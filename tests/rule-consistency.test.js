import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { CONTENT_IMAGE_LIMIT } from "../src/domain.js";
import { getRulesManifest, RULESET_VERSION } from "../src/skill-engine.js";

const root = process.cwd();
const read = path => readFileSync(join(root, path), "utf8");

test("规则文档版本与运行时版本一致", () => {
  const rules = read("AI_RULES.md");
  assert.match(rules, new RegExp(`规则版本：\`${RULESET_VERSION.replaceAll(".", "\\.")}\``));
});

test("八个 Skill 的界面默认提示使用完整 $skill-name", () => {
  const skillRoot = join(root, "skills");
  const skillIds = readdirSync(skillRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  assert.equal(skillIds.length, 8);
  for (const skillId of skillIds) {
    const yaml = read(`skills/${skillId}/agents/openai.yaml`);
    assert.match(yaml, new RegExp(`default_prompt: ".*\\$${skillId.replaceAll("-", "\\-")}.*"`));
  }
});

test("PRD、视觉 Skill 与运行时保持五图契约", () => {
  assert.equal(CONTENT_IMAGE_LIMIT, 5);
  const activeRules = [
    read("住得满AI内容助手_产品需求文档_PRD_v1.4.md"),
    read("AI_RULES.md"),
    read("skills/hotel-visual-director/SKILL.md"),
    read("skills/hotel-visual-director/references/visual-spec.md"),
    read("skills/hotel-visual-director/references/runtime-prompt.md")
  ].join("\n");

  assert.doesNotMatch(activeRules, /1[-–至]2张|2[-–至]5张|行动收束图/);
  assert.match(activeRules, /1张封面\s*\+\s*4张内容图|1 张封面\s*\+\s*4 张内容图/);
});

test("正式用户版使用方案 A 导航并将数据和服务归入对应模块", () => {
  const app = read("src/app.js");
  const prd = read("住得满AI内容助手_产品需求文档_PRD_v1.4.md");
  const userNav = app.match(/const USER_A_DESKTOP_NAV = \[([\s\S]*?)\n\];/)?.[1] || "";
  assert.match(userNav, /label: "首页"[\s\S]*label: "创作"[\s\S]*label: "内容"[\s\S]*label: "互动"[\s\S]*label: "我的"/);
  assert.doesNotMatch(userNav, /label: "发布"|label: "服务"|label: "数据"/);
  assert.match(prd, /首页、创作、内容、互动、我的/);
  assert.match(prd, /内容－数据/);
});

test("正式用户版作为系统入口落实五入口与移动端创作", () => {
  const html = read("user-a.html");
  const entry = read("src/entry-user.js");
  const app = read("src/app.js");
  const styles = read("src/styles-user-a.css");
  assert.match(html, /ui-user-a/);
  assert.match(html, /styles-user-a\.css/);
  assert.match(html, /entry-user\.js/);
  assert.doesNotMatch(html, /原型|方案 A/);
  assert.match(entry, /mountApp[\s\S]*edition: "user"/);
  assert.match(app, /const USER_A_DESKTOP_NAV/);
  assert.match(app, /label: "首页"[\s\S]*label: "创作"[\s\S]*label: "内容"[\s\S]*label: "互动"[\s\S]*label: "我的"/);
  assert.match(app, /form data-form="custom-topic"/);
  assert.match(app, /\["drafts", "草稿"[\s\S]*\["scheduled", "待发布"[\s\S]*\["published", "已发布"[\s\S]*\["insights", "数据"/);
  assert.match(app, /publishComplete/);
  assert.match(app, /a-recommendation-stage/);
  assert.match(app, /今日主推选题/);
  assert.match(app, /立即生成这条图文/);
  assert.match(app, /为什么推荐这个选题/);
  assert.match(app, /适合谁[\s\S]*内容怎么讲[\s\S]*素材基础/);
  assert.match(app, /USER_INTERNAL_TERM_PATTERN/);
  assert.match(app, /home-refresh-topics/);
  assert.match(app, /renderHomeGenerateLoadingModal/);
  assert.doesNotMatch(app.match(/renderUserADashboard\(\) \{[\s\S]*?\n  \}\n\n  renderUserV2Dashboard/)?.[0] || "", /a-progress-card|最近表现|常用工具/);
  assert.match(app, /默认留空，不替用户判断或自动勾选声明/);
  assert.match(app, /declaration: this\.userEditionA \? "" : "内容由AI辅助创作"/);
  assert.match(app, /renderRegenerateResultModal/);
  assert.match(app, /新版本已生成/);
  assert.match(styles, /a-mobile-creation-steps/);
  assert.match(styles, /a-mobile-nav button\.primary/);
  assert.match(styles, /a-regenerate-modal/);
  assert.match(styles, /a-topic-detail-drawer/);
  assert.match(styles, /a-alternative-list/);
  assert.match(styles, /a-topic-reason-panel/);
  assert.match(styles, /a-topic-action-panel/);
});

test("7天自动运营在我的中统一承载设置且保存不等于开启", () => {
  const app = read("src/app.js");
  const data = read("src/data.js");
  assert.match(app, /设置7天自动运营/);
  assert.match(app, /保存设置，稍后使用/);
  assert.match(app, /生成并预览本周计划/);
  assert.match(app, /确认开启本周自动运营/);
  assert.match(app, /系统会自动完成/);
  assert.doesNotMatch(app, /省心创作/);
  assert.match(data, /weeklyAutomation/);
  assert.match(data, /contentRules/);
  assert.match(data, /publishRules/);
});

test("工程版桌面保持独立，移动端复用正式用户版体验", () => {
  const html = read("index.html");
  const entry = read("src/entry-internal.js");
  const app = read("src/app.js");

  assert.match(entry, /edition: "internal"/);
  assert.match(html, /styles-user\.css/);
  assert.match(html, /styles-user-a\.css/);
  assert.match(app, /get userEdition\(\)[\s\S]*this\._userEdition \|\| this\.isInternalMobileSurface\(\)/);
  assert.match(app, /get userEditionA\(\)[\s\S]*this\._userEditionA \|\| this\.isInternalMobileSurface\(\)/);
  assert.match(app, /document\.body\.classList\.toggle\("ui-user", userSurface\)/);
  assert.match(app, /document\.body\.classList\.toggle\("ui-user-a", userSurface\)/);
  assert.match(app, /if \(this\.usesUserAExperience\) return this\.renderUserADashboard\(\)/);
  assert.match(app, /if \(this\.usesUserAExperience\) return this\.renderUserATopics\(\)/);
  assert.match(app, /if \(this\.usesUserAExperience\) return this\.renderUserARecords\(\)/);
  assert.match(app, /if \(this\.usesUserAExperience\) return this\.renderUserAMine\(\)/);
  assert.match(app, /const USER_A_MOBILE_NAV[\s\S]*label: "首页"[\s\S]*label: "内容"[\s\S]*label: "创作"[\s\S]*label: "互动"[\s\S]*label: "我的"/);

  const internalSidebar = app.match(/return `<aside class="sidebar">([\s\S]*?)<\/aside>`;/)?.[1] || "";
  assert.match(internalSidebar, /AI 新媒体/);
  assert.match(internalSidebar, /NAV\.slice\(0, 8\)/);
  assert.match(internalSidebar, /NAV\.slice\(8\)/);
});

test("设计审阅原型由正式用户版源码构建且不成为现役系统入口", () => {
  const builder = read("scripts/build-user-design-prototype.mjs");
  const prototype = read("住得满AI内容助手_正式用户版_设计审阅原型.html");
  const readme = read("README.md");
  assert.match(builder, /styles-user-a\.css/);
  assert.match(builder, /mountApp\(document\.getElementById\("app"\), \{ edition: "user" \}\)/);
  assert.match(prototype, /设计审阅原型/);
  assert.match(prototype, /立即生成这条图文/);
  assert.match(readme, /npm run build:design-prototype/);
});

test("双端交付版不包含内容运营中台且保留原工程版入口", () => {
  const internalEntry = read("src/entry-internal.js");
  assert.match(internalEntry, /edition: "internal"/);
  assert.equal(existsSync(join(root, "ops.html")), false);
  assert.equal(existsSync(join(root, "src/entry-ops.js")), false);
  assert.equal(existsSync(join(root, "src/ops-app.js")), false);
  assert.equal(existsSync(join(root, "src/styles-ops.css")), false);
});

test("规则中心列出的本地来源均存在", () => {
  const manifest = getRulesManifest();
  for (const source of manifest.skillSources) {
    assert.equal(existsSync(join(root, source.source)), true, `${source.name} 来源不存在：${source.source}`);
  }
});
