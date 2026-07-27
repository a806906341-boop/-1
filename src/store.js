import { DEFAULT_STATE } from "./data.js?v=20260724-5";
import { clone, validateImportedState } from "./domain.js?v=20260720-43";

const STORAGE_KEY = "zhudemax-ai-media-v1";

export class AppStore {
  constructor(storage = globalThis.localStorage, storageKey = STORAGE_KEY, seedKey = null) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.seedKey = seedKey;
    this.state = this.load();
  }

  load() {
    try {
      const raw = this.storage?.getItem(this.storageKey) || (this.seedKey ? this.storage?.getItem(this.seedKey) : null);
      if (!raw) return clone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      const validation = validateImportedState(parsed);
      if (!validation.valid) return clone(DEFAULT_STATE);
      return {
        ...clone(DEFAULT_STATE), ...parsed,
        testAccounts: Array.isArray(parsed.testAccounts) && parsed.testAccounts.length ? parsed.testAccounts : clone(DEFAULT_STATE.testAccounts),
        accountWorkspaces: parsed.accountWorkspaces && typeof parsed.accountWorkspaces === "object" ? parsed.accountWorkspaces : {},
        activeAccountId: parsed.activeAccountId || DEFAULT_STATE.activeAccountId,
        ui: { ...DEFAULT_STATE.ui, ...parsed.ui }
      };
    } catch (error) {
      console.warn("读取本地数据失败，已回退到示例数据", error);
      return clone(DEFAULT_STATE);
    }
  }

  save() {
    try {
      this.storage?.setItem(this.storageKey, JSON.stringify(this.state));
      return true;
    } catch (error) {
      console.warn("保存本地数据失败", error);
      return false;
    }
  }

  update(mutator) {
    mutator(this.state);
    this.save();
    return this.state;
  }

  replace(nextState) {
    const validation = validateImportedState(nextState);
    if (!validation.valid) throw new Error(validation.reason);
    this.state = { ...clone(DEFAULT_STATE), ...nextState, ui: { ...DEFAULT_STATE.ui, ...(nextState.ui || {}) } };
    this.save();
  }

  reset() {
    this.state = clone(DEFAULT_STATE);
    this.save();
  }
}

export { STORAGE_KEY };
