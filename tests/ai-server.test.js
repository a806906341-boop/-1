import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSystemPrompt, buildUserPrompt, getRulesManifest,
  contentSimilarity, normalizeContentOutput, normalizeTopicOutput, parseModelJson, resolveStaticRoute, validateDouyinInteractionConfig, validateModelConfig
} from "../server.mjs";
import { STAGES, resolveExecutionPlan, SKILL_REGISTRY } from "../src/skill-engine.js";
import { extractTerms, retrieveStageContext } from "../src/rag-engine.js";

const payload = {
  mode: "daily",
  accountId: "account-one",
  hotelId: "514254",
  settings: { brandName: "测试酒店", city: "大理", hotelType: "精品民宿", voice: "克制真实" },
  locationContext: { hotelId: "514254", name: "测试酒店", address: "云南大理市古城测试路1号", city: "大理", latitude: 25.68, longitude: 100.16, coordinateText: "纬度 25.68，经度 100.16", source: "OTA抓取", platformPoiId: null, status: "pending-platform-match" },
  knowledge: {
    facts: [
      { label: "位置", value: "大理古城附近", source: "OTA" },
      { label: "房型", value: "设有庭院大床房", source: "OTA" },
      { label: "早餐", value: "提供本地风味早餐", source: "商家确认" },
      { label: "今日价格", value: "500元", source: "人工" },
      ...Array.from({ length: 10 }, (_, index) => ({ label: `设施${index}`, value: `酒店设施说明${index}`, source: "OTA" }))
    ]
  },
  materials: [
    { id: "room-a", category: "room", title: "庭院大床房全景", source: "酒店实拍", used: 0 },
    { id: "room-b", category: "room", title: "床品细节", source: "酒店实拍", used: 2 },
    { id: "public-a", category: "public", title: "公共庭院", source: "酒店实拍", used: 0 },
    ...Array.from({ length: 15 }, (_, index) => ({ id: `extra-${index}`, category: "exterior", title: `建筑外观${index}`, source: "OTA", used: index }))
  ],
  records: Array.from({ length: 12 }, (_, index) => ({
    id: `record-${index}`, title: index ? `历史内容${index}` : "庭院房实拍",
    body: "真实空间和入住体验", topicType: index % 2 ? "traffic" : "vertical",
    status: "published", views: 100 + index * 20, likes: 10, comments: 2, shares: 1,
    imageIds: index === 0 ? ["room-b"] : []
  }))
};

test("本地服务只保留工程版和正式用户版两个现役入口", () => {
  assert.deepEqual(resolveStaticRoute("/"), { kind: "file", relative: "/index.html" });
  assert.deepEqual(resolveStaticRoute("/user-a.html"), { kind: "file", relative: "/user-a.html" });
  assert.deepEqual(resolveStaticRoute("/ops.html"), { kind: "historical" });
  assert.deepEqual(resolveStaticRoute("/user.html"), { kind: "redirect", location: "/user-a.html" });
  assert.deepEqual(resolveStaticRoute("/user-v2.html"), { kind: "redirect", location: "/user-a.html" });
  assert.deepEqual(resolveStaticRoute("/住得满AI新媒体_产品原型_v1.3.html"), { kind: "historical" });
});

test("通义千问配置只允许阿里云官方 HTTPS 接口", () => {
  const valid = validateModelConfig({
    apiKey: "sk-test-key-not-real",
    baseUrl: "https://example.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    model: "qwen3.7-max-2026-06-08"
  });
  assert.equal(valid.model, "qwen3.7-max-2026-06-08");
  assert.throws(() => validateModelConfig({ apiKey: "sk-test-key-not-real", baseUrl: "http://evil.test/v1", model: valid.model }));
});

test("抖音互动适配器只接受完整的 HTTPS 网关配置", () => {
  const valid = validateDouyinInteractionConfig({ gatewayUrl: "https://gateway.example.com/douyin", accessToken: "token-test", clientKey: "client-test" });
  assert.equal(valid.gatewayUrl, "https://gateway.example.com/douyin");
  assert.throws(() => validateDouyinInteractionConfig({ gatewayUrl: "http://gateway.example.com", accessToken: "token", clientKey: "client" }));
  assert.throws(() => validateDouyinInteractionConfig({ gatewayUrl: "https://gateway.example.com", accessToken: "", clientKey: "client" }));
});

test("选题阶段只装载选题技能，不装载内容、视觉和审核技能", () => {
  const prompt = buildSystemPrompt(STAGES.TOPIC);
  assert.match(prompt, /【hotel-topic-strategy】/);
  assert.match(prompt, /不得输出 content 字段/);
  assert.doesNotMatch(prompt, /【hotel-content-production】/);
  assert.doesNotMatch(prompt, /【hotel-visual-director】/);
  assert.doesNotMatch(prompt, /【hotel-compliance-review】/);
  assert.ok(prompt.length < 4000);
});

test("内容阶段只装载内容、视觉与审核技能，不重新执行选题", () => {
  const prompt = buildSystemPrompt(STAGES.CONTENT);
  assert.match(prompt, /【hotel-content-production】/);
  assert.match(prompt, /【hotel-visual-director】/);
  assert.match(prompt, /【hotel-compliance-review】/);
  assert.match(prompt, /不得输出 recommendations 字段/);
  assert.doesNotMatch(prompt, /【hotel-topic-strategy】/);
  assert.ok(prompt.length < 5000);
});

test("选题 RAG 只挂载 Top-K 事实、历史和素材聚合，不挂载单图", () => {
  const context = retrieveStageContext({ ...payload, rejectedTopics: [{ id: "old-1", title: "第一次来大理住宿怎么选", targetAudience: "首次到访游客" }] }, STAGES.TOPIC);
  assert.equal(context.account.accountId, "account-one");
  assert.ok(context.retrievedEvidence.length <= 8);
  assert.ok(context.retrievedHistory.length <= 8);
  assert.equal(context.materialCandidates.length, 0);
  assert.ok(context.materialInventory.length <= 5);
  assert.equal(context.retrieval.sourceCounts.materialsAvailable, 18);
  assert.equal(context.rejectedTopics[0].title, "第一次来大理住宿怎么选");
  const prompt = buildUserPrompt(STAGES.TOPIC, payload);
  assert.match(prompt, /测试酒店/);
  assert.doesNotMatch(prompt, /room-a/);
});

test("内容 RAG 围绕已选题目召回事实、相似历史与最多12张候选图", () => {
  const contentPayload = {
    ...payload,
    mode: "focus-topic",
    focusTopic: { id: "topic-1", title: "庭院大床房真实入住", type: "vertical", objective: "信任", targetAudience: "情侣游客", reason: "展示房间", materialCategory: "room" }
  };
  const context = retrieveStageContext(contentPayload, STAGES.CONTENT);
  assert.ok(context.retrievedEvidence.length <= 10);
  assert.ok(context.retrievedHistory.length <= 5);
  assert.ok(context.materialCandidates.length <= 12);
  assert.equal(context.materialCandidates[0].category, "room");
  assert.ok(context.materialCandidates.some(item => item.materialId === "room-a"));
  assert.equal(context.materialCandidates.find(item => item.materialId === "room-a").recentlyUsed, false);
  assert.ok(!context.materialCandidates.some(item => item.materialId === "room-b"));
  assert.equal(context.retrieval.mediaDedupWindow, 10);
  assert.equal(context.retrieval.coverDedupWindow, 8);
  assert.equal(context.locationContext.name, "测试酒店");
  assert.equal(context.locationContext.status, "pending-platform-match");
  assert.ok(extractTerms("庭院大床房").length > 0);
});

test("选题模型输出只规范化三条 recommendation", () => {
  const raw = parseModelJson("```json\n{\"strategySummary\":\"策略\",\"executionTrace\":{\"skills\":[\"hotel-topic-strategy\"]},\"recommendations\":[{\"title\":\"方向一\",\"type\":\"traffic\",\"objective\":\"曝光\",\"targetAudience\":\"初到大理游客\",\"reason\":\"位置事实\"},{\"title\":\"方向二\",\"type\":\"vertical\"},{\"title\":\"方向三\",\"type\":\"marketing\"}]}\n```");
  const result = normalizeTopicOutput(raw);
  assert.equal(result.recommendations.length, 3);
  assert.equal(result.recommendations[0].source, "ai");
  assert.deepEqual(result.executionTrace.skills, ["hotel-topic-strategy"]);
  assert.equal("content" in result, false);
});

test("正式用户选题字段会拦截模型内部检索术语", () => {
  const result = normalizeTopicOutput({ recommendations: [
    { title: "咖啡机体验", type: "traffic", displayReason: "fact-1支持", targetAudience: "rejectedTopics目标", contentAngle: "RAG证据", materialReadiness: "materialInventory中101张" },
    { title: "庭院慢生活", type: "vertical" },
    { title: "古城住宿清单", type: "marketing" }
  ] });
  const recommendation = result.recommendations[0];
  for (const value of [recommendation.displayReason, recommendation.targetAudience, recommendation.contentAngle, recommendation.materialReadiness]) {
    assert.doesNotMatch(value, /fact-|materialInventory|rejectedTopics|RAG/i);
  }
});

test("换一组会拒绝与上一轮相同或互为包含关系的标题", () => {
  const raw = {
    recommendations: [
      { title: "第一次来大理住宿怎么选", type: "traffic" },
      { title: "院落里的慢生活", type: "vertical" },
      { title: "出发前住宿清单", type: "marketing" }
    ]
  };
  assert.throws(() => normalizeTopicOutput(raw, {
    rejectedTopics: [{ title: "第一次来大理，住宿怎么选更省心" }]
  }), /模型返回重复选题/);
});

test("内容模型输出执行长度、事实、素材白名单和发布门禁校验", () => {
  const focusTopic = { id: "topic-1", title: "庭院大床房真实入住", type: "vertical", objective: "信任", targetAudience: "情侣游客", reason: "展示房间", materialCategory: "room" };
  const contentPayload = { ...payload, focusTopic };
  const rag = retrieveStageContext(contentPayload, STAGES.CONTENT);
  const fiveCandidates = rag.materialCandidates.slice(0, 5).map(item => item.materialId);
  const raw = {
    executionTrace: { skills: ["hotel-content-production", "hotel-visual-director"] },
    content: {
      title: "这是一个超过二十个中文字符的标题需要被系统截断处理",
      body: "如果你准备到大理古城旅行，可以先看清住宿位置、房间空间和公共区域是否符合同行人的需要。这里用当前酒店的真实图片呈现院落、客房和周边动线，不使用夸张滤镜替你做决定。建议结合出行人数、抵达方式和当天路线查看详情，再决定是否收藏或安排入住。",
      tags: ["大理", "民宿", "旅行"], materialCategory: "room",
      materialIds: [fiveCandidates[0], "not-retrieved", ...fiveCandidates.slice(1)], coverText: "住进大理庭院",
      hook: "先看真实房间", cta: "收藏备用", factReferences: ["房型｜OTA"],
      claimEvidence: [{ claim: "庭院大床房", evidence: "房型｜OTA" }],
      imagePlan: fiveCandidates.map((materialId, index) => ({
        order: index + 1, materialId, category: "room",
        purpose: index ? "内容证据" : "封面主题",
        cropMode: "3:4主体居中", selectionReason: "主题匹配"
      })),
      shotPlan: [{ order: 1, scene: "房间全景" }]
    }
  };
  const result = normalizeContentOutput(raw, contentPayload, focusTopic, rag);
  assert.ok(Array.from(result.content.title).length <= 20);
  assert.ok(Array.from(result.content.body).length >= 100);
  assert.ok(Array.from(result.content.body).length <= 140);
  assert.deepEqual(result.content.tags, ["#大理", "#民宿", "#旅行"]);
  assert.deepEqual(result.content.materialIds, fiveCandidates);
  assert.equal(result.content.imagePlan[0].materialId, fiveCandidates[0]);
  assert.equal(result.content.location.address, "云南大理市古城测试路1号");
  assert.equal(result.content.location.status, "pending-platform-match");
  assert.ok(result.content.risk);
  assert.ok(result.content.selfReview.qualityScore > 0);
  assert.equal("recommendations" in result, false);

  const sixCandidates = rag.materialCandidates.slice(0, 6).map(item => item.materialId);
  const capped = normalizeContentOutput({
    ...raw,
    content: {
      ...raw.content,
      materialIds: sixCandidates,
      imagePlan: sixCandidates.map((materialId, index) => ({ order: index + 1, materialId, category: "room", purpose: index ? "内容图" : "封面主题" }))
    }
  }, contentPayload, focusTopic, rag);
  assert.equal(capped.content.materialIds.length, 5);
  assert.equal(capped.content.imagePlan.length, 5);
  assert.equal(capped.content.selfReview.scoreBreakdown.brand, 10);
  assert.equal(capped.content.selfReview.scoreBreakdown.material, 15);
  assert.equal(capped.content.selfReview.qualityScore, 100);
});

test("内容模型正文不足100字时拒绝进入发布链路", () => {
  const focusTopic = { title: "庭院大床房真实入住", materialCategory: "room" };
  const contentPayload = { ...payload, focusTopic };
  const rag = retrieveStageContext(contentPayload, STAGES.CONTENT);
  assert.throws(() => normalizeContentOutput({ content: { title: "短正文", body: "只有一句很短的正文。", materialIds: ["room-a"] } }, contentPayload, focusTopic, rag), /要求100至140字/);
});

test("内容服务端拒绝少于固定五图的模型结果", () => {
  const focusTopic = { title: "庭院大床房真实入住", materialCategory: "room" };
  const contentPayload = { ...payload, focusTopic };
  const rag = retrieveStageContext(contentPayload, STAGES.CONTENT);
  const raw = {
    content: {
      title: "庭院房真实入住",
      body: "如果你准备到大理古城旅行，可以先看清住宿位置、房间空间和公共区域是否符合同行人的需要。这里用当前酒店的真实图片呈现院落、客房和周边动线，不使用夸张滤镜替你做决定。建议结合出行人数、抵达方式和当天路线查看详情，再决定是否收藏或安排入住。",
      materialIds: rag.materialCandidates.slice(0, 4).map(item => item.materialId)
    }
  };
  assert.throws(() => normalizeContentOutput(raw, contentPayload, focusTopic, rag), error => error.code === "CONTENT_MATERIALS");
});

test("重新生成与上一版高度相似时拒绝并保留地点定位", () => {
  const focusTopic = { title: "庭院大床房真实入住", materialCategory: "room" };
  const previousBody = "如果你准备到大理古城旅行，可以先看清住宿位置、房间空间和公共区域是否符合同行人的需要。这里用当前酒店的真实图片呈现院落、客房和周边动线，不使用夸张滤镜替你做决定。建议结合出行人数、抵达方式和当天路线查看详情，再决定是否收藏或安排入住。";
  const basePayload = { ...payload, mode: "regenerate", focusTopic };
  const preliminaryRag = retrieveStageContext(basePayload, STAGES.CONTENT);
  const fiveCandidates = preliminaryRag.materialCandidates.slice(0, 5).map(item => item.materialId);
  const contentPayload = { ...basePayload, previousContent: { title: "相同标题", body: previousBody, materialIds: fiveCandidates } };
  const rag = retrieveStageContext(contentPayload, STAGES.CONTENT);
  assert.equal(rag.previousContent.body, previousBody);
  assert.throws(() => normalizeContentOutput({ content: { title: "相同标题", body: previousBody, materialIds: fiveCandidates } }, contentPayload, focusTopic, preliminaryRag), /未形成实质变化/);
  assert.equal(contentSimilarity(previousBody, previousBody), 1);
});

test("规则中心完整展示八个治理 Skill、四个阶段提示词和 RAG 策略", () => {
  const manifest = getRulesManifest();
  assert.equal(manifest.architecture, "staged-skills-local-rag-v1");
  assert.equal(manifest.skills.length, 8);
  assert.equal(SKILL_REGISTRY.length, 8);
  assert.equal(manifest.stagePrompts.length, 4);
  assert.ok(manifest.skills.every(item => item.instructions.length > 300 && item.referenceText.length > 300 && item.runtimePrompt.length > 30));
  assert.match(manifest.ragPolicy.topic, /Top 8/);
  assert.match(manifest.ragPolicy.content, /Top 12/);
  assert.ok(manifest.skillSources.some(item => item.name === "产品 PRD v1.4"));
  assert.ok(manifest.skillSources.some(item => item.name === "大理 100 家酒店 OTA 快照"));
  assert.equal(manifest.skillSources.some(item => item.source === "hotel-social-media/SKILL.md"), false);
});

test("四类任务的技能计划隔离且始终经过总编排", () => {
  const topic = resolveExecutionPlan(STAGES.TOPIC);
  const content = resolveExecutionPlan(STAGES.CONTENT);
  const publish = resolveExecutionPlan(STAGES.PUBLISH);
  const performance = resolveExecutionPlan(STAGES.PERFORMANCE);
  assert.equal(topic[0], "hotel-media-orchestrator");
  assert.ok(topic.includes("hotel-topic-strategy"));
  assert.ok(!topic.includes("hotel-content-production"));
  assert.ok(content.includes("hotel-content-production"));
  assert.ok(!content.includes("hotel-topic-strategy"));
  assert.ok(publish.includes("douyin-publish-completion"));
  assert.ok(performance.includes("hotel-performance-loop"));
});

test("易变事实在 RAG 结果中显式标记为人工确认", () => {
  const context = retrieveStageContext({
    ...payload,
    focusTopic: { title: "今日价格说明", type: "marketing", materialCategory: "room" }
  }, STAGES.CONTENT);
  const price = context.retrievedEvidence.find(item => item.label === "今日价格");
  assert.equal(price?.mutable, true);
  assert.equal(context.materialInventory.find(item => item.category === "room")?.unusedCount, 1);
});
