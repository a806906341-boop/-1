import { AppStore, STORAGE_KEY } from "./store.js?v=20260724-5";
import { DEFAULT_INTERACTION_CENTER, DEFAULT_STATE, DEFAULT_VALUE_ADDED_STATE, HOTEL_TYPES, MATERIAL_CATEGORIES, TEST_ACCOUNTS, VALUE_ADDED_SERVICE_CATALOG } from "./data.js?v=20260724-5";
import { OTA_SNAPSHOT } from "./ota-snapshot.js?v=20260720-43";
import {
  assessRisk, BODY_MAX, BODY_MIN, BODY_TARGET, buildImageLayout, buildTopicFingerprint, charCount, clone, CONTENT_IMAGE_LIMIT,
  computeContentWorkflow, computeDashboard, createWeekPlan, deriveMineOverview, detectPeak, generateContent, localDate,
  evaluateContentReuseRisk, normalizeTopicContext, optimizeImageSelection, pickTopic, rankMaterialPool, suggestInteractionReply, uid,
  validateImportedState, validateRegeneration
} from "./domain.js?v=20260724-2";

const BUNDLED_HOTEL_IDS = new Set(["514254", "878958", "6078734"]);
const resolveHotelImageSrc = (hotel, image) => {
  if (BUNDLED_HOTEL_IDS.has(String(hotel.id))) {
    const relativePath = String(image.path || "").split("/images/")[1];
    if (relativePath) return `./assets/hotels/${relativePath}`;
  }
  return image.originalUrl || image.path;
};

const NAV = [
  { id: "dashboard", label: "工作台", icon: "fa-dashboard" },
  { id: "topics", label: "选题推荐", icon: "fa-lightbulb-o" },
  { id: "editor", label: "内容生成", icon: "fa-pencil-square-o" },
  { id: "materials", label: "素材管理", icon: "fa-picture-o" },
  { id: "planner", label: "周计划", icon: "fa-calendar" },
  { id: "records", label: "发布记录", icon: "fa-send-o" },
  { id: "interactions", label: "互动管理", icon: "fa-comments-o" },
  { id: "analytics", label: "数据看板", icon: "fa-line-chart" },
  { id: "valueServices", label: "增值服务", icon: "fa-diamond" },
  { id: "knowledge", label: "商家知识库", icon: "fa-database" },
  { id: "aiRules", label: "AI 规则中心", icon: "fa-sliders" },
  { id: "settings", label: "系统设置", icon: "fa-cog" }
];

const USER_NAV = [
  { id: "dashboard", label: "首页", icon: "fa-dashboard", views: ["dashboard"] },
  { id: "topics", label: "AI 创作", icon: "fa-magic", views: ["topics", "editor", "materials", "planner", "creatorPublish"] },
  { id: "records", label: "发布", icon: "fa-send-o", views: ["records"] },
  { id: "interactions", label: "互动", icon: "fa-comments-o", views: ["interactions"] },
  { id: "valueServices", label: "服务", icon: "fa-diamond", views: ["valueServices", "valueCapabilityDetail", "valueServiceDetail"] }
];

const USER_V2_DESKTOP_NAV = [
  { id: "dashboard", label: "首页", icon: "fa-home", views: ["dashboard"] },
  { id: "topics", label: "创作", icon: "fa-magic", views: ["topics", "editor", "materials", "planner", "creatorPublish"] },
  { id: "records", label: "内容", icon: "fa-file-text-o", views: ["records", "analytics"] },
  { id: "interactions", label: "互动", icon: "fa-comments-o", views: ["interactions"] },
  { id: "valueServices", label: "我的", icon: "fa-user-o", views: ["valueServices", "valueCapabilityDetail", "valueServiceDetail"] }
];

const USER_V2_MOBILE_NAV = [
  { id: "dashboard", label: "首页", icon: "fa-home", views: ["dashboard"] },
  { id: "records", label: "内容", icon: "fa-file-text-o", views: ["records", "analytics"] },
  { id: "topics", label: "创作", icon: "fa-plus", primary: true, views: ["topics", "editor", "materials", "planner", "creatorPublish"] },
  { id: "interactions", label: "互动", icon: "fa-comments-o", views: ["interactions"] },
  { id: "valueServices", label: "我的", icon: "fa-user-o", views: ["valueServices", "valueCapabilityDetail", "valueServiceDetail"] }
];

const USER_A_DESKTOP_NAV = [
  { id: "dashboard", label: "首页", icon: "fa-home", views: ["dashboard"] },
  { id: "topics", label: "创作", icon: "fa-magic", views: ["topics", "editor", "materials", "planner", "creatorPublish"] },
  { id: "records", label: "内容", icon: "fa-file-text-o", views: ["records", "analytics", "publishComplete"] },
  { id: "interactions", label: "互动", icon: "fa-comments-o", views: ["interactions"] },
  { id: "valueServices", label: "我的", icon: "fa-user-o", views: ["valueServices", "valueCapabilityDetail", "valueServiceDetail", "hotelGallery", "hotelData", "platformAccounts", "weeklySettings"] }
];

const USER_A_MOBILE_NAV = [
  { id: "dashboard", label: "首页", icon: "fa-home", views: ["dashboard"] },
  { id: "records", label: "内容", icon: "fa-file-text-o", views: ["records", "analytics", "publishComplete"] },
  { id: "topics", label: "创作", icon: "fa-plus", primary: true, views: ["topics", "editor", "materials", "planner", "creatorPublish"] },
  { id: "interactions", label: "互动", icon: "fa-comments-o", views: ["interactions"] },
  { id: "valueServices", label: "我的", icon: "fa-user-o", views: ["valueServices", "valueCapabilityDetail", "valueServiceDetail", "hotelGallery", "hotelData", "platformAccounts", "weeklySettings"] }
];

const PAGE_COPY = {
  dashboard: ["运营工作台", "今天只需确认一次，其他交给系统"],
  topics: ["选题推荐", "按酒店类型、时间节点和 532 策略自动轮换"],
  editor: ["内容生成", "编辑、预览并完成发布前安全检查"],
  creatorPublish: ["抖音创作者中心", "发布前补全作品信息并进行最终检查"],
  materials: ["素材管理", "六大分类、来源追踪与重复使用提醒"],
  planner: ["未来 7 天计划", "一次确认，按默认时间自动排期"],
  records: ["发布记录", "查看状态、失败原因与重试结果"],
  interactions: ["互动管理", "联动抖音作品评论与私信咨询"],
  analytics: ["数据看板", "关注周期结果和异常峰值"],
  valueServices: ["增值服务", "代运营、达人直播与本地生活增长服务"],
  valueCapabilityDetail: ["经营能力详情", "查看状态、缺口与下一步"],
  valueServiceDetail: ["增长服务详情", "查看交付内容、方案与需求进度"],
  knowledge: ["商家知识库", "所有生成内容的事实依据"],
  aiRules: ["AI 规则中心", "查看模型当前实际使用的规则、提示词与 Skills 来源"],
  settings: ["系统设置", "品牌、平台适配器与数据管理"]
};

const USER_PAGE_COPY = {
  dashboard: ["首页", "今天的内容、互动和经营进展"],
  topics: ["AI 创作", "从选题到发布，一步一步完成"],
  editor: ["编辑内容", "确认文案、图片和地点后即可发布"],
  creatorPublish: ["发布到抖音", "检查并补全发布信息"],
  materials: ["内容素材池", "查看和管理可用于内容创作的酒店实拍图片"],
  planner: ["内容计划", "查看和调整未来 7 天安排"],
  records: ["发布", "处理待发布内容、查看发布记录和内容效果"],
  interactions: ["互动", "统一处理评论和私信"],
  analytics: ["发布", "查看发布内容的效果"],
  valueServices: ["服务", "账号经营与新媒体增长服务"],
  valueCapabilityDetail: ["服务详情", "查看当前状态和下一步"],
  valueServiceDetail: ["服务详情", "了解交付内容并提交需求"]
};

const USER_V2_PAGE_COPY = {
  dashboard: ["首页", "今天只完成最重要的一件事"],
  topics: ["开始创作", "AI 先推荐方向，你确认后生成图文"],
  editor: ["编辑内容", "确认文案、5 张图片和酒店地点"],
  creatorPublish: ["多平台发布", "按平台核对版本和发布方式"],
  materials: ["酒店素材", "查看并管理可用于创作的实拍图片"],
  planner: ["内容计划", "安排未来 7 天的内容和时间"],
  records: ["内容", "管理草稿、待发布、已发布和内容表现"],
  interactions: ["互动", "处理抖音评论与私信咨询"],
  analytics: ["内容表现", "从已发布内容中找到有效方向"],
  valueServices: ["我的", "管理酒店账号、经营能力和服务需求"],
  valueCapabilityDetail: ["经营能力", "查看绑定状态与下一步"],
  valueServiceDetail: ["服务详情", "了解方案并联系运营顾问"]
};

const USER_A_PAGE_COPY = {
  dashboard: ["首页", "今天要做什么，一眼看清"],
  topics: ["开始创作", "先选方向，再由 AI 生成完整图文"],
  editor: ["编辑内容", "确认文案、5 张图片和酒店地点"],
  creatorPublish: ["多平台发布", "按平台核对版本和发布方式"],
  publishComplete: ["提交完成", "这条内容已进入内容管理"],
  materials: ["酒店素材", "查看并管理可用于创作的实拍图片"],
  planner: ["内容计划", "安排未来 7 天的内容和时间"],
  records: ["内容", "管理草稿、待发布、已发布和内容数据"],
  interactions: ["互动", "集中处理评论与私信咨询"],
  analytics: ["内容数据", "从已发布内容中找到有效方向"],
  valueServices: ["我的", "查看内容助手状态、经营连接和适合当前酒店的服务"],
  valueCapabilityDetail: ["经营能力", "查看绑定状态与下一步"],
  valueServiceDetail: ["服务详情", "了解方案并联系运营顾问"],
  hotelGallery: ["酒店图库", "管理系统采集和自行上传的图片"],
  hotelData: ["酒店资料", "查看内容创作所依据的酒店信息"],
  platformAccounts: ["发布平台", "管理抖音、小红书和微信视频号"],
  weeklySettings: ["7天自动运营", "设置本周内容准备、发布时间和异常处理方式"]
};

const TYPE_LABELS = { traffic: "流量型", vertical: "垂类型", marketing: "营销型" };
const STATUS_LABELS = { published: "已发布", failed: "失败", reviewing: "审核中", scheduled: "待发布", draft: "草稿" };
const STATUS_CLASS = { published: "badge-success", failed: "badge-danger", reviewing: "badge-warning", scheduled: "badge-info", draft: "badge-neutral" };

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function fmt(value) { return new Intl.NumberFormat("zh-CN").format(Number(value || 0)); }
function materialName(id) { return MATERIAL_CATEGORIES.find(item => item.id === id)?.name || "酒店实拍图片"; }
const USER_INTERNAL_TERM_PATTERN = /(?:fact[-_]?\d+|materialInventory|rejectedTopics|history[-_]|evidenceId|factReferences|RAG|Top[- ]?K|素材ID|字段名[｜|]来源)/i;
function userFacingTopicText(value, fallback, maxLength = 90) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || USER_INTERNAL_TERM_PATTERN.test(text)) return fallback;
  return Array.from(text).slice(0, maxLength).join("");
}
function topicBadge(type) { return `<span class="badge type-${type}">${TYPE_LABELS[type] || type}</span>`; }
function statusBadge(status) { return `<span class="badge ${STATUS_CLASS[status] || "badge-neutral"}">${STATUS_LABELS[status] || status}</span>`; }
function adapterBadge(status) {
  const map = {
    connected: ["badge-success", "已连接"], demo: ["badge-demo", "演示模式"], sample: ["badge-info", "本地样本"], disconnected: ["badge-neutral", "未连接"]
  };
  const [klass, label] = map[status] || map.disconnected;
  return `<span class="badge ${klass}">${label}</span>`;
}

function parseHotelCoordinates(value = "") {
  const values = String(value).match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  return values.length >= 2 ? { latitude: values[0], longitude: values[1] } : { latitude: null, longitude: null };
}

function resolveHotelLocation(state, account) {
  const hotelId = account?.hotelId || state.otaSnapshot?.selectedHotelId;
  const hotel = OTA_SNAPSHOT.hotels.find(item => item.id === hotelId);
  const coordinates = parseHotelCoordinates(hotel?.coordinates || "");
  const platformPoiId = state.adapters?.lifeService?.shopId || null;
  return {
    hotelId,
    name: hotel?.name || state.settings.brandName || state.settings.shortName,
    address: hotel?.address || state.settings.address || "",
    city: state.settings.city || "",
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    coordinateText: hotel?.coordinates || "",
    source: hotel ? "OTA抓取" : "商家设置",
    platformPoiId,
    status: platformPoiId ? "matched" : "pending-platform-match",
    nearbyPois: (hotel?.pois || []).slice(0, 5).map(item => ({ name: item.name, type: item.type, distance: item.displayDistance }))
  };
}

class App {
  constructor(root, { edition = "internal" } = {}) {
    this.root = root;
    this.edition = edition;
    this._userEdition = edition === "user";
    this.userEditionV2 = false;
    this._userEditionA = this._userEdition;
    this.userPreviewMode = "desktop";
    this.homeFeaturedTopicId = null;
    this.store = new AppStore(globalThis.localStorage, this._userEditionA ? "zhudemax-ai-media-user-a-v1" : STORAGE_KEY, this._userEditionA ? STORAGE_KEY : null);
    this.modal = null;
    this.toastTimer = null;
    this.aiLoading = false;
    this.aiStage = "";
    this.aiError = "";
    this.aiRules = null;
    this.materialPreviewId = null;
    this.interactionSyncing = false;
    this.hydrateBundledHotelMaterials();
    this.hydrateContentGovernanceFields();
    this.hydrateContentImageLimit();
    this.hydrateRuntimeLocation();
    this.hydrateTopicLinkage();
    this.hydrateValueAddedServices();
    this.hydrateInteractionCenter();
    this.hydrateOfficialUserWorkspace();
    this.hydratePublishingPlatforms();
    if (this.userEdition && ["knowledge", "aiRules", "settings"].includes(this.state.ui.view)) this.state.ui.view = "dashboard";
    if (this.userEdition && this.state.ui.view === "analytics") {
      this.state.ui.view = "records";
      this.state.ui.publishSection = "insights";
      this.store.save();
    }
    this.bindEvents();
    this.render();
    this.refreshAiStatus();
    if (!this._userEdition) this.refreshAiRules();
    this.refreshDouyinInteractionStatus();
  }

  get state() { return this.store.state; }

  get userEdition() {
    return this._userEdition || this.isInternalMobileSurface();
  }

  get userEditionA() {
    return this._userEditionA || this.isInternalMobileSurface();
  }

  isInternalMobileSurface() {
    if (this._userEdition || !this.store?.state?.ui) return false;
    const actualMobile = Boolean(globalThis.matchMedia?.("(max-width: 560px)")?.matches);
    return actualMobile || this.state.ui.device === "mobile";
  }

  get usesUserFacingExperience() {
    return this.userEdition;
  }

  get usesUserAExperience() {
    return this.userEditionA;
  }

  normalizeInternalMobileView() {
    if (!this.isInternalMobileSurface()) return;
    if (["knowledge", "aiRules", "settings"].includes(this.state.ui.view)) {
      this.state.ui.view = "dashboard";
      this.store.save();
      return;
    }
    if (this.state.ui.view === "analytics") {
      this.state.ui.view = "records";
      this.state.ui.publishSection = "insights";
      this.store.save();
    }
  }

  hydrateOfficialUserWorkspace() {
    if (!this.userEditionA || !this.state.draft) return;
    let changed = false;
    if (this.state.publishForm && !this.state.publishForm.declarationUserSelected && this.state.publishForm.declaration === "内容由AI辅助创作") {
      this.state.publishForm.declaration = "";
      this.state.publishForm.declarationDetail = "默认留空，由用户在发布确认时自主选择";
      changed = true;
    }
    const bodyLength = charCount(this.state.draft.body || "");
    const imageCount = Array.isArray(this.state.draft.imageIds) ? this.state.draft.imageIds.length : 0;
    if (bodyLength >= BODY_MIN && bodyLength <= BODY_MAX && imageCount === CONTENT_IMAGE_LIMIT) {
      if (changed) this.store.save();
      return;
    }
    const topic = this.state.activeTopic
      || this.state.draft.topicContext
      || this.state.topics.find(item => item.id === this.state.draft.topicId)
      || pickTopic(this.state.topics, this.state.settings.hotelType, this.state.records, []);
    this.state.draft = this.createLinkedRuleDraft(this.state, topic, Number(this.state.draft.regenerationCount || 0) + 1);
    this.state.publishForm = null;
    this.store.save();
  }

  hydratePublishingPlatforms() {
    if (!this.userEditionA) return;
    const defaults = clone(DEFAULT_STATE.publishingPlatforms || {});
    const current = this.state.publishingPlatforms || {};
    this.state.publishingPlatforms = Object.fromEntries(
      Object.entries(defaults).map(([id, platform]) => [id, { ...platform, ...(current[id] || {}) }])
    );
    const douyin = this.state.publishingPlatforms.douyin;
    douyin.status = this.state.adapters?.douyin?.status || douyin.status;
    douyin.account = this.state.adapters?.douyin?.account || douyin.account;
    if (this.state.publishForm) this.ensurePublishPlatformVariants(this.state.publishForm);
    this.store.save();
  }

  hydrateContentImageLimit() {
    const trimWorkspace = workspace => {
      if (!workspace) return false;
      let changed = false;
      const trimContent = content => {
        if (!content || !Array.isArray(content.imageIds) || content.imageIds.length <= CONTENT_IMAGE_LIMIT) return;
        content.imageIds = content.imageIds.slice(0, CONTENT_IMAGE_LIMIT);
        content.imageLayout = buildImageLayout(workspace.materials || [], content.imageIds, content.materialCategory || "room", content.imageLayout || []);
        if (content.imageSelectionMeta) content.imageSelectionMeta.selectedCount = content.imageIds.length;
        changed = true;
      };
      trimContent(workspace.draft);
      trimContent(workspace.publishForm);
      return changed;
    };
    let changed = trimWorkspace(this.state);
    Object.values(this.state.accountWorkspaces || {}).forEach(workspace => { changed = trimWorkspace(workspace) || changed; });
    if (changed) this.store.save();
  }

  hydrateContentGovernanceFields() {
    const accounts = Array.isArray(this.state.testAccounts) ? this.state.testAccounts : TEST_ACCOUNTS;
    const migrate = (workspace, accountId) => {
      if (!workspace) return false;
      const account = accounts.find(item => item.id === accountId);
      const hotelId = account?.hotelId || workspace.otaSnapshot?.selectedHotelId || "";
      let changed = false;
      (workspace.materials || []).forEach(material => {
        const defaults = {
          hotelId,
          fileHash: material.originalUrl || material.uploadSignature || material.id,
          visualGroupId: material.fileHash || material.originalUrl || material.uploadSignature || material.id,
          usageByPlatform: {},
          lastUsedAtByPlatform: {},
          coverUsedByPlatform: {}
        };
        Object.entries(defaults).forEach(([key, value]) => {
          if (material[key] === undefined || material[key] === null || material[key] === "") {
            material[key] = value;
            changed = true;
          }
        });
      });
      (workspace.records || []).forEach(record => {
        if (!record.hotelId && hotelId) { record.hotelId = hotelId; changed = true; }
        if (!record.coverId && record.imageIds?.[0]) { record.coverId = record.imageIds[0]; changed = true; }
        if (!record.topicFingerprint) {
          record.topicFingerprint = buildTopicFingerprint(record.topicContext || record, record);
          changed = true;
        }
        if (!record.platform && !record.platforms?.length) {
          record.platform = "douyin";
          record.platforms = ["douyin"];
          changed = true;
        }
      });
      return changed;
    };
    let changed = migrate(this.state, this.state.activeAccountId);
    Object.entries(this.state.accountWorkspaces || {}).forEach(([accountId, workspace]) => {
      changed = migrate(workspace, accountId) || changed;
    });
    if (changed) this.store.save();
  }

  hydrateBundledHotelMaterials() {
    const accounts = Array.isArray(this.state.testAccounts) ? this.state.testAccounts : TEST_ACCOUNTS;
    const migrateWorkspace = (workspace, accountId) => {
      const account = accounts.find(item => item.id === accountId);
      const hotel = OTA_SNAPSHOT.hotels.find(item => item.id === account?.hotelId);
      if (!workspace || !hotel || !BUNDLED_HOTEL_IDS.has(hotel.id) || !Array.isArray(workspace.materials)) return false;
      const byOriginalUrl = new Map(hotel.images.filter(image => image.originalUrl).map(image => [image.originalUrl, image]));
      const existingById = new Map(workspace.materials.map(material => [material.id, material]));
      const isSnapshotImage = material => String(material.id || "").startsWith(`ota_${hotel.id}_`)
        || byOriginalUrl.has(material.src)
        || byOriginalUrl.has(material.originalUrl)
        || String(material.src || "").includes(`/images/${hotel.id}_`)
        || String(material.src || "").includes(`/assets/hotels/${hotel.id}_`);
      const customMaterials = workspace.materials.filter(material => !isSnapshotImage(material));
      const bundledMaterials = hotel.images.map((image, index) => {
        const id = `ota_${hotel.id}_${image.id || index}`;
        const existing = existingById.get(id) || {};
        return {
          id, category: image.category, title: image.title || `${hotel.name}素材`,
          source: image.source || "OTA抓取", used: 0, selected: image.featured,
          createdAt: hotel.updatedAt || localDate(), originalUrl: image.originalUrl,
          hotelId: hotel.id,
          fileHash: image.originalUrl || String(image.id || id),
          visualGroupId: existing.visualGroupId || `ota:${hotel.id}:${image.id || index}`,
          usageByPlatform: {}, lastUsedAtByPlatform: {}, coverUsedByPlatform: {},
          ...existing,
          src: resolveHotelImageSrc(hotel, image)
        };
      });
      const nextMaterials = bundledMaterials.concat(customMaterials);
      const changed = nextMaterials.length !== workspace.materials.length
        || nextMaterials.some((material, index) => material.id !== workspace.materials[index]?.id || material.src !== workspace.materials[index]?.src);
      if (changed) workspace.materials = nextMaterials;
      return changed;
    };

    let changed = migrateWorkspace(this.state, this.state.activeAccountId);
    Object.entries(this.state.accountWorkspaces || {}).forEach(([accountId, workspace]) => {
      changed = migrateWorkspace(workspace, accountId) || changed;
    });
    if (changed) this.store.save();
  }

  hydrateRuntimeLocation() {
    const location = resolveHotelLocation(this.state, this.activeAccount());
    let changed = false;
    if (this.state.draft && !this.state.draft.location?.address) {
      this.state.draft.location = clone(location);
      changed = true;
    }
    if (this.state.publishForm && !this.state.publishForm.location?.address) {
      this.state.publishForm.location = clone(location);
      changed = true;
    }
    if (changed) this.store.save();
  }

  hydrateTopicLinkage() {
    if (!this.state.draft) return;
    const matched = this.state.draft.topicContext
      || this.state.aiRecommendations.find(item => item.id === this.state.draft.topicId)
      || this.state.topics.find(item => item.id === this.state.draft.topicId);
    const fallback = matched || {
      id: this.state.draft.topicId,
      title: this.state.draft.strategyTopicTitle || this.state.draft.title,
      type: this.state.draft.topicType,
      reason: this.state.draft.strategySummary,
      materialCategory: this.state.draft.materialCategory
    };
    const topic = normalizeTopicContext(fallback, this.state.draft.source === "model" ? "ai-recommendation" : "rule-library");
    let changed = false;
    if (!this.state.activeTopic?.title) {
      this.state.activeTopic = clone(topic);
      changed = true;
    } else {
      const normalizedActiveTopic = normalizeTopicContext(this.state.activeTopic, this.state.draft.source === "model" ? "ai-recommendation" : "rule-library");
      if (normalizedActiveTopic.source !== this.state.activeTopic.source) {
        this.state.activeTopic = clone(normalizedActiveTopic);
        changed = true;
      }
    }
    if (!this.state.draft.topicContext?.title) {
      this.state.draft.topicContext = clone(topic);
      changed = true;
    } else {
      const normalizedDraftTopic = normalizeTopicContext(this.state.draft.topicContext, this.state.draft.source === "model" ? "ai-recommendation" : "rule-library");
      if (normalizedDraftTopic.source !== this.state.draft.topicContext.source) {
        this.state.draft.topicContext = clone(normalizedDraftTopic);
        changed = true;
      }
    }
    if (this.state.contentGenerationJob?.status === "generating") {
      this.state.contentGenerationJob = { ...this.state.contentGenerationJob, status: "interrupted", message: "页面刷新中断了上次生成，请重新发起" };
      changed = true;
    }
    if (changed) this.store.save();
  }

  hydrateValueAddedServices() {
    const current = this.state.valueAdded || {};
    this.state.valueAdded = {
      ...clone(DEFAULT_VALUE_ADDED_STATE),
      ...current,
      foundation: { ...clone(DEFAULT_VALUE_ADDED_STATE.foundation), ...(current.foundation || {}) },
      capabilities: { ...clone(DEFAULT_VALUE_ADDED_STATE.capabilities), ...(current.capabilities || {}) },
      requests: Array.isArray(current.requests) ? current.requests : []
    };
    if (this.state.ui.view === "valueFoundation" || this.state.ui.view === "valueGrowth") this.state.ui.view = "valueServices";
    this.store.save();
  }

  hydrateInteractionCenter() {
    const current = this.state.interactionCenter || {};
    this.state.interactionCenter = {
      ...clone(DEFAULT_INTERACTION_CENTER),
      ...current,
      items: Array.isArray(current.items) ? current.items : clone(DEFAULT_INTERACTION_CENTER.items)
    };
    const items = this.state.interactionCenter.items;
    if (!this.state.ui.selectedInteractionId || !items.some(item => item.id === this.state.ui.selectedInteractionId)) {
      this.state.ui.selectedInteractionId = items.find(item => item.status === "pending")?.id || items[0]?.id || null;
    }
    this.store.save();
  }
  update(mutator, render = true) {
    this.store.update(mutator);
    if (render) this.render();
  }

  bindEvents() {
    this.root.addEventListener("click", event => this.handleClick(event));
    this.root.addEventListener("submit", event => this.handleSubmit(event));
    this.root.addEventListener("change", event => this.handleChange(event));
  }

  ensureDraft() {
    if (this.state.draft) return this.state.draft;
    const topic = pickTopic(this.state.topics, this.state.settings.hotelType, this.state.records, this.state.rejectedTopicIds);
    this.state.draft = this.createLinkedRuleDraft(this.state, topic);
    this.store.save();
    return this.state.draft;
  }

  activeAccount() {
    const accounts = Array.isArray(this.state.testAccounts) && this.state.testAccounts.length ? this.state.testAccounts : TEST_ACCOUNTS;
    return accounts.find(account => account.id === this.state.activeAccountId) || accounts[0];
  }

  createLinkedRuleDraft(state, topic, step = 0) {
    const topicContext = normalizeTopicContext(topic, "rule-library");
    const draft = {
      ...generateContent(state, topic, step),
      topicContext: clone(topicContext),
      strategyTopicTitle: topicContext.title
    };
    draft.topicFingerprint = buildTopicFingerprint(topicContext, draft);
    draft.contentReuseRisk = evaluateContentReuseRisk(state, draft, {
      platform: "douyin",
      hotelId: this.activeAccount()?.hotelId || state.otaSnapshot?.selectedHotelId
    });
    draft.materialShortage = draft.contentReuseRisk.level === "pass" ? null : {
      blocked: draft.contentReuseRisk.level === "blocked",
      reason: draft.contentReuseRisk.reasons[0] || "近期素材重复度较高",
      suggestions: this.buildReplenishmentSuggestions(draft.materialCategory || topicContext.materialCategory).slice(0, 6),
      repairAttempts: 0
    };
    state.activeTopic = clone(topicContext);
    state.contentGenerationJob = {
      status: "completed",
      mode: "rule-fallback",
      topicId: topicContext.id,
      topicTitle: topicContext.title,
      generatedTitle: draft.title,
      completedAt: draft.createdAt
    };
    return draft;
  }

  captureWorkspace(state) {
    const keys = [
      "settings", "otaSnapshot", "knowledge", "materials", "draft", "publishForm",
      "weeklyAutomation", "weekPlan", "records", "notifications", "feedback", "rejectedTopicIds", "rejectedTopics", "aiRecommendations", "activeTopic", "contentGenerationJob", "lastAiRun", "valueAdded", "interactionCenter", "publishingPlatforms"
    ];
    return Object.fromEntries(keys.map(key => [key, clone(state[key])]));
  }

  restoreWorkspace(state, workspace) {
    Object.entries(clone(workspace)).forEach(([key, value]) => { state[key] = value; });
  }

  seedRecordsForHotel(hotel) {
    const short = Array.from(hotel.name).slice(0, 10).join("");
    return [
      { id: uid("record"), title: `${short}真实入住空间`, body: "从房间到公区，用实拍了解真实入住感。", status: "published", mode: "测试账号样例", publishedAt: "2026-07-15 19:30", views: 680, likes: 42, comments: 6, shares: 4, topicType: "vertical", link: "#" },
      { id: uid("record"), title: `到大理先看${short}位置`, body: "结合周边地标和交通，安排更从容的行程。", status: "published", mode: "测试账号样例", publishedAt: "2026-07-13 19:30", views: 326, likes: 21, comments: 3, shares: 2, topicType: "traffic", link: "#" }
    ];
  }

  async requestApi(path, options = {}) {
    const response = await fetch(path, {
      method: options.method || "GET",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `请求失败：HTTP ${response.status}`);
    return data;
  }

  async refreshAiStatus(showToast = false) {
    try {
      const status = await this.requestApi("/api/ai/status");
      this.update(state => {
        state.adapters.ai = {
          ...state.adapters.ai,
          ...status,
          status: status.configured ? "connected" : "disconnected"
        };
      });
      if (showToast) this.toast(status.configured ? `模型已连接：${status.model}` : "模型尚未配置");
    } catch (error) {
      this.aiError = error.message;
      this.update(state => { state.adapters.ai.status = "disconnected"; });
      if (showToast) this.toast(`模型服务不可用：${error.message}`, "fa-exclamation-triangle");
    }
  }

  async refreshAiRules() {
    try {
      this.aiRules = await this.requestApi("/api/ai/rules");
      if (this.state.onboardingCompleted && this.state.ui.view === "aiRules") this.render();
    } catch (error) { this.aiError = error.message; }
  }

  async refreshDouyinInteractionStatus() {
    try {
      const status = await this.requestApi("/api/douyin/interactions/status");
      this.update(state => {
        state.adapters.douyin.status = status.configured ? "connected" : "demo";
        state.adapters.douyin.interactionMode = status.configured ? "connected" : "demo";
        state.adapters.douyin.interactionScopes = Array.isArray(status.scopes) ? status.scopes : state.adapters.douyin.interactionScopes;
        state.adapters.douyin.interactionVerifiedAt = status.configured ? new Date().toISOString() : null;
        if (state.publishingPlatforms?.douyin) {
          state.publishingPlatforms.douyin.status = status.configured ? "connected" : "demo";
          state.publishingPlatforms.douyin.lastSyncedAt = status.configured ? `${localDate()} ${new Date().toTimeString().slice(0, 5)}` : state.publishingPlatforms.douyin.lastSyncedAt;
        }
      });
    } catch {
      // 只有后端实时验权成功才允许显示真实联动，避免旧缓存误报“已连接”。
      this.update(state => {
        state.adapters.douyin.status = "demo";
        state.adapters.douyin.interactionMode = "demo";
        state.adapters.douyin.interactionVerifiedAt = null;
        if (state.publishingPlatforms?.douyin) state.publishingPlatforms.douyin.status = "demo";
      });
    }
  }

  isDouyinInteractionConnected() {
    const adapter = this.state.adapters?.douyin || {};
    return adapter.status === "connected"
      && adapter.interactionMode === "connected"
      && Boolean(adapter.interactionVerifiedAt);
  }

  buildAiPayload(mode, focusTopic = null) {
    const account = this.activeAccount();
    const previousContent = mode === "regenerate" && this.state.draft ? {
      title: this.state.draft.title,
      body: this.state.draft.body,
      hook: this.state.draft.hook || "",
      cta: this.state.draft.cta || "",
      materialIds: [...(this.state.draft.imageIds || [])],
      materialCategory: this.state.draft.materialCategory || "",
      location: this.state.draft.location || null,
      regenerationCount: Number(this.state.draft.regenerationCount || 0)
    } : null;
    return {
      mode,
      focusTopic,
      accountId: this.state.activeAccountId,
      hotelId: account?.hotelId || this.state.otaSnapshot?.selectedHotelId,
      targetPlatform: "douyin",
      settings: this.state.settings,
      knowledge: this.state.knowledge,
      materials: this.state.materials.map(({ id, category, title, source, used, fileHash, visualGroupId, usageByPlatform, lastUsedAtByPlatform, coverUsedByPlatform }) => ({
        id, category, title, source, used, fileHash, visualGroupId, usageByPlatform, lastUsedAtByPlatform, coverUsedByPlatform
      })),
      records: this.state.records,
      locationContext: resolveHotelLocation(this.state, account),
      previousContent,
      rejectedTopicIds: this.state.rejectedTopicIds,
      rejectedTopics: this.state.rejectedTopics || []
    };
  }

  collectTopicExclusions(mode) {
    const persisted = Array.isArray(this.state.rejectedTopics) ? this.state.rejectedTopics : [];
    const current = Array.isArray(this.state.aiRecommendations) ? this.state.aiRecommendations : [];
    const recentPublished = (this.state.records || []).filter(item => ["published", "reviewing", "scheduled"].includes(item.status)).slice(0, 10).map(item => ({
      id: item.topicId || item.id,
      title: item.strategyTopicTitle || item.title,
      type: item.topicType,
      targetAudience: item.topicContext?.targetAudience || "",
      contentAngle: item.topicContext?.contentAngle || "",
      reason: "同平台近期已发布方向"
    }));
    const fallback = mode === "swap" && !current.length ? [{
      id: this.state.draft.topicId,
      title: this.state.draft.title,
      type: this.state.draft.topicType,
      reason: this.state.draft.strategySummary || "当前页面选题"
    }] : [];
    const seen = new Set();
    return [...persisted, ...current, ...recentPublished, ...fallback].filter(item => {
      const key = String(item?.title || "").replace(/[\s，。！？、：；,.!?:;]/g, "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(-30).map(item => ({
      id: item.id || "",
      title: item.title || "",
      type: item.type || "",
      targetAudience: item.targetAudience || "",
      contentAngle: item.contentAngle || "",
      materialCategory: item.materialCategory || item.material || "",
      reason: item.reason || ""
    }));
  }

  ensureAiConfigured() {
    if (!this.state.adapters.ai.configured) {
      this.update(state => { state.ui.view = "settings"; });
      this.toast("请先连接通义千问模型", "fa-plug");
      return false;
    }
    return true;
  }

  async recommendTopicsWithAi(mode = "daily", returnView = "topics") {
    if (!this.ensureAiConfigured()) return;
    this.aiLoading = true;
    this.aiStage = "正在检索酒店事实、历史内容和素材结构…";
    this.aiError = "";
    this.render();
    const rejectedTopics = this.collectTopicExclusions(mode);
    try {
      const result = await this.requestApi("/api/ai/topics", {
        method: "POST",
        body: { ...this.buildAiPayload(mode), rejectedTopics }
      });
      this.update(state => {
        state.rejectedTopics = rejectedTopics;
        state.rejectedTopicIds = [...new Set([...(state.rejectedTopicIds || []), ...rejectedTopics.map(item => item.id).filter(Boolean)])].slice(-60);
        state.aiRecommendations = result.recommendations;
        state.lastAiRun = {
          stage: result.stage,
          model: result.model,
          usage: result.usage,
          retryCount: result.retryCount || 0,
          durationMs: result.durationMs,
          generatedAt: result.generatedAt,
          strategySummary: result.strategySummary,
          topicStrategySummary: result.strategySummary,
          executionTrace: result.executionTrace,
          retrieval: result.retrieval
        };
        state.ui.view = returnView;
      });
      if (returnView === "dashboard") this.homeFeaturedTopicId = result.recommendations[0]?.id || null;
      this.toast(`选题推荐完成：已排除 ${rejectedTopics.length} 个旧方向${result.retryCount ? "，重复后自动重试1次" : ""}`);
    } catch (error) {
      this.aiError = error.message;
      this.toast(`选题推荐失败：${error.message}`, "fa-exclamation-triangle");
    } finally {
      this.aiLoading = false;
      this.aiStage = "";
      this.render();
    }
  }

  async generateContentWithAi(focusTopic, mode = "focus-topic", options = {}) {
    if (!this.ensureAiConfigured() || !focusTopic?.title) return;
    const topicContext = normalizeTopicContext(focusTopic, focusTopic.source || (this.state.aiRecommendations.some(item => item.id === focusTopic.id) ? "ai-recommendation" : "rule-library"));
    const previousVersion = mode === "regenerate" && this.state.draft ? clone({
      title: this.state.draft.title,
      body: this.state.draft.body,
      imageIds: this.state.draft.imageIds || [],
      location: this.state.draft.location || null
    }) : null;
    this.aiLoading = true;
    this.aiStage = mode === "regenerate" ? "正在对比上一版，重写钩子、结构和图片组合…" : "正在按已选题目检索事实、图片和相似历史…";
    this.aiError = "";
    const showHomeProgress = this.usesUserAExperience && options.showHomeProgress && mode !== "regenerate";
    if (this.usesUserAExperience && mode === "regenerate") this.modal = this.renderRegenerateLoadingModal();
    if (showHomeProgress) this.modal = this.renderHomeGenerateLoadingModal(topicContext);
    this.update(state => {
      state.activeTopic = clone(topicContext);
      state.contentGenerationJob = {
        status: "generating",
        mode,
        topicId: topicContext.id,
        topicTitle: topicContext.title,
        startedAt: new Date().toISOString()
      };
      state.ui.view = "editor";
    });
    try {
      const previousDraftForRepair = this.state.draft ? clone(this.state.draft) : null;
      let result;
      let visual;
      let category = topicContext.materialCategory || "room";
      let reuseRisk = null;
      let regenerationValidation = null;
      let clientRepairCount = 0;
      let effectiveTopicContext = topicContext;
      let autoTopicChanged = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const payload = this.buildAiPayload(mode, effectiveTopicContext);
        if (payload.previousContent) payload.previousContent.regenerationCount += attempt;
        result = await this.requestApi("/api/ai/content", { method: "POST", body: payload });
        category = result.content.materialCategory || effectiveTopicContext.materialCategory || "room";
        const topicFingerprint = buildTopicFingerprint(effectiveTopicContext, result.content);
        visual = optimizeImageSelection(this.state, {
          platform: "douyin",
          preferredCategory: category,
          requestedIds: result.content.materialIds || [],
          requestedPlan: result.content.imagePlan || [],
          avoidIds: mode === "regenerate" ? previousDraftForRepair?.imageIds || [] : [],
          topicContext: effectiveTopicContext,
          topicFingerprint,
          limit: CONTENT_IMAGE_LIMIT
        });
        const provisionalDraft = {
          ...result.content,
          hotelId: payload.hotelId,
          topicContext: effectiveTopicContext,
          topicFingerprint,
          imageIds: visual.imageIds
        };
        reuseRisk = evaluateContentReuseRisk(this.state, provisionalDraft, { platform: "douyin", hotelId: payload.hotelId });
        regenerationValidation = mode === "regenerate" && previousDraftForRepair
          ? validateRegeneration(previousDraftForRepair, provisionalDraft, this.state, "douyin")
          : null;
        if (reuseRisk.level === "pass" && (!regenerationValidation || regenerationValidation.valid)) break;
        clientRepairCount += 1;
        if (attempt < 2) {
          if (attempt === 1 && mode !== "regenerate") {
            const alternative = this.state.aiRecommendations.find(item => item.id !== effectiveTopicContext.id
              && (item.materialCategory || "room") !== category);
            if (alternative) {
              effectiveTopicContext = normalizeTopicContext({ ...alternative, source: "ai-recommendation" }, "ai-recommendation");
              autoTopicChanged = true;
            }
          }
          this.aiStage = attempt === 0
            ? "正在自动更换重复封面和图片组合…"
            : autoTopicChanged ? "当前方向素材不足，正在改用素材更充足的选题…" : "正在更换表达角度并执行最后一次安全检查…";
          this.render();
        }
      }
      this.update(state => {
        const previousDraft = state.draft;
        const topicStrategySummary = state.lastAiRun?.stage === "topic-recommendation"
          ? state.lastAiRun.strategySummary
          : state.lastAiRun?.topicStrategySummary;
        state.lastAiRun = {
          ...(state.lastAiRun || {}),
          stage: result.stage,
          model: result.model,
          usage: result.usage,
          durationMs: result.durationMs,
          generatedAt: result.generatedAt,
          executionTrace: result.executionTrace,
          retrieval: result.retrieval,
          qualityScore: result.content.selfReview?.qualityScore,
          publishGate: result.content.selfReview?.publishGate,
          topicStrategySummary,
          selectedTopic: clone(effectiveTopicContext)
        };
        const topicFingerprint = buildTopicFingerprint(effectiveTopicContext, result.content);
        state.draft = {
          id: uid("draft"),
          topicId: effectiveTopicContext.id,
          topicType: effectiveTopicContext.type,
          topicContext: clone(effectiveTopicContext),
          strategyTopicTitle: effectiveTopicContext.title,
          title: result.content.title,
          body: result.content.body,
          tags: result.content.tags,
          music: "由抖音发布页智能匹配",
          imageIds: visual.imageIds,
          imageLayout: visual.imageLayout,
          imageSelectionMeta: visual.imageSelectionMeta,
          contentReuseRisk: reuseRisk,
          topicFingerprint,
          regenerationValidation,
          materialShortage: reuseRisk?.level !== "pass" ? {
            blocked: reuseRisk.level === "blocked",
            reason: reuseRisk.reasons[0] || "近期素材重复度较高",
            suggestions: this.buildReplenishmentSuggestions(category).slice(0, 6),
            repairAttempts: clientRepairCount
          } : null,
          materialCategory: category,
          imageAuthenticity: "real",
          status: "draft",
          source: "model",
          model: result.model,
          strategySummary: effectiveTopicContext.reason || effectiveTopicContext.contentAngle || topicStrategySummary || "",
          factReferences: result.content.factReferences,
          requiresConfirmation: result.content.requiresConfirmation,
          coverText: result.content.coverText,
          hook: result.content.hook,
          cta: result.content.cta,
          commentPrompt: result.content.commentPrompt,
          musicMood: result.content.musicMood,
          imagePlan: result.content.imagePlan,
          shotPlan: result.content.shotPlan,
          claimEvidence: result.content.claimEvidence,
          manualConfirmations: result.content.manualConfirmations,
          location: result.content.location || resolveHotelLocation(state, this.activeAccount()),
          rewriteSummary: result.content.rewriteSummary || "",
          rewriteSimilarity: result.content.rewriteSimilarity ?? null,
          regenerationCount: mode === "regenerate" ? Number(previousDraft?.regenerationCount || 0) + 1 : 0,
          selfReview: result.content.selfReview,
          executionTrace: result.executionTrace,
          risk: result.content.risk || assessRisk(result.content),
          generationRetryCount: Number(result.retryCount || 0) + clientRepairCount,
          createdAt: result.generatedAt
        };
        state.activeTopic = clone(effectiveTopicContext);
        state.contentGenerationJob = {
          status: "completed",
          mode,
          topicId: effectiveTopicContext.id,
          topicTitle: effectiveTopicContext.title,
          generatedTitle: result.content.title,
          completedAt: result.generatedAt
        };
        state.ui.view = "editor";
      });
      if (this.usesUserAExperience && mode === "regenerate") this.modal = this.renderRegenerateResultModal(previousVersion, this.state.draft);
      if (showHomeProgress) this.modal = null;
      const rewriteNote = mode === "regenerate" ? ` · 与上一版相似度${Math.round(Number(result.content.rewriteSimilarity || 0) * 100)}%` : "";
      if (this.state.draft.contentReuseRisk?.level !== "pass") {
        this.toast("当前素材与近期内容重复度偏高，已停止进入发布", "fa-picture-o");
      } else {
        this.toast(`${autoTopicChanged ? "原方向素材重复度较高，已自动换用可发布选题 · " : ""}内容生成完成：约${charCount(result.content.body)}字 · 自动选${visual.imageIds.length}张图片${rewriteNote}${this.state.draft.generationRetryCount ? ` · 自动纠正${this.state.draft.generationRetryCount}次` : ""}`);
      }
    } catch (error) {
      this.aiError = error.message;
      if (this.usesUserAExperience && (mode === "regenerate" || showHomeProgress)) this.modal = null;
      this.update(state => {
        state.activeTopic = clone(topicContext);
        state.contentGenerationJob = {
          status: "failed",
          mode,
          topicId: topicContext.id,
          topicTitle: topicContext.title,
          message: error.message,
          failedAt: new Date().toISOString()
        };
        state.ui.view = "editor";
      });
      this.toast(`内容生成失败：${error.message}`, "fa-exclamation-triangle");
    } finally {
      this.aiLoading = false;
      this.aiStage = "";
      this.render();
    }
  }

  render() {
    const internalMobile = this.isInternalMobileSurface();
    const userSurface = this._userEdition || internalMobile;
    document.body.classList.toggle("ui-user", userSurface);
    document.body.classList.toggle("ui-user-a", userSurface);
    if (!this.state.onboardingCompleted) {
      this.root.classList.remove("mobile-preview-root");
      this.root.innerHTML = this.renderOnboarding();
      return;
    }
    this.normalizeInternalMobileView();
    this.ensureDraft();
    const actualMobile = Boolean(globalThis.matchMedia?.("(max-width: 560px)")?.matches);
    const mobile = this._userEdition ? (actualMobile || this.userPreviewMode === "mobile") : internalMobile;
    this.root.classList.toggle("mobile-preview-root", mobile);
    this.root.innerHTML = `
      <div class="${mobile ? "device-preview" : "app-shell"}">
        ${mobile ? "" : this.renderSidebar()}
        <main class="main">
          <div class="${mobile ? "mobile-stage" : ""}">
            ${this.renderTopbar()}
            ${this.renderMobileSubnav()}
            <div class="content content-${escapeHtml(this.state.ui.view)}">${this.renderView()}</div>
            ${this.renderMobileNav()}
          </div>
        </main>
      </div>
      ${this.state.ui.notificationOpen ? this.renderNotifications() : ""}
      ${this.modal || ""}
    `;
  }

  renderOnboarding() {
    const s = this.state.settings;
    if (this.usesUserFacingExperience) return `<div class="user-onboarding"><section><div class="brand"><div class="brand-mark"><i class="fa fa-bed"></i></div><div><div class="brand-title">住得满</div><div class="brand-subtitle">酒店经营平台</div></div></div><span class="user-eyebrow">AI 内容助手</span><h1>每天花几分钟，完成酒店内容运营</h1><p>系统会准备选题、文案和图片，你只需要确认并发布。</p></section><form class="card" data-form="onboarding"><h2>确认当前酒店</h2><p>这些信息用于准备适合你酒店的内容。</p><div class="form-group"><label class="form-label">酒店名称</label><input class="form-control" name="brandName" required value="${escapeHtml(s.brandName)}"></div><div class="input-row"><div class="form-group"><label class="form-label">所在城市</label><input class="form-control" name="city" required value="${escapeHtml(s.city)}"></div><div class="form-group"><label class="form-label">酒店类型</label><select class="form-control" name="hotelType">${HOTEL_TYPES.map(type => `<option ${type === s.hotelType ? "selected" : ""}>${type}</option>`).join("")}</select></div></div><input type="hidden" name="otaUrl" value="${escapeHtml(s.otaUrl)}"><button class="btn btn-primary" type="submit">进入 AI 内容助手 <i class="fa fa-arrow-right"></i></button></form></div>`;
    return `
      <div class="onboarding">
        <section class="onboarding-brand">
          <div style="position:relative;z-index:1">
            <div class="brand" style="padding:0">
              <div class="brand-mark"><i class="fa fa-bed"></i></div>
              <div><div class="brand-title">住得满</div><div class="brand-subtitle">AI 新媒体</div></div>
            </div>
            <h1>每天一条好内容，<br>不用再从零开始。</h1>
            <p>为中小酒店民宿打造的抖音内容自动化工作台。从商家知识库到选题、生成、风控、排期和复盘，形成可持续闭环。</p>
          </div>
          <div class="onboarding-points">
            <div class="onboarding-point"><i class="fa fa-check"></i> 已接收 100 家酒店 OTA 在线抓取结果</div>
            <div class="onboarding-point"><i class="fa fa-check"></i> 内容生成前后均有事实与风险校验</div>
            <div class="onboarding-point"><i class="fa fa-check"></i> 当前为安全的本地演示模式，不会真实发布</div>
          </div>
        </section>
        <section class="onboarding-form">
          <form class="card onboarding-card" data-form="onboarding">
            <span class="badge badge-demo">本地演示模式</span>
            <h2 style="margin-top:14px">确认商家信息</h2>
            <p class="muted tiny" style="line-height:1.7;margin:0 0 22px">已从 OTA 在线抓取结果快照载入“大理 THE ONE 古城一号院”。你可以直接开始体验，之后可从 100 家酒店中切换。</p>
            <div class="form-group"><label class="form-label">酒店/民宿名称</label><input class="form-control" name="brandName" required value="${escapeHtml(s.brandName)}"></div>
            <div class="input-row">
              <div class="form-group"><label class="form-label">所在城市</label><input class="form-control" name="city" required value="${escapeHtml(s.city)}"></div>
              <div class="form-group"><label class="form-label">酒店类型</label><select class="form-control" name="hotelType">${HOTEL_TYPES.map(type => `<option ${type === s.hotelType ? "selected" : ""}>${type}</option>`).join("")}</select></div>
            </div>
            <div class="form-group"><label class="form-label">OTA 商家链接</label><input class="form-control" name="otaUrl" type="url" value="${escapeHtml(s.otaUrl)}"></div>
            <div class="alert alert-info"><i class="fa fa-info-circle"></i><div>OTA 抓取已完成并落地为本地结果快照；抖音授权与发布仍使用安全的演示适配器。</div></div>
            <button class="btn btn-primary" style="width:100%;margin-top:20px;min-height:44px" type="submit">开始使用抓取结果 <i class="fa fa-arrow-right"></i></button>
          </form>
        </section>
      </div>`;
  }

  renderSidebar() {
    if (this.userEditionA) {
      return `<aside class="sidebar user-sidebar a-sidebar">
        <div class="brand"><div class="brand-mark"><i class="fa fa-bed"></i></div><div class="brand-copy"><div class="brand-title">住得满</div><div class="brand-subtitle">酒店经营平台</div></div></div>
        <div class="a-app-label">当前应用</div>
        <button class="a-app-card" data-action="navigate" data-view="dashboard"><span><i class="fa fa-magic"></i></span><div><strong>AI 内容助手</strong><small>酒店内容运营工作区</small></div></button>
        <div class="a-sidebar-spacer"></div>
        <button class="a-hotel-card" data-action="navigate" data-view="valueServices"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><div><small>当前酒店</small><strong>${escapeHtml(this.activeAccount()?.name || this.state.settings.brandName)}</strong><em>${escapeHtml(this.state.settings.city || "")}</em></div><i class="fa fa-angle-right"></i></button>
      </aside>`;
    }
    if (this.userEditionV2) {
      return `<aside class="sidebar user-sidebar v2-sidebar">
        <div class="brand"><div class="brand-mark"><i class="fa fa-bed"></i></div><div class="brand-copy"><div class="brand-title">住得满</div><div class="brand-subtitle">酒店经营平台</div></div></div>
        <div class="v2-product-label">当前应用</div>
        <button class="v2-product-card active" data-action="navigate" data-view="dashboard"><span><i class="fa fa-magic"></i></span><div><strong>AI 内容助手</strong><small>帮酒店完成内容运营</small></div></button>
        <div class="v2-sidebar-spacer"></div>
        <button class="v2-hotel-card" data-action="navigate" data-view="valueServices"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><div><small>当前酒店</small><strong>${escapeHtml(this.activeAccount()?.name || this.state.settings.brandName)}</strong></div><i class="fa fa-angle-right"></i></button>
      </aside>`;
    }
    if (this.userEdition) {
      return `<aside class="sidebar user-sidebar">
        <div class="brand"><div class="brand-mark"><i class="fa fa-bed"></i></div><div class="brand-copy"><div class="brand-title">住得满</div><div class="brand-subtitle">酒店经营平台</div></div></div>
        <div class="user-sidebar-label">我的应用</div>
        <button class="user-module-card active" data-action="navigate" data-view="dashboard"><span><i class="fa fa-magic"></i></span><div><small>内容运营</small><strong>AI 内容助手</strong></div><i class="fa fa-angle-right"></i></button>
        <div class="user-hotel-card"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><div><small>当前酒店</small><strong>${escapeHtml(this.activeAccount()?.name || this.state.settings.brandName)}</strong><span>${escapeHtml(this.state.settings.city || "")}</span></div></div>
      </aside>`;
    }
    return `<aside class="sidebar">
      <div class="brand"><div class="brand-mark"><i class="fa fa-bed"></i></div><div class="brand-copy"><div class="brand-title">住得满</div><div class="brand-subtitle">AI 新媒体</div></div></div>
      <div class="nav-section">内容运营</div>
      ${NAV.slice(0, 8).map(item => this.navButton(item)).join("")}
      <div class="nav-section">配置与数据</div>
      ${NAV.slice(8).map(item => this.navButton(item)).join("")}
      <div class="sidebar-foot"><div class="tiny" style="color:#d9f4ee;font-weight:700">当前环境</div><div style="margin-top:7px">${adapterBadge(this.state.adapters.mode)}</div><div class="tiny" style="color:#88b9b0;margin-top:8px;line-height:1.55">所有发布动作仅写入本地记录</div></div>
    </aside>`;
  }

  navButton(item) {
    const active = item.views ? item.views.includes(this.state.ui.view) : this.state.ui.view === item.id;
    return `<button class="nav-item ${active ? "active" : ""}" data-action="navigate" data-view="${item.id}"><i class="fa ${item.icon}"></i><span>${item.label}</span></button>`;
  }

  renderTopbar() {
    const copy = this.usesUserAExperience ? USER_A_PAGE_COPY : this.userEditionV2 ? USER_V2_PAGE_COPY : this.userEdition ? USER_PAGE_COPY : PAGE_COPY;
    const [title, subtitle] = copy[this.state.ui.view] || copy.dashboard;
    const unread = this.state.notifications.filter(item => !item.read).length;
    const accounts = Array.isArray(this.state.testAccounts) && this.state.testAccounts.length ? this.state.testAccounts : TEST_ACCOUNTS;
    const accountOptions = accounts.map(account => `<option value="${account.id}" ${account.id === this.state.activeAccountId ? "selected" : ""}>${escapeHtml(account.name)}</option>`).join("");
    if (this.usesUserAExperience) return `<header class="topbar user-topbar a-topbar">
      <div class="user-page-heading"><div class="user-module-path"><span>AI 内容助手</span></div><div class="page-title">${title}</div><div class="page-kicker">${subtitle}</div></div>
      <div class="top-actions">
        <label class="account-switcher desktop-only"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><select data-account-switch="true" aria-label="切换酒店">${accountOptions}</select></label>
        <label class="mobile-account-switcher mobile-only"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><select data-account-switch="true" aria-label="切换酒店">${accountOptions}</select></label>
        <div class="device-switch user-device-switch desktop-only" aria-label="桌面与移动视图"><button class="${this.userPreviewMode === "desktop" ? "active" : ""}" data-action="device" data-device="desktop"><i class="fa fa-desktop"></i> 桌面版</button><button class="${this.userPreviewMode === "mobile" ? "active" : ""}" data-action="device" data-device="mobile"><i class="fa fa-mobile"></i> 移动版</button></div>
        ${(this._userEdition ? this.userPreviewMode === "mobile" : this.state.ui.device === "mobile") && !globalThis.matchMedia?.("(max-width: 560px)")?.matches ? `<button class="icon-btn user-preview-exit" data-action="device" data-device="desktop" aria-label="返回桌面版"><i class="fa fa-expand"></i></button>` : ""}
        <button class="icon-btn" data-action="notifications" aria-label="通知"><i class="fa fa-bell-o"></i>${unread ? '<span class="notification-dot"></span>' : ""}</button>
      </div>
    </header>`;
    if (this.userEditionV2) return `<header class="topbar user-topbar v2-topbar">
      <div class="user-page-heading"><div class="user-module-path"><span>AI 内容助手</span></div><div class="page-title">${title}</div><div class="page-kicker">${subtitle}</div></div>
      <div class="top-actions">
        <label class="account-switcher desktop-only"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><select data-account-switch="true" aria-label="切换酒店">${accountOptions}</select></label>
        <label class="mobile-account-switcher mobile-only"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><select data-account-switch="true" aria-label="移动端切换酒店">${accountOptions}</select></label>
        <div class="device-switch user-device-switch desktop-only" aria-label="V2 界面预览模式">
          <button class="${this.userPreviewMode === "desktop" ? "active" : ""}" data-action="device" data-device="desktop"><i class="fa fa-desktop"></i> 桌面版</button>
          <button class="${this.userPreviewMode === "mobile" ? "active" : ""}" data-action="device" data-device="mobile"><i class="fa fa-mobile"></i> 移动版</button>
        </div>
        ${this.userPreviewMode === "mobile" && !globalThis.matchMedia?.("(max-width: 560px)")?.matches ? `<button class="icon-btn user-preview-exit" data-action="device" data-device="desktop" aria-label="返回桌面版" title="返回桌面版"><i class="fa fa-expand"></i></button>` : ""}
        <button class="icon-btn" data-action="notifications" aria-label="通知"><i class="fa fa-bell-o"></i>${unread ? '<span class="notification-dot"></span>' : ""}</button>
      </div>
    </header>`;
    if (this.userEdition) return `<header class="topbar user-topbar">
      <div class="user-page-heading"><div class="user-module-path"><span>住得满</span><i class="fa fa-angle-right"></i><strong>AI 内容助手</strong></div><div class="page-title">${title}</div><div class="page-kicker">${subtitle}</div></div>
      <div class="top-actions">
        <label class="account-switcher desktop-only"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><select data-account-switch="true" aria-label="切换酒店">${accountOptions}</select></label>
        <label class="mobile-account-switcher mobile-only"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><select data-account-switch="true" aria-label="移动端切换酒店">${accountOptions}</select></label>
        <div class="device-switch user-device-switch desktop-only" aria-label="界面预览模式">
          <button class="${this.userPreviewMode === "desktop" ? "active" : ""}" data-action="device" data-device="desktop"><i class="fa fa-desktop"></i> 桌面版</button>
          <button class="${this.userPreviewMode === "mobile" ? "active" : ""}" data-action="device" data-device="mobile"><i class="fa fa-mobile"></i> 移动版</button>
        </div>
        ${this.userPreviewMode === "mobile" && !globalThis.matchMedia?.("(max-width: 560px)")?.matches ? `<button class="icon-btn user-preview-exit" data-action="device" data-device="desktop" aria-label="返回桌面版" title="返回桌面版"><i class="fa fa-expand"></i></button>` : ""}
        <button class="icon-btn" data-action="notifications" aria-label="通知"><i class="fa fa-bell-o"></i>${unread ? '<span class="notification-dot"></span>' : ""}</button>
      </div>
    </header>`;
    return `<header class="topbar">
      <div><div class="page-title">${title}</div><div class="page-kicker">${subtitle}</div></div>
      <div class="top-actions">
        <label class="account-switcher desktop-only"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><select id="account-switch" data-account-switch="true" aria-label="切换测试账号">${accountOptions}</select></label>
        <label class="mobile-account-switcher mobile-only"><span class="account-dot" style="background:${this.activeAccount()?.color || "#0f766e"}"></span><select id="mobile-account-switch" data-account-switch="true" aria-label="移动端切换测试账号">${accountOptions}</select></label>
        <span class="badge ${this.state.adapters.ai.configured ? "badge-success" : "badge-demo"} desktop-only"><i class="fa ${this.state.adapters.ai.configured ? "fa-magic" : "fa-flask"}"></i> ${this.state.adapters.ai.configured ? "模型已连接 · 发布演示" : "模型未连接 · 发布演示"}</span>
        <div class="device-switch desktop-only">
          <button class="${this.state.ui.device === "desktop" ? "active" : ""}" data-action="device" data-device="desktop"><i class="fa fa-desktop"></i> 桌面</button>
          <button class="${this.state.ui.device === "mobile" ? "active" : ""}" data-action="device" data-device="mobile"><i class="fa fa-mobile"></i> 移动</button>
        </div>
        ${this.state.ui.device === "mobile" ? `<button class="btn btn-secondary btn-sm" data-action="device" data-device="desktop"><i class="fa fa-expand"></i></button>` : ""}
        <button class="icon-btn" data-action="notifications" aria-label="通知"><i class="fa fa-bell-o"></i>${unread ? '<span class="notification-dot"></span>' : ""}</button>
      </div>
    </header>`;
  }

  renderMobileNav() {
    if (this.usesUserFacingExperience) {
      const items = this.usesUserAExperience ? USER_A_MOBILE_NAV : this.userEditionV2 ? USER_V2_MOBILE_NAV : USER_NAV;
      return `<nav class="mobile-bottom user-mobile-bottom ${this.usesUserAExperience ? "a-mobile-nav" : this.userEditionV2 ? "v2-mobile-nav" : ""}" aria-label="移动端主导航">${items.map(item => `<button class="${item.views.includes(this.state.ui.view) ? "active" : ""} ${item.primary ? "primary" : ""}" data-action="navigate" data-view="${item.id}"><i class="fa ${item.icon}"></i><span>${item.label}</span></button>`).join("")}</nav>`;
    }
    const items = [
      { id: "dashboard", label: "首页", icon: "fa-dashboard", views: ["dashboard"] },
      { id: "editor", label: "创作", icon: "fa-pencil-square-o", views: ["topics", "editor", "materials", "planner", "records", "creatorPublish"] },
      { id: "interactions", label: "互动", icon: "fa-comments-o", views: ["interactions"] },
      { id: "analytics", label: "数据", icon: "fa-line-chart", views: ["analytics"] },
      { id: "valueServices", label: "服务", icon: "fa-diamond", views: ["valueServices", "valueCapabilityDetail", "valueServiceDetail"] }
    ];
    return `<nav class="mobile-bottom" aria-label="移动端主导航">${items.map(item => `<button class="${item.views.includes(this.state.ui.view) ? "active" : ""}" data-action="navigate" data-view="${item.id}"><i class="fa ${item.icon}"></i><span>${item.label}</span></button>`).join("")}</nav>`;
  }

  renderMobileSubnav() {
    if (this.usesUserFacingExperience) {
      const items = this.usesUserAExperience ? USER_A_DESKTOP_NAV : this.userEditionV2 ? USER_V2_DESKTOP_NAV : USER_NAV;
      const creationSteps = [
        ["topics", "选题"], ["editor", "编辑"], ["creatorPublish", this.usesUserAExperience ? "发布平台" : "发布确认"]
      ];
      const mobileCreation = this.usesUserAExperience && ["topics", "editor", "creatorPublish"].includes(this.state.ui.view)
        ? `<div class="a-mobile-creation-steps">${creationSteps.map(([id, label], index) => `<button class="${this.state.ui.view === id ? "active" : creationSteps.findIndex(step => step[0] === this.state.ui.view) > index ? "done" : ""}" data-action="navigate" data-view="${id}" ${id === "creatorPublish" && !this.state.publishForm ? "disabled" : ""}><span>${index + 1}</span>${label}</button>`).join("")}</div>`
        : "";
      return `<nav class="user-module-nav ${this.usesUserAExperience ? "a-desktop-nav" : this.userEditionV2 ? "v2-desktop-nav" : ""}" aria-label="AI 内容助手子功能">${items.map(item => `<button class="${item.views.includes(this.state.ui.view) ? "active" : ""}" data-action="navigate" data-view="${item.id}"><i class="fa ${item.icon}"></i><span>${item.label}</span></button>`).join("")}</nav>${mobileCreation}`;
    }
    const items = [
      { id: "topics", label: "选题", icon: "fa-lightbulb-o", views: ["topics"] },
      { id: "editor", label: "内容", icon: "fa-pencil-square-o", views: ["editor", "creatorPublish"] },
      { id: "materials", label: "素材", icon: "fa-picture-o", views: ["materials"] },
      { id: "planner", label: "计划", icon: "fa-calendar", views: ["planner"] },
      { id: "records", label: "记录", icon: "fa-send-o", views: ["records"] }
    ];
    if (!items.some(item => item.views.includes(this.state.ui.view))) return "";
    return `<nav class="mobile-subnav" aria-label="移动端创作分区">${items.map(item => `<button class="${item.views.includes(this.state.ui.view) ? "active" : ""}" data-action="navigate" data-view="${item.id}"><i class="fa ${item.icon}"></i>${item.label}</button>`).join("")}</nav>`;
  }

  renderView() {
    const views = {
      dashboard: () => this.renderDashboard(), topics: () => this.renderTopics(), editor: () => this.renderEditor(), creatorPublish: () => this.renderCreatorPublish(), publishComplete: () => this.renderPublishComplete(),
      materials: () => this.renderMaterials(), planner: () => this.renderPlanner(), records: () => this.renderRecords(), interactions: () => this.renderInteractions(),
      analytics: () => this.renderAnalytics(), valueServices: () => this.renderValueServices(), valueCapabilityDetail: () => this.renderValueCapabilityDetail(), valueServiceDetail: () => this.renderValueServiceDetail(),
      hotelGallery: () => this.renderHotelGallery(), hotelData: () => this.renderHotelData(), platformAccounts: () => this.renderPlatformAccounts(), weeklySettings: () => this.renderWeeklySettings(),
      knowledge: () => this.renderKnowledge(), aiRules: () => this.renderAiRules(), settings: () => this.renderSettings()
    };
    return (views[this.state.ui.view] || views.dashboard)();
  }

  renderUserADashboard() {
    const workflow = computeContentWorkflow(this.state);
    const recommendations = this.state.aiRecommendations || [];
    const pendingContent = this.state.records.filter(item => ["scheduled", "draft", "reviewing"].includes(item.status)).length;
    const pendingInteractions = (this.state.interactionCenter?.items || []).filter(item => item.status === "pending").length;
    const weeklyAutomation = this.state.weeklyAutomation || DEFAULT_STATE.weeklyAutomation;
    const weeklyPlan = this.state.weekPlan || [];
    const weeklyActiveItems = weeklyPlan.filter(item => item.status !== "skipped");
    const weeklyReady = weeklyActiveItems.filter(item => ["ready", "ready-review", "scheduled", "published"].includes(item.status)).length;
    const weeklyPublished = weeklyActiveItems.filter(item => item.status === "published").length;
    const weeklyRunning = weeklyActiveItems.filter(item => item.status === "generating").length;
    const weeklyNeedsAction = weeklyActiveItems.filter(item => ["ready-review", "failed"].includes(item.status)).length;
    const nextWeeklyItem = weeklyActiveItems.find(item => !["published", "skipped"].includes(item.status));
    const activeTopic = workflow.activeTopic || this.state.topics.find(item => item.id === this.state.draft?.topicId);
    const eligibleHomeTopics = this.state.topics.filter(item => item.hotelTypes.includes(this.state.settings.hotelType) && item.id !== activeTopic?.id);
    const hotelSpecificHomeTopics = eligibleHomeTopics.filter(item => !String(item.id).startsWith("g"));
    const homeRecommendations = (recommendations.length ? recommendations : [...hotelSpecificHomeTopics, ...eligibleHomeTopics.filter(item => String(item.id).startsWith("g"))]).slice(0, 3);
    const featuredRecommendation = homeRecommendations.find(item => item.id === this.homeFeaturedTopicId) || homeRecommendations[0];
    const alternativeRecommendations = homeRecommendations.filter(item => item.id !== featuredRecommendation?.id).slice(0, 2);
    const recommendationImage = topicItem => this.state.materials.find(item => item.src && item.category === (topicItem?.materialCategory || topicItem?.material)) || this.state.materials.find(item => item.src);
    const featuredImage = recommendationImage(featuredRecommendation);
    const imageSrc = featuredImage?.src ? (featuredImage.src.startsWith("data:") ? featuredImage.src : encodeURI(featuredImage.src)) : "";
    const featuredIsAi = recommendations.some(item => item.id === featuredRecommendation?.id);
    const featuredCategory = featuredRecommendation?.materialCategory || featuredRecommendation?.material || "room";
    const featuredMaterialName = materialName(featuredCategory);
    const featuredMaterialCount = this.state.materials.filter(item => item.src && item.category === featuredCategory).length;
    const audienceText = userFacingTopicText(featuredRecommendation?.targetAudience, "适合正在比较大理住宿体验的客人");
    const angleText = userFacingTopicText(featuredRecommendation?.contentAngle || featuredRecommendation?.objective, "从真实入住场景切入，突出酒店体验价值");
    const materialText = userFacingTopicText(featuredRecommendation?.materialReadiness, `当前素材库有 ${featuredMaterialCount} 张${featuredMaterialName}，可以支撑这个方向的真实场景`);
    const draftNotice = workflow.generationStatus === "generating"
      ? `<section class="a-draft-ribbon is-loading"><span><i class="fa fa-circle-o-notch fa-spin"></i></span><div><strong>正在生成一条新内容</strong><small>正在读取酒店事实并匹配图片</small></div><button disabled>生成中</button></section>`
      : workflow.publishFormReady
        ? `<section class="a-draft-ribbon"><span><i class="fa fa-send-o"></i></span><div><strong>你有 1 篇内容等待确认</strong><small>${escapeHtml(this.state.draft?.title || "标题、图片、地点和发布设置已准备")}</small></div><button data-action="navigate" data-view="creatorPublish">继续处理 <i class="fa fa-angle-right"></i></button></section>`
        : workflow.contentReady
          ? `<section class="a-draft-ribbon"><span><i class="fa fa-pencil"></i></span><div><strong>你有 1 篇内容尚未完成</strong><small>${escapeHtml(this.state.draft?.title || "文案和图片已自动保存")}</small></div><button data-action="navigate" data-view="editor">继续编辑 <i class="fa fa-angle-right"></i></button></section>`
          : "";
    const recommendationContent = this.aiLoading
      ? `<div class="a-recommendation-loading" role="status" aria-live="polite"><div class="a-loading-copy"><span></span><strong>正在结合酒店资料生成新选题</strong><p>${escapeHtml(this.aiStage || "正在检索酒店事实、图片库存和近期内容…")}</p><i></i><i></i><i></i></div><div class="a-loading-cover"><i class="fa fa-magic"></i><span>正在重新匹配推荐封面</span></div></div>`
      : featuredRecommendation
        ? `<div class="a-recommendation-main"><div class="a-topic-title-panel"><div class="a-recommend-eyebrow"><span><i class="fa fa-lightbulb-o"></i> 今日主推选题</span><em>${featuredIsAi ? "AI 推荐" : "酒店适配"}</em></div><h1>${escapeHtml(featuredRecommendation.title)}</h1><div class="a-topic-meta">${topicBadge(featuredRecommendation.type || "vertical")}<span>${escapeHtml(featuredMaterialName)}</span></div></div><button class="a-recommend-cover" data-action="home-topic-detail" data-topic="${featuredRecommendation.id}" aria-label="查看推荐选题封面和详情">${imageSrc ? `<img src="${imageSrc}" alt="${escapeHtml(featuredImage.title || "推荐选题封面")}">` : '<span class="a-cover-empty"><i class="fa fa-picture-o"></i>正在匹配推荐封面</span>'}<span class="a-cover-shade"></span><span class="a-cover-badge"><i class="fa fa-star"></i> 建议封面</span><span class="a-cover-caption"><strong>${escapeHtml(featuredImage?.title || featuredMaterialName)}</strong><small>点击查看选题详情</small></span></button></div><section class="a-topic-reason-panel"><div class="a-reason-heading"><span>选题理由</span><h2>为什么推荐这个选题</h2><p>从目标客人、内容表达和现有素材三个方面判断</p></div><div class="a-reason-grid"><article><span>适合谁</span><i class="fa fa-user-o"></i><p>${escapeHtml(audienceText)}</p></article><article><span>内容怎么讲</span><i class="fa fa-commenting-o"></i><p>${escapeHtml(angleText)}</p></article><article><span>素材基础</span><i class="fa fa-picture-o"></i><p>${escapeHtml(materialText)}</p></article></div></section><section class="a-topic-action-panel"><button class="btn btn-primary a-generate-topic" data-action="home-generate-topic" data-topic="${featuredRecommendation.id}" ${!this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa fa-magic"></i><span>立即生成这条图文</span><i class="fa fa-arrow-right"></i></button><small class="a-output-note"><i class="fa fa-file-text-o"></i>约 120 字正文 · 1 张封面 · 4 张内容图 · 生成后可修改</small><div class="a-secondary-topic-actions"><button data-action="home-refresh-topics" ${!this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa fa-refresh"></i>换一组选题</button><button data-action="home-topic-detail" data-topic="${featuredRecommendation.id}"><i class="fa fa-info-circle"></i>查看推荐详情</button></div></section><div class="a-alternative-topics"><div class="a-alternative-head"><div><strong>另外两个方向</strong><span>点击即可切换为主推选题</span></div><button data-action="navigate" data-view="topics">查看全部选题 <i class="fa fa-angle-right"></i></button></div><div class="a-alternative-list">${alternativeRecommendations.map((item, index) => `<button data-action="feature-home-topic" data-topic="${item.id}"><span>0${index + 2}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(userFacingTopicText(item.targetAudience, "适合当前酒店的目标客人", 48))}</small></div><i class="fa fa-arrow-right"></i></button>`).join("")}</div></div>`
        : `<div class="a-recommendation-empty"><i class="fa fa-lightbulb-o"></i><h2>还没有准备今日选题</h2><p>AI 会结合当前酒店资料、图片库存和近期内容，生成三个不重复的方向。</p><button class="btn btn-primary" data-action="home-refresh-topics" ${!this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa fa-magic"></i>生成今日选题</button></div>`;
    const weeklyAutomationCard = weeklyAutomation.status === "active"
      ? `<section class="a-week-autopilot is-active"><div class="a-week-autopilot-icon"><i class="fa fa-calendar-check-o"></i></div><div class="a-week-autopilot-copy"><span>可选功能 · 本周正在使用</span><h2>7天自动运营</h2><p>${nextWeeklyItem ? `下一项：${escapeHtml(nextWeeklyItem.date)} ${escapeHtml(nextWeeklyItem.time)} · ${escapeHtml(nextWeeklyItem.title)}` : "本周任务已经全部完成"}</p></div><div class="a-week-autopilot-metrics"><span><strong>${weeklyPublished}</strong><small>已发布</small></span><span><strong>${weeklyReady}</strong><small>已准备</small></span><span><strong>${weeklyRunning}</strong><small>准备中</small></span><span class="${weeklyNeedsAction ? "needs-action" : ""}"><strong>${weeklyNeedsAction}</strong><small>待处理</small></span></div><button class="btn btn-primary" data-action="open-week-automation">查看本周运行 <i class="fa fa-arrow-right"></i></button></section>`
      : weeklyAutomation.status === "paused"
        ? `<section class="a-week-autopilot is-paused"><div class="a-week-autopilot-icon"><i class="fa fa-pause"></i></div><div class="a-week-autopilot-copy"><span>可选功能 · 已暂停</span><h2>7天自动运营</h2><p>本周任务和已准备内容均已保留，不会继续自动推进。</p></div><button class="btn btn-primary" data-action="toggle-week-automation">继续运行</button><button class="btn btn-secondary" data-action="open-week-automation">查看本周</button></section>`
        : `<section class="a-week-autopilot is-optional"><div class="a-week-autopilot-icon"><i class="fa fa-magic"></i></div><div class="a-week-autopilot-copy"><span>可选功能</span><h2>${weeklyAutomation.status === "completed" ? "本周自动运营已结束" : "想省心一点？试试7天自动运营"}</h2><p>${weeklyAutomation.status === "completed" ? "任务不会自动续期，需要时可以重新安排一周。" : "可以只生成7天选题，也可以自动准备内容或按计划发布。"}</p></div><button class="btn btn-primary" data-action="navigate" data-view="weeklySettings">${weeklyAutomation.status === "completed" ? "再安排一周" : "看看怎么安排"} <i class="fa fa-arrow-right"></i></button></section>`;
    return `<div class="a-home a-home-redesign">
      ${draftNotice}
      ${this.aiError ? `<section class="a-home-error"><i class="fa fa-exclamation-circle"></i><span>上次推荐未完成：${escapeHtml(this.aiError)}</span><button data-action="home-refresh-topics">重新获取</button></section>` : ""}
      <section class="a-recommendation-stage">${recommendationContent}</section>
      ${weeklyAutomationCard}
      <section class="a-today-panel"><div class="a-today-head"><div><span>今天需要处理</span><h2>只保留会影响运营的事项</h2></div><small>${pendingContent + pendingInteractions ? `共 ${pendingContent + pendingInteractions} 项待处理` : "今天没有待办"}</small></div><div class="a-today-actions"><button data-action="publish-section" data-section="pending"><span class="a-today-icon amber"><i class="fa fa-file-text-o"></i></span><div><strong>${pendingContent} 篇内容待处理</strong><small>草稿、审核中与待发布内容</small></div><em>去处理 <i class="fa fa-angle-right"></i></em></button><button data-action="navigate" data-view="interactions"><span class="a-today-icon blue"><i class="fa fa-comments-o"></i></span><div><strong>${pendingInteractions} 条互动待回复</strong><small>优先处理预订、房型与地点咨询</small></div><em>去回复 <i class="fa fa-angle-right"></i></em></button></div></section>
    </div>`;
  }

  renderUserV2Dashboard() {
    const workflow = computeContentWorkflow(this.state);
    const recommendations = (this.state.aiRecommendations || []).slice(0, 2);
    const topic = workflow.activeTopic || recommendations[0] || this.state.topics.find(item => item.id === this.state.draft?.topicId);
    const selectedCoverId = this.state.draft?.imageIds?.[0];
    const cover = this.state.materials.find(item => item.id === selectedCoverId) || this.state.materials.find(item => item.src);
    const pendingContent = this.state.records.filter(item => ["scheduled", "draft", "reviewing"].includes(item.status)).length;
    const pendingInteractions = (this.state.interactionCenter?.items || []).filter(item => item.status === "pending").length;
    const progress = workflow.publishFormReady ? 3 : workflow.contentReady ? 2 : workflow.topicConfirmed ? 1 : 0;
    const primaryAction = workflow.generationStatus === "generating"
      ? '<button class="btn btn-primary v2-primary-action" disabled><i class="fa fa-spinner fa-spin"></i><span><strong>AI 正在生成内容</strong><small>正在匹配酒店事实与图片</small></span></button>'
      : workflow.publishFormReady
        ? '<button class="btn btn-primary v2-primary-action" data-action="navigate" data-view="creatorPublish"><i class="fa fa-send-o"></i><span><strong>继续完成发布确认</strong><small>发布信息已补全，确认后提交抖音</small></span><i class="fa fa-arrow-right"></i></button>'
        : workflow.contentReady
        ? '<button class="btn btn-primary v2-primary-action" data-action="navigate" data-view="editor"><i class="fa fa-pencil"></i><span><strong>继续编辑这条内容</strong><small>检查文案、图片和地点</small></span><i class="fa fa-arrow-right"></i></button>'
        : workflow.topicConfirmed
          ? '<button class="btn btn-primary v2-primary-action" data-action="generate-active-topic"><i class="fa fa-magic"></i><span><strong>让 AI 生成图文</strong><small>自动生成约 120 字正文和 5 张配图</small></span><i class="fa fa-arrow-right"></i></button>'
          : recommendations[0]
            ? `<button class="btn btn-primary v2-primary-action" data-action="choose-ai-topic" data-topic="${recommendations[0].id}"><i class="fa fa-check-circle-o"></i><span><strong>用这个方向开始创作</strong><small>${escapeHtml(recommendations[0].title)}</small></span><i class="fa fa-arrow-right"></i></button>`
            : `<button class="btn btn-primary v2-primary-action" data-action="ai-recommend" ${this.aiLoading || !this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa ${this.aiLoading ? "fa-spinner fa-spin" : "fa-magic"}"></i><span><strong>${this.aiLoading ? "AI 正在分析" : "让 AI 推荐今天发什么"}</strong><small>${this.state.adapters.ai.configured ? "结合酒店资料、图片和历史内容" : "模型连接后即可生成推荐"}</small></span><i class="fa fa-arrow-right"></i></button>`;
    const steps = [
      ["确定方向", "AI 推荐，你来选择"],
      ["生成图文", "文案和图片自动完成"],
      ["确认发布", "补全抖音发布信息"]
    ];
    return `<div class="v2-home">
      <section class="v2-home-hero">
        <div class="v2-hero-copy"><span class="v2-eyebrow"><i class="fa fa-sun-o"></i> 今天的内容任务</span><h1>今天用 3 分钟，<br>完成一条酒店抖音图文</h1><p>AI 会先推荐适合今天的方向，再自动准备文案、5 张酒店实拍图和发布信息。</p><div class="v2-hero-actions">${primaryAction}<button class="btn btn-secondary v2-secondary-action" data-action="navigate" data-view="topics">查看全部创作方式</button></div></div>
        <div class="v2-hero-visual">${cover?.src ? `<img src="${cover.src.startsWith("data:") ? cover.src : encodeURI(cover.src)}" alt="${escapeHtml(cover.title || "酒店实拍素材")}">` : '<div class="v2-cover-empty"><i class="fa fa-picture-o"></i></div>'}<span>酒店实拍素材</span></div>
      </section>

      <section class="v2-progress" aria-label="今日创作进度"><div class="v2-progress-head"><div><span>今日进度</span><strong>${progress}/3</strong></div><small>${progress === 3 ? "发布信息已补全，请做最后确认" : `下一步：${steps[Math.min(progress, 2)][0]}`}</small></div><div class="v2-step-grid">${steps.map((item, index) => `<article class="${progress > index ? "done" : progress === index ? "active" : ""}"><span>${progress > index ? '<i class="fa fa-check"></i>' : index + 1}</span><div><strong>${item[0]}</strong><small>${item[1]}</small></div></article>`).join("")}</div></section>

      <div class="v2-home-grid">
        <section class="v2-panel v2-recommend-panel"><div class="v2-panel-head"><div><span>AI 今日建议</span><h2>${topic ? escapeHtml(topic.title) : "还没有生成今日方向"}</h2></div><button class="btn btn-ghost btn-sm" data-action="ai-recommend" ${this.aiLoading || !this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa fa-refresh"></i> 换一组</button></div>${recommendations.length ? `<div class="v2-recommend-list">${recommendations.map((item, index) => `<button data-action="choose-ai-topic" data-topic="${item.id}"><span>0${index + 1}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.reason || "适合当前酒店与今日内容节奏")}</small></div><i class="fa fa-angle-right"></i></button>`).join("")}</div>` : `<div class="v2-empty"><i class="fa fa-lightbulb-o"></i><p>点击上方主按钮，AI 会准备 3 个可直接创作的方向。</p></div>`}</section>
        <section class="v2-panel v2-todo-panel"><div class="v2-panel-head"><div><span>需要你处理</span><h2>两个入口，不错过重要事项</h2></div></div><button data-action="publish-section" data-section="pending"><i class="fa fa-file-text-o"></i><div><strong>${pendingContent} 条内容待处理</strong><small>草稿、审核中和待发布内容</small></div><span>去查看 <i class="fa fa-angle-right"></i></span></button><button data-action="navigate" data-view="interactions"><i class="fa fa-comments-o"></i><div><strong>${pendingInteractions} 条互动待回复</strong><small>评论与私信咨询</small></div><span>去处理 <i class="fa fa-angle-right"></i></span></button></section>
      </div>
    </div>`;
  }

  renderUserDashboard() {
    if (this.usesUserAExperience) return this.renderUserADashboard();
    if (this.userEditionV2) return this.renderUserV2Dashboard();
    const metrics = computeDashboard(this.state.records);
    const workflow = computeContentWorkflow(this.state);
    const recommendations = this.state.aiRecommendations || [];
    const activeTopic = workflow.activeTopic;
    const topic = activeTopic || recommendations[0] || this.state.topics.find(item => item.id === this.state.draft.topicId);
    const progress = workflow.contentReady ? (workflow.publishFormReady ? 3 : 2) : workflow.topicConfirmed ? 1 : 0;
    const primaryAction = workflow.generationStatus === "generating"
      ? '<button class="btn btn-primary" disabled><i class="fa fa-spinner fa-spin"></i> 正在准备内容</button>'
      : workflow.contentReady
        ? '<button class="btn btn-primary" data-action="navigate" data-view="editor">继续编辑并发布 <i class="fa fa-arrow-right"></i></button>'
        : workflow.topicConfirmed
          ? '<button class="btn btn-primary" data-action="generate-active-topic">生成这条内容 <i class="fa fa-arrow-right"></i></button>'
          : recommendations[0]
            ? `<button class="btn btn-primary" data-action="choose-ai-topic" data-topic="${recommendations[0].id}">使用这个选题 <i class="fa fa-arrow-right"></i></button>`
            : `<button class="btn btn-primary" data-action="ai-recommend" ${this.aiLoading || !this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa fa-magic"></i> ${this.aiLoading ? "正在准备…" : "生成今日选题"}</button>`;
    const steps = [
      ["选一个主题", "从今天推荐中确认方向"],
      ["确认内容和图片", "可以修改文案或更换图片"],
      ["补全信息并发布", "自动带入抖音发布页面"]
    ];
    return `<div class="user-dashboard">
      <section class="user-welcome-card">
        <div><span class="user-eyebrow">今日内容任务</span><h1>${escapeHtml(topic?.title || "生成一条适合今天发布的酒店内容")}</h1><p>${escapeHtml(topic?.targetAudience || topic?.reason || "系统会根据酒店资料、历史内容和现有图片准备推荐。")}</p><div class="user-welcome-actions">${primaryAction}<button class="btn btn-secondary" data-action="navigate" data-view="topics">查看全部选题</button></div></div>
        <div class="user-progress-card"><strong>${progress}/3</strong><span>今日进度</span><div class="progress"><span style="width:${Math.round(progress / 3 * 100)}%"></span></div></div>
      </section>
      <section class="user-flow section-space">${steps.map((item, index) => `<article class="${progress > index ? "done" : progress === index ? "active" : ""}"><span>${progress > index ? '<i class="fa fa-check"></i>' : index + 1}</span><div><strong>${item[0]}</strong><small>${item[1]}</small></div></article>`).join("")}</section>
      <section class="user-section section-space"><div class="user-section-head"><div><h2>今天推荐</h2><p>选一个最适合今天发布的方向</p></div><button class="btn btn-secondary btn-sm" data-action="ai-recommend" ${this.aiLoading || !this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa fa-refresh"></i> 换一组</button></div>
        ${recommendations.length ? `<div class="user-topic-grid">${recommendations.slice(0, 3).map(item => `<article><span><span class="badge badge-info">今日推荐</span></span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.targetAudience || item.reason || "适合当前酒店账号")}</p><button class="btn btn-secondary btn-sm" data-action="choose-ai-topic" data-topic="${item.id}">选择并生成</button></article>`).join("")}</div>` : `<div class="user-empty-state"><i class="fa fa-magic"></i><div><strong>${this.state.adapters.ai.configured ? "还没有生成今天的选题" : "AI 服务暂时不可用"}</strong><p>${this.state.adapters.ai.configured ? "点击上方按钮，系统会准备 3 个可直接创作的方向。" : "请联系服务顾问完成配置。"}</p></div></div>`}
      </section>
      <section class="user-quick-grid section-space">
        <button data-action="navigate" data-view="materials"><i class="fa fa-picture-o"></i><span><strong>内容素材池</strong><small>${this.state.materials.filter(item => item.src).length} 张酒店图片可用于创作</small></span><i class="fa fa-angle-right"></i></button>
        <button data-action="navigate" data-view="planner"><i class="fa fa-calendar"></i><span><strong>未来 7 天计划</strong><small>查看和调整发布时间</small></span><i class="fa fa-angle-right"></i></button>
        <button data-action="navigate" data-view="interactions"><i class="fa fa-comments-o"></i><span><strong>待处理互动</strong><small>统一处理评论和私信</small></span><i class="fa fa-angle-right"></i></button>
      </section>
      <section class="grid-4 section-space user-metrics">
        ${this.metricCard("本月发布", metrics.published, "fa-send-o", "条内容")}
        ${this.metricCard("累计曝光", fmt(metrics.views), "fa-eye", "次浏览")}
        ${this.metricCard("累计互动", fmt(metrics.interactions), "fa-heart-o", `互动率 ${metrics.engagementRate}%`)}
        ${this.metricCard("发布成功率", `${metrics.successRate}%`, "fa-check-circle-o", "保持稳定更新")}
      </section>
    </div>`;
  }

  renderDashboard() {
    if (this.userEdition) return this.renderUserDashboard();
    const metrics = computeDashboard(this.state.records);
    const workflow = computeContentWorkflow(this.state);
    const activeTopic = workflow.activeTopic;
    const recommendations = this.state.aiRecommendations || [];
    const ruleTopic = this.state.topics.find(item => item.id === this.state.draft.topicId);
    const heroTopic = activeTopic || recommendations[0] || ruleTopic;
    const peak = detectPeak(this.state.records);
    const stageLabels = {
      "knowledge-ready": "等待模型推荐", "topic-recommendation": "等待确认选题", "topic-confirmed": "选题已确认",
      "content-generating": "内容生成中", "content-confirmation": "等待确认内容", "publish-completion": "发布信息补全中"
    };
    const steps = [
      { label: "模型推荐", icon: "fa-magic", done: workflow.hasRecommendations || activeTopic?.source === "ai-recommendation", active: !workflow.hasRecommendations && !workflow.topicConfirmed },
      { label: "确认选题", icon: "fa-check-square-o", done: workflow.topicConfirmed, active: workflow.hasRecommendations && !workflow.topicConfirmed },
      { label: "内容生成", icon: "fa-file-text-o", done: workflow.contentReady, active: workflow.topicConfirmed && !workflow.contentReady },
      { label: "确认内容", icon: "fa-check-circle-o", done: workflow.publishFormReady, active: workflow.contentReady && !workflow.publishFormReady },
      { label: "发布补全", icon: "fa-send-o", done: false, active: workflow.publishFormReady }
    ];
    const heroAction = workflow.generationStatus === "generating"
      ? '<button class="btn" disabled><i class="fa fa-spinner fa-spin"></i> 正在生成内容</button>'
      : workflow.contentReady
        ? '<button class="btn" data-action="navigate" data-view="editor">查看并确认内容 <i class="fa fa-arrow-right"></i></button>'
        : workflow.topicConfirmed
          ? '<button class="btn" data-action="generate-active-topic">确认选题并生成内容 <i class="fa fa-arrow-right"></i></button>'
          : recommendations[0]
            ? `<button class="btn" data-action="choose-ai-topic" data-topic="${recommendations[0].id}">确认首选并生成内容 <i class="fa fa-arrow-right"></i></button>`
            : `<button class="btn" data-action="${this.state.adapters.ai.configured ? "ai-recommend" : "navigate"}" ${this.state.adapters.ai.configured ? "" : 'data-view="settings"'}>${this.state.adapters.ai.configured ? "获取模型推荐" : "连接模型"} <i class="fa fa-arrow-right"></i></button>`;
    return `
      ${!this.state.adapters.ai.configured ? `<div class="alert alert-warning"><i class="fa fa-plug"></i><div style="flex:1"><strong>模型尚未连接</strong><br>当前草稿来自本地规则兜底，不是大模型推荐。连接通义千问后才能测试真实推荐质量。</div><button class="btn btn-primary btn-sm" data-action="navigate" data-view="settings">去连接</button></div>` : ""}
      <section class="card hero">
        <div><span class="badge" style="color:#0b5e58;background:#9ce5d4"><i class="fa fa-link"></i> ${workflow.topicConfirmed ? "当前已确认选题" : recommendations.length ? "模型首选待确认" : "今日内容任务"}</span><h1>${escapeHtml(heroTopic?.title || "先获取今日推荐选题")}</h1><p>${escapeHtml(heroTopic?.objective || heroTopic?.reason || heroTopic?.contentAngle || "模型将结合酒店事实、历史内容和图片库存推荐选题，确认后再进入内容生成。")}</p><div class="hero-meta"><span>${topicBadge(heroTopic?.type || "vertical")}</span>${heroTopic?.targetAudience ? `<span><i class="fa fa-users"></i> ${escapeHtml(heroTopic.targetAudience)}</span>` : ""}${heroTopic?.materialCategory ? `<span><i class="fa fa-picture-o"></i> ${escapeHtml(heroTopic.materialCategory)}</span>` : ""}</div></div>
        <div class="hero-actions">${heroAction}<button class="btn hero-secondary" data-action="navigate" data-view="topics">查看选题推荐</button></div>
      </section>
      <section class="card workflow-console section-space"><div class="workflow-console-head"><div><h2>今日 AI 生产任务</h2><p>每一步都需要真实状态完成，确认后才进入下一阶段。</p></div><span class="badge ${workflow.publishFormReady ? "badge-warning" : workflow.contentReady ? "badge-success" : "badge-info"}">${stageLabels[workflow.stage] || workflow.stage}</span></div><div class="workflow-steps">${steps.map((step, index) => `${index ? '<i class="fa fa-angle-right workflow-arrow"></i>' : ""}<div class="workflow-step ${step.done ? "done" : step.active ? "active" : "pending"}"><span><i class="fa ${step.done ? "fa-check" : step.icon}"></i></span><strong>${step.label}</strong><small>${step.done ? "已完成" : step.active ? "当前步骤" : "待处理"}</small></div>`).join("")}</div></section>
      <section class="card card-pad section-space dashboard-recommendations"><div class="card-title"><div><h2>模型推荐选题</h2><div class="muted tiny" style="margin-top:4px">确认某条选题后，系统将携带完整选题上下文进入内容生成。</div></div><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="topics">进入选题页</button></div>${recommendations.length ? `<div class="dashboard-topic-list">${recommendations.map((item, index) => { const current = activeTopic?.id === item.id && workflow.contentLinked; const generating = activeTopic?.id === item.id && workflow.generationStatus === "generating"; return `<article class="dashboard-topic-card ${current ? "confirmed" : ""}"><div class="dashboard-topic-rank">AI${index + 1}</div><div class="dashboard-topic-copy"><div>${topicBadge(item.type)}<span class="badge badge-neutral">${Number(item.score || 0)}分</span>${current ? '<span class="badge badge-success">已确认并联动</span>' : ""}</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.targetAudience || item.reason || "模型推荐方向")}</p></div>${generating ? '<button class="btn btn-secondary btn-sm" disabled><i class="fa fa-spinner fa-spin"></i> 生成中</button>' : current ? '<button class="btn btn-ghost btn-sm" data-action="navigate" data-view="editor">查看已生成内容</button>' : `<button class="btn btn-primary btn-sm" data-action="choose-ai-topic" data-topic="${item.id}">确认并生成内容</button>`}</article>`; }).join("")}</div>` : `<div class="dashboard-recommend-empty"><i class="fa fa-magic"></i><div><strong>还没有模型推荐选题</strong><p>先让模型检索酒店事实、历史内容和素材库存。</p></div><button class="btn btn-primary" data-action="ai-recommend" ${this.aiLoading || !this.state.adapters.ai.configured ? "disabled" : ""}>${this.aiLoading ? escapeHtml(this.aiStage || "推荐中…") : "获取今日推荐"}</button></div>`}</section>
      <section class="grid-4 section-space">
        ${this.metricCard("本月已发布", metrics.published, "fa-send-o", "稳定更新中")}
        ${this.metricCard("累计曝光", fmt(metrics.views), "fa-eye", "含本地示例数据")}
        ${this.metricCard("累计互动", fmt(metrics.interactions), "fa-heart-o", `互动率 ${metrics.engagementRate}%`)}
        ${this.metricCard("发布成功率", `${metrics.successRate}%`, "fa-check-circle-o", "目标 > 90%")}
      </section>
      ${peak ? `<div class="alert alert-success section-space"><i class="fa fa-bolt"></i><div><strong>发现内容峰值</strong><br>《${escapeHtml(peak.record.title)}》曝光达到近 7 条均值的 ${peak.ratio}%，建议延展同类选题。</div></div>` : ""}
      <section class="grid-2 section-space">
        <div class="card card-pad"><div class="card-title"><h2>当前生成结果</h2><span class="badge ${workflow.contentReady ? "badge-success" : "badge-neutral"}">${workflow.contentReady ? "已关联选题" : "待生成"}</span></div>${workflow.contentReady ? `<div class="dashboard-content-result"><span>作品标题</span><h3>${escapeHtml(this.state.draft.title)}</h3><p>${escapeHtml(Array.from(this.state.draft.body || "").slice(0, 90).join(""))}${charCount(this.state.draft.body) > 90 ? "…" : ""}</p><button class="btn btn-primary btn-sm" data-action="navigate" data-view="editor">确认内容并继续</button></div>` : '<div class="muted tiny">确认一条推荐选题后，内容生成结果会在这里出现。</div>'}</div>
        <div class="card card-pad dashboard-system-card"><div class="card-title"><h2>系统连接</h2><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="settings">配置</button></div>
          ${this.adapterRow("AI 生成", "fa-magic", `${this.state.adapters.ai.provider} · ${this.state.adapters.ai.model}`, this.state.adapters.ai.status)}
          <div style="height:8px"></div>${this.adapterRow("OTA 数据", "fa-database", this.state.adapters.ota.provider, this.state.adapters.ota.status)}
          <div style="height:8px"></div>${this.adapterRow("抖音发布", "fa-music", this.state.adapters.douyin.account, this.state.adapters.douyin.status)}
        </div>
      </section>
      <section class="card card-pad section-space dashboard-recent-card"><div class="card-title"><h2>最近发布</h2><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="records">查看全部</button></div>${this.recordsTable(this.state.records.slice(0, 4), false)}</section>`;
  }

  metricCard(label, value, icon, trend) {
    return `<div class="card metric"><div class="metric-icon"><i class="fa ${icon}"></i></div><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-trend">${trend}</div></div>`;
  }

  adapterRow(name, icon, provider, status) {
    return `<div class="adapter"><div class="adapter-icon"><i class="fa ${icon}"></i></div><div class="adapter-main"><h3>${name}</h3><div class="muted tiny truncate-cell">${escapeHtml(provider || "未配置")}</div></div>${adapterBadge(status)}</div>`;
  }

  renderUserATopics() {
    const recommendations = this.state.aiRecommendations || [];
    const activeTopic = this.state.activeTopic || this.state.draft?.topicContext;
    const eligibleTopics = this.state.topics.filter(item => item.hotelTypes.includes(this.state.settings.hotelType) && item.id !== activeTopic?.id);
    const hotelSpecificTopics = eligibleTopics.filter(item => !String(item.id).startsWith("g"));
    const options = recommendations.length ? recommendations : [...hotelSpecificTopics, ...eligibleTopics.filter(item => String(item.id).startsWith("g"))].slice(0, 3);
    const materialName = id => MATERIAL_CATEGORIES.find(item => item.id === id)?.name || "酒店实拍";
    return `<div class="a-create-page">
      <section class="a-create-intro"><div><span class="a-kicker">第 1 步 · 确定内容方向</span><h1>选择今天要创作的主题</h1><p>AI 已结合当前酒店、图片库存和近期内容去重。选中后会直接生成约 120 字正文和 5 张配图。</p></div><button class="btn btn-secondary" data-action="ai-recommend" ${this.aiLoading || !this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa ${this.aiLoading ? "fa-spinner fa-spin" : "fa-refresh"}"></i> ${this.aiLoading ? "正在换一组" : "换一组推荐"}</button></section>
      ${activeTopic?.title ? `<section class="a-current-work"><span><i class="fa fa-pencil"></i></span><div><small>有一条内容正在编辑</small><strong>${escapeHtml(activeTopic.title)}</strong></div><button class="btn btn-secondary" data-action="navigate" data-view="editor">继续编辑 <i class="fa fa-angle-right"></i></button></section>` : ""}
      <section class="a-topic-list">${options.map((item, index) => `<article class="${activeTopic?.id === item.id ? "selected" : ""}"><div class="a-topic-rank"><span>推荐 ${index + 1}</span>${item.score ? `<em>${Number(item.score)} 分</em>` : ""}</div><div class="a-topic-copy"><div>${topicBadge(item.type || "vertical")}<span class="badge badge-neutral"><i class="fa fa-picture-o"></i> ${escapeHtml(materialName(item.materialCategory || item.material))}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.targetAudience || item.reason || "适合当前酒店和今天的内容节奏")}</p><details><summary>为什么推荐这个方向</summary><div>${escapeHtml(item.reason || item.objective || "综合酒店资料、近期内容和可用图片后推荐；生成时会继续校验事实并避开重复图片。")}</div></details></div><button class="btn btn-primary" data-action="${recommendations.length ? "choose-ai-topic" : "choose-topic"}" data-topic="${item.id}">${activeTopic?.id === item.id && this.state.draft?.topicId === item.id ? "重新生成此主题" : "选这个并生成"}<i class="fa fa-arrow-right"></i></button></article>`).join("")}</section>
      <section class="a-custom-topic"><div><span><i class="fa fa-pencil-square-o"></i></span><div><h2>我有自己的想法</h2><p>输入活动、房型、客群或想表达的主题，AI 会按当前酒店事实生成。</p></div></div><form data-form="custom-topic"><input class="form-control" name="customTopic" maxlength="60" required placeholder="例如：暑期带父母来大理，住古城附近怎么安排"><button class="btn btn-primary" type="submit">按我的想法生成</button></form></section>
      <section class="a-create-tools"><button data-action="navigate" data-view="planner"><i class="fa fa-calendar-o"></i>查看未来 7 天计划</button><button data-action="navigate" data-view="materials"><i class="fa fa-picture-o"></i>查看全部酒店素材</button></section>
    </div>`;
  }

  renderUserTopics() {
    const recommendations = this.state.aiRecommendations || [];
    const activeTopic = this.state.activeTopic || this.state.draft.topicContext;
    const generationJob = this.state.contentGenerationJob;
    const options = recommendations.length ? recommendations : this.state.topics.filter(item => item.hotelTypes.includes(this.state.settings.hotelType)).slice(0, 3);
    const materialName = id => MATERIAL_CATEGORIES.find(item => item.id === id)?.name || "酒店实拍图片";
    return `<div class="user-create-page">
      <section class="user-create-head"><div><span class="user-eyebrow">第 1 步 · 选择主题</span><h1>今天想发什么？</h1><p>系统已经结合当前酒店资料和最近发布内容，整理出可以直接生成的方向。</p></div><div><button class="btn btn-primary" data-action="ai-recommend" ${this.aiLoading || !this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa fa-refresh"></i> ${this.aiLoading ? "正在准备…" : "换一组推荐"}</button><button class="btn btn-secondary" data-action="navigate" data-view="planner"><i class="fa fa-calendar"></i> 查看本周计划</button></div></section>
      ${activeTopic?.title ? `<section class="user-current-topic"><i class="fa fa-check-circle"></i><div><span>当前正在创作</span><strong>${escapeHtml(activeTopic.title)}</strong></div><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="editor">${generationJob?.status === "generating" ? "生成中" : "继续编辑"}</button></section>` : ""}
      <section class="user-topic-choice-grid">${options.map((item, index) => `<article class="${activeTopic?.id === item.id ? "selected" : ""}"><div class="user-topic-choice-top"><span class="user-choice-number">${String(index + 1).padStart(2, "0")}</span><span class="badge badge-info">推荐方向</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.targetAudience || item.reason || "适合当前酒店的内容方向")}</p><div class="user-topic-hint"><i class="fa fa-picture-o"></i><span>${escapeHtml(materialName(item.materialCategory) || item.material || "酒店实拍图片")}</span></div><button class="btn btn-primary" data-action="${recommendations.length ? "choose-ai-topic" : "choose-topic"}" data-topic="${item.id}">${activeTopic?.id === item.id && this.state.draft.topicId === item.id ? "查看已生成内容" : "用这个选题生成内容"}</button></article>`).join("")}</section>
      <section class="user-create-help section-space"><i class="fa fa-lightbulb-o"></i><div><strong>不知道选哪个？</strong><p>优先选择与你近期没有重复、并且现有图片最充足的主题。系统在生成时还会自动避开近期用过的图片。</p></div></section>
    </div>`;
  }

  renderTopics() {
    if (this.usesUserAExperience) return this.renderUserATopics();
    if (this.userEdition) return this.renderUserTopics();
    const showingFreshRecommendations = this.state.lastAiRun?.stage === "topic-recommendation" && this.state.aiRecommendations.length;
    const activeTopic = this.state.activeTopic || this.state.draft.topicContext;
    const generationJob = this.state.contentGenerationJob;
    const current = (showingFreshRecommendations ? this.state.aiRecommendations[0] : null)
      || activeTopic
      || this.state.aiRecommendations.find(item => item.id === this.state.draft.topicId)
      || this.state.topics.find(item => item.id === this.state.draft.topicId)
      || { id: this.state.draft.topicId, type: this.state.draft.topicType, title: this.state.draft.title, reason: this.state.draft.strategySummary || "当前草稿" };
    const eligible = this.state.topics.filter(item => item.hotelTypes.includes(this.state.settings.hotelType));
    const topicAction = (item, action) => {
      const isActive = activeTopic?.id === item.id;
      const isGenerated = isActive && this.state.draft.topicId === item.id && this.state.draft.topicContext?.id === item.id;
      if (isActive && generationJob?.status === "generating") return '<button class="btn btn-secondary btn-sm" disabled><i class="fa fa-spinner fa-spin"></i> 正在生成内容</button>';
      if (isGenerated && generationJob?.status !== "failed") return '<button class="btn btn-ghost btn-sm" data-action="navigate" data-view="editor"><i class="fa fa-check-circle"></i> 已联动 · 查看内容</button>';
      return `<button class="btn btn-secondary btn-sm" data-action="${action}" data-topic="${item.id}">${isActive && generationJob?.status === "failed" ? "重试生成" : "确认此选题并生成内容"}</button>`;
    };
    return `
      <section class="card topic-feature">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div>${topicBadge(current.type)}<h2>${escapeHtml(current.title)}</h2><div class="muted tiny">${escapeHtml(current.formula || "模型动态策略")} · ${escapeHtml(current.reason)}</div></div><span class="badge ${showingFreshRecommendations || this.state.draft.source === "model" ? "badge-success" : "badge-warning"}"><i class="fa ${showingFreshRecommendations || this.state.draft.source === "model" ? "fa-magic" : "fa-cogs"}"></i> ${showingFreshRecommendations ? "AI 本轮首选" : this.state.draft.source === "model" ? escapeHtml(this.state.draft.model) : "规则兜底"}</span></div>
        <div class="topic-actions"><button class="btn btn-primary" data-action="ai-recommend" ${this.aiLoading ? "disabled" : ""}><i class="fa fa-magic"></i> ${this.aiLoading ? escapeHtml(this.aiStage || "模型分析中…") : "检索并推荐今日选题"}</button><button class="btn btn-secondary" data-action="swap-topic" ${this.aiLoading ? "disabled" : ""}><i class="fa fa-refresh"></i> AI 换一组</button><button class="btn btn-secondary" data-action="navigate" data-view="planner"><i class="fa fa-calendar"></i> 安排未来 7 天</button></div>
      </section>
      ${activeTopic?.title ? `<section class="topic-content-link section-space"><div class="topic-link-stage done"><i class="fa fa-lightbulb-o"></i><span>已选题</span></div><i class="fa fa-long-arrow-right"></i><div class="topic-link-main"><span class="badge ${activeTopic.source === "ai-recommendation" ? "badge-success" : "badge-neutral"}">${activeTopic.source === "ai-recommendation" ? "AI 推荐选题" : "规则库选题"}</span><strong>${escapeHtml(activeTopic.title)}</strong><small>${escapeHtml(activeTopic.objective || activeTopic.reason || "已作为内容生成依据")}</small></div><i class="fa fa-long-arrow-right"></i><div class="topic-link-stage ${generationJob?.status === "generating" ? "active" : this.state.draft.topicId === activeTopic.id ? "done" : ""}"><i class="fa ${generationJob?.status === "generating" ? "fa-spinner fa-spin" : "fa-file-text-o"}"></i><span>${generationJob?.status === "generating" ? "生成中" : this.state.draft.topicId === activeTopic.id ? "内容已生成" : "待生成"}</span></div><button class="btn btn-ghost btn-sm" data-action="navigate" data-view="editor">查看关联内容</button></section>` : ""}
      ${this.state.aiRecommendations.length ? `<section class="card card-pad section-space"><div class="card-title"><div><h2>模型本轮推荐</h2><div class="muted tiny" style="margin-top:4px">${escapeHtml(this.state.lastAiRun?.topicStrategySummary || this.state.lastAiRun?.strategySummary || "")}</div></div><span class="badge badge-success">${escapeHtml(this.state.lastAiRun?.model || "通义千问")}</span></div><div class="topic-list">${this.state.aiRecommendations.map((item, index) => `<div class="topic-row ${activeTopic?.id === item.id ? "linked" : ""}"><div class="topic-number">AI${index + 1}</div><div><div style="display:flex;gap:7px;align-items:center;margin-bottom:4px">${topicBadge(item.type)}<span class="muted tiny">${escapeHtml(item.objective || item.materialCategory)}</span><span class="badge badge-neutral">${Number(item.score || 0)}分</span>${activeTopic?.id === item.id ? '<span class="badge badge-success">当前内容选题</span>' : ""}</div><h3>${escapeHtml(item.title)}</h3><div class="muted tiny">${escapeHtml(item.targetAudience || "目标人群待模型补充")}</div><div class="muted tiny" style="margin-top:4px">${escapeHtml(item.reason)}</div></div>${topicAction(item, "choose-ai-topic")}</div>`).join("")}</div></section>` : ""}
      <div class="alert alert-info section-space"><i class="fa fa-pie-chart"></i><div><strong>532 排期策略</strong>：流量型 50% · 垂类型 30% · 营销型 20%。被换掉的选题会记录在本地，用于后续策略优化。</div></div>
      <section class="card card-pad section-space"><div class="card-title"><h2>${escapeHtml(this.state.settings.hotelType)}规则库</h2><span class="muted tiny">这些规则作为模型候选方向，不直接冒充 AI 输出</span></div><div class="topic-list">
        ${eligible.map((topic, index) => `<div class="topic-row ${activeTopic?.id === topic.id ? "linked" : ""}"><div class="topic-number">${String(index + 1).padStart(2, "0")}</div><div><div style="display:flex;gap:7px;align-items:center;margin-bottom:4px">${topicBadge(topic.type)}<span class="muted tiny">${escapeHtml(topic.material)}</span>${activeTopic?.id === topic.id ? '<span class="badge badge-success">当前内容选题</span>' : ""}</div><h3>${escapeHtml(topic.title)}</h3><div class="muted tiny">${escapeHtml(topic.reason)}</div></div>${topicAction(topic, "choose-topic")}</div>`).join("")}
      </div></section>`;
  }

  renderEditor() {
    const draft = this.state.draft;
    const linkedTopic = this.state.activeTopic || draft.topicContext || normalizeTopicContext({ id: draft.topicId, title: draft.strategyTopicTitle || draft.title, type: draft.topicType, reason: draft.strategySummary, materialCategory: draft.materialCategory }, draft.source === "model" ? "ai-recommendation" : "rule-library");
    const generationJob = this.state.contentGenerationJob;
    const topicLinkedToDraft = draft.topicId === linkedTopic.id && draft.topicContext?.id === linkedTopic.id;
    const selected = draft.imageIds.map(id => this.state.materials.find(item => item.id === id)).filter(Boolean);
    const imageLayout = draft.imageLayout?.length ? draft.imageLayout : buildImageLayout(this.state.materials, draft.imageIds, draft.materialCategory || "room");
    const selectionMeta = draft.imageSelectionMeta || {};
    const materialFilter = this.state.ui.draftMaterialFilter || "recommended";
    const materialSort = this.state.ui.draftMaterialSort || "smart";
    const materialQuery = this.state.ui.draftMaterialQuery || "";
    const materialPool = rankMaterialPool(this.state, {
      selectedIds: draft.imageIds,
      preferredCategory: draft.materialCategory || "room",
      filter: materialFilter,
      sort: materialSort,
      query: materialQuery,
      limit: 24
    });
    const imageMaterials = this.state.materials.filter(item => item.src);
    const categoryName = id => MATERIAL_CATEGORIES.find(item => item.id === id)?.name || id;
    const location = draft.location || resolveHotelLocation(this.state, this.activeAccount());
    const risk = draft.risk || assessRisk(draft);
    const reuseRisk = draft.contentReuseRisk || evaluateContentReuseRisk(this.state, draft, { platform: "douyin" });
    const riskClass = risk.level === "high" ? "danger" : risk.level === "medium" ? "warning" : "success";
    const riskLabel = risk.level === "high" ? "存在高风险，已阻止发布" : risk.level === "medium" ? "有信息需要你确认" : this.usesUserFacingExperience ? "发布检查已通过" : "基础安全检查已通过";
    const publishHardBlocked = risk.level === "high" || draft.selfReview?.publishGate === "blocked" || reuseRisk.level !== "pass";
    const needsManualConfirm = draft.selfReview?.publishGate === "revise" && !draft.manualReviewConfirmed;
    const publishAction = needsManualConfirm ? "confirm-review-and-publish" : "publish-now";
    const publishLabel = needsManualConfirm
      ? (this.usesUserAExperience ? "确认事实无误，生成平台版本" : "确认事实无误，去发布补全")
      : (this.usesUserAExperience ? "确认内容，生成平台版本" : "确认内容，去发布补全");
    return `<div class="editor-layout">
      <section class="card card-pad">
        <div class="card-title"><div><h2>${this.usesUserFacingExperience ? "编辑这条内容" : "内容编辑"}</h2><div class="muted tiny" style="margin-top:4px">${this.usesUserFacingExperience ? "文案、图片和发布信息已根据选题自动准备" : `来源：${draft.source === "model" ? `通义千问 · ${escapeHtml(draft.model)}` : "本地规则兜底（非模型输出）"}`}</div></div><button class="btn btn-secondary btn-sm" data-action="regenerate" ${this.aiLoading ? "disabled" : ""}><i class="fa fa-refresh"></i> ${this.aiLoading ? escapeHtml(this.aiStage || "生成中…") : this.usesUserFacingExperience ? "换一版" : "重新生成"}</button></div>
        <section class="editor-topic-link ${generationJob?.status === "generating" ? "generating" : generationJob?.status === "failed" ? "failed" : "linked"}"><div class="editor-topic-icon"><i class="fa ${generationJob?.status === "generating" ? "fa-spinner fa-spin" : "fa-lightbulb-o"}"></i></div><div class="editor-topic-main"><div class="editor-topic-kicker"><span>${this.usesUserFacingExperience ? "当前选题" : "当前内容来源选题"}</span>${this.usesUserFacingExperience ? "" : `<span class="badge ${linkedTopic.source === "ai-recommendation" ? "badge-success" : "badge-neutral"}">${linkedTopic.source === "ai-recommendation" ? "AI 推荐" : "规则库"}</span>`}<span class="badge ${generationJob?.status === "failed" ? "badge-danger" : generationJob?.status === "generating" ? "badge-warning" : "badge-success"}">${generationJob?.status === "generating" ? "正在生成" : generationJob?.status === "failed" ? "生成失败" : topicLinkedToDraft ? "内容已准备" : "等待生成"}</span></div><h3>${escapeHtml(linkedTopic.title)}</h3><p>${escapeHtml([linkedTopic.objective, linkedTopic.targetAudience, linkedTopic.contentAngle || linkedTopic.reason].filter(Boolean).join(" · ") || "将根据这个选题准备文案和图片")}</p><div class="editor-topic-chain"><span><i class="fa fa-check-circle"></i> 选题</span><i class="fa fa-angle-right"></i><span class="${generationJob?.status === "generating" ? "active" : "done"}"><i class="fa ${generationJob?.status === "generating" ? "fa-circle-o-notch fa-spin" : "fa-check-circle"}"></i> ${this.usesUserFacingExperience ? "酒店资料" : "酒店事实 RAG"}</span><i class="fa fa-angle-right"></i><span class="${topicLinkedToDraft ? "done" : ""}"><i class="fa ${topicLinkedToDraft ? "fa-check-circle" : "fa-circle-o"}"></i> 内容与图片</span></div></div><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="topics">更换选题</button></section>
        <section class="editor-confirm-jump"><div><span class="badge ${needsManualConfirm ? "badge-warning" : "badge-success"}"><i class="fa ${needsManualConfirm ? "fa-user" : "fa-check"}"></i> ${needsManualConfirm ? "发布前需要人工确认" : "选题与内容已联动"}</span><strong>${needsManualConfirm ? "请确认模型引用的酒店事实和易变信息准确" : this.usesUserAExperience ? "确认当前文案和图片后，生成各平台发布版本" : "确认当前文案和图片后，进入抖音发布信息补全"}</strong><small>下一步会自动带入标题、正文、图片顺序、封面、地点和声明信息。</small></div><button class="btn btn-primary" data-action="${publishAction}" ${publishHardBlocked || !topicLinkedToDraft || generationJob?.status === "generating" ? "disabled" : ""}><i class="fa fa-check-square-o"></i> ${publishLabel}</button></section>
        ${this.aiError ? `<div class="alert alert-danger"><i class="fa fa-exclamation-triangle"></i><div><strong>上次生成失败</strong><br>${escapeHtml(this.aiError)}</div></div>` : ""}
        ${reuseRisk.level !== "pass" ? `<div class="alert alert-warning"><i class="fa fa-picture-o"></i><div><strong>当前图片与近期内容重复度较高</strong><br>${escapeHtml(reuseRisk.reasons[0] || "系统没有强行生成可发布版本。")}${draft.materialShortage?.suggestions?.length ? `<br>建议补充：${draft.materialShortage.suggestions.slice(0, 6).map(escapeHtml).join("、")}` : ""}</div></div>` : ""}
        <div class="form-group"><label class="form-label">标题 <span>${charCount(draft.title)}/20</span></label><input class="form-control" name="draftTitle" value="${escapeHtml(draft.title)}"></div>
        <div class="form-group"><label class="form-label">正文 <span class="${charCount(draft.body) < BODY_MIN || charCount(draft.body) > BODY_MAX ? "count-warning" : ""}">${charCount(draft.body)}/${BODY_MAX} · 目标约${BODY_TARGET}字</span></label><textarea class="form-control" name="draftBody" rows="7">${escapeHtml(draft.body)}</textarea><div class="muted tiny" style="margin-top:6px">建议 ${BODY_MIN}-${BODY_MAX} 字：场景钩子 → 事实证据 → 适用人群/建议 → 轻量行动。</div></div>
        <div class="form-group"><label class="form-label">话题标签</label><input class="form-control" name="draftTags" value="${escapeHtml(draft.tags.join(" "))}"></div>
        <div class="content-location"><span class="location-icon"><i class="fa fa-map-marker"></i></span><div><div class="location-heading"><strong>地点定位：${escapeHtml(location.name || "当前酒店")}</strong><span class="badge ${location.platformPoiId ? "badge-success" : "badge-warning"}">${location.platformPoiId ? "抖音门店已匹配" : "待抖音门店匹配"}</span></div><p>${escapeHtml(location.address || "地址待补充")}</p><small>${this.usesUserFacingExperience ? "发布时会自动带入当前酒店地点" : `${escapeHtml(location.coordinateText || (location.latitude && location.longitude ? `${location.latitude}, ${location.longitude}` : "经纬度待补充"))} · 来源：${escapeHtml(location.source || "商家设置")}`}</small></div></div>
        ${draft.regenerationCount ? `<div class="alert alert-info"><i class="fa fa-random"></i><div><strong>${this.usesUserFacingExperience ? "已生成一个新版本" : `本次为第 ${Number(draft.regenerationCount)} 次实质重写`}</strong><br>${escapeHtml(draft.rewriteSummary || "已更换开头、信息顺序或图片组合")}${!this.usesUserFacingExperience && draft.rewriteSimilarity !== null && draft.rewriteSimilarity !== undefined ? ` · 与上一版相似度 ${Math.round(Number(draft.rewriteSimilarity) * 100)}%` : ""}</div></div>` : ""}
        <div class="visual-auto-panel"><div class="visual-auto-head"><div><strong><i class="fa fa-magic"></i> ${this.userEdition ? "本篇图片" : "AI 自动选图与排版"}</strong><div class="muted tiny">${this.userEdition ? "系统已按 1 张封面 + 4 张内容图自动排版，并避开近期重复素材" : escapeHtml(selectionMeta.strategy || "主题匹配 + 低使用次数 + 最近内容去重 + 3:4叙事排序")}</div></div><div class="visual-auto-actions"><button class="btn btn-secondary btn-sm" data-action="auto-select-images"><i class="fa fa-refresh"></i> 换一组图片</button><button class="btn btn-secondary btn-sm content-material-pool-link" data-action="navigate" data-view="materials"><i class="fa fa-th-large"></i> 内容素材池</button></div></div><div class="visual-summary"><span class="badge badge-success">1 封面 + ${Math.max(0, selected.length - 1)} 内容图</span>${this.userEdition ? '<span class="badge badge-neutral">近期图片已自动避开</span>' : `<span class="badge badge-neutral">避开近期 ${Number(selectionMeta.avoidedRecentCount || 0)} 张</span>${Number(selectionMeta.avoidedPreviousCount || 0) ? `<span class="badge badge-success">换组避开 ${Number(selectionMeta.avoidedPreviousCount)} 张</span>` : ""}<span class="badge badge-neutral">首图 3:4 安全区</span><span class="badge badge-neutral">同篇零重复</span>`}</div><div class="image-storyboard">${imageLayout.map((plan, index) => { const item = this.state.materials.find(material => material.id === plan.materialId); return item ? `<article class="story-image ${index === 0 ? "cover" : ""}"><div class="story-image-media"><img src="${encodeURI(item.src)}" alt="${escapeHtml(item.title)}"><span class="story-order">${index + 1}</span>${index === 0 ? '<span class="story-cover">封面</span>' : ""}</div><div class="story-image-copy"><strong>${escapeHtml(plan.role || "补充画面")}</strong><span>${escapeHtml(item.title)}</span><small>${escapeHtml(plan.cropMode || "保留主体与环境关系")}</small></div><div class="story-controls"><button type="button" data-action="move-image" data-id="${item.id}" data-direction="-1" ${index === 0 ? "disabled" : ""} title="前移"><i class="fa fa-arrow-left"></i></button><button type="button" data-action="set-draft-cover" data-id="${item.id}" title="设为封面"><i class="fa fa-picture-o"></i></button><button type="button" data-action="move-image" data-id="${item.id}" data-direction="1" ${index === imageLayout.length - 1 ? "disabled" : ""} title="后移"><i class="fa fa-arrow-right"></i></button></div></article>` : ""; }).join("")}</div><button class="mobile-material-pool-entry" data-action="navigate" data-view="materials"><i class="fa fa-th-large"></i><span><strong>内容素材池</strong><small>查看全部酒店图片并调整本篇 5 张素材</small></span><i class="fa fa-angle-right"></i></button></div>
        <section class="draft-material-pool">
          <div class="material-pool-head"><div><h3>内容素材池</h3><p>按当前选题智能排序，可检索、筛选、预览并手动调整；1 张封面 + 4 张内容图。</p></div><div class="material-pool-limit ${selected.length >= CONTENT_IMAGE_LIMIT ? "full" : ""}"><strong>${selected.length}</strong><span>/ ${CONTENT_IMAGE_LIMIT} 已选</span></div></div>
          <div class="material-pool-stats"><span><i class="fa fa-picture-o"></i><strong>${materialPool.totalImages}</strong> 张可用</span><span><i class="fa fa-leaf"></i><strong>${materialPool.unusedCount}</strong> 张未使用</span><span class="${materialPool.selectedRecentCount ? "warning" : ""}"><i class="fa fa-history"></i><strong>${materialPool.selectedRecentCount}</strong> 张近期重复</span><span><i class="fa fa-th-large"></i><strong>${materialPool.selectedCategoryCount}</strong> 类叙事画面</span></div>
          <div class="material-pool-toolbar">
            <form class="material-search" data-form="draft-material-search"><i class="fa fa-search"></i><input name="materialQuery" value="${escapeHtml(materialQuery)}" placeholder="搜索素材名称、来源或分类"><button type="submit">检索</button>${materialQuery ? '<button type="button" data-action="clear-draft-material-search" title="清空检索"><i class="fa fa-times"></i></button>' : ""}</form>
            <label class="material-sort"><span>排序</span><select data-material-sort><option value="smart" ${materialSort === "smart" ? "selected" : ""}>智能推荐</option><option value="unused" ${materialSort === "unused" ? "selected" : ""}>未使用优先</option><option value="newest" ${materialSort === "newest" ? "selected" : ""}>最近入库</option></select></label>
          </div>
          <div class="material-pool-filters"><button class="filter-chip ${materialFilter === "recommended" ? "active" : ""}" data-action="draft-material-filter" data-filter="recommended"><i class="fa fa-magic"></i> 智能推荐</button><button class="filter-chip ${materialFilter === "selected" ? "active" : ""}" data-action="draft-material-filter" data-filter="selected">已选 ${selected.length}</button><button class="filter-chip ${materialFilter === "all" ? "active" : ""}" data-action="draft-material-filter" data-filter="all">全部 ${imageMaterials.length}</button>${MATERIAL_CATEGORIES.filter(category => category.id !== "copy").map(category => `<button class="filter-chip ${materialFilter === category.id ? "active" : ""}" data-action="draft-material-filter" data-filter="${category.id}">${escapeHtml(category.name)} ${imageMaterials.filter(item => item.category === category.id).length}</button>`).join("")}</div>
          <div class="material-pool-result"><span>找到 ${materialPool.totalMatched} 张，当前展示 ${materialPool.items.length} 张</span>${materialFilter === "recommended" ? `<small>优先：${escapeHtml(categoryName(draft.materialCategory || "room"))} · 未近期使用 · 低使用次数</small>` : ""}</div>
          <div class="draft-material-grid">${materialPool.items.map(item => `<article class="draft-material-card ${item.selected ? "selected" : ""} ${item.recentlyUsed ? "recent" : ""}"><div class="draft-material-media"><img src="${item.src.startsWith("data:") ? item.src : encodeURI(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy">${item.selected ? `<span class="material-selected-order">已选 ${item.selectedIndex + 1}</span>` : ""}${item.recentlyUsed ? '<span class="material-recent-flag">近期用过</span>' : item.used === 0 ? '<span class="material-fresh-flag">未使用</span>' : ""}<button type="button" class="material-preview-btn" data-action="preview-material" data-id="${item.id}" title="预览大图"><i class="fa fa-search-plus"></i></button></div><div class="draft-material-copy"><strong title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</strong><div><span>${escapeHtml(categoryName(item.category))}</span><span>${escapeHtml(item.source || "素材库")}</span></div><div class="material-card-badges">${item.recommended ? '<span class="badge badge-success">适配选题</span>' : ""}<span class="badge ${item.recentlyUsed || item.used > 3 ? "badge-warning" : "badge-neutral"}">使用 ${item.used} 次</span></div></div><button type="button" class="material-select-action ${item.selected ? "remove" : ""}" data-action="toggle-image" data-id="${item.id}" ${!item.selected && selected.length >= CONTENT_IMAGE_LIMIT ? "disabled" : ""}><i class="fa ${item.selected ? "fa-minus-circle" : "fa-plus-circle"}"></i>${item.selected ? "移出本篇" : selected.length >= CONTENT_IMAGE_LIMIT ? "已达上限" : "加入本篇"}</button></article>`).join("") || `<div class="material-pool-empty"><i class="fa fa-search"></i><strong>没有匹配的图片</strong><span>请清空检索词或切换分类。</span></div>`}</div>
        </section>
        <div class="alert alert-${riskClass}"><i class="fa ${riskClass === "success" ? "fa-check-circle" : "fa-exclamation-triangle"}"></i><div><strong>${riskLabel}</strong>${risk.issues.length ? `<br>${risk.issues.map(item => `${escapeHtml(item.category)}：${escapeHtml(item.word)}，${escapeHtml(item.message)}`).join("；")}` : "<br>未发现极限词、明显敏感词或超长正文。"}</div></div>
        ${!this.usesUserFacingExperience && draft.selfReview ? `<div class="skill-quality"><div><span class="quality-score">${Number(draft.selfReview.qualityScore || 0)}</span><span class="muted tiny">/100 工程质量分</span></div><div><strong>${draft.selfReview.publishGate === "ready" ? "可以进入发布确认" : draft.selfReview.publishGate === "blocked" ? "已阻断发布" : "需要修改或人工确认"}</strong><div class="muted tiny">事实 ${draft.selfReview.scoreBreakdown?.grounding || 0}/25 · 合规 ${draft.selfReview.scoreBreakdown?.compliance || 0}/20 · 策略 ${draft.selfReview.scoreBreakdown?.strategy || 0}/15 · 品牌 ${draft.selfReview.scoreBreakdown?.brand || 0}/10 · 平台 ${draft.selfReview.scoreBreakdown?.platform || 0}/15 · 素材 ${draft.selfReview.scoreBreakdown?.material || 0}/15</div><a class="muted tiny" href="./CONTENT_QUALITY_SCORING.md" target="_blank" rel="noopener">查看评分规则与发布门禁 <i class="fa fa-external-link"></i></a></div></div>` : ""}
        ${draft.requiresConfirmation ? `<div class="alert alert-warning" style="margin-top:10px"><i class="fa fa-user"></i><div>模型标记了需要人工确认的事实或易变信息，确认准确后才能发布。</div></div>` : ""}
        ${!this.usesUserFacingExperience && draft.executionTrace?.skills?.length ? `<div class="execution-trace"><strong>本次执行 Skills</strong><div>${draft.executionTrace.skills.map(item => `<span class="badge badge-neutral">${escapeHtml(item)}</span>`).join("")}</div></div>` : ""}
        ${!this.usesUserFacingExperience && draft.factReferences?.length ? `<div class="muted tiny" style="margin-top:10px">事实引用：${draft.factReferences.map(escapeHtml).join("、")}</div>` : ""}
        <div class="topic-actions"><button class="btn btn-secondary" data-action="risk-check"><i class="fa fa-shield"></i> 再检查</button><button class="btn btn-primary" data-action="${publishAction}" ${publishHardBlocked ? "disabled" : ""}><i class="fa fa-send"></i> ${needsManualConfirm ? "确认事实并去补全信息" : "确认发布，去补全信息"}</button><button class="btn btn-secondary" data-action="navigate" data-view="planner"><i class="fa fa-calendar-plus-o"></i> 加入周计划</button></div>
        <p class="muted tiny" style="line-height:1.6;margin:12px 0 0">${this.usesUserFacingExperience ? "确认后会进入发布信息补全页，标题、正文、图片、地点和标签会自动带入。" : "确认后会进入创作者中心补全页；当前由本地发布适配器完整模拟提交，取得抖音开放平台授权后可替换为真实接口。"}</p>
      </section>
      <aside class="card card-pad douyin-preview-panel"><div class="card-title"><div><h2>抖音图文预览</h2><div class="muted tiny" style="margin-top:4px">按真实发布比例检查首图、标题与正文安全区</div></div><span class="badge badge-neutral">3:4 首图 · 9:19.5 屏幕</span></div><div class="preview-phone"><div class="preview-screen"><div class="preview-status"><span>19:30</span><span><i class="fa fa-signal"></i>&nbsp; 5G &nbsp;<i class="fa fa-battery-three-quarters"></i></span></div><div class="preview-appbar"><i class="fa fa-angle-left"></i><strong>图文</strong><i class="fa fa-ellipsis-h"></i></div><div class="preview-image">${selected[0]?.src ? `<img src="${encodeURI(selected[0].src)}" alt="内容封面">` : '<div class="preview-image-empty"><i class="fa fa-picture-o"></i><span>等待 AI 自动选图</span></div>'}<span class="preview-count">1/${Math.max(selected.length, 1)}</span><div class="preview-dots"><span class="active"></span>${selected.slice(1, 5).map(() => '<span></span>').join("")}</div></div><div class="preview-copy"><h3>${escapeHtml(draft.title)}</h3><p>${escapeHtml(draft.body)}</p><div class="tags">${escapeHtml(draft.tags.join(" "))}</div><div class="preview-meta-row"><div class="preview-location"><i class="fa fa-map-marker"></i> ${escapeHtml(location.name || "当前酒店")}</div><span><i class="fa fa-music"></i> ${escapeHtml(draft.musicMood || draft.music)}</span></div></div><div class="preview-bottom"><span><i class="fa fa-home"></i> 首页</span><span><i class="fa fa-search"></i> 发现</span><b><i class="fa fa-plus"></i></b><span><i class="fa fa-comment-o"></i> 消息</span><span><i class="fa fa-user-o"></i> 我</span></div></div></div></aside>
    </div>`;
  }

  renderCreatorPublish() {
    const form = this.state.publishForm;
    if (!form) return `<div class="card empty"><i class="fa fa-exclamation-circle"></i>没有待发布内容<br><button class="btn btn-primary" style="margin-top:12px" data-action="navigate" data-view="editor">返回内容生成</button></div>`;
    if (this.usesUserAExperience) return this.renderUserAMultiPlatformPublish(form);
    const images = form.imageIds.map(id => this.state.materials.find(item => item.id === id)).filter(Boolean);
    const cover = this.state.materials.find(item => item.id === form.coverId) || images[0];
    const formLocation = form.location || this.state.draft.location || resolveHotelLocation(this.state, this.activeAccount());
    const risk = assessRisk({ title: form.title, body: form.description, imageAuthenticity: "real" });
    const completionChecks = [
      ["作品标题", Boolean(form.title), "内容生成"], ["作品描述", Boolean(form.description), "正文+话题"],
      ["图片上传", images.length > 0, "视觉选材"], ["封面设置", Boolean(cover), "图片顺序首图"],
      ["地点定位", Boolean(formLocation?.name && formLocation?.address), formLocation?.platformPoiId ? "已绑定抖音门店POI" : "OTA地址·待抖音门店匹配"],
      ["官方活动", Boolean(form.officialActivity), "无实时活动ID时不参与"], ["合集", Boolean(form.collection), "账号配置"],
      [this.usesUserAExperience ? "自主声明（可选）" : "自主声明", this.usesUserAExperience ? true : Boolean(form.declaration), this.usesUserAExperience ? (form.declaration ? "用户自主选择" : "默认留空") : "内容真实性规则"], ["音乐", Boolean(form.music), "内容氛围"],
      ["内容标签", Boolean(form.contentLabel), "选题类型"], ["关联热点", Boolean(form.hotspot), "无实时热点时不关联"],
      ["发布设置", Boolean(form.visibility && form.publishMode), "账号默认设置"]
    ];
    const completedCount = completionChecks.filter(item => item[1]).length;
    const completionRate = Math.round(completedCount / completionChecks.length * 100);
    return `<div class="creator-shell">
      <div class="creator-main">
        <section class="creator-section"><div class="creator-heading"><h2>基础信息</h2><button class="btn btn-secondary btn-sm" data-action="quick-fill-publish"><i class="fa fa-magic"></i> 快速填写</button></div>
          <div class="creator-field"><label>作品描述 <i class="fa fa-question-circle"></i></label><div class="creator-control"><input class="form-control creator-title" data-publish-field="title" value="${escapeHtml(form.title)}" maxlength="20" placeholder="添加作品标题"><span class="field-count">${charCount(form.title)}/20</span><textarea class="form-control" data-publish-field="description" rows="6" maxlength="1000" placeholder="添加作品描述…">${escapeHtml(form.description)}</textarea><div class="creator-inline"><span>${form.tags.map(escapeHtml).join(" ")}</span><span>${charCount(form.description)}/1000</span></div></div></div>
          <div class="creator-field"><label>官方活动 <i class="fa fa-question-circle"></i></label><div><div class="activity-list"><button class="activity-chip active" type="button">${escapeHtml(form.officialActivity)}</button><button class="activity-chip" type="button" disabled>全民开唱</button><button class="activity-chip" type="button" disabled>热门作品分成</button><button class="activity-chip" type="button" disabled>更多活动 +</button></div><div class="field-source"><i class="fa fa-check-circle"></i> 自动补全依据：未接入实时活动ID，安全选择“不参与”</div></div></div>
          <div class="creator-field"><label>地点定位 <i class="fa fa-question-circle"></i></label><div class="publish-location"><span class="location-icon"><i class="fa fa-map-marker"></i></span><div><strong>${escapeHtml(formLocation?.name || "当前酒店")}</strong><p>${escapeHtml(formLocation?.address || "地址待补充")}</p><small>${this.userEdition ? (formLocation?.platformPoiId ? "酒店地点已匹配" : "请在发布前确认地点") : `${escapeHtml(formLocation?.coordinateText || "经纬度待补充")} · ${formLocation?.platformPoiId ? "已绑定抖音门店POI" : "待抖音门店POI匹配"}`}</small></div><span class="badge ${formLocation?.platformPoiId ? "badge-success" : "badge-warning"}">${formLocation?.platformPoiId ? "已匹配" : "待匹配"}</span></div></div>
          <div class="creator-field"><label>封面设置</label><div class="cover-setting">${cover?.src ? `<img src="${cover.src.startsWith("data:") ? cover.src : encodeURI(cover.src)}" alt="作品封面">` : ""}<strong>${escapeHtml(cover?.title || "已选择首图")}</strong><span class="muted tiny">自动排版第1张 · 3:4主体安全区</span><button class="btn btn-secondary btn-sm" type="button" data-action="cycle-creator-cover"><i class="fa fa-pencil"></i> 编辑封面</button></div></div>
          <div class="creator-field"><label>添加合集</label><div class="input-row"><select class="form-control" data-publish-field="collectionType"><option>${escapeHtml(form.collectionType || "合集")}</option></select><select class="form-control" data-publish-field="collection"><option>${escapeHtml(form.collection)}</option><option>${this.userEdition ? "不添加到其他合集" : "接入账号授权后读取已有合集"}</option></select></div></div>
          ${this.usesUserAExperience ? `<div class="creator-field"><label>自主声明 <span class="badge badge-neutral">可选</span></label><div><select class="form-control" data-publish-field="declaration"><option value="" ${!form.declaration ? "selected" : ""}>不选择自主声明</option>${["内容由AI辅助创作","个人原创","品牌内容"].map(value => `<option value="${value}" ${form.declaration === value ? "selected" : ""}>${value}</option>`).join("")}</select><div class="field-source ${form.declaration ? "" : "neutral"}"><i class="fa ${form.declaration ? "fa-check-circle" : "fa-info-circle"}"></i> ${form.declaration ? `已由用户选择「${escapeHtml(form.declaration)}」` : "默认留空，不替用户判断或自动勾选声明"}</div></div></div>` : `<div class="creator-field"><label>自主声明</label><div><select class="form-control" data-publish-field="declaration">${["内容由AI辅助创作","个人原创","品牌内容"].map(value => `<option ${form.declaration === value ? "selected" : ""}>${value}</option>`).join("")}</select><div class="field-source"><i class="fa fa-check-circle"></i> 图片为酒店实拍；文案由AI辅助并经过事实与风险校验</div></div></div>`}
        </section>

        <section class="creator-section"><div class="creator-heading"><h2>扩展信息</h2></div>
          <div class="creator-field"><label>选择音乐</label><div class="music-setting"><span class="music-icon"><i class="fa fa-music"></i></span><div><strong>${escapeHtml(form.music)}</strong><div class="muted tiny">适合作品风格 · 可在抖音端替换</div></div><button class="btn btn-secondary btn-sm" type="button"><i class="fa fa-pencil"></i> 选择音乐</button></div></div>
          <div class="creator-field"><label>添加标签 <i class="fa fa-question-circle"></i></label><div class="input-row"><select class="form-control" data-publish-field="contentLabel">${["酒旅住宿","旅行攻略","本地生活"].map(label => `<option ${form.contentLabel === label ? "selected" : ""}>${label}</option>`).join("")}</select><input class="form-control" data-publish-field="relatedContent" value="${escapeHtml(form.relatedContent || "酒店民宿")}" placeholder="添加作品相关内容"></div></div>
          <div class="creator-field"><label>关联热点 <i class="fa fa-question-circle"></i></label><select class="form-control" data-publish-field="hotspot"><option>${escapeHtml(form.hotspot)}</option><option>接入实时热点接口后选择</option></select></div>
        </section>

        <section class="creator-section"><div class="creator-heading"><h2>发布设置</h2></div>
          <div class="creator-field"><label>同步发布 <i class="fa fa-question-circle"></i></label><div class="option-row"><label class="radio-card"><input type="radio" name="crossPost" data-publish-field="crossPost" value="false" ${!form.crossPost ? "checked" : ""}> 不同时发布</label><label class="radio-card"><input type="radio" name="crossPost" data-publish-field="crossPost" value="true" ${form.crossPost ? "checked" : ""}> 同步发布到门店</label></div></div>
          <div class="creator-field"><label>谁可以看</label><div class="option-row">${[["public","公开"],["friends","好友可见"],["private","仅自己可见"]].map(([value,label]) => `<label class="radio-card"><input type="radio" name="visibility" data-publish-field="visibility" value="${value}" ${form.visibility === value ? "checked" : ""}> ${label}</label>`).join("")}</div></div>
          <div class="creator-field"><label>保存权限 <i class="fa fa-question-circle"></i></label><div class="option-row"><label class="radio-card"><input type="radio" name="allowSave" data-publish-field="allowSave" value="true" ${form.allowSave ? "checked" : ""}> 允许</label><label class="radio-card"><input type="radio" name="allowSave" data-publish-field="allowSave" value="false" ${!form.allowSave ? "checked" : ""}> 不允许</label></div></div>
          <div class="creator-field"><label>发布时间</label><div class="option-row"><label class="radio-card"><input type="radio" name="publishMode" data-publish-field="publishMode" value="now" ${form.publishMode === "now" ? "checked" : ""}> 立即发布</label><label class="radio-card"><input type="radio" name="publishMode" data-publish-field="publishMode" value="scheduled" ${form.publishMode === "scheduled" ? "checked" : ""}> 定时发布</label>${form.publishMode === "scheduled" ? `<input class="form-control" type="datetime-local" data-publish-field="scheduledAt" value="${escapeHtml(form.scheduledAt)}" style="max-width:220px">` : ""}</div></div>
        </section>
        <div class="creator-actions"><button class="btn btn-primary creator-publish-btn" data-action="creator-publish-submit" ${risk.level === "high" || !images.length ? "disabled" : ""}><i class="fa fa-send"></i> 发布</button><button class="btn btn-secondary" data-action="creator-save-draft">暂存离开</button><button class="btn btn-secondary" data-action="back-editor">返回修改</button></div>
      </div>
      <aside class="creator-side"><div class="creator-upload creator-dropzone"><div class="upload-icon"><i class="fa fa-cloud-upload"></i></div><strong>已自动上传并排序 ${images.length} 张实拍图片</strong><span>图文按 3:4 竖版优化 · 点击图片可设为封面</span><div class="creator-image-grid">${images.map((image, index) => { const plan = form.imageLayout?.find(item => item.materialId === image.id); return `<button type="button" class="creator-image ${image.id === form.coverId ? "cover" : ""}" data-action="set-creator-cover" data-id="${image.id}" title="${escapeHtml(plan?.role || image.title)}"><img src="${image.src.startsWith("data:") ? image.src : encodeURI(image.src)}" alt="${escapeHtml(image.title)}"><span>${index + 1}</span><small>${escapeHtml(plan?.role || "补充画面")}</small></button>`; }).join("")}</div></div>
        <div class="publish-assistant"><div class="creator-heading"><h2><i class="fa fa-check-square"></i> 发布助手</h2><span class="badge ${risk.level === "high" ? "badge-danger" : "badge-success"}">${completionRate}%</span></div><div class="muted tiny">快速检测 · ${completedCount}/${completionChecks.length} 项已补全</div><h3>${risk.level === "high" ? "作品存在异常" : "作品未见异常"}</h3><p>${risk.level === "high" ? "请返回修改高风险表达。" : `约${charCount(this.state.draft.body)}字正文、${images.length}张去重图片、封面、话题和发布设置已完成映射。`}</p><div class="progress"><span style="width:${risk.level === "high" ? Math.min(completionRate, 62) : completionRate}%"></span></div><div class="completion-list">${completionChecks.map(([label, filled, source]) => `<div><i class="fa ${filled ? "fa-check-circle" : "fa-exclamation-circle"}"></i><span>${escapeHtml(label)}</span><small>${escapeHtml(source)}</small></div>`).join("")}</div></div>
        <div class="account-publish-card"><span class="account-dot" style="background:${this.activeAccount()?.color}"></span><div><strong>${escapeHtml(this.activeAccount()?.name)}</strong><div class="muted tiny">${escapeHtml(this.activeAccount()?.handle)}</div></div></div>
      </aside>
    </div>`;
  }

  ensurePublishPlatformVariants(form) {
    if (!form) return;
    const hotelName = this.state.settings.shortName || this.state.settings.brandName;
    const cleanBody = String(form.description || "").split(/\n\s*\n/)[0];
    const tags = Array.isArray(form.tags) ? form.tags : [];
    form.selectedPlatforms = Array.isArray(form.selectedPlatforms) && form.selectedPlatforms.length
      ? form.selectedPlatforms
      : ["douyin", "xiaohongshu", "wechatChannels"];
    form.activePlatform = form.selectedPlatforms.includes(form.activePlatform) ? form.activePlatform : form.selectedPlatforms[0];
    form.platformVariants = {
      douyin: {
        title: form.title,
        body: form.description,
        tags,
        ...(form.platformVariants?.douyin || {})
      },
      xiaohongshu: {
        title: `${hotelName}入住体验｜${form.title}`.slice(0, 40),
        body: `${cleanBody}\n\n适合正在计划大理旅行、在意真实入住感的人收藏参考。`,
        tags: [...new Set(["#大理旅行", "#大理住宿", ...tags])].slice(0, 8),
        ...(form.platformVariants?.xiaohongshu || {})
      },
      wechatChannels: {
        title: form.title,
        body: `${cleanBody}\n${tags.slice(0, 3).join(" ")}`,
        tags: [...new Set(["#大理", "#酒店民宿", ...tags])].slice(0, 5),
        ...(form.platformVariants?.wechatChannels || {})
      }
    };
  }

  renderUserAMultiPlatformPublish(form) {
    this.ensurePublishPlatformVariants(form);
    const platforms = this.state.publishingPlatforms || DEFAULT_STATE.publishingPlatforms;
    const selected = form.selectedPlatforms || ["douyin"];
    const activeId = selected.includes(form.activePlatform) ? form.activePlatform : selected[0];
    const active = platforms[activeId];
    const variant = form.platformVariants[activeId];
    const images = form.imageIds.map(id => this.state.materials.find(item => item.id === id)).filter(Boolean);
    const location = form.location || resolveHotelLocation(this.state, this.activeAccount());
    const modeText = active?.delivery === "direct" && active?.status === "connected" ? "提交平台接口" : "生成发布包并前往客户端确认";
    const platformHelp = {
      douyin: "短标题、前置信息钩子和话题标签，适合快速浏览。",
      xiaohongshu: "搜索型标题、真实体验笔记和可收藏信息。",
      wechatChannels: "简洁描述、熟人传播语境和视频号话题。"
    };
    return `<div class="a-multi-publish"><section class="a-publish-head"><button class="btn btn-secondary btn-sm" data-action="back-editor"><i class="fa fa-arrow-left"></i> 返回编辑</button><div><span class="a-kicker">第 3 步 · 分平台确认</span><h1>一次准备，按平台分别发布</h1><p>图片和酒店事实共用，标题、正文和标签会按各平台习惯分别适配。</p></div><button class="btn btn-secondary" data-action="quick-fill-publish"><i class="fa fa-magic"></i> 重新适配全部平台</button></section>
      <section class="a-publish-platform-select">${Object.values(platforms).map(item => { const checked = selected.includes(item.id); return `<button class="${checked ? "selected" : ""}" data-action="toggle-publish-platform" data-platform="${item.id}"><span class="a-platform-icon ${item.id}"><i class="fa ${item.icon}"></i></span><span><strong>${escapeHtml(item.name)}</strong><small>${item.status === "connected" ? "账号已连接" : item.status === "demo" ? "演示连接" : "客户端接力"}</small></span><i class="fa ${checked ? "fa-check-circle" : "fa-circle-o"}"></i></button>`; }).join("")}</section>
      <div class="a-publish-workspace"><main><nav class="a-platform-version-tabs">${selected.map(id => `<button class="${activeId === id ? "active" : ""}" data-action="select-publish-platform" data-platform="${id}">${escapeHtml(platforms[id]?.name || id)}版本</button>`).join("")}</nav>
        <section class="a-platform-edit-card"><header><div><span>${escapeHtml(active?.name || activeId)}内容版本</span><h2>${escapeHtml(platformHelp[activeId] || "平台内容版本")}</h2></div><span class="badge ${active?.status === "connected" ? "badge-success" : "badge-warning"}">${escapeHtml(modeText)}</span></header>
          <div class="form-group"><label class="form-label">平台标题 <span>${charCount(variant.title)}/${activeId === "xiaohongshu" ? 40 : 20}</span></label><input class="form-control" data-platform="${activeId}" data-platform-field="title" value="${escapeHtml(variant.title)}" maxlength="${activeId === "xiaohongshu" ? 40 : 20}"></div>
          <div class="form-group"><label class="form-label">${activeId === "xiaohongshu" ? "笔记正文" : "作品描述"}</label><textarea class="form-control" data-platform="${activeId}" data-platform-field="body" rows="8">${escapeHtml(variant.body)}</textarea></div>
          <div class="form-group"><label class="form-label">话题标签</label><input class="form-control" data-platform="${activeId}" data-platform-field="tagsText" value="${escapeHtml((variant.tags || []).join(" "))}"><small class="muted">不同平台已使用不同标签数量和表达方式。</small></div>
          <div class="a-publish-shared-info"><div><i class="fa fa-map-marker"></i><span><strong>${escapeHtml(location.name || "当前酒店")}</strong><small>${escapeHtml(location.address || "地点待补充")}</small></span><span class="badge ${location.platformPoiId ? "badge-success" : "badge-warning"}">${location.platformPoiId ? "地点已匹配" : "发布时确认地点"}</span></div><div><i class="fa fa-copyright"></i><span><strong>自主声明</strong><small>${form.declaration ? escapeHtml(form.declaration) : "默认留空，由你自主选择"}</small></span><select class="form-control" data-publish-field="declaration"><option value="" ${!form.declaration ? "selected" : ""}>不选择</option>${["内容由AI辅助创作","个人原创","品牌内容"].map(value => `<option value="${value}" ${form.declaration === value ? "selected" : ""}>${value}</option>`).join("")}</select></div></div>
        </section>
        <section class="a-publish-images"><div><h2>共用图片</h2><p>所有平台使用同一组 1 封面 + 4 内容图，可返回编辑页更换。</p></div><div>${images.map((item, index) => `<figure class="${index === 0 ? "cover" : ""}"><img src="${item.src.startsWith("data:") ? item.src : encodeURI(item.src)}" alt="${escapeHtml(item.title)}"><figcaption>${index === 0 ? "封面" : `内容 ${index}`}</figcaption></figure>`).join("")}</div></section>
      </main><aside class="a-platform-preview"><div class="a-preview-device"><header><span class="a-platform-icon ${activeId}"><i class="fa ${active?.icon}"></i></span><strong>${escapeHtml(active?.name || activeId)}预览</strong></header>${images[0]?.src ? `<img src="${images[0].src.startsWith("data:") ? images[0].src : encodeURI(images[0].src)}" alt="封面预览">` : ""}<div><h3>${escapeHtml(variant.title)}</h3><p>${escapeHtml(variant.body)}</p><small>${escapeHtml((variant.tags || []).join(" "))}</small></div></div><section><strong>本平台发布方式</strong><p>${escapeHtml(active?.capability || modeText)}</p>${active?.lastSyncedAt ? `<small>最后同步：${escapeHtml(active.lastSyncedAt)}</small>` : ""}</section></aside></div>
      <footer class="a-publish-submit"><div><strong>已选择 ${selected.length} 个平台</strong><span>${selected.map(id => platforms[id]?.name).filter(Boolean).join("、")} · 每个平台保留独立版本</span></div><button class="btn btn-primary" data-action="creator-publish-submit" ${!selected.length || images.length !== CONTENT_IMAGE_LIMIT ? "disabled" : ""}><i class="fa fa-send"></i> 准备并分发到 ${selected.length} 个平台</button><button class="btn btn-secondary" data-action="creator-save-draft">保存草稿</button></footer></div>`;
  }

  renderPublishComplete() {
    if (!this.usesUserAExperience) return this.renderRecords();
    const result = this.state.lastPublishResult;
    if (!result) return `<div class="a-publish-complete"><div class="a-complete-icon"><i class="fa fa-check"></i></div><h1>当前没有刚提交的内容</h1><p>可以前往内容管理查看全部记录，或开始创作下一条。</p><div><button class="btn btn-primary" data-action="navigate" data-view="records">查看内容</button><button class="btn btn-secondary" data-action="navigate" data-view="topics">继续创作</button></div></div>`;
    if (result.platformResults?.length) {
      const images = (result.imageIds || []).map(id => this.state.materials.find(item => item.id === id)).filter(Boolean);
      const submitted = result.platformResults.filter(item => item.state === "submitted").length;
      return `<div class="a-publish-complete a-multi-complete"><div class="a-complete-icon"><i class="fa fa-check"></i></div><span class="a-kicker">多平台内容已准备</span><h1>${submitted === result.platformResults.length ? "所有平台均已提交" : "接下来完成客户端确认"}</h1><p>《${escapeHtml(result.title)}》已生成 ${result.platformResults.length} 个平台版本。只有获得官方直发能力并成功提交的平台才显示“已提交”。</p><div class="a-platform-results">${result.platformResults.map(item => `<article class="${item.state}"><i class="fa ${item.state === "submitted" ? "fa-check-circle" : "fa-mobile"}"></i><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.label)}</small></span><span class="badge ${item.state === "submitted" ? "badge-success" : "badge-warning"}">${item.state === "submitted" ? "已提交" : "待确认"}</span></article>`).join("")}</div>${images.length ? `<div class="a-complete-images">${images.map((item,index) => `<div class="${index === 0 ? "cover" : ""}"><img src="${item.src.startsWith("data:") ? item.src : encodeURI(item.src)}" alt="${escapeHtml(item.title)}"><span>${index === 0 ? "封面" : index + 1}</span></div>`).join("")}</div>` : ""}<div class="a-complete-actions"><button class="btn btn-primary" data-action="publish-section" data-section="drafts">查看内容状态</button><button class="btn btn-secondary" data-action="navigate" data-view="topics">继续创作</button><button class="btn btn-secondary" data-action="navigate" data-view="platformAccounts">管理发布平台</button></div></div>`;
    }
    const images = (result.imageIds || []).map(id => this.state.materials.find(item => item.id === id)).filter(Boolean);
    const connected = this.state.adapters?.douyin?.status === "connected";
    const scheduled = result.status === "scheduled";
    return `<div class="a-publish-complete"><div class="a-complete-icon"><i class="fa fa-check"></i></div><span class="a-kicker">${scheduled ? "已加入待发布" : connected ? "已提交抖音" : "发布流程演示完成"}</span><h1>${scheduled ? "内容已按计划排期" : "这条内容已处理完成"}</h1><p>《${escapeHtml(result.title)}》${scheduled ? `将在 ${escapeHtml(result.publishedAt)} 发布。` : connected ? "已提交到抖音创作者中心。" : "已完整验证抖音发布信息补全流程，并保存到内容管理。"}</p>${images.length ? `<div class="a-complete-images">${images.slice(0, CONTENT_IMAGE_LIMIT).map((item, index) => `<div class="${index === 0 ? "cover" : ""}"><img src="${item.src.startsWith("data:") ? item.src : encodeURI(item.src)}" alt="${escapeHtml(item.title)}"><span>${index === 0 ? "封面" : index + 1}</span></div>`).join("")}</div>` : ""}<div class="a-complete-summary"><span><i class="fa fa-file-text-o"></i><strong>内容已保存</strong><small>可在“内容”中继续查看</small></span><span><i class="fa fa-picture-o"></i><strong>${images.length} 张图片</strong><small>1 封面 + 4 内容图</small></span><span><i class="fa fa-map-marker"></i><strong>酒店地点</strong><small>发布信息已自动带入</small></span></div><div class="a-complete-actions"><button class="btn btn-primary" data-action="publish-section" data-section="${scheduled ? "scheduled" : "published"}">查看这条内容</button><button class="btn btn-secondary" data-action="navigate" data-view="topics">继续创作下一条</button><button class="btn btn-secondary" data-action="navigate" data-view="dashboard">返回首页</button></div></div>`;
  }

  renderMaterials() {
    const filter = this.state.ui.materialFilter;
    const list = filter === "all" ? this.state.materials : this.state.materials.filter(item => item.category === filter);
    if (this.usesUserFacingExperience) {
      const imageCategories = MATERIAL_CATEGORIES.filter(category => category.id !== "copy");
      const imageList = (filter === "all" || filter === "copy" ? this.state.materials : this.state.materials.filter(item => item.category === filter)).filter(item => item.src);
      return `<div class="user-light-page"><div class="user-page-back"><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="topics"><i class="fa fa-arrow-left"></i> 返回 AI 创作</button><div><h2>内容素材池</h2><p>查看全部酒店实拍图片，按需要调整本篇内容素材</p></div><div><input id="material-upload" type="file" accept="image/*" multiple hidden><button class="btn btn-primary btn-sm" data-action="upload-material"><i class="fa fa-upload"></i> 批量上传</button></div></div><div class="filter-row user-simple-filters"><button class="filter-chip ${filter === "all" || filter === "copy" ? "active" : ""}" data-action="material-filter" data-filter="all">全部图片</button>${imageCategories.map(category => `<button class="filter-chip ${filter === category.id ? "active" : ""}" data-action="material-filter" data-filter="${category.id}">${category.name}</button>`).join("")}</div><div class="material-grid user-material-grid">${imageList.map(item => `<article class="card material-card"><div class="material-image"><img src="${item.src.startsWith("data:") ? item.src : encodeURI(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy"></div><div class="material-info"><h3>${escapeHtml(item.title)}</h3><span class="muted tiny">${escapeHtml(item.source)}</span></div></article>`).join("") || '<div class="empty"><i class="fa fa-picture-o"></i>该分类暂无图片</div>'}</div></div>`;
    }
    return `
      <div class="alert alert-warning"><i class="fa fa-picture-o"></i><div><strong>素材健康提醒</strong>：每周 7 稿建议至少储备 70 张图片，并每月至少补充 50 张。图片需清晰、无水印/二维码，避免无授权人脸。</div></div>
      <section class="card card-pad section-space"><div class="card-title"><h2>素材库</h2><div><input id="material-upload" type="file" accept="image/*" hidden><button class="btn btn-primary btn-sm" data-action="upload-material"><i class="fa fa-upload"></i> 上传素材</button></div></div>
        <div class="filter-row"><button class="filter-chip ${filter === "all" ? "active" : ""}" data-action="material-filter" data-filter="all">全部 ${this.state.materials.length}</button>${MATERIAL_CATEGORIES.map(category => `<button class="filter-chip ${filter === category.id ? "active" : ""}" data-action="material-filter" data-filter="${category.id}">${category.name} ${this.state.materials.filter(item => item.category === category.id).length}</button>`).join("")}</div>
        <div class="material-grid">${list.map(item => `<article class="card material-card"><div class="material-image">${item.src ? `<img src="${item.src.startsWith("data:") ? item.src : encodeURI(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy">` : `<div class="empty"><i class="fa fa-file-text-o"></i>文案资料</div>`}</div><div class="material-info"><h3>${escapeHtml(item.title)}</h3><div style="display:flex;justify-content:space-between;gap:6px"><span class="muted tiny">${escapeHtml(item.source)}</span><span class="badge ${item.used > 3 ? "badge-warning" : "badge-neutral"}">使用 ${item.used || 0} 次</span></div></div></article>`).join("") || '<div class="empty"><i class="fa fa-inbox"></i>该分类暂无素材</div>'}</div>
      </section>`;
  }

  renderHotelGallery() {
    const category = this.state.ui.materialFilter || "all";
    const source = this.state.ui.materialSourceFilter || "all";
    const query = String(this.state.ui.materialQuery || "").trim().toLowerCase();
    const imageCategories = MATERIAL_CATEGORIES.filter(item => item.id !== "copy");
    const images = this.state.materials.filter(item => item.src);
    const uploaded = images.filter(item => item.source === "商家自有上传");
    const list = images.filter(item => (category === "all" || category === "copy" || item.category === category)
      && (source === "all" || (source === "uploaded" ? item.source === "商家自有上传" : item.source !== "商家自有上传"))
      && (!query || `${item.title} ${item.source} ${materialName(item.category)}`.toLowerCase().includes(query)));
    return `<div class="a-asset-page"><section class="a-asset-head"><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="valueServices"><i class="fa fa-arrow-left"></i> 返回我的</button><div><span class="a-kicker">酒店内容资产</span><h1>酒店图库</h1><p>系统采集图片和你自行补充的实拍图片统一管理，创作时自动检索使用。</p></div><div><input id="material-upload" type="file" accept="image/*" multiple hidden><button class="btn btn-primary" data-action="upload-material"><i class="fa fa-cloud-upload"></i> 上传自有图片</button></div></section>
      <section class="a-asset-stats"><span><i class="fa fa-picture-o"></i><strong>${images.length}</strong><small>全部图片</small></span><span><i class="fa fa-cloud-download"></i><strong>${images.length - uploaded.length}</strong><small>系统采集</small></span><span><i class="fa fa-upload"></i><strong>${uploaded.length}</strong><small>自有上传</small></span><span><i class="fa fa-folder-open-o"></i><strong>${new Set(images.map(item => item.category)).size}</strong><small>场景分类</small></span></section>
      <section class="a-gallery-tools"><form data-form="hotel-gallery-search"><i class="fa fa-search"></i><input name="materialQuery" value="${escapeHtml(this.state.ui.materialQuery || "")}" placeholder="搜索图片名称、场景或来源"><button type="submit">搜索</button></form><div class="a-source-tabs">${[["all","全部来源"],["system","系统采集"],["uploaded","自有上传"]].map(([id,label]) => `<button class="${source === id ? "active" : ""}" data-action="material-source-filter" data-source="${id}">${label}</button>`).join("")}</div></section>
      <nav class="a-gallery-categories"><button class="${category === "all" || category === "copy" ? "active" : ""}" data-action="material-filter" data-filter="all">全部</button>${imageCategories.map(item => `<button class="${category === item.id ? "active" : ""}" data-action="material-filter" data-filter="${item.id}">${escapeHtml(item.name)} <em>${images.filter(image => image.category === item.id).length}</em></button>`).join("")}</nav>
      <section class="a-gallery-grid">${list.map(item => `<article><button data-action="preview-material" data-id="${item.id}"><img src="${item.src.startsWith("data:") ? item.src : encodeURI(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy"><span>${escapeHtml(materialName(item.category))}</span></button><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.source)} · 使用 ${Number(item.used || 0)} 次</small></div></article>`).join("") || '<div class="a-empty"><i class="fa fa-picture-o"></i><strong>没有找到匹配图片</strong><p>换个分类或上传酒店自有实拍图片。</p></div>'}</section></div>`;
  }

  renderHotelData() {
    const account = this.activeAccount();
    const hotel = OTA_SNAPSHOT.hotels.find(item => item.id === (account?.hotelId || this.state.otaSnapshot?.selectedHotelId));
    const facts = this.state.knowledge?.facts || [];
    const infoGroups = [
      ["基础信息", "fa-building-o", [["酒店名称", hotel?.name || this.state.settings.brandName], ["酒店类型", this.state.settings.hotelType], ["评分信息", hotel?.rating || "待补充"], ["资料完整度", hotel?.completeness || `${this.state.knowledge?.completeness || 0}%`]]],
      ["位置与周边", "fa-map-marker", [["地址", hotel?.address || this.state.settings.address], ["坐标", hotel?.coordinates || "待补充"], ["周边地标", hotel?.landmarkSummary?.split("\n").slice(0, 3).join("；") || "待补充"]]],
      ["设施与服务", "fa-bell-o", [["特色设施", hotel?.facilities || "待补充"], ["基础设施", hotel?.basicFacilities || "待补充"], ["服务项目", hotel?.services || "待补充"]]]
    ];
    return `<div class="a-hotel-data-page"><section class="a-asset-head"><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="valueServices"><i class="fa fa-arrow-left"></i> 返回我的</button><div><span class="a-kicker">内容事实依据</span><h1>酒店资料</h1><p>这些信息会用于选题、正文、地点和发布前检查；有变化时请及时更新。</p></div><span class="badge badge-success"><i class="fa fa-check-circle"></i> 已载入</span></section>
      <section class="a-data-overview"><div><strong>${escapeHtml(hotel?.name || this.state.settings.brandName)}</strong><span>${escapeHtml(hotel?.summary || "当前酒店资料已从 OTA 抓取结果和商家确认信息中汇总。")}</span></div><div><b>${facts.length}</b><small>条创作事实</small></div><div><b>${hotel?.poiCount || 0}</b><small>个周边地点</small></div><div><b>${hotel?.imageCount || this.state.materials.filter(item => item.src).length}</b><small>张资料图片</small></div></section>
      <section class="a-data-groups">${infoGroups.map(([title, icon, rows]) => `<article><header><i class="fa ${icon}"></i><h2>${title}</h2></header>${rows.map(([label,value]) => `<div><span>${label}</span><strong>${escapeHtml(value || "待补充")}</strong></div>`).join("")}</article>`).join("")}</section>
      <section class="a-content-facts"><div class="a-section-title"><div><span>创作会使用</span><h2>已确认的酒店事实</h2></div><small>来源清楚，生成内容时优先引用</small></div><div>${facts.map(item => `<article><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><small>${escapeHtml(item.source || "商家资料")}</small></article>`).join("")}</div></section></div>`;
  }

  renderWeeklySettings() {
    const automation = this.state.weeklyAutomation || DEFAULT_STATE.weeklyAutomation;
    const contentRules = { ...DEFAULT_STATE.weeklyAutomation.contentRules, ...(automation.contentRules || {}) };
    const platforms = Object.values(this.state.publishingPlatforms || {});
    const selectedPlatforms = new Set(automation.platforms?.length ? automation.platforms : ["douyin"]);
    const active = ["active", "paused"].includes(automation.status);
    const modeLabel = { topics: "只安排7天选题", review: "自动准备，发布前确认", auto: "自动准备并按计划发布" }[automation.mode] || "自动准备，发布前确认";
    if (active) {
      const activeItems = (this.state.weekPlan || []).filter(item => item.status !== "skipped");
      const completed = activeItems.filter(item => ["published", "scheduled"].includes(item.status)).length;
      const pending = activeItems.filter(item => ["ready-review", "failed"].includes(item.status)).length;
      return `<form class="a-week-simple-page" data-form="weekly-settings"><section class="a-week-simple-head"><button class="btn btn-secondary btn-sm" type="button" data-action="navigate" data-view="valueServices"><i class="fa fa-arrow-left"></i> 返回我的</button><div><span class="a-kicker">本周任务设置</span><h1>调整后续自动运营</h1><p>只影响尚未开始的任务，已生成、已排期和已发布内容保持不变。</p></div><span class="badge ${automation.status === "active" ? "badge-success" : "badge-warning"}">${automation.status === "active" ? "运行中" : "已暂停"}</span></section>
        <section class="a-week-running-summary"><div><span>当前方式</span><strong>${escapeHtml(modeLabel)}</strong></div><div><span>已完成/排期</span><strong>${completed}/${activeItems.length || 7}</strong></div><div><span>需要处理</span><strong>${pending}</strong></div></section>
        <section class="a-week-simple-card"><div class="a-week-simple-title"><h2>后续任务设置</h2><p>这里仅保留运行中可能需要调整的三项。</p></div><div class="a-week-simple-grid"><div class="form-group"><label class="form-label">后续发布时间</label><input class="form-control" type="time" name="defaultTime" value="${escapeHtml(automation.defaultTime || "19:30")}"></div><div class="form-group"><label class="form-label">提醒方式</label><select class="form-control" name="notify"><option value="exceptions" ${automation.notify !== "all" ? "selected" : ""}>仅异常和发布确认</option><option value="all" ${automation.notify === "all" ? "selected" : ""}>每个阶段都提醒</option></select></div></div><div class="form-group"><label class="form-label">后续发布平台</label><div class="a-week-simple-platforms">${platforms.map(item => `<label><input type="checkbox" name="platform_${item.id}" ${selectedPlatforms.has(item.id) ? "checked" : ""}><span><i class="fa ${item.icon}"></i><strong>${escapeHtml(item.name)}</strong><small>${item.status === "connected" ? "已连接" : item.status === "demo" ? "演示连接" : "客户端确认"}</small></span></label>`).join("")}</div></div></section>
        <input type="hidden" name="mode" value="${escapeHtml(automation.mode || "review")}"><input type="hidden" name="startDate" value="${escapeHtml(automation.startDate || localDate(1))}"><input type="hidden" name="voice" value="${escapeHtml(contentRules.voice)}"><input type="hidden" name="forbidden" value="${escapeHtml(contentRules.forbidden || "")}"><input type="hidden" name="materialFallback" value="${escapeHtml(contentRules.materialFallback || "change-topic")}">
        <footer class="a-week-simple-actions"><button class="btn btn-secondary" type="button" data-action="open-week-automation">查看本周运行</button><button class="btn btn-primary" type="button" data-action="save-start-weekly-settings">保存并应用到未开始任务</button></footer></form>`;
    }
    const startDate = automation.startDate || localDate(1);
    const voiceOptions = ["自然、克制、有画面感", "温暖、有生活感、像店主分享", "简洁、实用、突出入住决策", "品质、克制、突出空间细节"];
    return `<form class="a-week-simple-page" data-form="weekly-settings"><section class="a-week-simple-head"><button class="btn btn-secondary btn-sm" type="button" data-action="navigate" data-view="valueServices"><i class="fa fa-arrow-left"></i> 返回我的</button><div><span class="a-kicker">可选功能 · 默认不开启</span><h1>设置7天自动运营</h1><p>只需决定做到哪一步、什么时候发布、什么情况提醒你。</p></div><span class="badge badge-neutral">未开启</span></section>
      <section class="a-week-simple-card"><div class="a-week-simple-title"><span>1</span><div><h2>希望系统帮到哪一步</h2><p>选择本周默认协作方式。</p></div></div><div class="a-week-mode-options a-week-simple-modes"><label><input type="radio" name="mode" value="topics" ${automation.mode === "topics" ? "checked" : ""}><span><i class="fa fa-lightbulb-o"></i><strong>只安排7天选题</strong><small>先看方向，再决定是否生成</small></span></label><label class="recommended"><input type="radio" name="mode" value="review" ${automation.mode === "review" || !automation.mode ? "checked" : ""}><span><em>推荐</em><i class="fa fa-magic"></i><strong>自动准备，发布前确认</strong><small>正文和5张图准备好后提醒你</small></span></label><label><input type="radio" name="mode" value="auto" ${automation.mode === "auto" ? "checked" : ""}><span><i class="fa fa-clock-o"></i><strong>自动准备并按计划发布</strong><small>仅已授权平台可自动提交</small></span></label></div></section>
      <section class="a-week-simple-card"><div class="a-week-simple-title"><span>2</span><div><h2>什么时候、发到哪里</h2><p>未接通的平台会生成内容包并等待客户端确认。</p></div></div><div class="a-week-simple-grid"><div class="form-group"><label class="form-label">开始日期</label><input class="form-control" type="date" name="startDate" min="${localDate(0)}" value="${escapeHtml(startDate)}"></div><div class="form-group"><label class="form-label">每天默认发布时间</label><input class="form-control" type="time" name="defaultTime" value="${escapeHtml(automation.defaultTime || "19:30")}"></div></div><div class="a-week-simple-platforms">${platforms.map(item => `<label><input type="checkbox" name="platform_${item.id}" ${selectedPlatforms.has(item.id) ? "checked" : ""}><span><i class="fa ${item.icon}"></i><strong>${escapeHtml(item.name)}</strong><small>${item.status === "connected" ? "已连接" : item.status === "demo" ? "演示连接" : "客户端确认"}</small></span></label>`).join("")}</div></section>
      <section class="a-week-simple-card"><div class="a-week-simple-title"><span>3</span><div><h2>什么情况提醒我</h2><p>正常任务可以安静运行。</p></div></div><div class="a-week-notify-options"><label><input type="radio" name="notify" value="exceptions" ${automation.notify !== "all" ? "checked" : ""}><span><i class="fa fa-bell-o"></i><strong>仅异常和发布确认时提醒</strong><small>推荐，素材不足、事实缺失或发布失败时再找你</small></span></label><label><input type="radio" name="notify" value="all" ${automation.notify === "all" ? "checked" : ""}><span><i class="fa fa-list-ul"></i><strong>每个阶段都提醒</strong><small>选题、生成、检查和发布状态全部通知</small></span></label></div></section>
      <section class="a-week-system-does"><i class="fa fa-check-circle"></i><div><strong>系统会自动完成</strong><p>7天选题、约120字正文、1封面＋4内容图、图片去重、酒店事实检查、风险检查、平台版本和发布失败重试。</p></div></section>
      <details class="a-week-more-settings"><summary>更多设置：内容风格与素材不足处理 <i class="fa fa-angle-down"></i></summary><div><div class="form-group"><label class="form-label">内容风格</label><select class="form-control" name="voice">${voiceOptions.map(option => `<option ${option === contentRules.voice ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">素材不足时</label><select class="form-control" name="materialFallback"><option value="change-topic" ${contentRules.materialFallback === "change-topic" ? "selected" : ""}>自动换成素材充足的选题</option><option value="prepare-and-alert" ${contentRules.materialFallback === "prepare-and-alert" ? "selected" : ""}>继续准备并提醒补图</option><option value="pause" ${contentRules.materialFallback === "pause" ? "selected" : ""}>暂停并等待处理</option></select></div><div class="form-group"><label class="form-label">不希望出现的表达</label><textarea class="form-control" rows="3" name="forbidden" maxlength="240">${escapeHtml(contentRules.forbidden || "")}</textarea></div></div></details>
      <footer class="a-week-simple-actions"><button class="a-week-save-link" type="submit"><i class="fa fa-save"></i> 保存设置，稍后使用</button><button class="btn btn-primary" type="button" data-action="preview-weekly-plan"><i class="fa fa-calendar"></i> 生成并预览本周计划</button></footer></form>`;
  }

  renderWeeklySettingsLegacy() {
    const automation = this.state.weeklyAutomation || DEFAULT_STATE.weeklyAutomation;
    const contentRules = { ...DEFAULT_STATE.weeklyAutomation.contentRules, ...(automation.contentRules || {}) };
    const publishRules = { ...DEFAULT_STATE.weeklyAutomation.publishRules, ...(automation.publishRules || {}) };
    const runDays = new Set(automation.runDays?.length ? automation.runDays : DEFAULT_STATE.weeklyAutomation.runDays);
    const platforms = this.state.publishingPlatforms || {};
    const selectedPlatforms = new Set(automation.platforms?.length ? automation.platforms : ["douyin"]);
    const voiceOptions = ["自然、克制、有画面感", "温暖、有生活感、像店主分享", "简洁、实用、突出入住决策", "品质、克制、突出空间细节"];
    const statusLabel = automation.status === "active" ? "自动运营中" : automation.status === "paused" ? "已暂停" : automation.status === "completed" ? "本周已结束" : "尚未开启";
    const isActive = ["active", "paused"].includes(automation.status);
    return `<form class="a-week-settings-page" data-form="weekly-settings">
      <section class="a-week-settings-head"><button class="btn btn-secondary btn-sm" type="button" data-action="navigate" data-view="valueServices"><i class="fa fa-arrow-left"></i> 返回我的</button><div><span class="a-kicker">我的 · 可选功能</span><h1>7天自动运营设置</h1><p>在这里统一设置内容准备、时间发布和异常处理；可以只保存，也可以主动开启本周任务。</p></div><span class="badge ${automation.status === "active" ? "badge-success" : automation.status === "paused" ? "badge-warning" : "badge-neutral"}">${statusLabel}</span></section>
      <section class="a-week-settings-block"><div class="a-week-settings-title"><span>01</span><div><h2>希望系统帮到哪一步</h2><p>这里只设置默认运行方式，不会自动开启。</p></div></div><div class="a-week-mode-options">
        <label><input type="radio" name="mode" value="topics" ${automation.mode === "topics" ? "checked" : ""}><span><i class="fa fa-lightbulb-o"></i><strong>只生成7天选题</strong><small>安排方向，不自动生成正文和图片</small></span></label>
        <label class="recommended"><input type="radio" name="mode" value="review" ${automation.mode === "review" || !automation.mode ? "checked" : ""}><span><em>推荐</em><i class="fa fa-magic"></i><strong>自动准备，发布前确认</strong><small>正文、5张图片和平台版本自动完成</small></span></label>
        <label><input type="radio" name="mode" value="auto" ${automation.mode === "auto" ? "checked" : ""}><span><i class="fa fa-clock-o"></i><strong>自动准备并按计划发布</strong><small>已授权平台提交，其他平台等待客户端确认</small></span></label>
      </div></section>
      <section class="a-week-settings-block"><div class="a-week-settings-title"><span>02</span><div><h2>内容准备规则</h2><p>系统生成每篇内容时使用，单篇创作也会沿用内容风格与禁用表达。</p></div></div><div class="a-week-settings-grid"><div class="form-group"><label class="form-label">内容风格</label><select class="form-control" name="voice">${voiceOptions.map(option => `<option ${option === contentRules.voice ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}${voiceOptions.includes(contentRules.voice) ? "" : `<option selected>${escapeHtml(contentRules.voice)}</option>`}</select></div><div class="form-group"><label class="form-label">素材不足时</label><select class="form-control" name="materialFallback"><option value="change-topic" ${contentRules.materialFallback === "change-topic" ? "selected" : ""}>自动换成素材充足的选题</option><option value="prepare-and-alert" ${contentRules.materialFallback === "prepare-and-alert" ? "selected" : ""}>继续准备并提醒补图</option><option value="pause" ${contentRules.materialFallback === "pause" ? "selected" : ""}>暂停并等待处理</option></select></div></div><div class="form-group"><label class="form-label">不希望出现的表达</label><textarea class="form-control" rows="3" name="forbidden" maxlength="240" placeholder="例如：全网第一、绝对值得、错过后悔">${escapeHtml(contentRules.forbidden || "")}</textarea></div><div class="a-week-toggle-grid"><label><input type="checkbox" name="autoFactCheck" ${contentRules.autoFactCheck ? "checked" : ""}><span><i class="fa fa-shield"></i><strong>自动事实与风险检查</strong><small>酒店事实缺失或内容高风险时暂停</small></span></label><label><input type="checkbox" name="autoPlatformVariants" ${contentRules.autoPlatformVariants ? "checked" : ""}><span><i class="fa fa-files-o"></i><strong>自动生成平台独立版本</strong><small>不同平台不直接复制同一份文案</small></span></label></div><div class="a-week-fixed-rule"><i class="fa fa-picture-o"></i><span><strong>固定内容规格</strong><small>约120字正文 · 1张封面＋4张内容图 · 自动去重和叙事排序</small></span></div></section>
      <section class="a-week-settings-block"><div class="a-week-settings-title"><span>03</span><div><h2>时间与发布</h2><p>选择执行日期、默认时间和发布平台。</p></div></div><div class="a-week-settings-grid"><div class="form-group"><label class="form-label">每天默认发布时间</label><input class="form-control" type="time" name="defaultTime" value="${escapeHtml(automation.defaultTime || this.state.settings.defaultTime || "19:30")}"></div><div class="form-group"><label class="form-label">发布确认边界</label><select class="form-control" name="publishBoundary"><option value="confirm" ${publishRules.requireConfirmation ? "selected" : ""}>发布前由我确认</option><option value="auto" ${!publishRules.requireConfirmation ? "selected" : ""}>已授权平台按计划提交</option></select></div></div><div class="form-group"><label class="form-label">本周执行日期</label><div class="a-week-day-options">${["一","二","三","四","五","六","日"].map((day,index) => `<label><input type="checkbox" name="runDay${index}" ${runDays.has(index) ? "checked" : ""}><span>周${day}</span></label>`).join("")}</div></div><div class="form-group"><label class="form-label">默认发布平台</label><div class="a-week-platform-options">${Object.values(platforms).map(item => `<label><input type="checkbox" name="platform_${item.id}" ${selectedPlatforms.has(item.id) ? "checked" : ""}><span><i class="fa ${item.icon}"></i>${escapeHtml(item.name)}<small>${item.status === "connected" ? "已连接" : item.status === "demo" ? "演示连接" : "客户端确认"}</small></span></label>`).join("")}</div></div><div class="a-week-toggle-grid"><label><input type="checkbox" name="autoLocation" ${publishRules.autoLocation ? "checked" : ""}><span><i class="fa fa-map-marker"></i><strong>自动带入酒店地点</strong><small>地点缺失时暂停并提醒</small></span></label><label><input type="checkbox" name="autoProduct" ${publishRules.autoProduct ? "checked" : ""}><span><i class="fa fa-shopping-bag"></i><strong>自动关联已配置商品</strong><small>没有可用商品时保持为空</small></span></label></div></section>
      <section class="a-week-settings-block"><div class="a-week-settings-title"><span>04</span><div><h2>提醒与异常</h2><p>正常任务尽量安静，只把需要你判断的事情交回来。</p></div></div><div class="a-week-settings-grid"><div class="form-group"><label class="form-label">消息提醒</label><select class="form-control" name="notify"><option value="exceptions" ${automation.notify !== "all" ? "selected" : ""}>仅异常和发布确认时提醒</option><option value="all" ${automation.notify === "all" ? "selected" : ""}>每个生产阶段都提醒</option></select></div><div class="form-group"><label class="form-label">发布失败</label><select class="form-control" name="retryOnFailure"><option value="true" ${publishRules.retryOnFailure ? "selected" : ""}>自动重试1次，仍失败再提醒</option><option value="false" ${!publishRules.retryOnFailure ? "selected" : ""}>立即暂停并提醒</option></select></div></div><div class="a-week-boundary"><i class="fa fa-shield"></i><div><strong>不会因为保存设置而自动运行</strong><p>只有点击“保存并开启本周”才会创建任务；本周结束后不会自动续期。</p></div></div></section>
      <footer class="a-week-settings-submit"><div><strong>${isActive ? "本周任务已存在" : "当前只是在设置默认方式"}</strong><span>${isActive ? "保存后可选择是否应用到尚未开始的任务" : "可仅保存，稍后再决定是否使用"}</span></div><button class="btn btn-secondary" type="submit"><i class="fa fa-save"></i> 仅保存设置</button><button class="btn btn-primary" type="button" data-action="save-start-weekly-settings"><i class="fa ${isActive ? "fa-refresh" : "fa-play"}"></i> ${isActive ? "保存并应用到未开始任务" : "保存并开启本周"}</button></footer>
    </form>`;
  }

  renderPlatformAccounts() {
    const platforms = Object.values(this.state.publishingPlatforms || {});
    const status = { connected: ["已连接", "badge-success"], demo: ["演示连接", "badge-demo"], disconnected: ["未连接", "badge-neutral"] };
    return `<div class="a-platform-page"><section class="a-asset-head"><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="valueServices"><i class="fa fa-arrow-left"></i> 返回我的</button><div><span class="a-kicker">多平台分发</span><h1>发布平台</h1><p>一次准备内容，各平台分别生成适合自己的版本；发布方式会按接口能力明确提示。</p></div><button class="btn btn-primary" data-action="navigate" data-view="creatorPublish" ${this.state.publishForm ? "" : "disabled"}>继续当前发布</button></section>
      <section class="a-platform-cards">${platforms.map(item => { const [label, klass] = status[item.status] || status.disconnected; return `<article><div class="a-platform-card-head"><span class="a-platform-icon ${item.id}"><i class="fa ${item.icon}"></i></span><div><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.account || "尚未绑定账号")}</p></div><span class="badge ${klass}">${label}</span></div><div class="a-platform-capability"><strong>${item.delivery === "direct" ? "可直接提交" : "客户端接力"}</strong><span>${escapeHtml(item.capability)}</span></div>${item.lastSyncedAt ? `<small>最后同步：${escapeHtml(item.lastSyncedAt)}</small>` : "<small>连接后同步账号与发布状态</small>"}<div class="a-platform-card-actions"><button class="btn btn-primary" data-action="open-platform-binding" data-platform="${item.id}">${item.status === "disconnected" ? `连接${escapeHtml(item.name)}` : "管理连接"}</button>${item.status !== "disconnected" ? `<button class="btn btn-secondary" data-action="disconnect-platform" data-platform="${item.id}">解除连接</button>` : ""}</div></article>`; }).join("")}</section>
      <section class="a-platform-note"><i class="fa fa-info-circle"></i><div><strong>不同平台，不复制同一份文案</strong><p>抖音侧重短标题和观看钩子；小红书侧重搜索标题与体验笔记；视频号侧重简洁描述和熟人传播。未获得直发能力的平台，会生成发布包并引导到客户端确认。</p></div></section></div>`;
  }

  renderPlanner() {
    const plan = this.state.weekPlan;
    const counts = plan.reduce((acc, item) => ({ ...acc, [item.topicType]: (acc[item.topicType] || 0) + 1 }), {});
    const revision = Number(plan[0]?.planRevision || 1);
    if (this.usesUserFacingExperience) {
      const automation = this.state.weeklyAutomation || DEFAULT_STATE.weeklyAutomation;
      const isRunning = automation.status === "active";
      const isPaused = automation.status === "paused";
      const modeCopy = {
        topics: "只生成7天选题",
        review: "自动准备内容，发布前确认",
        auto: "自动准备并按计划发布"
      };
      const selected = plan.find(item => item.id === this.state.ui.selectedPlanId) || plan[0];
      const platformNames = { douyin: "抖音", xiaohongshu: "小红书", wechatChannels: "视频号" };
      const stateCopy = {
        "topic-ready": ["选题已准备", "badge-info"],
        queued: ["等待开始", "badge-neutral"],
        confirmed: ["等待开始", "badge-neutral"],
        generating: ["正在生成", "badge-warning"],
        ready: ["内容已准备", "badge-success"],
        "ready-review": ["待发布确认", "badge-warning"],
        scheduled: ["已进入发布队列", "badge-success"],
        published: ["已发布", "badge-success"],
        failed: ["需要处理", "badge-danger"],
        skipped: ["本日已跳过", "badge-neutral"]
      };
      const dateLabel = value => {
        const date = new Date(`${value}T00:00:00`);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      };
      const weekdayLabel = value => ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date(`${value}T00:00:00`).getDay()];
      const itemPlatforms = item => (item.platforms?.length ? item.platforms : ["douyin"]).map(id => platformNames[id]).filter(Boolean);
      const planCard = item => {
        const image = this.state.materials.find(material => material.id === item.imageIds?.[0]);
        const [statusLabel, statusClass] = stateCopy[item.status] || stateCopy["topic-ready"];
        return `<article class="a-plan-row ${selected?.id === item.id ? "selected" : ""} ${item.status === "skipped" ? "skipped" : ""}" data-action="select-plan-day" data-id="${item.id}">
          <div class="a-plan-date"><strong>${dateLabel(item.date)}</strong><span>${weekdayLabel(item.date)}</span></div>
          <div class="a-plan-thumb">${image?.src ? `<img src="${image.src.startsWith("data:") ? image.src : encodeURI(image.src)}" alt="${escapeHtml(item.title)}">` : '<i class="fa fa-picture-o"></i>'}</div>
          <div class="a-plan-copy"><div>${topicBadge(item.topicType)}<span class="badge ${statusClass}">${statusLabel}</span></div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(itemPlatforms(item).join(" · "))}</small></div>
          <time>${escapeHtml(item.time)}</time><button class="btn btn-secondary btn-sm" data-action="select-plan-day" data-id="${item.id}">查看</button>
        </article>`;
      };
      const selectedDetail = selected ? (() => {
        const image = this.state.materials.find(material => material.id === selected.imageIds?.[0]);
        const platforms = itemPlatforms(selected);
        const stageIndex = {
          "topic-ready": 0, queued: 0, confirmed: 0, generating: 2, ready: 4,
          "ready-review": 4, scheduled: 5, published: 6, failed: 4, skipped: -1
        }[selected.status] ?? 0;
        const stages = ["选题", "正文", "5张图片", "平台版本", "内容检查", "发布队列", "完成发布"];
        return `<article class="a-plan-day-detail"><div class="a-plan-detail-head"><div><span class="a-kicker">${weekdayLabel(selected.date)} · ${dateLabel(selected.date)}</span><h2>${escapeHtml(selected.title)}</h2></div>${topicBadge(selected.topicType)}</div>
          <div class="a-plan-detail-body">${image?.src ? `<img src="${image.src.startsWith("data:") ? image.src : encodeURI(image.src)}" alt="${escapeHtml(selected.title)}">` : ""}<div><label>内容方向</label><p>${escapeHtml(selected.body)}</p><label>计划平台</label><div class="a-plan-platform-badges">${platforms.map(name => `<span>${escapeHtml(name)}</span>`).join("")}</div><div class="a-plan-time-edit"><input class="form-control" type="date" data-plan-field="date" data-id="${selected.id}" value="${selected.date}" min="${localDate(0)}"><input class="form-control" type="time" data-plan-field="time" data-id="${selected.id}" value="${selected.time}"></div></div></div>
          ${isRunning || isPaused ? `<div class="a-plan-pipeline" aria-label="当天生产进度">${stages.map((stage, index) => `<span class="${index < stageIndex ? "done" : index === stageIndex ? "current" : ""}"><i class="fa ${index < stageIndex ? "fa-check" : index === stageIndex ? "fa-circle-o-notch" : "fa-circle-o"}"></i><small>${stage}</small></span>`).join("")}</div>` : ""}
          <div class="a-plan-detail-actions">${["ready", "ready-review", "scheduled", "published"].includes(selected.status) ? `<button class="btn btn-primary" data-action="view-plan-content" data-id="${selected.id}"><i class="fa fa-file-text-o"></i> 查看这条成品</button>` : `<button class="btn btn-primary" data-action="plan-change-topic" data-id="${selected.id}"><i class="fa fa-refresh"></i> 换一个选题</button>`}<button class="btn btn-secondary" data-action="open-plan-platforms" data-id="${selected.id}"><i class="fa fa-share-alt"></i> 选择平台</button><button class="btn btn-secondary" data-action="plan-toggle-skip" data-id="${selected.id}">${selected.status === "skipped" ? "恢复这一天" : "跳过这一天"}</button></div></article>`;
      })() : "";
      const automationStatus = isRunning ? ["自动运营中", "badge-success"] : isPaused ? ["已暂停", "badge-warning"] : automation.status === "completed" ? ["本周已结束", "badge-neutral"] : ["尚未开启", "badge-neutral"];
      return `<div class="a-plan-page"><section class="a-plan-head ${isRunning ? "is-running" : ""}"><button class="btn btn-secondary btn-sm" data-action="navigate" data-view="topics"><i class="fa fa-arrow-left"></i> 返回创作</button><div><span class="a-kicker">可选功能 · 由你决定是否使用</span><h1>7天自动运营</h1><p>${isRunning || isPaused ? `${escapeHtml(modeCopy[automation.mode] || modeCopy.review)} · 默认${escapeHtml(automation.defaultTime || this.state.settings.defaultTime)} · 本周结束后不自动续期` : "可以只安排选题，也可以让系统准备内容或按计划发布；不开启不影响单篇创作。"}</p></div><span class="badge ${automationStatus[1]}">${automationStatus[0]}</span></section>
        ${plan.length ? `<section class="a-plan-summary"><div><strong>${isRunning || isPaused ? modeCopy[automation.mode] : `第 ${revision} 版待选计划`}</strong><span>流量型 ${counts.traffic || 0} · 垂类型 ${counts.vertical || 0} · 营销型 ${counts.marketing || 0}</span></div><span><i class="fa fa-info-circle"></i> ${isRunning ? "系统只在异常或需要确认时提醒你" : isPaused ? "所有任务已保留，继续后恢复推进" : "先查看7天安排，再自主选择是否开启"}</span></section>
        <div class="a-plan-workspace"><div><nav class="a-plan-mobile-dates">${plan.map(item => `<button class="${selected?.id === item.id ? "active" : ""}" data-action="select-plan-day" data-id="${item.id}"><strong>${dateLabel(item.date)}</strong><span>${weekdayLabel(item.date).replace("周", "")}</span></button>`).join("")}</nav><div class="a-plan-list">${plan.map(planCard).join("")}</div></div>${selectedDetail}</div>
        <div class="a-plan-sticky"><div><strong>${isRunning ? "本周自动运营正在运行" : isPaused ? "本周任务已暂停" : `${plan.filter(item => item.status !== "skipped").length} 天计划等待确认`}</strong><span>${isRunning ? "正常任务自动推进，只在异常时需要你处理" : isPaused ? "内容和设置均已保留" : "先检查7天选题、日期和平台，确认后才正式开启"}</span></div>${isRunning ? `<button class="btn btn-secondary" data-action="toggle-week-automation"><i class="fa fa-pause"></i> 暂停</button><button class="btn btn-secondary" data-action="confirm-end-week"><i class="fa fa-stop"></i> 结束本周</button>` : isPaused ? `<button class="btn btn-primary" data-action="toggle-week-automation"><i class="fa fa-play"></i> 继续运行</button><button class="btn btn-secondary" data-action="confirm-end-week">结束本周</button>` : `<button class="btn btn-secondary" data-action="open-week-setup"><i class="fa fa-sliders"></i> 调整设置</button><button class="btn btn-primary" data-action="activate-weekly-plan"><i class="fa fa-play"></i> 确认开启本周自动运营</button>`}</div>`
        : `<div class="user-empty-state"><i class="fa fa-calendar-plus-o"></i><div><strong>本周还没有安排</strong><p>先生成7天选题进行预览，生成后仍由你决定是否开启自动运营。</p><button class="btn btn-primary" style="margin-top:12px" data-action="generate-plan">生成并预览本周安排</button><button class="btn btn-secondary" style="margin-top:12px" data-action="navigate" data-view="dashboard">本周暂不使用</button></div></div>`}</div>`;
    }
    return `
      <section class="card card-pad"><div class="card-title"><div><h2>未来 7 天内容</h2><div class="muted tiny" style="margin-top:4px">当天内容确认即发；只有多天计划展示并使用发布时间。</div></div><button class="btn btn-secondary btn-sm" data-action="generate-plan"><i class="fa fa-magic"></i> ${plan.length ? "重新生成整周" : "智能生成"}</button></div>
        ${plan.length ? `<div class="alert alert-info" style="margin-bottom:14px"><i class="fa fa-pie-chart"></i><div><strong>当前为第 ${revision} 版</strong> · 流量型 ${counts.traffic || 0} 条 · 垂类型 ${counts.vertical || 0} 条 · 营销型 ${counts.marketing || 0} 条。重新生成会保留你设置的日期和时间，优先避开上一版选题与图片。</div></div><div class="plan-list">${plan.map(item => `<div class="plan-row"><input class="form-control" type="date" data-plan-field="date" data-id="${item.id}" value="${item.date}" min="${localDate(0)}"><input class="form-control" type="time" data-plan-field="time" data-id="${item.id}" value="${item.time}"><div><div style="font-size:12px;font-weight:700;margin-bottom:4px">${escapeHtml(item.title)}</div><div class="muted tiny">${escapeHtml(item.body)}</div></div>${topicBadge(item.topicType)}<button class="btn btn-danger btn-sm" data-action="remove-plan" data-id="${item.id}"><i class="fa fa-trash-o"></i></button></div>`).join("")}</div><div class="topic-actions" style="justify-content:flex-end"><button class="btn btn-primary" data-action="confirm-plan"><i class="fa fa-check"></i> 确认整个计划</button></div>` : `<div class="empty"><i class="fa fa-calendar-plus-o"></i><div>还没有周计划</div><button class="btn btn-primary" style="margin-top:14px" data-action="generate-plan">生成未来 7 天内容</button></div>`}
      </section>`;
  }

  renderUserARecords() {
    const requested = this.state.ui.publishSection || "drafts";
    const section = requested === "pending" ? "drafts" : requested === "records" ? "published" : requested;
    const cover = this.state.materials.find(item => item.src);
    const sectionMap = {
      drafts: this.state.records.filter(item => ["draft", "reviewing", "failed"].includes(item.status)),
      scheduled: this.state.records.filter(item => item.status === "scheduled"),
      published: this.state.records.filter(item => item.status === "published")
    };
    const tabs = [
      ["drafts", "草稿", "fa-pencil-square-o", sectionMap.drafts.length],
      ["scheduled", "待发布", "fa-clock-o", sectionMap.scheduled.length],
      ["published", "已发布", "fa-check-circle-o", sectionMap.published.length],
      ["insights", "数据", "fa-line-chart", sectionMap.published.length]
    ];
    const records = sectionMap[section] || [];
    const list = `<div class="a-content-list">${records.map(item => `<article><div class="a-content-cover">${cover?.src ? `<img src="${cover.src.startsWith("data:") ? cover.src : encodeURI(cover.src)}" alt="内容封面">` : '<i class="fa fa-picture-o"></i>'}</div><div class="a-content-main"><div><strong>${escapeHtml(item.title)}</strong>${statusBadge(item.status)}</div><p>${escapeHtml(item.body || "暂无正文摘要")}</p><small>${escapeHtml(item.publishedAt || "尚未设置时间")} · ${escapeHtml(item.mode || "内容草稿")}</small></div><div class="a-content-result">${item.status === "published" ? `<strong>${fmt(item.views)}</strong><small>曝光</small><span>${fmt((item.likes || 0) + (item.comments || 0) + (item.shares || 0))} 互动</span>` : item.status === "failed" ? `<button class="btn btn-secondary btn-sm" data-action="retry" data-id="${item.id}">重新提交</button>` : `<button class="btn btn-secondary btn-sm" data-action="navigate" data-view="editor">继续处理</button>`}</div></article>`).join("") || `<div class="a-empty"><i class="fa fa-inbox"></i><strong>这里暂时没有内容</strong><p>${section === "scheduled" ? "在发布确认中选择定时发布后，会显示在这里。" : "开始一次 AI 创作，内容会自动保存。"}</p><button class="btn btn-primary" data-action="navigate" data-view="topics">开始创作</button></div>`}</div>`;
    return `<div class="a-content-page"><section class="a-content-head"><div><span class="a-kicker">内容管理</span><h1>从创作到效果，统一查看</h1><p>草稿、待发布、已发布内容和数据不再分散在多个入口。</p></div><button class="btn btn-primary" data-action="navigate" data-view="topics"><i class="fa fa-plus"></i> 创作新内容</button></section><nav class="a-content-tabs">${tabs.map(([id, label, icon, count]) => `<button class="${section === id ? "active" : ""}" data-action="publish-section" data-section="${id}"><i class="fa ${icon}"></i><span>${label}</span><em>${count}</em></button>`).join("")}</nav><section class="a-content-body">${section === "insights" ? this.renderUserAnalyticsContent() : list}</section></div>`;
  }

  renderRecords() {
    const rawFilter = this.state.ui.recordFilter;
    const filter = rawFilter;
    const records = filter === "all" ? this.state.records : this.state.records.filter(item => item.status === filter);
    if (this.usesUserAExperience) return this.renderUserARecords();
    if (this.userEdition) {
      const v2 = this.userEditionV2;
      const section = this.state.ui.publishSection || "records";
      const pendingStatuses = new Set(["scheduled", "draft", "reviewing"]);
      const sectionRecords = section === "pending"
        ? this.state.records.filter(item => pendingStatuses.has(item.status))
        : this.state.records.filter(item => ["published", "failed"].includes(item.status));
      const visibleRecords = section === "records" && filter !== "all"
        ? sectionRecords.filter(item => item.status === filter)
        : sectionRecords;
      const sectionCount = section === "insights" ? this.state.records.filter(item => item.status === "published").length : visibleRecords.length;
      const tabs = v2
        ? [["pending", "草稿与待发布", "fa-clock-o"], ["records", "已发布内容", "fa-check-circle-o"], ["insights", "内容表现", "fa-line-chart"]]
        : [["pending", "待发布", "fa-clock-o"], ["records", "发布记录", "fa-list-alt"], ["insights", "内容效果", "fa-line-chart"]];
      const list = `<div class="user-record-list">${visibleRecords.map(item => `<article><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.publishedAt || "尚未发布")}</span></div>${statusBadge(item.status)}${item.status === "published" ? `<div class="user-record-result"><span><i class="fa fa-eye"></i>${fmt(item.views)}</span><span><i class="fa fa-heart-o"></i>${fmt((item.likes || 0) + (item.comments || 0) + (item.shares || 0))}</span></div>` : `<div class="user-record-result"><span><i class="fa fa-calendar-o"></i>${escapeHtml(item.mode || "等待处理")}</span></div>`}${item.status === "failed" ? `<button class="btn btn-secondary btn-sm" data-action="retry" data-id="${item.id}">重新发布</button>` : ""}</article>`).join("") || `<div class="empty"><i class="fa fa-inbox"></i>${section === "pending" ? "暂无待发布内容" : "暂无发布记录"}</div>`}</div>`;
      const sectionContent = section === "insights"
        ? this.renderUserAnalyticsContent()
        : `${section === "records" ? `<div class="filter-row user-simple-filters">${[["all","全部"],["published","已发布"],["failed","失败"]].map(([id,label]) => `<button class="filter-chip ${filter === id ? "active" : ""}" data-action="record-filter" data-filter="${id}">${label}</button>`).join("")}</div>` : ""}${list}`;
      return `<div class="user-light-page user-publish-page ${v2 ? "v2-content-page" : ""}"><div class="user-page-back"><div class="user-page-icon"><i class="fa ${v2 ? "fa-file-text-o" : "fa-send-o"}"></i></div><div><h2>${v2 ? "内容" : "发布"}</h2><p>${v2 ? "从草稿到已发布内容，在这里统一管理" : "处理待发布内容、查看发布记录和内容效果"}</p></div><span class="badge badge-neutral">${sectionCount} 条</span></div><nav class="user-publish-tabs" aria-label="${v2 ? "内容分区" : "发布分区"}">${tabs.map(([id,label,icon]) => `<button class="${section === id ? "active" : ""}" data-action="publish-section" data-section="${id}"><i class="fa ${icon}"></i><span>${label}</span></button>`).join("")}</nav><section class="user-publish-section">${sectionContent}</section></div>`;
    }
    return `<section class="card card-pad"><div class="card-title"><h2>内容记录</h2><span class="muted tiny">共 ${this.state.records.length} 条</span></div><div class="filter-row">${[["all","全部"],["published","已发布"],["scheduled","待发布"],["draft","草稿"],["reviewing","审核中"],["failed","失败"]].map(([id,label]) => `<button class="filter-chip ${filter === id ? "active" : ""}" data-action="record-filter" data-filter="${id}">${label}</button>`).join("")}</div>${this.recordsTable(records, true)}</section>`;
  }

  renderInteractions() {
    const center = this.state.interactionCenter || clone(DEFAULT_INTERACTION_CENTER);
    const allItems = Array.isArray(center.items) ? center.items : [];
    const channel = this.state.ui.interactionChannel || "all";
    const filter = this.state.ui.interactionFilter || "pending";
    const channelItems = channel === "all" ? allItems : allItems.filter(item => item.channel === channel);
    const visibleItems = filter === "all" ? channelItems : channelItems.filter(item => item.status === filter);
    const selected = visibleItems.find(item => item.id === this.state.ui.selectedInteractionId) || visibleItems[0] || null;
    const comments = allItems.filter(item => item.channel === "comment");
    const messages = allItems.filter(item => item.channel === "message");
    const pendingCount = allItems.filter(item => item.status === "pending").length;
    const unreadCount = allItems.filter(item => item.unread).length;
    const highLeads = allItems.filter(item => item.status === "pending" && item.leadLevel === "high").length;
    const repliedCount = allItems.filter(item => item.status === "replied" || item.status === "handled").length;
    const replyRate = allItems.length ? Math.round(repliedCount / allItems.length * 100) : 0;
    const suggestion = selected ? suggestInteractionReply(this.state, selected) : null;
    const factMap = new Map((this.state.knowledge?.facts || []).map(item => [item.id, item]));
    const selectedReply = selected?.replyDraft || selected?.reply || suggestion?.text || "";
    const statusLabel = { pending: "待回复", replied: "已回复", handled: "已处理" };
    const statusClass = { pending: "badge-warning", replied: "badge-success", handled: "badge-neutral" };
    const channelLabel = { comment: "作品评论", message: "私信消息" };
    const interactionConnected = this.isDouyinInteractionConnected();
    return `
      <section class="interaction-entry-grid">
        <article class="card interaction-entry-card"><span class="interaction-entry-icon comments"><i class="fa fa-commenting"></i></span><div><h2>作品评论 <span class="badge badge-warning">${comments.filter(item => item.status === "pending").length}</span></h2><p>${comments.length ? `共 ${comments.length} 条评论，优先处理高意向咨询` : "暂无新评论"}</p></div><button class="btn btn-secondary btn-sm" data-action="interaction-channel" data-channel="comment">评论管理 <i class="fa fa-angle-right"></i></button></article>
        <article class="card interaction-entry-card"><span class="interaction-entry-icon messages"><i class="fa fa-envelope"></i></span><div><h2>私信消息 ${messages.filter(item => item.unread).length ? `<span class="badge badge-info">+${messages.filter(item => item.unread).length}</span>` : ""}</h2><p>${messages.find(item => item.unread) ? `你收到一条新咨询：${escapeHtml(messages.find(item => item.unread).content)}` : "暂无未读私信"}</p></div><button class="btn btn-secondary btn-sm" data-action="interaction-channel" data-channel="message">私信管理 <i class="fa fa-angle-right"></i></button></article>
      </section>

      <div class="alert ${interactionConnected ? "alert-success" : "alert-warning"} section-space"><i class="fa ${interactionConnected ? "fa-link" : this.userEdition ? "fa-info-circle" : "fa-flask"}"></i><div style="flex:1"><strong>${this.userEdition ? (interactionConnected ? "抖音互动已连接" : "当前展示示例互动") : (interactionConnected ? "抖音开放平台互动已连接" : "抖音互动演示适配器")}</strong><br>${this.userEdition ? (interactionConnected ? "评论和私信会自动同步到这里。" : "绑定抖音账号后，真实评论和私信会自动出现在这里。") : (interactionConnected ? `已连接 ${escapeHtml(this.state.adapters.douyin.account)}，互动将通过官方接口同步。` : "当前使用本地样本验证评论与私信工作流；取得 comment/message 权限且后端验权成功后才会切换真实同步与回复。")}${this.userEdition ? "" : ` 最近同步：${escapeHtml(center.lastSyncedAt || "尚未同步")}`}</div><button class="btn btn-primary btn-sm" data-action="sync-interactions" ${this.interactionSyncing ? "disabled" : ""}><i class="fa ${this.interactionSyncing ? "fa-spinner fa-spin" : "fa-refresh"}"></i> ${this.interactionSyncing ? "同步中" : this.userEdition ? "刷新互动" : "同步抖音互动"}</button></div>

      ${this.userEdition ? "" : `<section class="grid-4 section-space">${this.metricCard("待处理", pendingCount, "fa-clock-o", "评论与私信")}${this.metricCard("未读消息", unreadCount, "fa-envelope-o", "需及时查看")}${this.metricCard("高意向咨询", highLeads, "fa-fire", "优先转化")}${this.metricCard("处理完成率", `${replyRate}%`, "fa-check-circle-o", "已回复/已处理")}</section>`}

      <section class="card interaction-workspace section-space"><div class="interaction-list-pane"><div class="interaction-toolbar"><div class="filter-row">${[["all","全部"],["comment","作品评论"],["message","私信"]].map(([id,label]) => `<button class="filter-chip ${channel === id ? "active" : ""}" data-action="interaction-channel" data-channel="${id}">${label}</button>`).join("")}</div><div class="filter-row">${[["pending","待回复"],["replied","已回复"],["handled","已处理"],["all","全部状态"]].map(([id,label]) => `<button class="filter-chip ${filter === id ? "active" : ""}" data-action="interaction-filter" data-filter="${id}">${label}</button>`).join("")}</div></div><div class="interaction-list">${visibleItems.length ? visibleItems.map(item => `<button class="interaction-item ${selected?.id === item.id ? "active" : ""}" data-action="select-interaction" data-id="${item.id}"><span class="interaction-avatar">${escapeHtml(Array.from(item.userName || "客")[0])}</span><span class="interaction-item-main"><span class="interaction-item-head"><strong>${escapeHtml(item.userName)}</strong><small>${escapeHtml(item.receivedAt)}</small></span><span class="interaction-content">${escapeHtml(item.content)}</span><span class="interaction-item-foot"><em>${channelLabel[item.channel]}</em><small>${escapeHtml(item.workTitle)}</small></span></span>${item.unread ? '<i class="interaction-unread"></i>' : ""}<span class="badge ${statusClass[item.status] || "badge-neutral"}">${statusLabel[item.status] || item.status}</span></button>`).join("") : '<div class="empty"><i class="fa fa-comments-o"></i>当前筛选下暂无互动</div>'}</div></div>
        <div class="interaction-detail-pane">${selected ? `<div class="interaction-detail-head"><div><span class="badge ${selected.channel === "comment" ? "badge-warning" : "badge-info"}">${channelLabel[selected.channel]}</span><h2>${escapeHtml(selected.userName)}</h2><p>${escapeHtml(selected.receivedAt)} · ${escapeHtml(selected.workTitle)}</p></div><span class="badge ${selected.leadLevel === "high" ? "badge-danger" : selected.leadLevel === "medium" ? "badge-warning" : "badge-neutral"}">${selected.leadLevel === "high" ? "高意向" : selected.leadLevel === "medium" ? "一般咨询" : "普通互动"}</span></div><div class="interaction-original"><i class="fa fa-quote-left"></i><p>${escapeHtml(selected.content)}</p></div><div class="interaction-suggestion"><div class="interaction-suggestion-head"><div><i class="fa fa-lightbulb-o"></i><strong>${this.userEdition ? "回复建议" : "知识库回复建议"}</strong></div><span class="badge ${suggestion.requiresHumanConfirm ? "badge-warning" : "badge-success"}">${suggestion.requiresHumanConfirm ? "发送前确认" : this.userEdition ? "可直接使用" : "事实可用"}</span></div><p>${escapeHtml(suggestion.text)}</p>${this.userEdition ? "" : `<div class="interaction-reference">${suggestion.factReferences.length ? suggestion.factReferences.map(id => `<span><i class="fa fa-database"></i>${escapeHtml(factMap.get(id)?.label || id)}</span>`).join("") : '<span><i class="fa fa-shield"></i>安全服务模板</span>'}</div>`}<button class="btn btn-ghost btn-sm" data-action="use-interaction-suggestion" data-id="${selected.id}"><i class="fa fa-magic"></i> 使用此建议</button></div>${selected.status === "pending" ? `<form class="interaction-reply-form" data-form="interaction-reply"><input type="hidden" name="interactionId" value="${selected.id}"><label class="form-label">回复内容 <span>${charCount(selectedReply)}/180</span></label><textarea class="form-control" name="reply" rows="5" maxlength="180" required>${escapeHtml(selectedReply)}</textarea>${suggestion.requiresHumanConfirm ? '<label class="interaction-confirm"><input type="checkbox" name="humanConfirmed" value="yes" required> 我已确认房价、房态、宠物政策或预订信息，允许发送</label>' : ""}<div class="interaction-reply-actions"><button class="btn btn-secondary" type="button" data-action="mark-interaction-handled" data-id="${selected.id}">无需回复，标记处理</button><button class="btn btn-primary" type="submit"><i class="fa fa-reply"></i> ${interactionConnected ? "回复到抖音" : this.userEdition ? "保存回复" : "演示回复"}</button></div></form>` : `<div class="interaction-replied"><i class="fa fa-check-circle"></i><div><strong>${selected.status === "replied" ? "已回复" : "已处理"}</strong><p>${escapeHtml(selected.reply || "该互动已完成处理，无需回复。")}</p></div></div>`}` : '<div class="empty"><i class="fa fa-hand-pointer-o"></i>请选择一条互动</div>'}</div></section>`;
  }

  recordsTable(records, actions) {
    if (!records.length) return '<div class="empty"><i class="fa fa-inbox"></i>暂无匹配记录</div>';
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>内容</th><th>状态</th><th>模式</th><th>时间</th><th>曝光</th><th>互动</th>${actions ? "<th>操作</th>" : ""}</tr></thead><tbody>${records.map(item => `<tr><td><div class="truncate-cell" style="font-weight:700">${escapeHtml(item.title)}</div>${item.error ? `<div class="tiny" style="color:#b43b3b;margin-top:3px">${escapeHtml(item.error)}</div>` : ""}</td><td>${statusBadge(item.status)}</td><td>${escapeHtml(item.mode)}</td><td class="muted">${escapeHtml(item.publishedAt)}</td><td>${fmt(item.views)}</td><td>${fmt((item.likes || 0) + (item.comments || 0) + (item.shares || 0))}</td>${actions ? `<td>${item.status === "failed" ? `<button class="btn btn-secondary btn-sm" data-action="retry" data-id="${item.id}"><i class="fa fa-refresh"></i> 重试</button>` : '<span class="muted">—</span>'}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
  }

  renderAnalytics() {
    const metrics = computeDashboard(this.state.records);
    const records = this.state.records.filter(item => item.status === "published").slice(0, 7).reverse();
    const max = Math.max(...records.map(item => item.views), 1);
    const peak = detectPeak(this.state.records);
    if (this.usesUserFacingExperience) return this.renderUserAnalyticsContent();
    return `
      <section class="grid-4">${this.metricCard("发布内容", metrics.published, "fa-send-o", "本月累计")}${this.metricCard("总曝光", fmt(metrics.views), "fa-eye", "内容浏览/播放")}${this.metricCard("互动率", `${metrics.engagementRate}%`, "fa-heart-o", "赞评转/曝光")}${this.metricCard("成功率", `${metrics.successRate}%`, "fa-check-circle-o", "目标 > 90%")}</section>
      ${peak ? `<div class="alert alert-success section-space"><i class="fa fa-bolt"></i><div><strong>表现突出</strong>：${escapeHtml(peak.record.title)}达到近期均值的 ${peak.ratio}%，${this.userEdition ? "建议继续发布类似内容。" : "已自动生成策略通知。"}</div></div>` : ""}
      <section class="grid-2 section-space"><div class="card card-pad"><div class="card-title"><h2>近 7 条曝光趋势</h2><span class="muted tiny">按发布时间</span></div><div class="chart">${records.map(item => `<div class="chart-column"><div class="tiny">${fmt(item.views)}</div><div class="chart-bar" style="height:${Math.max(8, (item.views / max) * 145)}px"></div><div class="chart-label">${item.publishedAt.slice(5,10)}</div></div>`).join("")}</div></div>
      <div class="card card-pad"><div class="card-title"><h2>${this.userEdition ? "内容类型" : "内容结构"}</h2>${this.userEdition ? "" : '<span class="muted tiny">532 对照</span>'}</div>${["traffic","vertical","marketing"].map(type => { const count = this.state.records.filter(item => item.topicType === type).length; const pct = Math.round(count / Math.max(this.state.records.length,1) * 100); const userLabel = { traffic: "吸引新客", vertical: "展示酒店特色", marketing: "促进咨询预订" }[type]; return `<div style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;margin-bottom:7px">${this.userEdition ? `<strong style="font-size:11px">${userLabel}</strong>` : topicBadge(type)}<span class="muted tiny">${count} 条 · ${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div></div>`; }).join("")}</div></section>`;
  }

  renderUserAnalyticsContent() {
    const metrics = computeDashboard(this.state.records);
    const records = this.state.records.filter(item => item.status === "published").slice(0, 7).reverse();
    const max = Math.max(...records.map(item => item.views), 1);
    const peak = detectPeak(this.state.records);
    const ranked = [...records].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 3);
    return `<div class="user-data-page"><section class="user-data-summary"><div><span>本月发布</span><strong>${metrics.published}</strong><small>条内容</small></div><div><span>累计曝光</span><strong>${fmt(metrics.views)}</strong><small>次浏览</small></div><div><span>互动率</span><strong>${metrics.engagementRate}%</strong><small>赞评转 / 曝光</small></div></section>${peak ? `<section class="user-data-highlight"><i class="fa fa-bolt"></i><div><strong>这条内容表现最好</strong><p>《${escapeHtml(peak.record.title)}》达到近期平均曝光的 ${peak.ratio}%，可以继续发布类似内容。</p></div></section>` : ""}<section class="user-data-grid section-space"><div class="card card-pad"><div class="card-title"><h2>最近内容曝光</h2><span class="muted tiny">近 7 条</span></div><div class="chart">${records.map(item => `<div class="chart-column"><div class="tiny">${fmt(item.views)}</div><div class="chart-bar" style="height:${Math.max(8, (item.views / max) * 145)}px"></div><div class="chart-label">${item.publishedAt.slice(5,10)}</div></div>`).join("")}</div></div><div class="card card-pad"><div class="card-title"><h2>表现较好的内容</h2></div><div class="user-top-content">${ranked.map((item, index) => `<article><span>${index + 1}</span><div><strong>${escapeHtml(item.title)}</strong><small>${fmt(item.views)} 次曝光 · ${fmt((item.likes || 0) + (item.comments || 0) + (item.shares || 0))} 次互动</small></div></article>`).join("") || '<div class="empty">暂无已发布内容</div>'}</div></div></section></div>`;
  }

  isMobileServiceExperience() {
    return (this.userEdition ? this.userPreviewMode === "mobile" : this.state.ui.device === "mobile") || globalThis.matchMedia?.("(max-width: 560px)")?.matches;
  }

  getValueStatusMap() {
    return {
      active: ["已连接", "badge-success"],
      reviewing: ["审核中", "badge-warning"],
      consulting: ["顾问跟进", "badge-info"],
      inactive: ["未连接", "badge-neutral"]
    };
  }

  getCapabilityActionLabels(capabilityId) {
    const labels = {
      douyinAccount: ["绑定抖音账号", "咨询配置顾问"],
      blueV: ["绑定蓝v地点", "咨询配置顾问"],
      groupBuy: ["联动商品链接", "咨询配置顾问"],
      lifeService: ["绑定抖音来客", "咨询配置顾问"]
    };
    return labels[capabilityId] || ["查看能力详情", "咨询配置顾问"];
  }

  getValueCapabilities() {
    const capabilityState = this.state.valueAdded?.capabilities || {};
    return [
      {
        id: "douyinAccount", stage: "01", title: "内容账号与品牌主体", icon: "fa-music", accent: "black",
        subtitle: "账号归属、酒店品牌和管理员权限一致",
        detail: `${capabilityState.douyinAccount?.binding?.accountName || this.activeAccount()?.handle || this.state.adapters.douyin.account} · ${capabilityState.douyinAccount?.binding?.mode === "official" ? "官方授权已关联" : "已接入当前酒店工作台"}`,
        outcome: "持续发布内容，评论和私信能够回到当前酒店处理",
        checks: ["账号绑定", "品牌一致", "权限可交接"],
        serviceId: "douyin-managed"
      },
      {
        id: "blueV", stage: "02", title: "门店身份与地点", icon: "fa-map-marker", accent: "blue",
        subtitle: "主体认证、门店 POI、地址和电话一致",
        detail: capabilityState.blueV?.binding?.externalId ? `已绑定 ${capabilityState.blueV.binding.poiName} · ${capabilityState.blueV.binding.externalId}` : `认证资料已提交 ${Number(capabilityState.blueV?.submittedDays || 0)} 天，预计 ${Number(capabilityState.blueV?.etaDays || 3)} 个工作日完成`,
        outcome: "内容可挂载可信酒店定位，用户能找到门店与咨询入口",
        checks: ["主体认证", "POI 地点", "门店资料"],
        serviceId: "local-life-operations"
      },
      {
        id: "groupBuy", stage: "03", title: "房型商品与预订承接", icon: "fa-shopping-bag", accent: "orange",
        subtitle: "房型/套餐、库存、退款和核销规则完整",
        detail: capabilityState.groupBuy?.binding?.productUrl ? `已联动 ${capabilityState.groupBuy.binding.productName} · ${capabilityState.groupBuy.binding.productType}` : "尚未配置可挂载的房型或团购商品，内容流量暂不能直接进入下单",
        outcome: "短视频和直播可关联商品，用户从种草直接进入预订",
        checks: ["商品信息", "库存规则", "退款核销"],
        serviceId: "local-life-operations"
      },
      {
        id: "lifeService", stage: "04", title: "订单数据与客户经营", icon: "fa-exchange", accent: "purple",
        subtitle: "咨询、预订、核销和内容来源形成归因",
        detail: this.state.adapters.lifeService.shopId ? `已绑定门店 ${this.state.adapters.lifeService.shopId}` : "门店订单数据尚未授权，当前只能统计内容与互动数据",
        outcome: "看清哪条内容带来咨询、预订和核销，并用于下一轮增长",
        checks: ["门店授权", "订单回传", "转化归因"],
        serviceId: "local-life-operations"
      }
    ];
  }

  getValueServiceContext() {
    const valueAdded = this.state.valueAdded || clone(DEFAULT_VALUE_ADDED_STATE);
    const capabilityState = valueAdded.capabilities || {};
    const capabilities = this.getValueCapabilities();
    const statusScore = { active: 100, reviewing: 70, consulting: 45, inactive: 0 };
    const readiness = Math.round(capabilities.reduce((total, item) => total + (statusScore[capabilityState[item.id]?.status] || 0), 0) / capabilities.length);
    const readyCount = capabilities.filter(item => capabilityState[item.id]?.status === "active").length;
    const nextCapability = capabilities.find(item => capabilityState[item.id]?.status === "inactive") || capabilities.find(item => capabilityState[item.id]?.status !== "active") || capabilities[capabilities.length - 1];
    const requests = Array.isArray(valueAdded.requests) ? valueAdded.requests : [];
    return { valueAdded, capabilityState, capabilities, readiness, readyCount, nextCapability, requests };
  }

  renderUserV2Mine() {
    const account = this.activeAccount();
    const { readyCount, requests } = this.getValueServiceContext();
    return `<div class="v2-mine-page">
      <section class="v2-profile-card"><div class="v2-profile-avatar">${escapeHtml(Array.from(account?.name || this.state.settings.brandName || "店")[0])}</div><div><span>当前酒店账号</span><h1>${escapeHtml(account?.name || this.state.settings.brandName)}</h1><p>${escapeHtml(account?.handle || this.state.adapters.douyin.account || "抖音账号待绑定")} · ${escapeHtml(this.state.settings.city || "")}</p></div><button class="btn btn-primary" data-action="open-capability-binding" data-capability="douyinAccount"><i class="fa fa-link"></i> 管理抖音账号</button></section>
      <section class="v2-mine-shortcuts"><button data-action="open-value-capability-detail" data-capability="douyinAccount"><i class="fa fa-user-circle-o"></i><span><strong>账号与门店</strong><small>${readyCount}/4 项经营能力已完成</small></span><i class="fa fa-angle-right"></i></button><button data-action="navigate" data-view="materials"><i class="fa fa-picture-o"></i><span><strong>酒店素材</strong><small>${this.state.materials.filter(item => item.src).length} 张实拍图片</small></span><i class="fa fa-angle-right"></i></button><button data-action="navigate" data-view="planner"><i class="fa fa-calendar-o"></i><span><strong>内容计划</strong><small>查看未来 7 天安排</small></span><i class="fa fa-angle-right"></i></button><button data-action="open-service-request" data-service="douyin-managed" data-intent="consultation"><i class="fa fa-headphones"></i><span><strong>联系运营顾问</strong><small>${requests.length ? `${requests.length} 个需求正在跟进` : "获取经营与内容建议"}</small></span><i class="fa fa-angle-right"></i></button></section>
      <section class="v2-mine-service-head"><span>经营与增长</span><h2>需要时再使用的服务</h2><p>账号绑定、经营能力与新媒体代运营服务统一放在“我的”，不占用日常创作导航。</p></section>
      ${this.renderValueServicesMobileOverview()}
    </div>`;
  }

  renderUserAMine() {
    const account = this.activeAccount();
    const { capabilityState, capabilities, readyCount, requests } = this.getValueServiceContext();
    const statusMap = this.getValueStatusMap();
    const overview = deriveMineOverview(this.state);
    const hotelImageCount = this.state.materials.filter(item => item.src).length;
    const uploadedImageCount = this.state.materials.filter(item => item.src && item.source === "商家自有上传").length;
    const hotelFactCount = this.state.knowledge?.facts?.length || 0;
    const platformList = Object.values(this.state.publishingPlatforms || {});
    const platformConnectedCount = platformList.filter(item => item.status !== "disconnected").length;
    const recommendation = overview.serviceRecommendation;
    const recommendedService = VALUE_ADDED_SERVICE_CATALOG.find(service => service.id === recommendation?.id);
    const mobileRecommendationRow = recommendation && recommendedService
      ? `<button class="a-mobile-service-recommend-row" data-action="open-value-service-detail" data-service="${recommendedService.id}"><span class="a-mine-card-icon amber"><i class="fa fa-lightbulb-o"></i></span><span><small>当前建议 · ${escapeHtml(recommendedService.name)}</small><strong>${escapeHtml(recommendation.reason)}</strong></span><i class="fa fa-angle-right"></i></button>`
      : "";
    const actionAttributes = action => action.type === "service"
      ? `data-action="open-service-request" data-service="${action.serviceId}" data-intent="${action.intent}"`
      : `data-action="navigate" data-view="${action.view}"`;
    const notificationLabels = { all: "全部提醒", important: "仅重要提醒", none: "已关闭提醒" };
    const weeklyAutomation = this.state.weeklyAutomation || DEFAULT_STATE.weeklyAutomation;
    const weeklyStatus = weeklyAutomation.status === "active"
      ? ["自动运营中", "badge-success"]
      : weeklyAutomation.status === "paused"
        ? ["已暂停", "badge-warning"]
        : weeklyAutomation.status === "completed"
          ? ["本周已结束", "badge-neutral"]
          : ["未开启", "badge-neutral"];
    const weeklyModeLabel = { topics: "只生成7天选题", review: "自动准备，发布前确认", auto: "自动准备并按计划发布" }[weeklyAutomation.mode] || "自动准备，发布前确认";
    const weeklyActiveCount = (this.state.weekPlan || []).filter(item => !["skipped", "topic-ready", "queued"].includes(item.status)).length;
    return `<div class="a-mine-page">
      <section class="a-profile"><div class="a-avatar">${escapeHtml(Array.from(account?.name || "店")[0])}</div><div><small>当前酒店</small><h1>${escapeHtml(account?.name || this.state.settings.brandName)}</h1><p>当前正在为这家酒店准备内容 · ${escapeHtml(account?.handle || "抖音账号待绑定")} · ${escapeHtml(this.state.settings.city || "")}</p></div><button class="btn btn-secondary" data-action="open-capability-binding" data-capability="douyinAccount">管理账号</button></section>
      <section class="a-mine-overview">
        <article class="a-assistant-status ${overview.assistant.tone}"><div class="a-mine-card-head"><span class="a-mine-card-icon"><i class="fa ${overview.assistant.icon}"></i></span><div><small>我的内容助手</small><h2>${escapeHtml(overview.assistant.title)}</h2></div><span class="a-status-dot">${overview.assistant.tone === "warning" ? "需要处理" : overview.assistant.tone === "working" ? "处理中" : "正常"}</span></div><p>${escapeHtml(overview.assistant.detail)}</p><div class="a-assistant-meta"><span><i class="fa fa-check-circle"></i>酒店资料已载入</span><span><i class="fa fa-picture-o"></i>${overview.materialCount} 张实拍图片可用</span>${overview.unreadNotifications ? `<span><i class="fa fa-bell-o"></i>${overview.unreadNotifications} 条未读提醒</span>` : ""}</div><button class="btn btn-primary" ${actionAttributes(overview.assistant.action)}>${escapeHtml(overview.assistant.actionLabel)} <i class="fa fa-arrow-right"></i></button></article>
        <article class="a-assistant-settings a-weekly-settings-card"><div class="a-mine-card-head"><span class="a-mine-card-icon soft"><i class="fa fa-calendar-check-o"></i></span><div><small>可选使用</small><h2>7天自动运营</h2></div><span class="badge ${weeklyStatus[1]}">${weeklyStatus[0]}</span></div><p>${weeklyAutomation.status === "active" ? `本周已有 ${weeklyActiveCount}/7 天进入生产流程，可随时查看、暂停或调整后续任务。` : weeklyAutomation.status === "paused" ? "本周任务和已准备内容均已保留，继续后恢复运行。" : "需要时连续7天自动选题、准备图文并按你选择的方式处理发布。"}</p><div class="a-preference-list"><span><b>运行方式</b><em>${escapeHtml(weeklyModeLabel)}</em></span><span><b>默认时间</b><em>${escapeHtml(weeklyAutomation.defaultTime || "19:30")}</em></span><span><b>提醒方式</b><em>${escapeHtml(weeklyAutomation.notify === "all" ? "全部提醒" : "仅异常和确认")}</em></span></div><div class="a-mobile-preference-summary"><span>${escapeHtml(weeklyModeLabel)}</span><span>${escapeHtml(weeklyAutomation.defaultTime || "19:30")}</span><span>${weeklyAutomation.notify === "all" ? "全部提醒" : "仅异常提醒"}</span></div><div class="a-weekly-card-actions">${["active", "paused"].includes(weeklyAutomation.status) ? `<button class="btn btn-primary" data-action="open-week-automation">查看本周运行</button><button class="btn btn-secondary" data-action="navigate" data-view="weeklySettings">调整设置</button>` : `<button class="btn btn-primary" data-action="navigate" data-view="weeklySettings">设置并使用</button>`}</div></article>
      </section>
      <section class="a-mine-assets"><div class="a-section-title"><div><span>常用管理</span><h2>酒店内容资产</h2></div><small>图片和资料会直接参与选题与内容生成</small></div><div class="a-asset-shortcuts"><button data-action="navigate" data-view="hotelGallery"><span class="a-mine-card-icon soft"><i class="fa fa-picture-o"></i></span><span><strong>酒店图库</strong><small>${hotelImageCount} 张图片 · 自有上传 ${uploadedImageCount} 张</small></span><i class="fa fa-angle-right"></i></button><button data-action="navigate" data-view="hotelData"><span class="a-mine-card-icon blue"><i class="fa fa-building-o"></i></span><span><strong>酒店资料</strong><small>${hotelFactCount} 条已确认事实 · 查看完整资料</small></span><i class="fa fa-angle-right"></i></button></div><button class="a-platform-shortcut" data-action="navigate" data-view="platformAccounts"><span class="a-mine-card-icon amber"><i class="fa fa-share-alt"></i></span><span><strong>发布平台</strong><small>抖音、小红书、微信视频号 · ${platformConnectedCount}/3 已连接或可演示</small></span><span class="badge ${platformConnectedCount ? "badge-success" : "badge-neutral"}">${platformConnectedCount ? "管理连接" : "去连接"}</span><i class="fa fa-angle-right"></i></button></section>
      ${overview.latestRequest ? `<section class="a-service-progress"><span class="a-mine-card-icon amber"><i class="fa fa-headphones"></i></span><div><small>我的服务进度</small><strong>${escapeHtml(VALUE_ADDED_SERVICE_CATALOG.find(item => item.id === overview.latestRequest.serviceId)?.name || "服务需求")}</strong><p>${escapeHtml(overview.latestRequest.requestNo)} · ${escapeHtml(overview.latestRequest.plan)} · 等待顾问联系</p></div><button class="btn btn-secondary" data-action="view-service-request" data-request="${overview.latestRequest.id}">查看服务进度</button></section>` : ""}
      <section class="a-mine-group"><div class="a-section-title"><div><span>经营基础能力</span><h2>${readyCount}/4 项已完成</h2></div><small>完善连接，让内容承接地点、商品与订单</small><em class="a-mobile-swipe-hint"><i class="fa fa-arrows-h"></i> 左右滑动查看 4 项</em></div><div class="a-mine-grid">${capabilities.map(item => { const state = capabilityState[item.id] || { status: "inactive" }; const [label, klass] = statusMap[state.status] || statusMap.inactive; const [primary, secondary] = this.getCapabilityActionLabels(item.id); return `<article><button class="a-card-link" data-action="open-value-capability-detail" data-capability="${item.id}"><span class="value-capability-icon ${item.accent}"><i class="fa ${item.icon}"></i></span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.outcome)}</small></div><span class="badge ${klass}">${label}</span><i class="fa fa-angle-right"></i></button><div class="a-card-actions"><button class="btn btn-primary" data-action="open-capability-binding" data-capability="${item.id}">${primary}</button><button class="btn btn-secondary" data-action="open-service-request" data-service="${item.serviceId}" data-intent="consultation">${secondary}</button></div></article>`; }).join("")}</div></section>
      <section class="a-mine-group"><div class="a-section-title"><div><span>按需选择</span><h2>新媒体增长服务</h2></div><small>四项服务和咨询方式保持不变</small><em class="a-mobile-swipe-hint"><i class="fa fa-arrows-h"></i> 左右滑动查看 4 项</em></div><div class="a-mine-grid a-growth-grid">${VALUE_ADDED_SERVICE_CATALOG.map(service => { const recommended = recommendation?.id === service.id; return `<article class="${recommended ? "recommended" : ""}"><button class="a-card-link" data-action="open-value-service-detail" data-service="${service.id}"><span class="value-service-icon ${service.accent}"><i class="fa ${service.icon}"></i></span><div><strong>${escapeHtml(service.name)}${recommended ? '<em class="a-recommend-mark">当前建议</em>' : ""}</strong><small>${escapeHtml(service.objective)}</small></div><i class="fa fa-angle-right"></i></button>${recommended ? `<p class="a-service-recommend-reason"><i class="fa fa-lightbulb-o"></i>${escapeHtml(recommendation.reason)}</p>` : ""}<div class="a-card-actions"><button class="btn btn-primary" data-action="open-value-service-detail" data-service="${service.id}">了解服务详情</button><button class="btn btn-secondary" data-action="open-service-request" data-service="${service.id}" data-intent="consultation">获取服务建议</button></div></article>`; }).join("")}</div>${mobileRecommendationRow}</section>
      <section class="a-help-feedback"><button data-action="open-mine-help"><span class="a-mine-card-icon blue"><i class="fa ${overview.help.icon}"></i></span><span><small>根据当前状态推荐</small><strong>${escapeHtml(overview.help.title)}</strong><em>${escapeHtml(overview.help.detail)}</em></span><i class="fa fa-angle-right"></i></button><button data-action="open-mine-feedback"><span class="a-mine-card-icon soft"><i class="fa fa-commenting-o"></i></span><span><small>帮助我们持续改进</small><strong>意见反馈</strong><em>内容、图片、功能或服务问题都可以告诉我们</em></span><i class="fa fa-angle-right"></i></button></section>
    </div>`;
  }

  renderValueServices() {
    if (this.usesUserAExperience) return this.renderUserAMine();
    if (this.userEditionV2) return this.renderUserV2Mine();
    if (this.userEdition || this.isMobileServiceExperience()) return this.renderValueServicesMobileOverview();
    const { capabilityState, capabilities, readiness, readyCount, nextCapability, requests } = this.getValueServiceContext();
    const statusMap = this.getValueStatusMap();
    const serviceName = id => VALUE_ADDED_SERVICE_CATALOG.find(item => item.id === id)?.name || id;
    return `
      <section class="card value-service-hero"><div><span class="badge badge-success"><i class="fa fa-building-o"></i> 酒店经营服务中心</span><h1>先补齐经营承接，再放大新媒体增长</h1><p>把账号、门店、商品和订单数据连成一条经营链路；基础能力清晰后，再按目标选择代运营、达人直播、到店拍摄或本地生活增长服务。</p><div class="value-hero-points"><span><i class="fa fa-check-circle"></i> 基础能力与当前酒店绑定</span><span><i class="fa fa-check-circle"></i> 增长服务独立可选</span><span><i class="fa fa-check-circle"></i> 服务需求全程可追踪</span></div></div><button class="btn" data-action="open-service-request" data-service="douyin-managed" data-intent="diagnosis"><i class="fa fa-stethoscope"></i> 预约经营诊断</button></section>

      <section id="business-foundation" class="card card-pad section-space value-foundation"><div class="card-title value-foundation-title"><div><span class="value-section-kicker">经营承接基础</span><h2>从内容曝光走到预订核销</h2><div class="muted tiny" style="margin-top:5px">不是简单“开通平台功能”，而是检查酒店能否承接新媒体带来的客流。</div></div><span class="badge badge-info">${escapeHtml(this.activeAccount()?.name || this.state.settings.shortName)}</span></div>
        <div class="value-readiness"><div class="value-readiness-score" style="--score:${readiness * 3.6}deg"><div><strong>${readiness}</strong><span>基础就绪度</span></div></div><div class="value-readiness-main"><strong>${readyCount}/4 项已就绪</strong><p>${readyCount === capabilities.length ? "经营基础能力已全部就绪，可按增长目标选择内容投放或达人服务。" : `当前建议优先完善「${escapeHtml(nextCapability.title)}」，再增加内容投放或达人预算。`}</p><div class="value-journey">${capabilities.map(item => { const state = capabilityState[item.id] || { status: "inactive" }; return `<span class="${state.status}"><i class="fa ${state.status === "active" ? "fa-check" : state.status === "inactive" ? "fa-circle-o" : "fa-clock-o"}"></i>${escapeHtml(item.stage)} ${escapeHtml(item.title.replace(/与.*/, ""))}</span>`; }).join('<i class="fa fa-angle-right"></i>')}</div></div></div>
        <div class="value-capability-grid">${capabilities.map(item => {
          const state = capabilityState[item.id] || { status: "inactive" };
          const [statusLabel, statusClass] = statusMap[state.status] || statusMap.inactive;
          const progress = Math.max(0, Math.min(100, Number(state.progress || 0)));
          const [primaryLabel, secondaryLabel] = this.getCapabilityActionLabels(item.id);
          return `<article class="value-capability-card ${state.status}"><div class="value-capability-stage">${escapeHtml(item.stage)}</div><div class="value-capability-head"><span class="value-capability-icon ${item.accent}"><i class="fa ${item.icon}"></i></span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.subtitle)}</p></div><span class="badge ${statusClass}">${statusLabel}</span></div><div class="value-capability-outcome"><i class="fa fa-bullseye"></i><span>${escapeHtml(item.outcome)}</span></div><div class="value-capability-checks">${item.checks.map((check, index) => `<span class="${state.status === "active" || (state.status === "reviewing" && index === 0) ? "done" : ""}"><i class="fa ${state.status === "active" || (state.status === "reviewing" && index === 0) ? "fa-check-circle" : "fa-circle-o"}"></i>${escapeHtml(check)}</span>`).join("")}</div><div class="value-capability-detail">${escapeHtml(item.detail)}</div>${state.status === "reviewing" ? `<div class="value-review-progress"><div class="progress"><span style="width:${progress}%"></span></div><div><span>资料配置进度</span><strong>${progress}%</strong></div></div>` : ""}<div class="value-capability-actions"><button class="btn btn-primary btn-sm" data-action="open-capability-binding" data-capability="${item.id}">${primaryLabel}</button><button class="btn btn-secondary btn-sm" data-action="open-service-request" data-service="${item.serviceId}" data-intent="consultation">${secondaryLabel}</button></div></article>`;
        }).join("")}</div>
      </section>

      <section class="section-space value-growth-section"><div class="value-section-heading"><div><span class="value-section-kicker">可选的人力增长服务</span><h2>新媒体增长服务</h2><p>基础能力不要求购买服务；需要团队代执行时，再按经营目标选择。</p></div><span>${VALUE_ADDED_SERVICE_CATALOG.length} 项服务</span></div><div class="value-service-grid">${VALUE_ADDED_SERVICE_CATALOG.map(service => {
        const latest = requests.find(item => item.serviceId === service.id);
        return `<article class="card value-service-card"><div class="value-service-card-head"><span class="value-service-icon ${service.accent}"><i class="fa ${service.icon}"></i></span><div><h3>${escapeHtml(service.name)}</h3><p>${escapeHtml(service.summary)}</p></div>${latest ? '<span class="badge badge-info">已提交</span>' : ""}</div><div class="value-service-objective"><span>经营目标</span><strong>${escapeHtml(service.objective)}</strong><small><i class="fa fa-user-o"></i> ${escapeHtml(service.fit)}</small></div><div class="value-deliverables">${service.deliverables.map(item => `<span><i class="fa fa-check-circle"></i>${escapeHtml(item)}</span>`).join("")}</div><div class="value-service-meta"><span><i class="fa fa-calendar-o"></i>${escapeHtml(service.cycle)}</span><strong>${escapeHtml(service.quote)}</strong></div><div class="value-service-actions"><button class="btn btn-primary" data-action="open-value-service-detail" data-service="${service.id}">了解服务详情</button><button class="btn btn-secondary" data-action="open-service-request" data-service="${service.id}" data-intent="consultation">获取服务建议</button></div></article>`;
      }).join("")}</div></section>

      ${requests.length ? `<section class="card card-pad section-space"><div class="card-title"><div><h2>服务需求进度</h2><div class="muted tiny" style="margin-top:4px">当前测试账号共 ${requests.length} 个服务工单</div></div><span class="badge badge-success">已记录</span></div><div class="value-request-list">${requests.map(item => `<button class="value-request-row" data-action="view-service-request" data-request="${item.id}"><span class="value-request-no">${escapeHtml(item.requestNo)}</span><span><strong>${escapeHtml(serviceName(item.serviceId))}</strong><small>${escapeHtml(item.plan)} · ${escapeHtml(item.submittedAt)}</small></span><span class="badge badge-info">顾问待联系</span><i class="fa fa-angle-right"></i></button>`).join("")}</div></section>` : ""}`;
  }

  renderValueServicesMobileOverview() {
    const { capabilityState, capabilities, readiness, readyCount, nextCapability, requests } = this.getValueServiceContext();
    const statusMap = this.getValueStatusMap();
    const requestedServices = new Set(requests.map(item => item.serviceId)).size;
    const latestRequest = requests[0];
    return `<div class="mobile-value-level mobile-value-overview">
      <section class="mobile-value-hero"><span class="badge badge-success"><i class="fa fa-building-o"></i> 当前酒店服务中心</span><h1>经营承接与增长服务</h1><p>先检查账号到订单的经营链路，再按目标选择团队代执行服务。</p><button class="btn btn-secondary btn-sm" data-action="open-service-request" data-service="douyin-managed" data-intent="diagnosis"><i class="fa fa-stethoscope"></i> 预约经营诊断</button></section>
      <section class="mobile-value-overview-section"><div class="mobile-value-overview-heading"><div><span class="value-section-kicker">经营承接基础</span><h2>经营基础能力</h2><p>${readyCount === capabilities.length ? `${readyCount}/4 项已就绪 · 基础能力已全部就绪` : `${readyCount}/4 项已就绪 · 就绪度 ${readiness} · 下一项：${escapeHtml(nextCapability.title)}`}</p></div><span class="mobile-value-score">${readiness}</span></div><div class="mobile-value-overview-grid">${capabilities.map(item => {
        const state = capabilityState[item.id] || { status: "inactive" };
        const [statusLabel, statusClass] = statusMap[state.status] || statusMap.inactive;
        const [primaryLabel, secondaryLabel] = this.getCapabilityActionLabels(item.id);
        return `<article class="mobile-value-overview-card" data-action="open-value-capability-detail" data-capability="${item.id}"><div class="mobile-value-overview-card-head"><span class="value-capability-icon ${item.accent}"><i class="fa ${item.icon}"></i></span><span class="badge ${statusClass}">${statusLabel}</span></div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.outcome)}</small><div class="mobile-value-overview-actions"><button class="btn btn-primary" data-action="open-capability-binding" data-capability="${item.id}">${primaryLabel}</button><button class="btn btn-secondary" data-action="open-service-request" data-service="${item.serviceId}" data-intent="consultation">${secondaryLabel}</button></div></article>`;
      }).join("")}</div></section>
      <section class="mobile-value-overview-section growth"><div class="mobile-value-overview-heading"><div><span class="value-section-kicker">团队代执行</span><h2>新媒体增长服务</h2><p>${VALUE_ADDED_SERVICE_CATALOG.length} 项可选 · ${requestedServices} 项已申请</p></div><span class="mobile-value-count">4 项</span></div><div class="mobile-value-overview-grid">${VALUE_ADDED_SERVICE_CATALOG.map(service => {
        const latest = requests.find(item => item.serviceId === service.id);
        return `<article class="mobile-value-overview-card" data-action="open-value-service-detail" data-service="${service.id}"><div class="mobile-value-overview-card-head"><span class="value-service-icon ${service.accent}"><i class="fa ${service.icon}"></i></span>${latest ? '<span class="badge badge-info">已申请</span>' : '<span class="badge badge-neutral">可申请</span>'}</div><strong>${escapeHtml(service.name)}</strong><small>${escapeHtml(service.objective)}</small><div class="mobile-value-overview-actions"><button class="btn btn-primary" data-action="open-value-service-detail" data-service="${service.id}">了解服务详情</button><button class="btn btn-secondary" data-action="open-service-request" data-service="${service.id}" data-intent="consultation">获取服务建议</button></div></article>`;
      }).join("")}</div></section>
      ${latestRequest ? `<button class="mobile-value-latest" data-action="view-service-request" data-request="${latestRequest.id}"><i class="fa fa-file-text-o"></i><span><strong>最近服务需求</strong><small>${escapeHtml(latestRequest.requestNo)} · ${escapeHtml(latestRequest.plan)}</small></span><span class="badge badge-info">待联系</span><i class="fa fa-angle-right"></i></button>` : ""}
    </div>`;
  }

  renderValueBack(view, label) {
    return `<button class="mobile-value-back" data-action="navigate" data-view="${view}"><i class="fa fa-angle-left"></i>${escapeHtml(label)}</button>`;
  }

  renderValueCapabilityDetail() {
    const { capabilityState, capabilities } = this.getValueServiceContext();
    const item = capabilities.find(capability => capability.id === this.state.ui.valueCapabilityId) || capabilities[0];
    const state = capabilityState[item.id] || { status: "inactive" };
    const [statusLabel, statusClass] = (this.getValueStatusMap()[state.status] || this.getValueStatusMap().inactive);
    const progress = Math.max(0, Math.min(100, Number(state.progress || 0)));
    const readyChecks = state.status === "active" ? item.checks.length : state.status === "reviewing" ? 1 : 0;
    const [primaryLabel, secondaryLabel] = this.getCapabilityActionLabels(item.id);
    return `<div class="mobile-value-level mobile-value-detail-page">${this.renderValueBack("valueServices", "增值服务概览")}<section class="card mobile-value-detail-card"><div class="mobile-value-detail-head"><span class="value-capability-icon ${item.accent}"><i class="fa ${item.icon}"></i></span><div><small>${escapeHtml(item.stage)} · 经营基础能力</small><h1>${escapeHtml(item.title)}</h1></div><span class="badge ${statusClass}">${statusLabel}</span></div><p class="mobile-value-detail-subtitle">${escapeHtml(item.subtitle)}</p><div class="mobile-value-outcome"><span>完成后的结果</span><strong>${escapeHtml(item.outcome)}</strong></div><div class="mobile-value-check-list">${item.checks.map((check, index) => `<div class="${index < readyChecks ? "done" : ""}"><i class="fa ${index < readyChecks ? "fa-check-circle" : "fa-circle-o"}"></i><span>${escapeHtml(check)}</span><small>${index < readyChecks ? "已完成" : "待确认"}</small></div>`).join("")}</div>${state.status === "reviewing" ? `<div class="mobile-value-progress"><div><span>当前配置进度</span><strong>${progress}%</strong></div><div class="progress"><span style="width:${progress}%"></span></div></div>` : ""}<div class="mobile-value-current"><span>当前情况</span><p>${escapeHtml(item.detail)}</p></div><div class="mobile-value-detail-actions"><button class="btn btn-primary" data-action="open-capability-binding" data-capability="${item.id}">${primaryLabel}</button><button class="btn btn-secondary" data-action="open-service-request" data-service="${item.serviceId}" data-intent="consultation">${secondaryLabel}</button></div></section></div>`;
  }

  renderValueServiceDetail() {
    const requests = this.getValueServiceContext().requests;
    const service = VALUE_ADDED_SERVICE_CATALOG.find(item => item.id === this.state.ui.valueServiceId) || VALUE_ADDED_SERVICE_CATALOG[0];
    const latest = requests.find(item => item.serviceId === service.id);
    return `<div class="mobile-value-level mobile-value-detail-page">${this.renderValueBack("valueServices", "增值服务概览")}<section class="card mobile-value-detail-card service-detail"><div class="mobile-value-detail-head"><span class="value-service-icon ${service.accent}"><i class="fa ${service.icon}"></i></span><div><small>${escapeHtml(service.cycle)} · ${escapeHtml(service.quote)}</small><h1>${escapeHtml(service.name)}</h1></div>${latest ? '<span class="badge badge-info">已申请</span>' : ""}</div><p class="mobile-value-detail-subtitle">${escapeHtml(service.summary)}</p><div class="mobile-value-outcome"><span>经营目标</span><strong>${escapeHtml(service.objective)}</strong><small><i class="fa fa-user-o"></i> ${escapeHtml(service.fit)}</small></div><div class="mobile-value-detail-section"><h2>交付内容</h2><div class="mobile-value-deliverables">${service.deliverables.map(item => `<span><i class="fa fa-check-circle"></i>${escapeHtml(item)}</span>`).join("")}</div></div><div class="mobile-value-detail-section"><h2>可选方案</h2><div class="mobile-value-plan-list">${service.plans.map((plan, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(plan)}</strong></div>`).join("")}</div></div>${latest ? `<button class="mobile-value-request-status" data-action="view-service-request" data-request="${latest.id}"><i class="fa fa-file-text-o"></i><span><strong>${escapeHtml(latest.requestNo)}</strong><small>${escapeHtml(latest.plan)} · 顾问待联系</small></span><i class="fa fa-angle-right"></i></button>` : ""}<div class="mobile-value-detail-actions">${latest ? `<button class="btn btn-primary" data-action="view-service-request" data-request="${latest.id}">查看方案进度</button>` : `<button class="btn btn-primary" data-action="open-service-request" data-service="${service.id}" data-intent="request">获取专属方案</button>`}<button class="btn btn-secondary" data-action="open-service-request" data-service="${service.id}" data-intent="consultation">先问问顾问</button></div></section></div>`;
  }

  renderKnowledge() {
    const k = this.state.knowledge;
    return `
      <section class="grid-3"><div class="card metric"><div class="metric-label">知识库完整度</div><div class="metric-value">${k.completeness}%</div><div class="progress"><span style="width:${k.completeness}%"></span></div></div><div class="card metric"><div class="metric-label">已确认事实</div><div class="metric-value">${k.facts.length}</div><div class="metric-trend">生成时仅引用这些事实</div></div><div class="card metric"><div class="metric-label">数据来源</div><div class="metric-value" style="font-size:18px">OTA + 人工</div><div class="metric-trend">在线抓取结果快照</div></div></section>
      <div class="alert alert-warning section-space"><i class="fa fa-exclamation-triangle"></i><div>价格、房态、优惠、套餐等易变信息不会默认生成；若手动加入内容，系统会要求再次确认。</div></div>
      <section class="card card-pad section-space"><div class="card-title"><h2>事实清单</h2><span class="badge ${k.confirmed ? "badge-success" : "badge-warning"}"><i class="fa ${k.confirmed ? "fa-check" : "fa-clock-o"}"></i> ${k.confirmed ? "商家已确认" : "待商家确认"}</span></div>${k.facts.map(fact => `<div class="fact-row"><strong>${escapeHtml(fact.label)}</strong><span>${escapeHtml(fact.value)}</span><span class="badge badge-neutral">${escapeHtml(fact.source)}</span></div>`).join("")}</section>
      <form class="card card-pad section-space" data-form="add-fact"><div class="card-title"><h2>补充一句话事实</h2></div><div class="input-row"><input class="form-control" name="label" placeholder="例如：近期活动" required><input class="form-control" name="value" placeholder="仅填写可核实的信息" required></div><button class="btn btn-primary btn-sm" style="margin-top:12px" type="submit"><i class="fa fa-plus"></i> 加入知识库</button></form>`;
  }

  renderAiRules() {
    const rules = this.aiRules;
    if (!rules) return `<div class="card empty"><i class="fa fa-spinner fa-spin"></i>正在从后端读取生效规则…</div>`;
    return `
      <section class="card hero"><div><span class="badge" style="color:#0b5e58;background:#9ce5d4">规则版本 ${escapeHtml(rules.version)}</span><h1>分阶段 Skills + 酒店业务 RAG</h1><p>选题、内容、发布和复盘是四个隔离任务。每次模型调用只加载当前阶段的短运行提示词，并只挂载本轮检索命中的事实、图片和历史内容。</p></div><a class="btn" href="./AI_RULES.md" target="_blank" rel="noopener">打开体系文档 <i class="fa fa-external-link"></i></a></section>
      <section class="card card-pad section-space"><div class="card-title"><div><h2>Skills 执行矩阵</h2><div class="muted tiny" style="margin-top:4px">完整 SKILL.md 用于治理和审阅；模型运行时只装载对应 runtime-prompt.md</div></div><span class="badge badge-success">${rules.skills?.length || 0} 个可执行技能</span></div><div class="skill-grid">${(rules.skills || []).map((skill, index) => `<details class="skill-card" ${index === 0 ? "open" : ""}><summary><span class="skill-index">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(skill.id)} · ${escapeHtml(skill.stage)}</small></span><i class="fa fa-angle-down"></i></summary><div class="skill-card-body"><p>${escapeHtml(skill.purpose)}</p><div class="skill-meta"><span>触发：${skill.triggers.map(escapeHtml).join("、")}</span><span>阶段：${skill.modes.map(escapeHtml).join(" / ")}</span><span>运行提示词：${escapeHtml(skill.runtimeSource)}</span></div><h4>模型实际加载的短提示词</h4><pre class="skill-instruction">${escapeHtml(skill.runtimePrompt)}</pre><h4>完整技能治理说明</h4><pre class="skill-instruction">${escapeHtml(skill.instructions)}</pre><h4>详细参考资料</h4><pre class="skill-reference">${escapeHtml(skill.referenceText)}</pre></div></details>`).join("")}</div></section>
      <section class="card card-pad section-space"><div class="card-title"><h2>任务模式与装载计划</h2><span class="badge badge-info">运行时路由</span></div><div class="mode-grid">${(rules.promptVariants || []).map(item => `<div class="mode-card"><strong>${escapeHtml(item.mode)}</strong><span>${escapeHtml(item.description)}</span><div>${item.skills.map(skill => `<code>${escapeHtml(skill)}</code>`).join(" → ")}</div></div>`).join("")}</div></section>
      <section class="card card-pad section-space"><div class="card-title"><div><h2>RAG 挂载策略</h2><div class="muted tiny" style="margin-top:4px">检索发生在调用模型之前，未命中的资料不会进入提示词</div></div><span class="badge badge-info">${escapeHtml(rules.ragPolicy?.engine || "阶段检索")}</span></div><div class="mode-grid">${Object.entries(rules.ragPolicy || {}).filter(([key]) => key !== "engine").map(([key, value]) => `<div class="mode-card"><strong>${escapeHtml(key)}</strong><span>${escapeHtml(value)}</span></div>`).join("")}</div></section>
      <section class="grid-2 section-space"><div class="card card-pad"><div class="card-title"><h2>选题推荐规则</h2><span class="badge badge-info">模型前置</span></div><ol class="rule-list">${rules.selectionRules.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol></div><div class="card card-pad"><div class="card-title"><h2>内容生成与校验规则</h2><span class="badge badge-warning">双重校验</span></div><ol class="rule-list">${rules.contentRules.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol></div></section>
      <section class="card card-pad section-space"><div class="card-title"><div><h2>各阶段实际系统提示词</h2><div class="muted tiny" style="margin-top:4px">以下就是后端当前发给模型的系统提示词；用户上下文会另行挂载本阶段 RAG 结果</div></div><span class="badge badge-success">服务端实时读取</span></div><div class="skill-grid">${(rules.stagePrompts || []).map((item, index) => `<details class="skill-card" ${index === 0 ? "open" : ""}><summary><span class="skill-index">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(item.stage)}</strong><small>${escapeHtml(item.description)} · ${fmt(item.prompt.length)} 字符</small></span><i class="fa fa-angle-down"></i></summary><div class="skill-card-body"><div class="skill-meta"><span>装载：${item.skills.map(escapeHtml).join(" → ")}</span></div><pre class="prompt-view">${escapeHtml(item.prompt)}</pre></div></details>`).join("")}</div></section>
      <section class="card card-pad section-space"><div class="card-title"><h2>模型工作流</h2></div><div class="pipeline">${rules.workflow.map((item, index) => `${index ? '<i class="fa fa-angle-right pipeline-arrow"></i>' : ""}<div class="pipeline-step ${index < 5 ? "done" : ""}"><div class="tiny">${escapeHtml(item)}</div></div>`).join("")}</div></section>
      <section class="card card-pad section-space"><div class="card-title"><h2>Skills 与业务资料来源</h2><span class="muted tiny">运行时技能与设计依据分开展示</span></div><div class="topic-list">${rules.skillSources.map((item, index) => `<div class="topic-row"><div class="topic-number">S${index + 1}</div><div><h3>${escapeHtml(item.name)}</h3><div class="muted tiny">${escapeHtml(item.purpose)}</div><div class="tiny" style="margin-top:5px;color:var(--brand)">${escapeHtml(item.source)}</div></div><span class="badge ${item.kind === "运行时 Skill" ? "badge-success" : "badge-neutral"}">${escapeHtml(item.kind || "资料来源")}</span></div>`).join("")}</div></section>`;
  }

  renderSettings() {
    const s = this.state.settings;
    const ai = this.state.adapters.ai;
    const selectedHotel = this.state.otaSnapshot?.selectedHotelId || "514254";
    return `<form class="card card-pad" data-form="ai-config" style="margin-bottom:18px"><div class="card-title"><div><h2>通义千问模型连接</h2><div class="muted tiny" style="margin-top:4px">Key 仅发送到本机后端并保存在进程内存，不写入浏览器或源码</div></div>${adapterBadge(ai.status)}</div>
      <div class="input-row"><div class="form-group"><label class="form-label">接口地址</label><input class="form-control" name="baseUrl" type="url" value="${escapeHtml(ai.baseUrl || "")}" required></div><div class="form-group"><label class="form-label">模型名称</label><input class="form-control" name="model" value="${escapeHtml(ai.model || "qwen3.7-max-2026-06-08")}" placeholder="qwen3.7-max-2026-06-08" required></div></div>
      <div class="input-row"><div class="form-group"><label class="form-label">业务/项目 ID</label><input class="form-control" name="projectId" value="${escapeHtml(ai.projectId || "")}"></div><div class="form-group"><label class="form-label">API Key ${ai.configured ? "（留空则保持当前连接）" : ""}</label><input class="form-control" name="apiKey" type="password" autocomplete="new-password" placeholder="粘贴百炼 API Key" ${ai.configured ? "" : "required"}></div></div>
      <div class="topic-actions" style="margin-top:0"><button class="btn btn-primary" type="submit"><i class="fa fa-plug"></i> 保存到后端内存</button><button class="btn btn-secondary" type="button" data-action="test-ai" ${ai.configured ? "" : "disabled"}><i class="fa fa-check-circle-o"></i> 测试连接</button>${ai.configured ? `<button class="btn btn-danger" type="button" data-action="clear-ai"><i class="fa fa-unlink"></i> 断开模型</button>` : ""}</div>
      <div class="alert ${ai.configured ? "alert-success" : "alert-warning"}" style="margin-top:14px"><i class="fa ${ai.configured ? "fa-check-circle" : "fa-exclamation-triangle"}"></i><div>${ai.configured ? `已连接 ${escapeHtml(ai.provider)}，当前模型 ${escapeHtml(ai.model)}，凭证来源：${ai.credentialSource === "environment" ? "环境变量" : "后端内存"}。` : "尚未连接模型。当前页面中的内容只属于规则兜底，不能用于评估模型推荐质量。"}</div></div>
    </form>
      <form class="card card-pad" data-form="ota-hotel" style="margin-bottom:18px"><div class="card-title"><div><h2>OTA 在线抓取结果</h2><div class="muted tiny" style="margin-top:4px">来源：${escapeHtml(OTA_SNAPSHOT.meta.sourceFolder)} · ${OTA_SNAPSHOT.meta.hotelCount} 家酒店 · ${fmt(OTA_SNAPSHOT.meta.imageCount)} 张图片 · ${fmt(OTA_SNAPSHOT.meta.poiCount)} 条 POI</div></div>${adapterBadge("connected")}</div><div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px"><select class="form-control" name="hotelId">${OTA_SNAPSHOT.hotels.map(hotel => `<option value="${hotel.id}" ${hotel.id === selectedHotel ? "selected" : ""}>${escapeHtml(hotel.name)} · ${escapeHtml(hotel.tier || "未定级")}</option>`).join("")}</select><button class="btn btn-primary" type="submit"><i class="fa fa-refresh"></i> 从抓取结果载入</button></div></form>
      <div class="grid-2"><form class="card card-pad" data-form="settings"><div class="card-title"><h2>品牌与运营配置</h2></div>
      <div class="form-group"><label class="form-label">品牌全称</label><input class="form-control" name="brandName" value="${escapeHtml(s.brandName)}" required></div>
      <div class="input-row"><div class="form-group"><label class="form-label">内容短称</label><input class="form-control" name="shortName" value="${escapeHtml(s.shortName)}"></div><div class="form-group"><label class="form-label">所在城市</label><input class="form-control" name="city" value="${escapeHtml(s.city)}"></div></div>
      <div class="input-row"><div class="form-group"><label class="form-label">酒店类型</label><select class="form-control" name="hotelType">${HOTEL_TYPES.map(type => `<option ${type === s.hotelType ? "selected" : ""}>${type}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">默认排期时间</label><input class="form-control" type="time" name="defaultTime" value="${s.defaultTime}"></div></div>
      <div class="form-group"><label class="form-label">品牌语气</label><input class="form-control" name="voice" value="${escapeHtml(s.voice)}"></div>
      <div class="form-group"><label class="form-label">禁止表达</label><textarea class="form-control" rows="3" name="forbidden">${escapeHtml(s.forbidden)}</textarea></div>
      <button class="btn btn-primary" type="submit"><i class="fa fa-save"></i> 保存设置</button></form>
      <section class="card card-pad"><div class="card-title"><h2>服务适配器</h2><span class="badge badge-info">分层适配</span></div>
        ${this.adapterRow("AI 内容生成", "fa-magic", this.state.adapters.ai.provider, this.state.adapters.ai.status)}<div style="height:9px"></div>
        ${this.adapterRow("OTA 信息抓取", "fa-database", `${this.state.adapters.ota.provider} · 已成功`, this.state.adapters.ota.status)}<div style="height:9px"></div>
        ${this.adapterRow("抖音开放平台", "fa-music", this.state.adapters.douyin.account, this.state.adapters.douyin.status)}<div style="height:9px"></div>
        ${this.adapterRow("抖音来客", "fa-shopping-bag", "门店与商品挂载", this.state.adapters.lifeService.status)}
        <div class="alert alert-info" style="margin-top:14px"><i class="fa fa-code"></i><div>AI 已通过本地后端安全接入；抖音发布仍需官方 App ID、授权回调地址和发布权限。</div></div>
      </section></div>
      <section class="card card-pad section-space"><div class="card-title"><h2>数据管理</h2><span class="muted tiny">数据保存在当前浏览器 localStorage</span></div><div class="topic-actions" style="margin-top:0"><button class="btn btn-secondary" data-action="export"><i class="fa fa-download"></i> 导出 JSON 备份</button><input id="import-file" type="file" accept="application/json" hidden><button class="btn btn-secondary" data-action="import"><i class="fa fa-upload"></i> 导入备份</button><button class="btn btn-danger" data-action="reset"><i class="fa fa-trash-o"></i> 恢复示例数据</button></div></section>`;
  }

  renderNotifications() {
    return `<div class="drawer-backdrop" data-action="close-notifications"><aside class="notification-drawer" data-drawer><div class="drawer-head"><div><strong>通知中心</strong><div class="muted tiny" style="margin-top:3px">异常、峰值和发布状态</div></div><button class="icon-btn" data-action="close-notifications"><i class="fa fa-times"></i></button></div><button class="btn btn-secondary btn-sm" data-action="mark-read" style="margin-bottom:10px">全部标为已读</button>${this.state.notifications.map(item => `<div class="notice" style="${item.read ? "opacity:.65" : ""}"><div class="notice-icon"><i class="fa ${item.type === "peak" ? "fa-bolt" : item.type === "warning" ? "fa-exclamation-triangle" : "fa-check"}"></i></div><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p><div class="muted tiny" style="margin-top:5px">${escapeHtml(item.createdAt)}</div></div></div>`).join("")}</aside></div>`;
  }

  openMineHelp() {
    const overview = deriveMineOverview(this.state);
    this.modal = `<div class="modal-backdrop"><div class="modal a-mine-modal"><div class="a-mine-modal-head"><span class="a-mine-card-icon blue"><i class="fa ${overview.help.icon}"></i></span><div><small>根据当前状态推荐</small><h2>${escapeHtml(overview.help.title)}</h2></div></div><p class="a-help-lead">${escapeHtml(overview.help.detail)}</p><div class="a-help-steps"><span><i class="fa fa-lightbulb-o"></i><b>首页</b>查看今天最适合发布的选题</span><span><i class="fa fa-magic"></i><b>创作</b>确认文案、5张图片和酒店地点</span><span><i class="fa fa-send-o"></i><b>内容</b>查看待处理、已发布和内容效果</span><span><i class="fa fa-comments-o"></i><b>互动</b>处理评论和私信咨询</span></div><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">知道了</button><button class="btn btn-primary" data-action="open-service-request" data-service="douyin-managed" data-intent="consultation">还是需要顾问帮助</button></div></div></div>`;
    this.render();
  }

  openMineFeedback() {
    const latestTitle = this.state.draft?.title || this.state.activeTopic?.title || "暂无当前内容";
    this.modal = `<div class="modal-backdrop"><form class="modal a-mine-modal" data-form="mine-feedback"><div class="a-mine-modal-head"><span class="a-mine-card-icon soft"><i class="fa fa-commenting-o"></i></span><div><small>意见反馈</small><h2>告诉我们哪里还不够好</h2></div></div><div class="form-group"><label class="form-label">反馈类型</label><select class="form-control" name="type"><option value="content">生成内容不满意</option><option value="image">图片选择不合适</option><option value="product">功能不好使用</option><option value="service">服务或顾问问题</option></select></div><div class="form-group"><label class="form-label">具体问题</label><textarea class="form-control" rows="5" name="detail" required maxlength="500" placeholder="例如：生成的正文语气太像广告，希望更像店主真实分享。"></textarea></div><div class="a-feedback-context"><i class="fa fa-link"></i><span>将关联当前酒店和最近内容</span><strong>${escapeHtml(latestTitle)}</strong></div><div class="modal-actions"><button class="btn btn-secondary" type="button" data-action="close-modal">暂不反馈</button><button class="btn btn-primary" type="submit">提交反馈</button></div></form></div>`;
    this.render();
  }

  showModal(title, body, confirmAction, confirmLabel = "确认") {
    this.modal = `<div class="modal-backdrop"><div class="modal"><h2>${title}</h2><div class="muted" style="font-size:12px;line-height:1.7">${body}</div><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">取消</button><button class="btn btn-danger" data-action="${confirmAction}">${confirmLabel}</button></div></div></div>`;
    this.render();
  }

  renderHomeGenerateLoadingModal(topic) {
    return `<div class="modal-backdrop a-home-generate-backdrop"><div class="modal a-home-generate-modal" role="status" aria-live="polite"><div class="a-home-generate-icon"><span></span><i class="fa fa-magic"></i></div><span class="a-kicker">正在为当前酒店生成</span><h2>${escapeHtml(topic?.title || "今日酒店内容")}</h2><p>页面会在内容准备完成后自动进入编辑，不需要重复点击。</p><div class="a-home-generate-steps"><span class="done"><i class="fa fa-check"></i><strong>已确认选题</strong><small>保留当前推荐方向</small></span><span class="active"><i class="fa fa-circle-o-notch fa-spin"></i><strong>生成标题正文</strong><small>读取酒店事实与地点</small></span><span><i class="fa fa-picture-o"></i><strong>匹配 5 张图片</strong><small>1封面＋4内容图</small></span></div><div class="a-home-generate-progress"><span></span></div><small>${escapeHtml(this.aiStage || "正在准备约 120 字正文…")}</small></div></div>`;
  }

  openHomeTopicDetail(id) {
    const topic = [...(this.state.aiRecommendations || []), ...this.state.topics].find(item => item.id === id);
    if (!topic) return;
    const material = this.state.materials.find(item => item.src && item.category === (topic.materialCategory || topic.material)) || this.state.materials.find(item => item.src);
    const imageSrc = material?.src ? (material.src.startsWith("data:") ? material.src : encodeURI(material.src)) : "";
    const facts = (this.state.knowledge?.facts || []).slice(0, 3);
    const topicIsAi = (this.state.aiRecommendations || []).some(item => item.id === topic.id);
    const category = topic.materialCategory || topic.material || "room";
    const categoryLabel = materialName(category);
    const materialCount = this.state.materials.filter(item => item.src && item.category === category).length;
    const displayReason = userFacingTopicText(topic.displayReason, "这个方向兼顾目标客人的关注点、酒店真实体验和现有图片条件。", 80);
    const reasons = [
      ["适合谁", userFacingTopicText(topic.targetAudience, "适合正在比较大理住宿体验的目标客人")],
      ["内容怎么讲", userFacingTopicText(topic.contentAngle || topic.objective, "从真实入住场景切入，突出酒店体验价值")],
      ["素材基础", userFacingTopicText(topic.materialReadiness, `当前素材库有 ${materialCount} 张${categoryLabel}，可以支撑这个方向的真实场景`)]
    ];
    this.modal = `<div class="modal-backdrop a-topic-detail-backdrop"><aside class="a-topic-detail-drawer" data-drawer><div class="a-topic-detail-head"><div><span>今日推荐详情</span><strong>${topicIsAi ? "AI 结合当前酒店生成" : "酒店内容库适配"}</strong></div><button class="icon-btn" data-action="close-modal" aria-label="关闭推荐详情"><i class="fa fa-times"></i></button></div>${imageSrc ? `<div class="a-topic-detail-cover"><img src="${imageSrc}" alt="${escapeHtml(material?.title || "推荐封面")}"><span>建议封面</span></div>` : ""}<div class="a-topic-detail-body"><div>${topicBadge(topic.type || "vertical")}<span class="badge badge-neutral">${escapeHtml(categoryLabel)}</span></div><h2>${escapeHtml(topic.title)}</h2><p>${escapeHtml(displayReason)}</p><section><strong>为什么推荐这个选题</strong>${reasons.map(([label, value]) => `<span><i class="fa fa-check-circle"></i><b>${escapeHtml(label)}</b>${escapeHtml(value)}</span>`).join("")}</section>${facts.length ? `<section><strong>生成时会核对的酒店事实</strong>${facts.map(item => `<span><i class="fa fa-building-o"></i>${escapeHtml(item.label || "酒店信息")}：${escapeHtml(item.value || "待确认")}</span>`).join("")}</section>` : ""}<div class="a-topic-detail-note"><i class="fa fa-shield"></i><span>生成后仍可修改标题、正文、5张图片和酒店地点。</span></div></div><div class="a-topic-detail-actions"><button class="btn btn-secondary" data-action="close-modal">暂不使用</button><button class="btn btn-primary" data-action="home-generate-topic" data-topic="${topic.id}" ${!this.state.adapters.ai.configured ? "disabled" : ""}><i class="fa fa-magic"></i>立即生成这条图文</button></div></aside></div>`;
    this.render();
  }

  renderRegenerateLoadingModal() {
    return `<div class="modal-backdrop a-regenerate-backdrop"><div class="modal a-regenerate-modal loading" role="status" aria-live="polite"><div class="a-regenerate-orbit"><span></span><i class="fa fa-magic"></i></div><span class="a-kicker">AI 正在生成新版本</span><h2>这次会明显换一种写法</h2><p>保留当前选题和酒店地点，重新生成标题、正文结构、开头钩子和图片组合。</p><div class="a-regenerate-progress"><span></span></div><div class="a-regenerate-steps"><span class="done"><i class="fa fa-check"></i> 对比上一版</span><span class="active"><i class="fa fa-circle-o-notch fa-spin"></i> 重写标题正文</span><span><i class="fa fa-picture-o"></i> 重新匹配 5 图</span></div><small>${escapeHtml(this.aiStage || "正在生成，请稍候…")}</small></div></div>`;
  }

  renderRegenerateResultModal(previous, current) {
    const beforeIds = new Set(previous?.imageIds || []);
    const changedImages = (current?.imageIds || []).filter(id => !beforeIds.has(id)).length;
    const oldBody = Array.from(previous?.body || "").slice(0, 74).join("");
    const newBody = Array.from(current?.body || "").slice(0, 74).join("");
    return `<div class="modal-backdrop a-regenerate-backdrop"><div class="modal a-regenerate-modal result"><div class="a-regenerate-success"><i class="fa fa-check"></i></div><span class="a-kicker">新版本已生成</span><h2>标题、正文和图片已经更新</h2><div class="a-version-compare"><article><span>上一版</span><strong>${escapeHtml(previous?.title || "上一版标题")}</strong><p>${escapeHtml(oldBody)}${charCount(previous?.body || "") > 74 ? "…" : ""}</p></article><i class="fa fa-long-arrow-right"></i><article class="new"><span>新版本</span><strong>${escapeHtml(current?.title || "新版本标题")}</strong><p>${escapeHtml(newBody)}${charCount(current?.body || "") > 74 ? "…" : ""}</p></article></div><div class="a-version-changes"><span><i class="fa fa-pencil"></i> 标题已重写</span><span><i class="fa fa-file-text-o"></i> 正文 ${charCount(current?.body || "")} 字</span><span><i class="fa fa-picture-o"></i> 更换 ${changedImages} 张图片</span><span><i class="fa fa-map-marker"></i> 地点继续保留</span></div><div class="modal-actions"><button class="btn btn-secondary" data-action="regenerate"><i class="fa fa-refresh"></i> 再生成一次</button><button class="btn btn-primary" data-action="close-modal"><i class="fa fa-check"></i> 使用这个新版本</button></div></div></div>`;
  }

  async syncDouyinInteractions() {
    if (this.interactionSyncing) return;
    this.interactionSyncing = true;
    this.render();
    try {
      if (this.isDouyinInteractionConnected()) {
        const result = await this.requestApi("/api/douyin/interactions/sync", {
          method: "POST",
          body: { accountId: this.state.activeAccountId }
        });
        this.update(state => {
          state.interactionCenter.items = Array.isArray(result.items) ? result.items : state.interactionCenter.items;
          state.interactionCenter.source = "douyin-open-platform";
          state.interactionCenter.connectionStatus = "connected";
          state.interactionCenter.lastSyncedAt = result.syncedAt || `${localDate()} 刚刚`;
          state.interactionCenter.syncCount = Number(state.interactionCenter.syncCount || 0) + 1;
        }, false);
        this.toast("抖音评论与私信已同步");
      } else {
        await new Promise(resolve => setTimeout(resolve, 320));
        this.update(state => {
          const center = state.interactionCenter;
          center.lastSyncedAt = `${localDate()} 刚刚`;
          center.syncCount = Number(center.syncCount || 0) + 1;
          if (!center.items.some(item => item.id === "dy-sync-demo-01")) {
            center.items.unshift({ id: "dy-sync-demo-01", channel: "comment", userName: "旅行清单", content: "请问从酒店步行去附近景点方便吗？", workTitle: "大理古城附近的散步路线", receivedAt: "刚刚", status: "pending", unread: true, leadLevel: "medium", sentiment: "question" });
            state.ui.selectedInteractionId = "dy-sync-demo-01";
          }
        }, false);
        this.toast("演示互动已同步，本次未调用抖音真实接口");
      }
    } catch (error) {
      this.toast(`互动同步失败：${error.message}`, "fa-exclamation-triangle");
    } finally {
      this.interactionSyncing = false;
      this.render();
    }
  }

  useInteractionSuggestion(interactionId) {
    this.update(state => {
      const interaction = state.interactionCenter?.items?.find(item => item.id === interactionId);
      if (!interaction) return;
      interaction.replyDraft = suggestInteractionReply(state, interaction).text;
      state.ui.selectedInteractionId = interaction.id;
    });
    this.toast("已填入知识库回复建议，可继续修改");
  }

  markInteractionHandled(interactionId) {
    this.update(state => {
      const items = state.interactionCenter?.items || [];
      const interaction = items.find(item => item.id === interactionId);
      if (!interaction) return;
      interaction.status = "handled";
      interaction.unread = false;
      interaction.handledAt = new Date().toISOString();
      interaction.replyDraft = "";
      state.ui.selectedInteractionId = items.find(item => item.status === "pending" && item.id !== interactionId)?.id || interaction.id;
    });
    this.toast("已标记为无需回复");
  }

  async submitInteractionReply(data) {
    const interaction = this.state.interactionCenter?.items?.find(item => item.id === data.interactionId);
    if (!interaction) { this.toast("互动记录不存在", "fa-exclamation-triangle"); return; }
    const reply = String(data.reply || "").trim();
    if (!reply || charCount(reply) > 180) { this.toast("回复需为1至180个字符", "fa-exclamation-triangle"); return; }
    const suggestion = suggestInteractionReply(this.state, interaction);
    if (suggestion.requiresHumanConfirm && data.humanConfirmed !== "yes") {
      this.toast("该咨询涉及易变信息，请先人工确认", "fa-exclamation-triangle");
      return;
    }
    try {
      let externalSubmitted = false;
      if (this.isDouyinInteractionConnected()) {
        const result = await this.requestApi("/api/douyin/interactions/reply", {
          method: "POST",
          body: { accountId: this.state.activeAccountId, interactionId: interaction.id, channel: interaction.channel, reply }
        });
        externalSubmitted = Boolean(result.submitted);
        if (!externalSubmitted) throw new Error("抖音接口未确认回复成功");
      }
      this.update(state => {
        const current = state.interactionCenter.items.find(item => item.id === interaction.id);
        current.reply = reply;
        current.replyDraft = "";
        current.status = "replied";
        current.unread = false;
        current.repliedAt = new Date().toISOString();
        current.replyMode = externalSubmitted ? "douyin-open-platform" : "demo-record";
        state.notifications.unshift({ id: uid("notice"), type: "success", title: externalSubmitted ? "抖音互动回复成功" : "互动演示回复已记录", detail: `已回复 ${interaction.userName}：${Array.from(reply).slice(0, 42).join("")}`, read: false, createdAt: "刚刚" });
        state.ui.selectedInteractionId = state.interactionCenter.items.find(item => item.status === "pending" && item.id !== interaction.id)?.id || interaction.id;
      });
      this.toast(externalSubmitted ? "回复已发送到抖音" : "演示回复已记录，未发送到抖音");
    } catch (error) {
      this.toast(`回复失败：${error.message}`, "fa-exclamation-triangle");
    }
  }

  openCapabilityBinding(capabilityId) {
    const capability = this.getValueCapabilities().find(item => item.id === capabilityId);
    if (!capability) { this.toast("未找到对应绑定能力", "fa-exclamation-triangle"); return; }
    const current = this.state.valueAdded?.capabilities?.[capabilityId] || {};
    const binding = current.binding || {};
    const hotelId = this.state.otaSnapshot?.selectedHotelId || this.activeAccount()?.hotelId || "demo";
    const connected = capabilityId === "douyinAccount"
      ? this.state.adapters.douyin.status === "connected"
      : this.state.adapters.lifeService.status === "connected";
    const bindingMode = connected ? "official" : "demo";
    const modeNotice = connected
      ? "当前已具备官方适配器配置，提交后将保存本次授权关联。"
      : "当前缺少抖音官方 App ID、授权回调或来客凭证，本次按内部测试绑定保存，不会伪造真实平台授权。";
    const fieldSets = {
      douyinAccount: `<div class="form-group"><label class="form-label">抖音账号名称</label><input class="form-control" name="accountName" required maxlength="60" value="${escapeHtml(binding.accountName || this.activeAccount()?.handle || this.state.adapters.douyin.account)}" placeholder="例如：@酒店官方账号"></div><div class="form-group"><label class="form-label">抖音号或 UID</label><input class="form-control" name="externalId" required maxlength="80" value="${escapeHtml(binding.externalId || this.activeAccount()?.id || "")}" placeholder="填写抖音号或开放平台 UID"></div>`,
      blueV: `<div class="form-group"><label class="form-label">蓝v认证主体</label><input class="form-control" name="subjectName" required maxlength="80" value="${escapeHtml(binding.subjectName || this.state.settings.brandName)}"></div><div class="form-group"><label class="form-label">绑定门店地点</label><input class="form-control" name="poiName" required maxlength="100" value="${escapeHtml(binding.poiName || this.state.settings.brandName)}"></div><div class="form-group"><label class="form-label">地点 POI ID</label><input class="form-control" name="externalId" required maxlength="100" value="${escapeHtml(binding.externalId || `POI-DEMO-${hotelId}`)}" placeholder="抖音地点 POI ID"></div>`,
      groupBuy: `<div class="form-group"><label class="form-label">商品名称</label><input class="form-control" name="productName" required maxlength="100" value="${escapeHtml(binding.productName || `${this.activeAccount()?.name || this.state.settings.shortName}住宿套餐`)}"></div><div class="form-group"><label class="form-label">抖音商品链接</label><input class="form-control" name="productUrl" type="url" required value="${escapeHtml(binding.productUrl || "https://www.douyin.com/")}" placeholder="https://..."></div><div class="form-group"><label class="form-label">商品类型</label><select class="form-control" name="productType">${["房型商品", "住宿套餐", "团购套餐"].map(type => `<option ${type === binding.productType ? "selected" : ""}>${type}</option>`).join("")}</select></div>`,
      lifeService: `<div class="form-group"><label class="form-label">抖音来客门店名称</label><input class="form-control" name="shopName" required maxlength="100" value="${escapeHtml(binding.shopName || this.state.settings.brandName)}"></div><div class="form-group"><label class="form-label">来客门店 ID</label><input class="form-control" name="externalId" required maxlength="100" value="${escapeHtml(binding.externalId || this.state.adapters.lifeService.shopId || `LK-DEMO-${hotelId}`)}" placeholder="抖音来客门店 ID"></div><div class="form-group"><label class="form-label">授权主体</label><input class="form-control" name="subjectName" required maxlength="80" value="${escapeHtml(binding.subjectName || this.state.settings.brandName)}"></div>`
    };
    this.modal = `<div class="modal-backdrop"><form class="modal service-request-modal" data-form="capability-binding"><div class="service-modal-head"><span class="value-capability-icon ${capability.accent}"><i class="fa ${capability.icon}"></i></span><div><h2>${escapeHtml(this.getCapabilityActionLabels(capability.id)[0])}</h2><p>${escapeHtml(capability.subtitle)} · 绑定到当前酒店工作区</p></div></div><input type="hidden" name="capabilityId" value="${capability.id}"><input type="hidden" name="bindingMode" value="${bindingMode}">${fieldSets[capability.id]}<div class="alert ${connected ? "alert-success" : "alert-warning"}"><i class="fa ${connected ? "fa-check-circle" : "fa-flask"}"></i><div>${escapeHtml(modeNotice)}</div></div><div class="service-form-context"><i class="fa fa-building-o"></i><div><strong>${escapeHtml(this.state.settings.brandName)}</strong><span>${escapeHtml(this.state.settings.hotelType)} · 当前测试账号独立保存</span></div></div><div class="modal-actions"><button class="btn btn-secondary" type="button" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit"><i class="fa fa-link"></i> 确认绑定</button></div></form></div>`;
    this.render();
  }

  submitCapabilityBinding(data) {
    const capabilityId = String(data.capabilityId || "");
    const capability = this.getValueCapabilities().find(item => item.id === capabilityId);
    if (!capability) { this.toast("绑定能力无效", "fa-exclamation-triangle"); return; }
    if (capabilityId === "groupBuy") {
      try {
        const url = new URL(String(data.productUrl || ""));
        if (url.protocol !== "https:") throw new Error("商品链接必须使用 HTTPS");
      } catch (error) {
        this.toast(error.message === "商品链接必须使用 HTTPS" ? error.message : "请填写有效的 HTTPS 商品链接", "fa-exclamation-triangle");
        return;
      }
    } else if (String(data.externalId || "").trim().length < 2) {
      this.toast("请填写有效的平台账号或门店 ID", "fa-exclamation-triangle");
      return;
    }
    const binding = Object.fromEntries(Object.entries(data)
      .filter(([key]) => !["capabilityId", "bindingMode"].includes(key))
      .map(([key, value]) => [key, String(value).trim()]));
    binding.mode = data.bindingMode === "official" ? "official" : "demo";
    binding.boundAt = new Date().toISOString();
    this.modal = null;
    this.update(state => {
      const previous = state.valueAdded.capabilities[capabilityId] || {};
      state.valueAdded.capabilities[capabilityId] = { ...previous, status: "active", progress: 100, updatedAt: localDate(), binding };
      if (capabilityId === "douyinAccount") {
        state.adapters.douyin.account = binding.accountName || state.adapters.douyin.account;
      }
      if (capabilityId === "lifeService") {
        state.adapters.lifeService.shopId = binding.externalId;
        state.adapters.lifeService.status = binding.mode === "official" ? "connected" : "demo";
      }
      state.ui.valueCapabilityId = capabilityId;
      state.notifications.unshift({ id: uid("notice"), type: "success", title: `${capability.title}已绑定`, detail: binding.mode === "official" ? "已保存官方授权关联。" : "已保存内部测试绑定，配置官方凭证后可切换真实授权。", read: false, createdAt: "刚刚" });
    });
    this.toast(`${this.getCapabilityActionLabels(capabilityId)[0]}完成${binding.mode === "demo" ? "（内部测试）" : ""}`);
  }

  openValueServiceDetail(serviceId) {
    const service = VALUE_ADDED_SERVICE_CATALOG.find(item => item.id === serviceId);
    if (!service) { this.toast("未找到对应服务", "fa-exclamation-triangle"); return; }
    if (this.isMobileServiceExperience()) {
      this.update(state => { state.ui.valueServiceId = service.id; state.ui.view = "valueServiceDetail"; });
      return;
    }
    this.modal = `<div class="modal-backdrop"><div class="modal service-request-modal"><div class="service-modal-head"><span class="value-service-icon ${service.accent}"><i class="fa ${service.icon}"></i></span><div><h2>${escapeHtml(service.name)}</h2><p>${escapeHtml(service.summary)}</p></div></div><div class="value-service-objective"><span>经营目标</span><strong>${escapeHtml(service.objective)}</strong><small><i class="fa fa-user-o"></i> ${escapeHtml(service.fit)}</small></div><div class="value-deliverables">${service.deliverables.map(item => `<span><i class="fa fa-check-circle"></i>${escapeHtml(item)}</span>`).join("")}</div><div class="value-service-meta"><span><i class="fa fa-calendar-o"></i>${escapeHtml(service.cycle)}</span><strong>${escapeHtml(service.quote)}</strong></div><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">关闭</button><button class="btn btn-primary" data-action="open-service-request" data-service="${service.id}" data-intent="consultation">获取服务建议</button></div></div></div>`;
    this.render();
  }

  openServiceRequest(serviceId, intent = "request") {
    const service = VALUE_ADDED_SERVICE_CATALOG.find(item => item.id === serviceId);
    if (!service) { this.toast("未找到对应服务", "fa-exclamation-triangle"); return; }
    const intentCopy = {
      diagnosis: ["预约免费运营诊断", "提交后由运营顾问梳理账号、内容和成交承接问题。", "提交诊断预约"],
      consultation: ["先问问运营顾问", "无需立即购买，顾问会结合当前酒店资料先回答问题并说明可选方案。", "请顾问联系我"],
      activate: ["获取经营能力开通方案", "顾问将梳理所需授权、资质和配置步骤，给出适合当前酒店的开通清单。", "获取开通方案"],
      request: ["获取酒店专属服务方案", "选择感兴趣的方向并描述目标，顾问将结合当前酒店资料提供执行建议。", "获取专属方案"]
    };
    const [title, description, submitLabel] = intentCopy[intent] || intentCopy.request;
    this.modal = `<div class="modal-backdrop"><form class="modal service-request-modal" data-form="service-request"><div class="service-modal-head"><span class="value-service-icon ${service.accent}"><i class="fa ${service.icon}"></i></span><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(service.name)} · ${escapeHtml(description)}</p></div></div><input type="hidden" name="serviceId" value="${service.id}"><input type="hidden" name="intent" value="${escapeHtml(intent)}"><div class="form-group"><label class="form-label">服务方案</label><select class="form-control" name="plan">${service.plans.map(plan => `<option>${escapeHtml(plan)}</option>`).join("")}</select></div><div class="input-row"><div class="form-group"><label class="form-label">联系人</label><input class="form-control" name="contact" required maxlength="20" placeholder="怎么称呼您"></div><div class="form-group"><label class="form-label">联系电话</label><input class="form-control" name="phone" required maxlength="30" placeholder="手机号或座机"></div></div><div class="form-group"><label class="form-label">期望启动时间</label><input class="form-control" type="date" name="expectedDate" min="${localDate(0)}" value="${localDate(3)}"></div><div class="form-group"><label class="form-label">需求说明</label><textarea class="form-control" name="brief" rows="4" maxlength="300" placeholder="例如：希望提升暑期团购订单，计划安排达人直播并持续代运营"></textarea></div><div class="service-form-context"><i class="fa fa-building-o"></i><div><strong>${escapeHtml(this.state.settings.brandName)}</strong><span>${escapeHtml(this.state.settings.hotelType)} · ${escapeHtml(this.state.settings.city)} · 自动关联当前酒店知识库</span></div></div><div class="modal-actions"><button class="btn btn-secondary" type="button" data-action="close-modal">暂不提交</button><button class="btn btn-primary" type="submit"><i class="fa fa-paper-plane"></i> ${escapeHtml(submitLabel)}</button></div></form></div>`;
    this.render();
  }

  submitServiceRequest(data) {
    const service = VALUE_ADDED_SERVICE_CATALOG.find(item => item.id === data.serviceId);
    if (!service) { this.toast("服务信息无效", "fa-exclamation-triangle"); return; }
    if (String(data.contact || "").trim().length < 2 || String(data.phone || "").replace(/\D/g, "").length < 6) {
      this.toast("请填写有效联系人和联系电话", "fa-exclamation-triangle");
      return;
    }
    const request = {
      id: uid("service"),
      requestNo: `ZD${localDate().replaceAll("-", "")}${String(Date.now()).slice(-4)}`,
      accountId: this.state.activeAccountId,
      hotelName: this.state.settings.brandName,
      serviceId: service.id,
      intent: data.intent || "request",
      plan: data.plan,
      contact: String(data.contact).trim(),
      phone: String(data.phone).trim(),
      expectedDate: data.expectedDate || "待沟通",
      brief: String(data.brief || "").trim() || "请顾问结合当前酒店经营资料提供建议",
      status: "submitted",
      submittedAt: `${localDate()} 刚刚`
    };
    const returnView = this.isMobileServiceExperience()
      ? (data.intent === "activate" ? "valueCapabilityDetail" : "valueServiceDetail")
      : "valueServices";
    this.modal = null;
    this.update(state => {
      if (!state.valueAdded) state.valueAdded = clone(DEFAULT_VALUE_ADDED_STATE);
      if (!Array.isArray(state.valueAdded.requests)) state.valueAdded.requests = [];
      state.valueAdded.requests.unshift(request);
      if (service.id === "local-life-operations") {
        state.valueAdded.capabilities.groupBuy.status = "consulting";
        state.valueAdded.capabilities.lifeService.status = "consulting";
      }
      state.notifications.unshift({ id: uid("notice"), type: "success", title: "增值服务需求已提交", detail: `${service.name}工单 ${request.requestNo} 已创建，等待运营顾问联系。`, read: false, createdAt: "刚刚" });
      state.ui.valueServiceId = service.id;
      state.ui.view = returnView;
    });
    this.toast(`需求已提交：${request.requestNo}`);
  }

  viewServiceRequest(requestId) {
    const request = this.state.valueAdded?.requests?.find(item => item.id === requestId);
    if (!request) { this.toast("未找到该服务工单", "fa-exclamation-triangle"); return; }
    const service = VALUE_ADDED_SERVICE_CATALOG.find(item => item.id === request.serviceId);
    this.modal = `<div class="modal-backdrop"><div class="modal service-request-modal"><div class="service-modal-head"><span class="value-service-icon ${service?.accent || "teal"}"><i class="fa ${service?.icon || "fa-diamond"}"></i></span><div><h2>服务需求进度</h2><p>${escapeHtml(request.requestNo)} · 已绑定 ${escapeHtml(request.hotelName)}</p></div></div><div class="service-request-status"><span class="badge badge-info">顾问待联系</span><strong>${escapeHtml(service?.name || request.serviceId)}</strong><p>需求已记录，当前等待运营顾问确认目标、档期和执行边界。</p></div><div class="service-request-facts"><div><span>选择方案</span><strong>${escapeHtml(request.plan)}</strong></div><div><span>期望启动</span><strong>${escapeHtml(request.expectedDate)}</strong></div><div><span>联系人</span><strong>${escapeHtml(request.contact)} · ${escapeHtml(request.phone)}</strong></div><div><span>需求说明</span><strong>${escapeHtml(request.brief)}</strong></div></div><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">知道了</button></div></div></div>`;
    this.render();
  }

  viewCapability(capabilityId) {
    const capability = this.state.valueAdded?.capabilities?.[capabilityId] || { status: "inactive" };
    const copy = {
      douyinAccount: ["内容账号与品牌主体", `${this.activeAccount()?.handle || this.state.adapters.douyin.account} 已绑定当前酒店，可承接内容发布、评论和私信；真实发布仍以平台授权状态为准。`],
      blueV: ["门店身份与地点进度", `主体与地点资料已提交 ${Number(capability.submittedDays || 0)} 天，当前进度 ${Number(capability.progress || 0)}%，预计 ${Number(capability.etaDays || 3)} 个工作日完成。`],
      groupBuy: ["房型商品与预订承接", "需求已进入顾问跟进阶段，下一步将核对房型/套餐信息、库存规则、退款说明和核销方式。"],
      lifeService: ["订单数据与客户经营", "需求已进入顾问跟进阶段，下一步确认门店授权主体、订单数据边界和内容转化归因口径。"]
    };
    const [title, body] = copy[capabilityId] || ["能力接入信息", "当前状态已记录。"];
    this.modal = `<div class="modal-backdrop"><div class="modal"><h2>${escapeHtml(title)}</h2><div class="alert ${capability.status === "active" ? "alert-success" : "alert-info"}" style="margin-top:14px"><i class="fa ${capability.status === "active" ? "fa-check-circle" : "fa-clock-o"}"></i><div>${escapeHtml(body)}</div></div><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">知道了</button></div></div></div>`;
    this.render();
  }

  toast(message, icon = "fa-check-circle") {
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<i class="fa ${icon}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(el);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.remove(), 2600);
  }

  handleClick(event) {
    if (event.target.closest("[data-drawer]") && !event.target.closest("[data-action]")) event.stopPropagation();
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const actions = {
      navigate: () => {
        this.update(state => { state.ui.view = target.dataset.view; });
        globalThis.scrollTo?.(0, 0);
      },
      "publish-section": () => this.update(state => {
        state.ui.view = "records";
        state.ui.publishSection = target.dataset.section;
        state.ui.recordFilter = "all";
      }),
      device: () => {
        if (this._userEdition) {
          this.userPreviewMode = target.dataset.device;
          this.render();
          return;
        }
        this.update(state => { state.ui.device = target.dataset.device; });
      },
      notifications: () => this.update(state => { state.ui.notificationOpen = true; }),
      "close-notifications": () => this.update(state => { state.ui.notificationOpen = false; }),
      "mark-read": () => this.update(state => { state.notifications.forEach(item => { item.read = true; }); }),
      "open-mine-help": () => this.openMineHelp(),
      "open-mine-feedback": () => this.openMineFeedback(),
      "ai-recommend": () => this.recommendTopicsWithAi("daily"),
      "home-refresh-topics": () => this.refreshHomeTopics(),
      "feature-home-topic": () => { this.homeFeaturedTopicId = target.dataset.topic; this.render(); },
      "home-topic-detail": () => this.openHomeTopicDetail(target.dataset.topic),
      "home-generate-topic": () => this.generateHomeTopic(target.dataset.topic),
      "choose-topic": () => this.chooseTopic(target.dataset.topic),
      "choose-ai-topic": () => this.chooseAiTopic(target.dataset.topic),
      "swap-topic": () => this.swapTopic(),
      regenerate: () => this.regenerate(),
      "confirm-regenerate": () => this.performRegenerate(),
      "generate-active-topic": () => this.generateActiveTopic(),
      "test-ai": () => this.testAiConnection(),
      "clear-ai": () => this.clearAiConnection(),
      "toggle-image": () => this.toggleImage(target.dataset.id),
      "auto-select-images": () => this.autoSelectImages(),
      "draft-material-filter": () => this.update(state => { state.ui.draftMaterialFilter = target.dataset.filter; }),
      "clear-draft-material-search": () => this.update(state => { state.ui.draftMaterialQuery = ""; }),
      "preview-material": () => this.previewMaterial(target.dataset.id),
      "toggle-preview-material": () => this.togglePreviewMaterial(target.dataset.id),
      "move-image": () => this.moveDraftImage(target.dataset.id, Number(target.dataset.direction || 0)),
      "set-draft-cover": () => this.setDraftCover(target.dataset.id),
      "risk-check": () => this.runRiskCheck(),
      "publish-now": () => this.publishNow(),
      "confirm-review-and-publish": () => this.confirmReviewAndPublish(),
      "quick-fill-publish": () => this.quickFillPublish(),
      "set-creator-cover": () => this.setCreatorCover(target.dataset.id),
      "cycle-creator-cover": () => this.cycleCreatorCover(),
      "creator-publish-submit": () => this.finalizeCreatorPublish(),
      "creator-save-draft": () => this.saveCreatorDraft(),
      "back-editor": () => this.update(state => { state.ui.view = "editor"; }),
      "interaction-channel": () => this.update(state => {
        state.ui.interactionChannel = target.dataset.channel;
        const items = state.interactionCenter?.items || [];
        const channelItems = target.dataset.channel === "all" ? items : items.filter(item => item.channel === target.dataset.channel);
        const filtered = state.ui.interactionFilter === "all" ? channelItems : channelItems.filter(item => item.status === state.ui.interactionFilter);
        state.ui.selectedInteractionId = filtered[0]?.id || null;
      }),
      "interaction-filter": () => this.update(state => {
        state.ui.interactionFilter = target.dataset.filter;
        const items = state.interactionCenter?.items || [];
        const channelItems = state.ui.interactionChannel === "all" ? items : items.filter(item => item.channel === state.ui.interactionChannel);
        const filtered = target.dataset.filter === "all" ? channelItems : channelItems.filter(item => item.status === target.dataset.filter);
        state.ui.selectedInteractionId = filtered[0]?.id || null;
      }),
      "select-interaction": () => this.update(state => { state.ui.selectedInteractionId = target.dataset.id; }),
      "use-interaction-suggestion": () => this.useInteractionSuggestion(target.dataset.id),
      "mark-interaction-handled": () => this.markInteractionHandled(target.dataset.id),
      "sync-interactions": () => this.syncDouyinInteractions(),
      "open-capability-binding": () => this.openCapabilityBinding(target.dataset.capability),
      "open-service-request": () => this.openServiceRequest(target.dataset.service, target.dataset.intent),
      "view-service-request": () => this.viewServiceRequest(target.dataset.request),
      "view-capability": () => this.viewCapability(target.dataset.capability),
      "open-value-capability-detail": () => this.update(state => { state.ui.valueCapabilityId = target.dataset.capability; state.ui.view = "valueCapabilityDetail"; }),
      "open-value-service-detail": () => this.openValueServiceDetail(target.dataset.service),
      "material-filter": () => this.update(state => { state.ui.materialFilter = target.dataset.filter; }),
      "material-source-filter": () => this.update(state => { state.ui.materialSourceFilter = target.dataset.source; }),
      "upload-material": () => document.getElementById("material-upload")?.click(),
      "open-week-automation": () => this.openWeekAutomation(),
      "open-week-setup": () => this.openWeekAutomationSetup(),
      "save-start-weekly-settings": () => {
        const form = this.root.querySelector('[data-form="weekly-settings"]');
        if (form) this.saveWeeklySettings(Object.fromEntries(new FormData(form)), true);
      },
      "preview-weekly-plan": () => {
        const form = this.root.querySelector('[data-form="weekly-settings"]');
        if (form) this.previewWeeklyPlan(Object.fromEntries(new FormData(form)));
      },
      "activate-weekly-plan": () => this.activateSavedWeekAutomation(),
      "toggle-week-automation": () => this.toggleWeekAutomation(),
      "confirm-end-week": () => this.confirmEndWeekAutomation(),
      "end-week-automation": () => this.endWeekAutomation(),
      "view-plan-content": () => this.viewPlanContent(target.dataset.id),
      "generate-plan": () => this.requestPlanGeneration(),
      "select-plan-day": () => this.update(state => { state.ui.selectedPlanId = target.dataset.id; }),
      "plan-change-topic": () => this.regeneratePlanDay(target.dataset.id),
      "plan-toggle-skip": () => this.togglePlanDay(target.dataset.id),
      "open-plan-platforms": () => this.openPlanPlatforms(target.dataset.id),
      "toggle-plan-platform": () => this.togglePlanPlatform(target.dataset.id, target.dataset.platform),
      "confirm-plan-regenerate": () => { this.modal = null; this.generateWeekPlan(); },
      "remove-plan": () => this.update(state => { state.weekPlan = state.weekPlan.filter(item => item.id !== target.dataset.id); }),
      "confirm-plan": () => this.confirmPlan(),
      "select-publish-platform": () => this.update(state => { if (state.publishForm) state.publishForm.activePlatform = target.dataset.platform; }),
      "toggle-publish-platform": () => this.togglePublishPlatform(target.dataset.platform),
      "open-platform-binding": () => this.openPlatformBinding(target.dataset.platform),
      "disconnect-platform": () => this.disconnectPlatform(target.dataset.platform),
      "record-filter": () => this.update(state => { state.ui.recordFilter = target.dataset.filter; }),
      retry: () => this.retry(target.dataset.id),
      export: () => this.exportData(),
      import: () => document.getElementById("import-file")?.click(),
      reset: () => this.showModal("恢复示例数据？", "当前浏览器内的设置、草稿、排期和发布记录都会被示例数据覆盖。建议先导出备份。", "confirm-reset", "确认恢复"),
      "confirm-reset": () => { this.modal = null; this.store.reset(); this.render(); this.toast("已恢复示例数据"); },
      "close-modal": () => { this.modal = null; this.materialPreviewId = null; this.render(); }
    };
    actions[action]?.();
  }

  async handleSubmit(event) {
    const form = event.target.closest("[data-form]");
    if (!form) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (form.dataset.form === "onboarding") {
      this.update(state => {
        Object.assign(state.settings, data);
        state.onboardingCompleted = true;
        const topic = pickTopic(state.topics, state.settings.hotelType, state.records, []);
        state.draft = this.createLinkedRuleDraft(state, topic);
      });
      this.toast("初始化完成，已生成今日内容");
    }
    if (form.dataset.form === "custom-topic") {
      const title = String(data.customTopic || "").trim();
      if (title) {
        await this.generateContentWithAi({
          id: uid("custom-topic"), title, type: "vertical",
          reason: "用户主动输入的创作方向", contentAngle: "用户主题 + 酒店事实 + 入住建议",
          materialCategory: "room", source: "user-custom"
        });
      }
    }
    if (form.dataset.form === "settings") {
      this.update(state => { Object.assign(state.settings, data); });
      this.toast("设置已保存");
    }
    if (form.dataset.form === "weekly-settings") {
      this.saveWeeklySettings(data, false);
    }
    if (form.dataset.form === "mine-feedback") {
      const feedbackType = ["content", "image", "product", "service"].includes(data.type) ? data.type : "product";
      const detail = String(data.detail || "").trim();
      if (!detail) return;
      const account = this.activeAccount();
      this.modal = null;
      this.update(state => {
        if (!Array.isArray(state.feedback)) state.feedback = [];
        state.feedback.unshift({
          id: uid("feedback"), hotelId: account?.hotelId || state.otaSnapshot?.selectedHotelId,
          accountId: state.activeAccountId, type: feedbackType, detail,
          contentId: state.draft?.id || null, contentTitle: state.draft?.title || state.activeTopic?.title || "",
          status: "submitted", submittedAt: new Date().toISOString()
        });
        state.notifications.unshift({ id: uid("notice"), type: "success", title: "意见反馈已提交", detail: "反馈已关联当前酒店和内容，我们会继续优化。", read: false, createdAt: "刚刚" });
      });
      this.toast("谢谢反馈，我们已经记录");
    }
    if (form.dataset.form === "ai-config") {
      await this.configureAi(data);
    }
    if (form.dataset.form === "ota-hotel") {
      this.applyOtaHotel(data.hotelId);
    }
    if (form.dataset.form === "add-fact") {
      this.update(state => {
        state.knowledge.facts.push({ id: uid("fact"), label: data.label, value: data.value, source: "商家补充" });
        state.knowledge.completeness = Math.min(100, state.knowledge.completeness + 3);
      });
      this.toast("事实已加入知识库");
    }
    if (form.dataset.form === "draft-material-search") {
      this.update(state => { state.ui.draftMaterialQuery = String(data.materialQuery || "").trim(); });
    }
    if (form.dataset.form === "hotel-gallery-search") {
      this.update(state => { state.ui.materialQuery = String(data.materialQuery || "").trim(); });
    }
    if (form.dataset.form === "service-request") {
      this.submitServiceRequest(data);
    }
    if (form.dataset.form === "capability-binding") {
      this.submitCapabilityBinding(data);
    }
    if (form.dataset.form === "interaction-reply") {
      await this.submitInteractionReply(data);
    }
    if (form.dataset.form === "platform-binding") {
      this.submitPlatformBinding(data);
    }
  }

  handleChange(event) {
    const el = event.target;
    if (el.dataset.accountSwitch === "true") {
      this.switchTestAccount(el.value);
      return;
    }
    if (["draftTitle", "draftBody", "draftTags"].includes(el.name)) {
      this.update(state => {
        if (el.name === "draftTitle") state.draft.title = el.value;
        if (el.name === "draftBody") state.draft.body = el.value;
        if (el.name === "draftTags") state.draft.tags = el.value.split(/\s+/).filter(Boolean).map(tag => tag.startsWith("#") ? tag : `#${tag}`);
        state.draft.risk = assessRisk(state.draft);
        state.draft.selfReview = null;
        state.draft.manualReviewConfirmed = false;
        state.draft.manualReviewConfirmedAt = null;
        this.refreshDraftReuseRisk(state);
      });
    }
    if (el.dataset.publishField) {
      this.update(state => {
        if (!state.publishForm) return;
        const booleanFields = new Set(["crossPost", "allowSave"]);
        state.publishForm[el.dataset.publishField] = booleanFields.has(el.dataset.publishField) ? el.value === "true" : el.value;
        if (el.dataset.publishField === "declaration") state.publishForm.declarationUserSelected = true;
      });
      return;
    }
    if (el.dataset.platformField) {
      this.update(state => {
        if (!state.publishForm) return;
        this.ensurePublishPlatformVariants(state.publishForm);
        const platform = el.dataset.platform || state.publishForm.activePlatform || "douyin";
        if (el.dataset.platformField === "tagsText") {
          state.publishForm.platformVariants[platform].tags = el.value.split(/\s+/).filter(Boolean).map(tag => tag.startsWith("#") ? tag : `#${tag}`);
        } else {
          state.publishForm.platformVariants[platform][el.dataset.platformField] = el.value;
        }
      });
      return;
    }
    if (el.dataset.planField) {
      this.update(state => {
        const plan = state.weekPlan.find(item => item.id === el.dataset.id);
        if (plan) plan[el.dataset.planField] = el.value;
      });
    }
    if (el.dataset.materialSort) {
      this.update(state => { state.ui.draftMaterialSort = el.value; });
      return;
    }
    if (el.id === "material-upload" && el.files?.length) this.uploadMaterials([...el.files]);
    if (el.id === "import-file" && el.files?.[0]) this.importData(el.files[0]);
  }

  async chooseTopic(id) {
    const topic = this.state.topics.find(item => item.id === id);
    if (!topic) return;
    await this.generateContentWithAi({
      id: topic.id, title: topic.title, type: topic.type, reason: topic.reason, contentAngle: topic.formula, materialCategory: topic.material, source: "rule-library"
    });
  }

  async chooseAiTopic(id) {
    const topic = this.state.aiRecommendations.find(item => item.id === id);
    if (!topic) return;
    await this.generateContentWithAi({ ...topic, source: "ai-recommendation" });
  }

  async refreshHomeTopics() {
    this.homeFeaturedTopicId = null;
    await this.recommendTopicsWithAi("swap", "dashboard");
  }

  async generateHomeTopic(id) {
    this.modal = null;
    const aiTopic = this.state.aiRecommendations.find(item => item.id === id);
    const libraryTopic = this.state.topics.find(item => item.id === id);
    const topic = aiTopic ? { ...aiTopic, source: "ai-recommendation" } : libraryTopic ? {
      id: libraryTopic.id,
      title: libraryTopic.title,
      type: libraryTopic.type,
      reason: libraryTopic.reason,
      contentAngle: libraryTopic.formula,
      materialCategory: libraryTopic.material,
      source: "rule-library"
    } : null;
    if (!topic) return;
    await this.generateContentWithAi(topic, "focus-topic", { showHomeProgress: true });
  }

  async swapTopic() {
    await this.recommendTopicsWithAi("swap");
  }

  async regenerate() {
    if (this.userEditionA) {
      this.modal = `<div class="modal-backdrop a-regenerate-backdrop"><div class="modal a-regenerate-modal confirm"><div class="a-regenerate-confirm-icon"><i class="fa fa-refresh"></i></div><span class="a-kicker">重新生成新版本</span><h2>当前内容会被新版本替换</h2><p>系统会保留选题和酒店地点，重点重写标题、正文开头、信息顺序与图片组合。生成完成后会展示新旧版本差异。</p><div class="a-regenerate-scope"><span><i class="fa fa-check-circle"></i> 保留：选题、酒店事实、地点</span><span><i class="fa fa-random"></i> 更新：标题、正文、5 张图片</span></div><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="confirm-regenerate"><i class="fa fa-magic"></i> 确认生成新版本</button></div></div></div>`;
      this.render();
      return;
    }
    await this.performRegenerate();
  }

  async performRegenerate() {
    this.modal = null;
    const focus = this.state.draft.topicContext
      || this.state.activeTopic
      || this.state.aiRecommendations.find(item => item.id === this.state.draft.topicId)
      || { id: this.state.draft.topicId, title: this.state.draft.strategyTopicTitle || this.state.draft.title, type: this.state.draft.topicType, reason: this.state.draft.strategySummary, materialCategory: this.state.draft.materialCategory };
    await this.generateContentWithAi(focus, "regenerate");
  }

  async generateActiveTopic() {
    const topic = this.state.activeTopic || this.state.draft.topicContext;
    if (!topic?.title) {
      this.update(state => { state.ui.view = "topics"; });
      this.toast("请先确认一条选题", "fa-exclamation-circle");
      return;
    }
    await this.generateContentWithAi(topic, "focus-topic");
  }

  async configureAi(data) {
    try {
      const status = await this.requestApi("/api/ai/configure", {
        method: "POST",
        body: {
          apiKey: data.apiKey || undefined,
          baseUrl: data.baseUrl,
          model: data.model,
          projectId: data.projectId
        }
      });
      this.update(state => {
        state.adapters.ai = { ...state.adapters.ai, ...status, status: status.configured ? "connected" : "disconnected" };
      });
      this.toast(`模型配置成功：${status.model}`);
    } catch (error) {
      this.toast(`配置失败：${error.message}`, "fa-exclamation-triangle");
    }
  }

  async testAiConnection() {
    this.aiLoading = true;
    this.render();
    try {
      const result = await this.requestApi("/api/ai/test", { method: "POST", body: {} });
      this.toast(`连接成功：${result.model}`);
      await this.refreshAiStatus();
    } catch (error) {
      this.toast(`连接测试失败：${error.message}`, "fa-exclamation-triangle");
    } finally { this.aiLoading = false; this.render(); }
  }

  async clearAiConnection() {
    try {
      const status = await this.requestApi("/api/ai/configure", { method: "POST", body: { clearKey: true } });
      this.update(state => {
        state.adapters.ai = { ...state.adapters.ai, ...status, status: "disconnected" };
        state.aiRecommendations = [];
      });
      this.toast("模型连接已从后端内存清除");
    } catch (error) { this.toast(`断开失败：${error.message}`, "fa-exclamation-triangle"); }
  }

  toggleImage(id) {
    if (!this.state.draft.imageIds.includes(id) && this.state.draft.imageIds.length >= CONTENT_IMAGE_LIMIT) {
      this.toast("一篇图文固定为 1 张封面 + 4 张内容图，请先移出一张", "fa-exclamation-circle");
      return;
    }
    this.update(state => {
      const ids = state.draft.imageIds;
      if (ids.includes(id)) state.draft.imageIds = ids.filter(item => item !== id);
      else if (ids.length < CONTENT_IMAGE_LIMIT) ids.push(id);
      state.draft.imageLayout = buildImageLayout(state.materials, state.draft.imageIds, state.draft.materialCategory || "room", state.draft.imageLayout || []);
      state.draft.imageSelectionMeta = { ...(state.draft.imageSelectionMeta || {}), mode: "manual", selectedCount: state.draft.imageIds.length, strategy: "自动选图结果已人工调整，仍保持3:4叙事顺序与同篇去重" };
      this.refreshDraftReuseRisk(state);
    });
  }

  autoSelectImages() {
    this.update(state => {
      const previousIds = [...state.draft.imageIds];
      const visual = optimizeImageSelection(state, {
        platform: "douyin",
        preferredCategory: state.draft.materialCategory || "room",
        requestedIds: [],
        requestedPlan: [],
        avoidIds: previousIds,
        topicContext: state.draft.topicContext,
        topicFingerprint: state.draft.topicFingerprint,
        limit: CONTENT_IMAGE_LIMIT
      });
      Object.assign(state.draft, visual);
      this.refreshDraftReuseRisk(state);
    });
    this.toast(`已换一组图片：避开上一组 ${Number(this.state.draft.imageSelectionMeta?.avoidedPreviousCount || 0)} 张`);
  }

  previewMaterial(id) {
    const item = this.state.materials.find(material => material.id === id && material.src);
    if (!item) return;
    const selectedIndex = this.state.draft.imageIds.indexOf(id);
    const category = MATERIAL_CATEGORIES.find(entry => entry.id === item.category)?.name || item.category;
    this.materialPreviewId = id;
    this.modal = `<div class="modal-backdrop material-preview-backdrop"><div class="material-preview-modal"><button class="material-preview-close" data-action="close-modal" aria-label="关闭预览"><i class="fa fa-times"></i></button><div class="material-preview-image"><img src="${item.src.startsWith("data:") ? item.src : encodeURI(item.src)}" alt="${escapeHtml(item.title)}"></div><div class="material-preview-detail"><span class="badge badge-neutral">${escapeHtml(category)}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.source || "素材库")} · 已使用 ${Number(item.used || 0)} 次</p><div class="material-preview-actions"><button class="btn btn-secondary" data-action="close-modal">继续浏览</button><button class="btn ${selectedIndex >= 0 ? "btn-danger" : "btn-primary"}" data-action="toggle-preview-material" data-id="${item.id}" ${selectedIndex < 0 && this.state.draft.imageIds.length >= CONTENT_IMAGE_LIMIT ? "disabled" : ""}><i class="fa ${selectedIndex >= 0 ? "fa-minus-circle" : "fa-plus-circle"}"></i>${selectedIndex >= 0 ? `移出本篇（当前第 ${selectedIndex + 1} 张）` : this.state.draft.imageIds.length >= CONTENT_IMAGE_LIMIT ? `已达 ${CONTENT_IMAGE_LIMIT} 张上限` : "加入本篇"}</button></div></div></div></div>`;
    this.render();
  }

  togglePreviewMaterial(id) {
    this.modal = null;
    this.materialPreviewId = null;
    this.toggleImage(id);
  }

  moveDraftImage(id, direction) {
    if (!direction) return;
    this.update(state => {
      const ids = [...state.draft.imageIds];
      const index = ids.indexOf(id);
      const next = Math.max(0, Math.min(ids.length - 1, index + direction));
      if (index < 0 || next === index) return;
      [ids[index], ids[next]] = [ids[next], ids[index]];
      state.draft.imageIds = ids;
      state.draft.imageLayout = buildImageLayout(state.materials, ids, state.draft.materialCategory || "room", state.draft.imageLayout || []);
      state.draft.imageSelectionMeta = { ...(state.draft.imageSelectionMeta || {}), mode: "manual", strategy: "自动排版结果已人工调整顺序" };
      this.refreshDraftReuseRisk(state);
    });
  }

  setDraftCover(id) {
    this.update(state => {
      if (!state.draft.imageIds.includes(id)) return;
      state.draft.imageIds = [id, ...state.draft.imageIds.filter(item => item !== id)];
      state.draft.imageLayout = buildImageLayout(state.materials, state.draft.imageIds, state.draft.materialCategory || "room", state.draft.imageLayout || []);
      state.draft.imageSelectionMeta = { ...(state.draft.imageSelectionMeta || {}), mode: "manual", strategy: "人工指定封面，其余图片保持叙事排序" };
      this.refreshDraftReuseRisk(state);
    });
    this.toast("已设为首图封面");
  }

  runRiskCheck() {
    this.update(state => {
      state.draft.risk = assessRisk(state.draft);
      this.refreshDraftReuseRisk(state);
    });
    const passed = this.state.draft.risk.passed && this.state.draft.contentReuseRisk?.level === "pass";
    this.toast(passed ? "发布安全检查完成" : "发现内容或素材重复风险，已阻止发布", passed ? "fa-shield" : "fa-exclamation-triangle");
  }

  refreshDraftReuseRisk(state, platform = "douyin") {
    if (!state.draft) return null;
    const account = (state.testAccounts || []).find(item => item.id === state.activeAccountId);
    state.draft.topicFingerprint = state.draft.topicFingerprint || buildTopicFingerprint(state.draft.topicContext || state.activeTopic || state.draft, state.draft);
    const risk = evaluateContentReuseRisk(state, state.draft, {
      platform,
      hotelId: account?.hotelId || state.otaSnapshot?.selectedHotelId
    });
    state.draft.contentReuseRisk = risk;
    state.draft.materialShortage = risk.level === "pass" ? null : {
      blocked: risk.level === "blocked",
      reason: risk.reasons[0] || "近期素材重复度较高",
      suggestions: this.buildReplenishmentSuggestions(state.draft.materialCategory).slice(0, 6),
      repairAttempts: Number(state.draft.materialShortage?.repairAttempts || 0)
    };
    return risk;
  }

  buildReplenishmentSuggestions(category = "room") {
    const categorySuggestions = {
      room: ["客房全景1张", "床品或水吧细节2张", "窗边真实视角1张", "卫浴细节1张", "入住使用场景1张"],
      public: ["大堂或前台1张", "公共区域全景2张", "休息区细节1张", "服务场景1张", "夜间氛围1张"],
      exterior: ["酒店门头1张", "抵达动线2张", "建筑全景1张", "入口细节1张", "周边街景1张"],
      dining: ["今日早餐全景1张", "餐品细节2张", "用餐空间1张", "出餐场景1张", "饮品细节1张"],
      poi: ["酒店入口到地标动线1张", "周边街景2张", "真实距离标识1张", "附近生活配套1张", "酒店外观承接1张"]
    };
    return categorySuggestions[category] || categorySuggestions.room;
  }

  createPublishForm(state, selectedIds) {
    const imageLayout = buildImageLayout(state.materials, selectedIds, state.draft.materialCategory || "room", state.draft.imageLayout || []);
    const contentLabel = state.draft.topicType === "traffic" ? "旅行攻略" : "酒旅住宿";
    const form = {
      title: state.draft.title,
      description: `${state.draft.body}\n\n${state.draft.tags.join(" ")}`,
      tags: [...state.draft.tags],
      imageIds: [...selectedIds],
      imageLayout,
      coverId: selectedIds[0],
      topicFingerprint: state.draft.topicFingerprint || buildTopicFingerprint(state.draft.topicContext || state.draft, state.draft),
      location: clone(state.draft.location || resolveHotelLocation(state, this.activeAccount())),
      officialActivity: "不参与官方活动",
      collectionType: "合集",
      collection: "不选择合集",
      declaration: this.userEditionA ? "" : "内容由AI辅助创作",
      declarationDetail: this.userEditionA ? "默认留空，由用户在发布确认时自主选择" : "图片为酒店实拍；信息依据当前酒店知识库并经过发布前检查",
      declarationUserSelected: !this.userEditionA,
      music: state.draft.musicMood ? `${state.draft.musicMood}（抖音曲库智能匹配）` : "自然松弛轻音乐（抖音曲库智能匹配）",
      contentLabel,
      relatedContent: "酒店民宿",
      hotspot: "不关联热点",
      crossPost: false,
      visibility: "public",
      allowSave: true,
      publishMode: "now",
      scheduledAt: `${localDate(1)}T${state.settings.defaultTime}`,
      completionVersion: "douyin-creator-screenshot-v2",
      adapterMode: state.adapters?.mode || "demo",
      executionTrace: { skills: ["hotel-fact-grounding", "hotel-compliance-review", "douyin-publish-completion"], source: "抖音创作者中心发布需要补充信息界面.png" }
    };
    if (this.userEditionA) this.ensurePublishPlatformVariants(form);
    return form;
  }

  publishNow() {
    const risk = assessRisk(this.state.draft);
    const reuseRisk = evaluateContentReuseRisk(this.state, this.state.draft, { platform: "douyin" });
    const bodyLength = charCount(this.state.draft.body);
    if (bodyLength < BODY_MIN || bodyLength > BODY_MAX) {
      this.toast(`正文当前${bodyLength}字，请调整到${BODY_MIN}-${BODY_MAX}字后再发布`, "fa-exclamation-triangle");
      return;
    }
    if (!risk.passed) { this.toast("存在高风险内容，无法发布", "fa-exclamation-triangle"); return; }
    if (reuseRisk.level !== "pass") {
      this.update(state => this.refreshDraftReuseRisk(state));
      this.toast("当前图片或内容与近期作品重复度较高，请换一版或补充素材", "fa-picture-o");
      return;
    }
    if (this.state.draft.selfReview?.publishGate === "blocked" || (this.state.draft.selfReview?.publishGate === "revise" && !this.state.draft.manualReviewConfirmed)) {
      this.toast("工程质量门禁未通过，请按审核意见修改或重新生成", "fa-exclamation-triangle");
      return;
    }
    const availableImages = this.state.materials.filter(item => item.src);
    const selectedIds = this.state.draft.imageIds.filter(id => availableImages.some(item => item.id === id));
    if (!selectedIds.length) selectedIds.push(...optimizeImageSelection(this.state, { preferredCategory: this.state.draft.materialCategory || "room", limit: CONTENT_IMAGE_LIMIT }).imageIds);
    if (!selectedIds.length) { this.toast("当前账号没有可发布图片，请先补充素材", "fa-picture-o"); return; }
    if (selectedIds.length !== CONTENT_IMAGE_LIMIT) {
      this.toast(`当前需要完整的1张封面和4张内容图，请先补充素材`, "fa-picture-o");
      return;
    }
    this.update(state => {
      state.draft.imageIds = selectedIds;
      state.draft.imageLayout = buildImageLayout(state.materials, selectedIds, state.draft.materialCategory || "room", state.draft.imageLayout || []);
      state.publishForm = this.createPublishForm(state, selectedIds);
      state.ui.view = "creatorPublish";
    });
    this.toast(this.usesUserAExperience ? "已生成各平台发布版本" : "已进入抖音创作者中心补全页");
  }

  confirmReviewAndPublish() {
    const risk = assessRisk(this.state.draft);
    if (!risk.passed || this.state.draft.selfReview?.publishGate === "blocked") {
      this.toast("存在阻断风险，不能通过人工确认绕过", "fa-exclamation-triangle");
      return;
    }
    this.update(state => {
      state.draft.manualReviewConfirmed = true;
      state.draft.manualReviewConfirmedAt = new Date().toISOString();
      if (state.draft.selfReview?.publishGate === "revise") {
        state.draft.selfReview = { ...state.draft.selfReview, originalPublishGate: "revise", publishGate: "ready" };
      }
    }, false);
    this.publishNow();
  }

  quickFillPublish() {
    this.update(state => {
      if (!state.publishForm) return;
      const selectedPlatforms = [...(state.publishForm.selectedPlatforms || ["douyin"])];
      const activePlatform = state.publishForm.activePlatform || selectedPlatforms[0];
      const ids = state.publishForm.imageIds.filter(id => state.materials.some(item => item.id === id && item.src));
      state.publishForm = this.createPublishForm(state, ids.length ? ids : state.draft.imageIds);
      state.publishForm.selectedPlatforms = selectedPlatforms;
      state.publishForm.activePlatform = activePlatform;
    });
    this.toast(this.usesUserAExperience ? "已重新生成各平台适配版本" : "已按创作者中心字段重新自动补全");
  }

  setCreatorCover(id) {
    this.update(state => {
      const form = state.publishForm;
      if (!form?.imageIds.includes(id)) return;
      form.coverId = id;
      form.imageIds = [id, ...form.imageIds.filter(item => item !== id)];
      form.imageLayout = buildImageLayout(state.materials, form.imageIds, state.draft.materialCategory || "room", form.imageLayout || []);
    });
    this.toast("已更新创作者中心封面与图片顺序");
  }

  cycleCreatorCover() {
    const form = this.state.publishForm;
    if (!form?.imageIds.length) return;
    const index = Math.max(0, form.imageIds.indexOf(form.coverId));
    this.setCreatorCover(form.imageIds[(index + 1) % form.imageIds.length]);
  }

  togglePublishPlatform(platformId) {
    this.update(state => {
      const form = state.publishForm;
      if (!form || !state.publishingPlatforms?.[platformId]) return;
      this.ensurePublishPlatformVariants(form);
      const current = new Set(form.selectedPlatforms || ["douyin"]);
      if (current.has(platformId)) {
        if (current.size === 1) return;
        current.delete(platformId);
      } else current.add(platformId);
      form.selectedPlatforms = [...current];
      if (!current.has(form.activePlatform)) form.activePlatform = form.selectedPlatforms[0];
    });
  }

  openPlatformBinding(platformId) {
    const platform = this.state.publishingPlatforms?.[platformId];
    if (!platform) return;
    this.modal = `<div class="modal-backdrop"><form class="modal a-platform-bind-modal" data-form="platform-binding"><input type="hidden" name="platformId" value="${platformId}"><span class="a-platform-icon ${platformId}"><i class="fa ${platform.icon}"></i></span><span class="a-kicker">连接发布平台</span><h2>${escapeHtml(platform.name)}账号</h2><p>原型会保存账号名称并展示完整连接流程；真实发布仍以平台官方授权和接口能力为准。</p><div class="form-group"><label class="form-label">账号名称</label><input class="form-control" name="account" required maxlength="60" value="${escapeHtml(platform.account || "")}" placeholder="例如：大理某某民宿"></div><div class="form-group"><label class="form-label">发布方式</label><div class="a-binding-mode"><i class="fa ${platform.delivery === "direct" ? "fa-exchange" : "fa-mobile"}"></i><span><strong>${platform.delivery === "direct" ? "官方接口授权" : "客户端确认发布"}</strong><small>${escapeHtml(platform.capability)}</small></span></div></div><div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">取消</button><button type="submit" class="btn btn-primary">保存连接</button></div></form></div>`;
    this.render();
  }

  submitPlatformBinding(data) {
    const platformId = String(data.platformId || "");
    if (!this.state.publishingPlatforms?.[platformId]) return;
    this.modal = null;
    this.update(state => {
      const platform = state.publishingPlatforms[platformId];
      platform.account = String(data.account || "").trim();
      platform.status = platformId === "douyin" && state.adapters?.douyin?.status === "connected" ? "connected" : "demo";
      platform.lastSyncedAt = `${localDate()} ${new Date().toTimeString().slice(0, 5)}`;
      if (platformId === "douyin") {
        state.adapters.douyin.account = platform.account;
        if (state.adapters.douyin.status !== "connected") state.adapters.douyin.status = "demo";
      }
    });
    this.toast("账号连接信息已保存");
  }

  disconnectPlatform(platformId) {
    this.update(state => {
      const platform = state.publishingPlatforms?.[platformId];
      if (!platform) return;
      platform.status = "disconnected";
      platform.account = "";
      platform.lastSyncedAt = null;
      if (platformId === "douyin") state.adapters.douyin.status = "demo";
    });
    this.toast("已解除当前原型中的账号连接");
  }

  createCreatorRecord(status, mode) {
    const form = this.state.publishForm;
    const now = new Date();
    const immediateTime = `${localDate(0, now)} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    return {
      id: uid("record"), accountId: this.state.activeAccountId,
      hotelId: this.activeAccount()?.hotelId || this.state.otaSnapshot?.selectedHotelId,
      topicId: this.state.draft.topicId, topicType: this.state.draft.topicType,
      topicFingerprint: this.state.draft.topicFingerprint || buildTopicFingerprint(this.state.draft.topicContext || this.state.draft, this.state.draft),
      title: form.title, body: form.description, imageIds: [...form.imageIds],
      coverId: form.coverId || form.imageIds[0],
      platform: "douyin", platforms: ["douyin"],
      status, mode, publishedAt: status === "scheduled" ? form.scheduledAt.replace("T", " ") : immediateTime,
      views: 0, likes: 0, comments: 0, shares: 0, link: "#", publishMeta: clone(form)
    };
  }

  markMaterialsUsed(state, imageIds, platforms = ["douyin"], coverId = imageIds?.[0]) {
    const usedAt = new Date().toISOString();
    imageIds.forEach(id => {
      const item = state.materials.find(material => material.id === id);
      if (!item) return;
      item.used = Number(item.used || 0) + 1;
      item.usageByPlatform = { ...(item.usageByPlatform || {}) };
      item.lastUsedAtByPlatform = { ...(item.lastUsedAtByPlatform || {}) };
      item.coverUsedByPlatform = { ...(item.coverUsedByPlatform || {}) };
      platforms.forEach(platform => {
        item.usageByPlatform[platform] = Number(item.usageByPlatform[platform] || 0) + 1;
        item.lastUsedAtByPlatform[platform] = usedAt;
        if (id === coverId) {
          const previous = item.coverUsedByPlatform[platform] || {};
          item.coverUsedByPlatform[platform] = { count: Number(previous.count || 0) + 1, lastUsedAt: usedAt };
        }
      });
    });
  }

  finalizeCreatorPublish() {
    const form = this.state.publishForm;
    if (!form) return;
    if (this.usesUserAExperience) {
      this.finalizeMultiPlatformPublish();
      return;
    }
    if (!form.title.trim() || charCount(form.title) > 20) { this.toast("标题需为1至20个字符", "fa-exclamation-triangle"); return; }
    if (!form.description.trim() || charCount(form.description) > 1000) { this.toast("作品描述需为1至1000个字符", "fa-exclamation-triangle"); return; }
    if (!form.imageIds.length) { this.toast("至少需要1张图片", "fa-picture-o"); return; }
    const risk = assessRisk({ title: form.title, body: form.description, imageAuthenticity: "real" });
    if (!risk.passed) { this.toast("作品存在高风险表达，请返回修改", "fa-exclamation-triangle"); return; }
    const reuseRisk = evaluateContentReuseRisk(this.state, {
      ...this.state.draft,
      title: form.title,
      body: form.description,
      imageIds: form.imageIds,
      coverId: form.coverId,
      topicFingerprint: form.topicFingerprint
    }, { platform: "douyin" });
    if (reuseRisk.level !== "pass") {
      this.toast("当前版本与抖音近期内容重复度较高，请返回换一版", "fa-picture-o");
      return;
    }
    const status = form.publishMode === "scheduled" ? "scheduled" : "published";
    const mode = form.publishMode === "scheduled" ? "抖音创作者中心·定时发布" : "抖音创作者中心·立即发布";
    const record = this.createCreatorRecord(status, mode);
    this.update(state => {
      state.records.unshift(record);
      this.markMaterialsUsed(state, form.imageIds, ["douyin"], form.coverId);
      state.notifications.unshift({ id: uid("notice"), type: "success", title: status === "scheduled" ? "定时发布已确认" : "作品发布成功", detail: `《${form.title}》的图文和发布信息已完整提交。`, read: false, createdAt: "刚刚" });
      const next = pickTopic(state.topics, state.settings.hotelType, state.records, []);
      if (this.userEditionA) state.lastPublishResult = clone(record);
      state.draft = this.createLinkedRuleDraft(state, next, 1);
      state.publishForm = null;
      state.ui.view = this.userEditionA ? "publishComplete" : "records";
      state.ui.recordFilter = status;
      state.ui.publishSection = this.userEditionA ? (status === "scheduled" ? "scheduled" : "published") : (status === "scheduled" ? "pending" : "records");
    });
    this.toast(status === "scheduled" ? "作品已进入定时发布队列" : "作品已完成发布");
  }

  finalizeMultiPlatformPublish() {
    const form = this.state.publishForm;
    if (!form) return;
    this.ensurePublishPlatformVariants(form);
    const selected = form.selectedPlatforms || [];
    if (!selected.length) { this.toast("请至少选择一个发布平台", "fa-exclamation-triangle"); return; }
    if (form.imageIds.length !== CONTENT_IMAGE_LIMIT) { this.toast(`请确认完整的 ${CONTENT_IMAGE_LIMIT} 张图片`, "fa-picture-o"); return; }
    for (const id of selected) {
      const variant = form.platformVariants[id];
      if (!variant?.title?.trim() || !variant?.body?.trim()) {
        this.toast(`${this.state.publishingPlatforms[id]?.name || id}版本还未填写完整`, "fa-exclamation-triangle");
        return;
      }
      const platformReuseRisk = evaluateContentReuseRisk(this.state, {
        ...this.state.draft,
        title: variant.title,
        body: variant.body,
        imageIds: form.imageIds,
        coverId: form.coverId,
        topicFingerprint: form.topicFingerprint,
        platformVariants: form.platformVariants
      }, { platform: id });
      if (platformReuseRisk.level !== "pass") {
        this.toast(`${this.state.publishingPlatforms[id]?.name || id}版本与近期内容重复度较高，请换一版或补充素材`, "fa-picture-o");
        return;
      }
    }
    const platformResults = selected.map(id => {
      const platform = this.state.publishingPlatforms[id];
      const direct = platform?.delivery === "direct" && platform?.status === "connected";
      return {
        platform: id,
        name: platform?.name || id,
        state: direct ? "submitted" : "handoff-ready",
        label: direct ? "已提交平台接口" : "发布包已准备，待客户端确认",
        delivery: platform?.delivery || "handoff"
      };
    });
    const allSubmitted = platformResults.every(item => item.state === "submitted");
    const now = new Date();
    const record = {
      id: uid("record"),
      accountId: this.state.activeAccountId,
      hotelId: this.activeAccount()?.hotelId || this.state.otaSnapshot?.selectedHotelId,
      topicId: this.state.draft.topicId,
      topicType: this.state.draft.topicType,
      topicFingerprint: this.state.draft.topicFingerprint || buildTopicFingerprint(this.state.draft.topicContext || this.state.draft, this.state.draft),
      title: form.platformVariants[selected[0]].title,
      body: form.platformVariants[selected[0]].body,
      imageIds: [...form.imageIds],
      coverId: form.coverId || form.imageIds[0],
      status: allSubmitted ? "published" : "reviewing",
      mode: `多平台分发 · ${selected.length}个平台`,
      publishedAt: `${localDate(0, now)} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,
      views: 0, likes: 0, comments: 0, shares: 0, link: "#",
      platforms: selected,
      platformVariants: clone(form.platformVariants),
      platformResults,
      publishMeta: clone(form)
    };
    this.update(state => {
      state.records.unshift(record);
      this.markMaterialsUsed(state, form.imageIds, selected, form.coverId);
      state.notifications.unshift({ id: uid("notice"), type: "success", title: allSubmitted ? "多平台内容已提交" : "多平台发布包已准备", detail: `${selected.length}个平台版本已完成；需要客户端确认的平台不会显示为已发布。`, read: false, createdAt: "刚刚" });
      state.lastPublishResult = clone(record);
      const next = pickTopic(state.topics, state.settings.hotelType, state.records, []);
      state.draft = this.createLinkedRuleDraft(state, next, 1);
      state.publishForm = null;
      state.ui.view = "publishComplete";
      state.ui.publishSection = allSubmitted ? "published" : "drafts";
    });
    this.toast(allSubmitted ? "内容已提交到所选平台" : "平台版本与发布包已准备完成");
  }

  saveCreatorDraft() {
    const form = this.state.publishForm;
    if (!form) return;
    const record = this.createCreatorRecord("draft", this.usesUserAExperience ? "多平台发布·暂存" : "抖音创作者中心·暂存");
    this.update(state => {
      state.records.unshift(record);
      state.notifications.unshift({ id: uid("notice"), type: "success", title: this.usesUserAExperience ? "多平台草稿已保存" : "创作者中心草稿已保存", detail: `《${form.title}》已保留全部图片与发布设置。`, read: false, createdAt: "刚刚" });
      state.publishForm = null;
      state.ui.view = "records";
      state.ui.recordFilter = "draft";
      state.ui.publishSection = "pending";
    });
    this.toast("已保存创作者中心草稿");
  }

  requestPlanGeneration() {
    if (!this.usesUserAExperience || !this.state.weekPlan.length) {
      this.generateWeekPlan();
      return;
    }
    this.modal = `<div class="modal-backdrop"><div class="modal a-plan-regenerate-modal"><span class="a-kicker">重新生成前确认</span><h2>这次要调整整周哪些内容？</h2><p>系统会更换重复度较高的选题和图片，同时保留你已经设置的日期与时间。</p><div class="a-plan-regenerate-options"><span><i class="fa fa-check-circle"></i><strong>保留日期与时间</strong><small>避免重新安排营业节奏</small></span><span><i class="fa fa-random"></i><strong>更新选题与图片</strong><small>优先避开上一版内容</small></span><span><i class="fa fa-share-alt"></i><strong>保留平台选择</strong><small>抖音、小红书、视频号不变</small></span></div><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">取消</button><button class="btn btn-primary" data-action="confirm-plan-regenerate"><i class="fa fa-refresh"></i> 生成新一版</button></div></div></div>`;
    this.render();
  }

  openWeekAutomation() {
    const wasCompleted = this.state.weeklyAutomation?.status === "completed";
    if (wasCompleted) {
      this.update(state => {
        state.weekPlan = [];
        state.weeklyAutomation.status = "idle";
        state.weeklyAutomation.startedAt = null;
        state.weeklyAutomation.completedAt = null;
      }, false);
    }
    if (!this.state.weekPlan.length) this.generateWeekPlan();
    this.update(state => {
      state.ui.view = "planner";
      state.ui.selectedPlanId = state.weekPlan[0]?.id || null;
    });
  }

  openWeekAutomationSetup() {
    this.update(state => { state.ui.view = "weeklySettings"; });
  }

  saveWeeklySettings(data, start = false) {
    const currentAutomation = { ...clone(DEFAULT_STATE.weeklyAutomation), ...clone(this.state.weeklyAutomation || {}) };
    const currentContentRules = { ...clone(DEFAULT_STATE.weeklyAutomation.contentRules), ...(currentAutomation.contentRules || {}) };
    const currentPublishRules = { ...clone(DEFAULT_STATE.weeklyAutomation.publishRules), ...(currentAutomation.publishRules || {}) };
    const mode = ["topics", "review", "auto"].includes(data.mode) ? data.mode : "review";
    const platformIds = Object.keys(this.state.publishingPlatforms || {});
    const platforms = platformIds.filter(id => data[`platform_${id}`] === "on");
    if (!platforms.length) platforms.push(...(currentAutomation.platforms?.length ? currentAutomation.platforms : ["douyin"]));
    const runDays = Array.from({ length: 7 }, (_, index) => index).filter(index => data[`runDay${index}`] === "on");
    if (!runDays.length) runDays.push(...(currentAutomation.runDays?.length ? currentAutomation.runDays : [0, 1, 2, 3, 4, 5, 6]));
    const previousStatus = this.state.weeklyAutomation?.status || "idle";
    const nextConfig = {
      ...clone(DEFAULT_STATE.weeklyAutomation),
      ...currentAutomation,
      status: start ? "active" : previousStatus === "completed" ? "idle" : previousStatus,
      mode,
      startDate: String(data.startDate || currentAutomation.startDate || localDate(1)),
      defaultTime: String(data.defaultTime || "19:30"),
      platforms,
      notify: data.notify === "all" ? "all" : "exceptions",
      runDays,
      contentRules: {
        voice: String(data.voice || currentContentRules.voice),
        forbidden: data.forbidden === undefined ? String(currentContentRules.forbidden || "") : String(data.forbidden || "").trim(),
        materialFallback: ["change-topic", "prepare-and-alert", "pause"].includes(data.materialFallback) ? data.materialFallback : currentContentRules.materialFallback,
        autoFactCheck: true,
        autoPlatformVariants: true
      },
      publishRules: {
        requireConfirmation: mode !== "auto",
        autoLocation: currentPublishRules.autoLocation !== false,
        autoProduct: Boolean(currentPublishRules.autoProduct),
        retryOnFailure: true
      },
      startedAt: start ? (previousStatus === "active" ? this.state.weeklyAutomation.startedAt : new Date().toISOString()) : this.state.weeklyAutomation?.startedAt || null,
      completedAt: start ? null : this.state.weeklyAutomation?.completedAt || null
    };
    if (start && !this.state.weekPlan.length) this.generateWeekPlan();
    const statusPattern = mode === "topics"
      ? ["topic-ready", "topic-ready", "topic-ready", "topic-ready", "topic-ready", "topic-ready", "topic-ready"]
      : mode === "auto" && !nextConfig.publishRules.requireConfirmation
        ? ["scheduled", "ready", "generating", "queued", "queued", "queued", "queued"]
        : ["ready-review", "ready", "generating", "queued", "queued", "queued", "queued"];
    this.update(state => {
      state.weeklyAutomation = nextConfig;
      state.settings.voice = nextConfig.contentRules.voice;
      state.settings.forbidden = nextConfig.contentRules.forbidden;
      state.settings.defaultTime = nextConfig.defaultTime;
      state.settings.notificationPreference = nextConfig.notify === "all" ? "all" : "important";
      if (start) {
        state.weekPlan.forEach((item, index) => {
          if (!runDays.includes(index)) {
            item.status = "skipped";
            return;
          }
          if (!["published", "scheduled"].includes(item.status) || previousStatus !== "active") item.status = statusPattern[index] || "queued";
          item.time = nextConfig.defaultTime;
          item.platforms = [...platforms];
        });
        state.notifications.unshift({
          id: uid("notice"), type: "success", title: previousStatus === "active" ? "本周自动运营设置已更新" : "7天自动运营已开始",
          detail: previousStatus === "active" ? "新设置已应用到尚未开始的任务，已生成和已排期内容保持不变。" : "系统已按你选择的内容规则、时间和平台创建本周任务。",
          read: false, createdAt: "刚刚"
        });
        state.ui.view = "planner";
        state.ui.selectedPlanId = state.weekPlan.find(item => item.status !== "skipped")?.id || state.weekPlan[0]?.id || null;
      } else {
        state.ui.view = "valueServices";
      }
    });
    this.toast(start ? (previousStatus === "active" ? "设置已应用到未开始任务" : "本周自动运营已开启") : "7天自动运营设置已保存，尚未开启");
  }

  previewWeeklyPlan(data) {
    this.saveWeeklySettings(data, false);
    this.update(state => { state.weekPlan = []; }, false);
    this.generateWeekPlan();
    this.update(state => {
      state.ui.view = "planner";
      state.ui.selectedPlanId = state.weekPlan[0]?.id || null;
    });
    this.toast("本周计划已生成，确认后才会正式开启");
  }

  activateSavedWeekAutomation() {
    const automation = this.state.weeklyAutomation || DEFAULT_STATE.weeklyAutomation;
    const contentRules = { ...DEFAULT_STATE.weeklyAutomation.contentRules, ...(automation.contentRules || {}) };
    const data = {
      mode: automation.mode || "review",
      startDate: automation.startDate || localDate(1),
      defaultTime: automation.defaultTime || "19:30",
      notify: automation.notify || "exceptions",
      voice: contentRules.voice,
      forbidden: contentRules.forbidden,
      materialFallback: contentRules.materialFallback
    };
    (automation.platforms || ["douyin"]).forEach(id => { data[`platform_${id}`] = "on"; });
    (automation.runDays || [0, 1, 2, 3, 4, 5, 6]).forEach(index => { data[`runDay${index}`] = "on"; });
    this.saveWeeklySettings(data, true);
  }

  toggleWeekAutomation() {
    const current = this.state.weeklyAutomation?.status;
    if (!["active", "paused"].includes(current)) {
      this.openWeekAutomationSetup();
      return;
    }
    this.update(state => {
      state.weeklyAutomation.status = current === "active" ? "paused" : "active";
    });
    this.toast(current === "active" ? "本周自动运营已暂停" : "本周自动运营已继续");
  }

  confirmEndWeekAutomation() {
    this.modal = `<div class="modal-backdrop"><div class="modal a-week-end-modal"><span class="a-kicker">结束本周任务</span><h2>确定不再继续自动运行吗？</h2><p>已生成的选题、正文和图片都会保留；结束后不会继续准备或发布，本周也不会自动续期。</p><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">继续使用</button><button class="btn btn-danger" data-action="end-week-automation">确认结束本周</button></div></div></div>`;
    this.render();
  }

  endWeekAutomation() {
    this.modal = null;
    this.update(state => {
      state.weeklyAutomation.status = "completed";
      state.weeklyAutomation.completedAt = new Date().toISOString();
      state.weekPlan.forEach(item => {
        if (["generating", "queued", "confirmed"].includes(item.status)) item.status = "topic-ready";
      });
      state.ui.view = "dashboard";
    });
    this.toast("本周自动运营已结束，任务不会自动续期");
  }

  viewPlanContent(id) {
    const item = this.state.weekPlan.find(plan => plan.id === id);
    if (!item) return;
    this.update(state => {
      const topic = state.topics.find(candidate => candidate.id === item.topicId) || state.topics[0];
      const draft = this.createLinkedRuleDraft(state, topic, Number(item.planRevision || 1));
      state.draft = {
        ...draft,
        title: item.title,
        body: item.body,
        imageIds: [...(item.imageIds || [])],
        imageLayout: clone(item.imageLayout || draft.imageLayout),
        status: "draft",
        source: "weekly-automation",
        scheduledAt: `${item.date}T${item.time}`
      };
      state.ui.view = "editor";
    });
    this.toast("已打开这一天的完整图文，可继续修改");
  }

  regeneratePlanDay(id) {
    const index = this.state.weekPlan.findIndex(item => item.id === id);
    if (index < 0) return;
    const previous = clone(this.state.weekPlan[index]);
    const candidatePlan = createWeekPlan(this.state, new Date(), { previousPlan: this.state.weekPlan });
    const replacement = candidatePlan[index] || candidatePlan.find(item => item.topicId !== previous.topicId);
    if (!replacement) return;
    this.update(state => {
      state.weekPlan[index] = {
        ...replacement,
        id: previous.id,
        date: previous.date,
        time: previous.time,
        platforms: previous.platforms?.length ? previous.platforms : replacement.platforms,
        planRevision: Number(previous.planRevision || 1) + 1
      };
      state.ui.selectedPlanId = previous.id;
    });
    this.toast(`已为${previous.date}更换选题和图片`);
  }

  togglePlanDay(id) {
    this.update(state => {
      const item = state.weekPlan.find(plan => plan.id === id);
      if (item) item.status = item.status === "skipped" ? "topic-ready" : "skipped";
    });
  }

  openPlanPlatforms(id) {
    const item = this.state.weekPlan.find(plan => plan.id === id);
    if (!item) return;
    const names = { douyin: ["抖音", "fa-music"], xiaohongshu: ["小红书", "fa-book"], wechatChannels: ["微信视频号", "fa-weixin"] };
    const selected = item.platforms || ["douyin"];
    this.modal = `<div class="modal-backdrop"><div class="modal a-plan-platform-modal"><span class="a-kicker">选择分发平台</span><h2>${escapeHtml(item.title)}</h2><p>同一选题会分别生成适合各平台的标题、正文和标签，不会直接复制同一份文案。</p><div class="a-platform-check-list">${Object.entries(names).map(([platform, [name, icon]]) => `<button class="${selected.includes(platform) ? "active" : ""}" data-action="toggle-plan-platform" data-id="${id}" data-platform="${platform}"><i class="fa ${icon}"></i><span><strong>${name}</strong><small>${platform === "douyin" ? "短标题 + 话题标签" : platform === "xiaohongshu" ? "搜索型标题 + 笔记结构" : "简洁描述 + 视频号话题"}</small></span><i class="fa ${selected.includes(platform) ? "fa-check-circle" : "fa-circle-o"}"></i></button>`).join("")}</div><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">完成</button></div></div></div>`;
    this.render();
  }

  togglePlanPlatform(id, platform) {
    this.update(state => {
      const item = state.weekPlan.find(plan => plan.id === id);
      if (!item) return;
      const current = new Set(item.platforms || ["douyin"]);
      if (current.has(platform) && current.size > 1) current.delete(platform);
      else current.add(platform);
      item.platforms = [...current];
    }, false);
    this.openPlanPlatforms(id);
  }

  confirmPlan() {
    if (!this.state.weekPlan.length) return;
    if (this.usesUserAExperience) {
      this.openWeekAutomationSetup();
      return;
    }
    this.update(state => {
      const records = state.weekPlan.map(item => ({ ...item, id: uid("record"), status: "scheduled", mode: "周计划", publishedAt: `${item.date} ${item.time}`, views: 0, likes: 0, comments: 0, shares: 0 }));
      state.records.unshift(...records);
      state.notifications.unshift({ id: uid("notice"), type: "success", title: "周计划已确认", detail: `${records.length} 条内容已进入待发布队列。`, read: false, createdAt: "刚刚" });
      state.weekPlan = [];
      state.ui.view = "records";
      state.ui.recordFilter = "scheduled";
      state.ui.publishSection = "pending";
    });
    this.toast("7 天计划已进入待发布队列");
  }

  generateWeekPlan() {
    const previousPlan = clone(this.state.weekPlan || []);
    const isRegeneration = previousPlan.length > 0;
    const configuredStart = this.state.weeklyAutomation?.startDate;
    const planBase = configuredStart ? new Date(`${configuredStart}T00:00:00`) : new Date();
    if (configuredStart) planBase.setDate(planBase.getDate() - 1);
    let revision = 1;
    let changedTopics = 0;
    let changedImages = 0;
    this.update(state => {
      const nextPlan = createWeekPlan(state, planBase, { previousPlan });
      revision = Number(nextPlan[0]?.planRevision || 1);
      if (isRegeneration) {
        changedTopics = nextPlan.filter((item, index) => item.topicId !== previousPlan[index]?.topicId || item.body !== previousPlan[index]?.body).length;
        changedImages = nextPlan.filter((item, index) => item.imageIds?.join("|") !== previousPlan[index]?.imageIds?.join("|")).length;
      }
      state.weekPlan = nextPlan;
      state.ui.selectedPlanId = nextPlan[0]?.id || null;
    });
    this.toast(isRegeneration
      ? `第 ${revision} 版已生成：${changedTopics} 天选题/文案变化，${changedImages} 天图片组合变化`
      : "未来 7 天计划已生成，可调整日期和时间");
  }

  retry(id) {
    this.update(state => {
      const record = state.records.find(item => item.id === id);
      if (record) { record.status = "reviewing"; record.error = null; record.publishedAt = `${localDate()} ${state.settings.defaultTime}`; }
      if (this.userEdition) state.ui.publishSection = "pending";
    });
    this.toast("已重新提交，当前状态为审核中");
  }

  inferMaterialCategory(filename = "") {
    const name = String(filename).toLowerCase();
    if (/餐|咖啡|早餐|茶|dining|coffee|breakfast/.test(name)) return "dining";
    if (/外观|门头|建筑|庭院|花园|exterior|facade|garden/.test(name)) return "exterior";
    if (/周边|景点|街|湖|山|poi|nearby|view/.test(name)) return "poi";
    if (/大厅|公区|泳池|走廊|前台|健身|lobby|public|pool/.test(name)) return "public";
    return "room";
  }

  compressUploadedImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("读取失败"));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("图片格式无法识别"));
        image.onload = () => {
          const maxEdge = 1600;
          const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async uploadMaterials(files) {
    const candidates = files.slice(0, 30);
    const existing = new Set(this.state.materials.map(item => item.uploadSignature).filter(Boolean));
    const accepted = [];
    let duplicateCount = 0;
    let failedCount = Math.max(0, files.length - candidates.length);
    for (const file of candidates) {
      if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) { failedCount += 1; continue; }
      const signature = `${file.name}:${file.size}:${file.lastModified}`;
      if (existing.has(signature)) { duplicateCount += 1; continue; }
      try {
        const digest = globalThis.crypto?.subtle
          ? await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer())
          : null;
        const fileHash = digest
          ? [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("")
          : signature;
        if (this.state.materials.some(item => item.fileHash === fileHash)) { duplicateCount += 1; continue; }
        const src = await this.compressUploadedImage(file);
        const hotelId = this.activeAccount()?.hotelId || this.state.otaSnapshot?.selectedHotelId || "";
        accepted.push({
          id: uid("material"),
          hotelId,
          category: this.inferMaterialCategory(file.name),
          src,
          title: file.name.replace(/\.[^.]+$/, ""),
          source: "商家自有上传",
          uploadSignature: signature,
          fileHash,
          visualGroupId: `upload:${fileHash}`,
          usageByPlatform: {},
          lastUsedAtByPlatform: {},
          coverUsedByPlatform: {},
          rightsConfirmed: true,
          used: 0,
          createdAt: localDate()
        });
        existing.add(signature);
      } catch {
        failedCount += 1;
      }
    }
    if (accepted.length) this.update(state => { state.materials.unshift(...accepted); });
    this.modal = `<div class="modal-backdrop"><div class="modal a-upload-result"><div class="a-complete-icon"><i class="fa fa-cloud-upload"></i></div><h2>图片入库完成</h2><p>已自动压缩图片并按文件名识别客房、餐饮、公区、外观或周边场景。创作时会参与智能检索和去重。</p><div><span><strong>${accepted.length}</strong><small>成功入库</small></span><span><strong>${duplicateCount}</strong><small>重复跳过</small></span><span><strong>${failedCount}</strong><small>格式或大小不合规</small></span></div><div class="alert alert-info"><i class="fa fa-shield"></i><div>上传即表示你确认图片为酒店自有或已获授权素材；当前原型将压缩图保存在本浏览器。</div></div><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">查看图库</button></div></div></div>`;
    this.render();
  }

  exportData() {
    const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `住得满AI新媒体备份_${localDate()}.json`; a.click();
    URL.revokeObjectURL(url);
    this.toast("备份已导出");
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const validation = validateImportedState(parsed);
        if (!validation.valid) throw new Error(validation.reason);
        this.store.replace(parsed);
        this.render();
        this.toast("备份导入成功");
      } catch (error) { this.toast(`导入失败：${error.message}`, "fa-exclamation-triangle"); }
    };
    reader.readAsText(file);
  }

  inferHotelType(hotel) {
    const source = `${hotel.name} ${hotel.themeTags} ${hotel.platformTags} ${hotel.facilities}`;
    if (/亲子|儿童乐园/.test(source)) return "亲子主题酒店";
    if (/温泉|私汤/.test(source)) return "温泉疗养酒店";
    if (/海景|海滨|洱海/.test(source)) return "海滨度假酒店";
    if (/青旅|青年旅舍/.test(source)) return "青年旅舍";
    if (/公寓/.test(source)) return "服务式公寓";
    if (/别墅|整租|独栋/.test(source)) return "别墅/私密整租";
    if (/艺术|设计/.test(source)) return "设计师/艺术酒店";
    if (/民宿|客栈|山居|小院/.test(source)) return "精品民宿";
    return "景区目的地酒店";
  }

  switchTestAccount(accountId) {
    if (accountId === this.state.activeAccountId) return;
    const target = this.state.testAccounts.find(account => account.id === accountId);
    if (!target) return;
    const previousId = this.state.activeAccountId;
    this.update(state => {
      state.accountWorkspaces[previousId] = this.captureWorkspace(state);
      state.activeAccountId = accountId;
    }, false);
    const saved = this.state.accountWorkspaces[accountId];
    if (saved) {
      this.update(state => {
        this.restoreWorkspace(state, saved);
        if (!state.activeTopic?.title && state.draft) {
          const topic = state.draft.topicContext
            || state.aiRecommendations.find(item => item.id === state.draft.topicId)
            || state.topics.find(item => item.id === state.draft.topicId)
            || { id: state.draft.topicId, title: state.draft.strategyTopicTitle || state.draft.title, type: state.draft.topicType, reason: state.draft.strategySummary, materialCategory: state.draft.materialCategory };
          state.activeTopic = normalizeTopicContext(topic, state.draft.source === "model" ? "ai-recommendation" : "rule-library");
          state.draft.topicContext = clone(state.activeTopic);
        }
        state.adapters.douyin.account = target.handle;
        if (!state.publishingPlatforms) state.publishingPlatforms = clone(DEFAULT_STATE.publishingPlatforms);
        state.publishingPlatforms.douyin.account = target.handle;
        state.ui.view = "dashboard";
      });
      this.toast(`已切换到测试账号：${target.name}`);
      return;
    }
    this.applyOtaHotel(target.hotelId, { navigate: false });
    const hotel = OTA_SNAPSHOT.hotels.find(item => item.id === target.hotelId);
    this.update(state => {
      state.records = this.seedRecordsForHotel(hotel);
      state.valueAdded = clone(DEFAULT_VALUE_ADDED_STATE);
      state.interactionCenter = clone(DEFAULT_INTERACTION_CENTER);
      state.adapters.douyin.account = target.handle;
      state.publishingPlatforms = clone(DEFAULT_STATE.publishingPlatforms);
      state.publishingPlatforms.douyin.account = target.handle;
      state.weekPlan = [];
      state.notifications = [{ id: uid("notice"), type: "success", title: "测试账号已初始化", detail: `${hotel.name} 的 OTA 信息和 ${hotel.images.length} 张图片已载入。`, read: false, createdAt: "刚刚" }];
      state.ui.view = "dashboard";
    });
    this.toast(`已切换到测试账号：${target.name}`);
  }

  applyOtaHotel(hotelId, options = {}) {
    const hotel = OTA_SNAPSHOT.hotels.find(item => item.id === String(hotelId));
    if (!hotel) { this.toast("未找到该酒店的抓取结果", "fa-exclamation-triangle"); return; }
    this.update(state => {
      state.otaSnapshot = { ...OTA_SNAPSHOT.meta, selectedHotelId: hotel.id, syncedAt: hotel.updatedAt || OTA_SNAPSHOT.meta.generatedAt };
      state.settings.brandName = hotel.name;
      state.settings.shortName = Array.from(hotel.name).slice(0, 12).join("");
      state.settings.hotelType = this.inferHotelType(hotel);
      state.settings.city = "大理";
      state.settings.address = hotel.address;
      state.settings.otaUrl = hotel.sourceUrl;
      const nearest = hotel.pois.slice(0, 5).map(item => `${item.name}${item.displayDistance}（${item.distanceType}）`).join("、");
      state.knowledge = {
        confirmed: false,
        completeness: Number.parseInt(hotel.completeness, 10) || 80,
        facts: [
          { id: uid("fact"), label: "酒店定位", value: [hotel.tier, hotel.themeTags, hotel.platformTags].filter(Boolean).join(" · ") || this.inferHotelType(hotel), source: "OTA抓取" },
          { id: uid("fact"), label: "酒店简介", value: hotel.summary || "待商家补充", source: "OTA抓取" },
          { id: uid("fact"), label: "详细地址", value: hotel.address, source: "OTA抓取" },
          { id: uid("fact"), label: "附近地标", value: nearest || hotel.landmarkSummary || "暂无", source: "OTA抓取" },
          { id: uid("fact"), label: "设施服务", value: [hotel.facilities, hotel.basicFacilities, hotel.services].filter(Boolean).join("；") || "待确认", source: "OTA抓取" }
        ]
      };
      const copyText = hotel.themeTags || hotel.summary || "待提炼商家卖点";
      const copyMaterial = { id: uid("material"), category: "copy", title: `OTA提取：${Array.from(copyText).slice(0, 60).join("")}`, source: "OTA抓取", used: 0, createdAt: hotel.updatedAt || localDate() };
      state.materials = hotel.images.map((image, index) => ({
        id: `ota_${hotel.id}_${image.id || index}`, category: image.category, src: resolveHotelImageSrc(hotel, image),
        title: image.title || `${hotel.name}素材`, source: image.source || "OTA抓取", used: 0,
        selected: image.featured, createdAt: hotel.updatedAt || localDate(), originalUrl: image.originalUrl
      })).concat(copyMaterial);
      state.adapters.ota = { status: "connected", provider: `OTA 抓取结果 · ${hotel.name}` };
      const topic = pickTopic(state.topics, state.settings.hotelType, state.records, []);
      state.draft = this.createLinkedRuleDraft(state, topic);
      state.publishForm = null;
      state.ui.view = options.navigate === false ? "dashboard" : "knowledge";
    });
    this.toast(`已载入 ${hotel.name} 的 OTA 抓取结果`);
  }
}

export function mountApp(root, options = {}) {
  if (!root) throw new Error("缺少应用挂载节点");
  return new App(root, options);
}
