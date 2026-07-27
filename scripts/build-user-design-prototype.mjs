import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFileSync(resolve(root, path), "utf8");

const stripModuleSyntax = source => source
  .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "")
  .replace(/^export\s+\{[^}]+\};\s*$/gm, "")
  .replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, "");

const css = ["src/styles.css", "src/styles-user.css", "src/styles-user-a.css"]
  .map(read)
  .join("\n\n");

let runtime = [
  "src/data.js",
  "src/ota-snapshot.js",
  "src/domain.js",
  "src/store.js",
  "src/app.js"
].map(path => stripModuleSyntax(read(path))).join("\n\n");

runtime = runtime
  .replace('const BUNDLED_HOTEL_IDS = new Set(["514254", "878958", "6078734"]);', "const BUNDLED_HOTEL_IDS = new Set();")
  .replaceAll("zhudemax-ai-media-user-a-v1", "zhudemax-ai-media-design-review-v1");

const prototypeRuntime = `
// 设计审阅文件不连接接收方电脑上的本地 API，模型与抖音能力使用明确的本地规则演示。
App.prototype.refreshAiStatus = async function () {
  this.update(state => {
    state.adapters.ai.configured = true;
    state.adapters.ai.status = "demo";
    state.adapters.ai.model = "设计审阅 · 本地规则演示";
  });
};

App.prototype.refreshDouyinInteractionStatus = async function () {
  this.update(state => {
    state.adapters.douyin.status = "demo";
    state.adapters.douyin.interactionMode = "demo";
    state.adapters.douyin.interactionVerifiedAt = null;
  });
};

const designTopics = [
  {
    id: "design-topic-coffee",
    title: "自带豆还是用酒店的？海景房咖啡自由",
    type: "vertical",
    objective: "信任",
    targetAudience: "对咖啡品质有要求的数字游民或旅居客，关注客房内饮品自主权",
    displayReason: "把客房里的真实设施讲成可感知的入住体验，既有生活细节，也方便客人判断是否适合自己。",
    reason: "当前酒店资料与房间实拍可以支撑客房饮品体验主题。",
    contentAngle: "以客房咖啡机为生活支点，呈现旅居中饮品自主的掌控感与仪式感",
    materialCategory: "room",
    materialReadiness: "房间与水吧台实拍素材充足，可完成封面、环境、设施和细节画面",
    source: "ai-recommendation",
    score: 92
  },
  {
    id: "design-topic-arrival",
    title: "晚到大理，住古城里还是古城外？",
    type: "traffic",
    objective: "曝光",
    targetAudience: "晚班抵达、带行李或第一次到大理的游客",
    displayReason: "从抵达后的真实动线切入，帮助客人快速理解位置与入住便利性。",
    reason: "地址与周边地标资料可支撑抵达场景。",
    contentAngle: "用抵达时间、行李和次日路线三个问题讲清住宿位置选择",
    materialCategory: "exterior",
    materialReadiness: "外观、入口和周边实拍可支撑路线与到店场景",
    source: "ai-recommendation",
    score: 88
  },
  {
    id: "design-topic-family",
    title: "带娃住古城，房间之外还要看什么？",
    type: "marketing",
    objective: "转化",
    targetAudience: "带儿童出行、关注公共空间与服务细节的家庭客人",
    displayReason: "用家庭客人真正关心的空间和服务细节，降低预订前的信息不确定感。",
    reason: "亲子设施与公共空间资料可以支撑家庭入住主题。",
    contentAngle: "从孩子活动、家长休息和出行便利三个角度呈现家庭入住体验",
    materialCategory: "public",
    materialReadiness: "公共区域、亲子设施和客房实拍可组成完整五图",
    source: "ai-recommendation",
    score: 86
  }
];

App.prototype.recommendTopicsWithAi = async function (mode = "daily", returnView = "topics") {
  const ordered = mode === "swap" ? [designTopics[1], designTopics[2], designTopics[0]] : designTopics;
  this.update(state => {
    state.aiRecommendations = clone(ordered);
    state.lastAiRun = {
      stage: "design-review",
      model: "本地规则演示",
      generatedAt: new Date().toISOString(),
      strategySummary: "设计审阅文件使用固定可解释选题，系统版会调用现役模型。"
    };
    state.ui.view = returnView;
  });
  this.homeFeaturedTopicId = ordered[0].id;
  this.toast(mode === "swap" ? "已切换一组设计演示选题" : "已准备 3 个设计演示选题");
};

App.prototype.generateContentWithAi = async function (focusTopic, mode = "focus-topic") {
  if (!focusTopic?.title) return;
  const topicContext = normalizeTopicContext(focusTopic, "ai-recommendation");
  const variation = mode === "regenerate" ? Number(this.state.draft?.regenerationCount || 0) + 1 : 0;
  this.update(state => {
    const nextDraft = this.createLinkedRuleDraft(state, topicContext, variation);
    nextDraft.source = "design-review";
    nextDraft.model = "本地规则演示";
    nextDraft.regenerationCount = variation;
    state.draft = nextDraft;
    state.ui.view = "editor";
  });
  this.toast(mode === "regenerate" ? "已生成新的设计演示版本" : "已生成设计演示内容");
};

try {
  const key = "zhudemax-ai-media-design-review-v1";
  if (!globalThis.localStorage?.getItem(key)) {
    const state = clone(DEFAULT_STATE);
    state.onboardingCompleted = true;
    state.ui.view = "dashboard";
    state.aiRecommendations = clone(designTopics);
    state.adapters.ai.configured = true;
    state.adapters.ai.status = "demo";
    state.adapters.ai.model = "设计审阅 · 本地规则演示";
    globalThis.localStorage?.setItem(key, JSON.stringify(state));
  }
} catch (error) {
  console.warn("设计审阅原型初始化失败", error);
}

mountApp(document.getElementById("app"), { edition: "user" });`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="referrer" content="no-referrer">
  <meta name="theme-color" content="#0f766e">
  <meta name="description" content="住得满 AI 内容助手正式用户版设计审阅原型">
  <title>住得满 · AI 内容助手 · 设计审阅原型</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css">
  <style>${css}</style>
</head>
<body class="ui-user ui-user-a">
  <noscript>本原型需要启用 JavaScript。</noscript>
  <div id="app" aria-live="polite"></div>
  <script>(() => {\n${runtime}\n${prototypeRuntime}\n})();<\/script>
</body>
</html>`;

const output = "住得满AI内容助手_正式用户版_设计审阅原型.html";
writeFileSync(resolve(root, output), html, "utf8");
console.log(`已生成 ${output}`);
