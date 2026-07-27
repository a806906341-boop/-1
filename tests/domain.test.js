import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INTERACTION_CENTER, DEFAULT_STATE, HOTEL_TYPES, VALUE_ADDED_SERVICE_CATALOG } from "../src/data.js";
import {
  assessRisk, BODY_MAX, BODY_MIN, buildTopicFingerprint, charCount, clone, computeContentWorkflow, computeDashboard,
  CONTENT_IMAGE_LIMIT, createWeekPlan, deriveMineOverview, detectPeak, evaluateContentReuseRisk, generateContent,
  normalizeTopicContext, optimizeImageSelection, pickTopic, rankMaterialPool, suggestInteractionReply,
  validateImportedState, validateRegeneration
} from "../src/domain.js";

test("生成内容正文约120字并引用商家信息", () => {
  const state = clone(DEFAULT_STATE);
  const topic = pickTopic(state.topics, state.settings.hotelType, state.records);
  const content = generateContent(state, topic);
  assert.ok(charCount(content.body) >= BODY_MIN);
  assert.ok(charCount(content.body) <= BODY_MAX);
  assert.ok(content.body.includes(state.settings.shortName) || content.body.includes(state.settings.city));
  assert.equal(content.imageIds.length, CONTENT_IMAGE_LIMIT);
  assert.equal(new Set(content.imageIds).size, content.imageIds.length);
  assert.equal(content.imageLayout[0].role, "封面主题");
});

test("选题上下文完整保留到内容生成链路", () => {
  const context = normalizeTopicContext({
    id: "ai-topic-2", title: "带娃住大理先看儿童用品", type: "vertical", objective: "建立信任",
    targetAudience: "亲子家庭", reason: "酒店有儿童用品事实", contentAngle: "用品清单与入住决策", materialCategory: "room", score: 91
  }, "ai-recommendation");
  assert.equal(context.id, "ai-topic-2");
  assert.equal(context.title, "带娃住大理先看儿童用品");
  assert.equal(context.targetAudience, "亲子家庭");
  assert.equal(context.materialCategory, "room");
  assert.equal(context.source, "ai-recommendation");
  assert.equal(normalizeTopicContext({ title: "模型选题", source: "ai" }).source, "ai-recommendation");
});

test("我的页面摘要复用现有工作流而不是创建独立任务状态", () => {
  const state = clone(DEFAULT_STATE);
  state.adapters.ai.configured = true;
  state.aiRecommendations = [{ id: "mine-topic", title: "今天的酒店选题" }];
  const recommended = deriveMineOverview(state);
  assert.equal(recommended.assistant.action.view, "dashboard");
  assert.match(recommended.assistant.title, /推荐选题/);

  state.activeTopic = { id: "mine-topic", title: "今天的酒店选题" };
  state.draft = { id: "draft-mine", topicId: "mine-topic", topicContext: state.activeTopic, title: "待确认内容", imageIds: ["m01", "m02", "m03", "m04", "m05"] };
  state.contentGenerationJob = { status: "completed" };
  const contentReady = deriveMineOverview(state);
  assert.equal(contentReady.assistant.action.view, "editor");
  assert.match(contentReady.assistant.title, /等待确认/);
});

test("我的页面增长服务推荐读取素材和经营连接缺口", () => {
  const state = clone(DEFAULT_STATE);
  state.adapters.ai.configured = true;
  const connectionGap = deriveMineOverview(state);
  assert.equal(connectionGap.serviceRecommendation.id, "local-life-operations");

  state.materials = state.materials.filter(item => item.src).slice(0, 3);
  const materialGap = deriveMineOverview(state);
  assert.equal(materialGap.serviceRecommendation.id, "video-production");
});

test("工作台生产状态随推荐、确认、生成和发布补全推进", () => {
  const state = clone(DEFAULT_STATE);
  state.draft = null;
  state.activeTopic = null;
  assert.equal(computeContentWorkflow(state).stage, "knowledge-ready");
  state.aiRecommendations = [{ id: "ai-1", title: "停车攻略" }];
  assert.equal(computeContentWorkflow(state).stage, "topic-recommendation");
  state.activeTopic = { id: "ai-1", title: "停车攻略", source: "ai-recommendation" };
  state.contentGenerationJob = { status: "generating", topicId: "ai-1" };
  assert.equal(computeContentWorkflow(state).stage, "content-generating");
  state.draft = { topicId: "ai-1", topicContext: { id: "ai-1", title: "停车攻略" } };
  state.contentGenerationJob = { status: "completed", topicId: "ai-1" };
  assert.equal(computeContentWorkflow(state).stage, "content-confirmation");
  state.publishForm = { title: "停车不绕路", imageIds: ["m01"] };
  assert.equal(computeContentWorkflow(state).stage, "publish-completion");
});

test("自动选图允许受控复用并满足近期组合约束", () => {
  const state = clone(DEFAULT_STATE);
  state.records[0].imageIds = ["m04", "m07", "m10"];
  state.records[0].coverId = "m04";
  const visual = optimizeImageSelection(state, { preferredCategory: "room", requestedIds: ["m04", "m03", "m05"], avoidIds: ["m03"], limit: 6 });
  assert.equal(visual.imageIds.length, CONTENT_IMAGE_LIMIT);
  assert.equal(new Set(visual.imageIds).size, visual.imageIds.length);
  assert.notEqual(visual.imageIds[0], "m04");
  assert.ok(visual.imageSelectionMeta.selectedFreshCount >= 2);
  assert.ok(visual.imageSelectionMeta.maxRecentOverlap <= 2);
  assert.equal(visual.imageLayout.length, visual.imageIds.length);
  assert.equal(visual.imageLayout[0].aspectRatio, "3:4");
});

test("同平台历史五图完全相同时阻断发布", () => {
  const state = clone(DEFAULT_STATE);
  const imageIds = ["m01", "m03", "m06", "m09", "m10"];
  state.records = [{
    id: "history-same", platform: "douyin", status: "published", publishedAt: "2026-07-23 19:30",
    title: "旧标题", body: "旧正文", imageIds, coverId: imageIds[0], topicFingerprint: "旧方向"
  }];
  const risk = evaluateContentReuseRisk(state, {
    title: "新的酒店内容", body: "这是完全不同的正文表达，用于验证图片组合重复时仍会被确定性门禁阻断。",
    imageIds, topicFingerprint: "新方向"
  }, { platform: "douyin" });
  assert.equal(risk.level, "blocked");
  assert.equal(risk.metrics.identicalFiveImageSet, true);
});

test("同平台近期重合三图时自动要求修复而非直接发布", () => {
  const state = clone(DEFAULT_STATE);
  state.records = [{
    id: "history-three", platform: "douyin", status: "published", publishedAt: "2026-07-23 19:30",
    title: "旧标题", body: "旧正文", imageIds: ["m01", "m03", "m06", "m07", "m08"], coverId: "m01"
  }];
  const risk = evaluateContentReuseRisk(state, {
    title: "全新标题", body: "这是一段全新的酒店正文，信息组织和表达均与历史内容不同。",
    imageIds: ["m02", "m03", "m06", "m07", "m09"], topicFingerprint: "新方向"
  }, { platform: "douyin" });
  assert.equal(risk.level, "repair");
  assert.equal(risk.metrics.maxImageOverlap, 3);
});

test("同篇文件签名重复时阻断发布", () => {
  const state = clone(DEFAULT_STATE);
  state.records = [];
  const imageIds = ["m01", "m02", "m03", "m04", "m05"];
  state.materials.find(item => item.id === "m02").fileHash = state.materials.find(item => item.id === "m01").fileHash;
  const risk = evaluateContentReuseRisk(state, {
    title: "客房真实体验", body: "用五张真实图片介绍客房空间、细节和入住动线。",
    imageIds, topicFingerprint: "客房|自由行|入住|空间"
  }, { platform: "douyin" });
  assert.equal(risk.level, "blocked");
  assert.ok(risk.reasons.some(reason => reason.includes("文件内容相同")));
});

test("五图少于四个视觉组时阻断发布", () => {
  const state = clone(DEFAULT_STATE);
  state.records = [];
  const imageIds = ["m01", "m02", "m03", "m04", "m05"];
  imageIds.forEach((id, index) => {
    const item = state.materials.find(material => material.id === id);
    item.fileHash = `file-${index}`;
    item.visualGroupId = index < 3 ? "same-room-angle" : `scene-${index}`;
  });
  const risk = evaluateContentReuseRisk(state, {
    title: "客房真实体验", body: "用五张真实图片介绍客房空间、细节和入住动线。",
    imageIds, topicFingerprint: "客房|自由行|入住|空间"
  }, { platform: "douyin" });
  assert.equal(risk.level, "blocked");
  assert.equal(risk.metrics.visualGroupCount, 3);
});

test("换一版必须更换封面、至少两图、标题和首句", () => {
  const previous = {
    title: "古城旁边怎么住", body: "先看位置，再看房间和公共区域。后面补充入住建议。",
    imageIds: ["m01", "m02", "m03", "m04", "m05"]
  };
  const valid = validateRegeneration(previous, {
    title: "住进院落的慢生活", body: "喜欢安静院落的人，可以先确认真实空间。再结合路线判断是否适合。",
    imageIds: ["m06", "m02", "m07", "m04", "m08"]
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.metrics.changedImageCount, 3);
  const invalid = validateRegeneration(previous, { ...previous });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.reasons.length >= 4);
});

test("选题指纹由卖点、人群、场景和角度组成", () => {
  const fingerprint = buildTopicFingerprint({
    objective: "咖啡机", targetAudience: "数字游民", scene: "客房休息", contentAngle: "饮品自主"
  });
  assert.match(fingerprint, /咖啡机\|数字游民\|客房休息\|饮品自主/);
});

test("内容素材池支持智能排序、近期使用标记和检索", () => {
  const state = clone(DEFAULT_STATE);
  state.records[0].imageIds = ["m04"];
  const ranked = rankMaterialPool(state, {
    selectedIds: ["m05"], preferredCategory: "room", filter: "recommended", sort: "smart", limit: 24
  });
  assert.equal(ranked.items[0].id, "m05");
  assert.equal(ranked.items.find(item => item.id === "m04")?.recentlyUsed, true);
  assert.equal(ranked.selectedCategoryCount, 1);
  const searched = rankMaterialPool(state, { filter: "all", query: "古城", limit: 24 });
  assert.ok(searched.items.length >= 2);
  assert.ok(searched.items.every(item => item.title.includes("古城")));
});

test("手动换一组图片时优先避开当前整组素材", () => {
  const state = clone(DEFAULT_STATE);
  state.records = [];
  state.materials = Array.from({ length: 12 }, (_, index) => ({
    id: `img-${index + 1}`, category: "room", src: `./${index + 1}.jpg`, title: `房间${index + 1}`, source: "测试", used: 0
  }));
  const previous = state.materials.slice(0, 6).map(item => item.id);
  const visual = optimizeImageSelection(state, { preferredCategory: "room", avoidIds: previous, limit: 6 });
  assert.equal(visual.imageIds.filter(id => previous.includes(id)).length, 0);
  assert.equal(visual.imageSelectionMeta.avoidedPreviousCount, 6);
});

test("极限词触发高风险并阻止发布", () => {
  const result = assessRisk({ title: "全网最低的唯一民宿", body: "百分百满意", imageAuthenticity: "real" });
  assert.equal(result.level, "high");
  assert.equal(result.passed, false);
  assert.ok(result.issues.length >= 3);
});

test("易变信息触发确认但不直接阻断", () => {
  const result = assessRisk({ title: "暑期套餐", body: "今日特价，房态仅剩一间", imageAuthenticity: "real" });
  assert.equal(result.level, "medium");
  assert.equal(result.passed, true);
});

test("第一次不是绝对化第一宣称", () => {
  const result = assessRisk({ title: "第一次来大理", body: "先去古城散步", imageAuthenticity: "real" });
  assert.equal(result.level, "safe");
  assert.equal(assessRisk({ title: "到大理的第一晚", body: "先休息", imageAuthenticity: "real" }).level, "safe");
});

test("7 天计划日期唯一且包含三类内容", () => {
  const state = clone(DEFAULT_STATE);
  const plan = createWeekPlan(state, new Date("2026-07-16T10:00:00+08:00"));
  assert.equal(plan.length, 7);
  assert.equal(new Set(plan.map(item => item.date)).size, 7);
  assert.deepEqual(plan.reduce((counts, item) => ({ ...counts, [item.topicType]: (counts[item.topicType] || 0) + 1 }), {}), { traffic: 4, vertical: 2, marketing: 1 });
  assert.ok(plan.every(item => item.time === state.settings.defaultTime));
  assert.ok(plan.every(item => item.planRevision === 1));
});

test("周计划重新生成会换版并保留人工调整的日期时间", () => {
  const state = clone(DEFAULT_STATE);
  const first = createWeekPlan(state, new Date("2026-07-16T10:00:00+08:00"));
  first[0].date = "2026-07-30";
  first[0].time = "21:15";
  state.weekPlan = first;
  const second = createWeekPlan(state, new Date("2026-07-16T10:00:00+08:00"), { previousPlan: first });
  const changedDays = second.filter((item, index) => item.topicId !== first[index].topicId || item.body !== first[index].body);
  assert.equal(second[0].planRevision, 2);
  assert.equal(second[0].date, "2026-07-30");
  assert.equal(second[0].time, "21:15");
  assert.ok(changedDays.length >= 5);
  assert.deepEqual(second.reduce((counts, item) => ({ ...counts, [item.topicType]: (counts[item.topicType] || 0) + 1 }), {}), { vertical: 2, traffic: 4, marketing: 1 });
});

test("全部 15 类酒店都有可用的三类通用选题", () => {
  for (const hotelType of HOTEL_TYPES) {
    const eligible = DEFAULT_STATE.topics.filter(topic => topic.hotelTypes.includes(hotelType));
    assert.deepEqual(new Set(eligible.map(topic => topic.type)), new Set(["traffic", "vertical", "marketing"]));
  }
});

test("增值服务覆盖抖音代运营、达人直播和本地生活承接", () => {
  const serviceIds = new Set(VALUE_ADDED_SERVICE_CATALOG.map(item => item.id));
  assert.ok(serviceIds.has("douyin-managed"));
  assert.ok(serviceIds.has("influencer-live"));
  assert.ok(serviceIds.has("local-life-operations"));
  assert.ok(VALUE_ADDED_SERVICE_CATALOG.every(item => item.deliverables.length >= 4 && item.plans.length >= 3 && item.objective && item.fit));
  assert.equal(DEFAULT_STATE.valueAdded.foundation.version, "hotel-growth-v2");
  assert.match(DEFAULT_STATE.valueAdded.foundation.goal, /咨询.*预订.*核销/);
  assert.equal(DEFAULT_STATE.valueAdded.capabilities.douyinAccount.status, "active");
  assert.equal(DEFAULT_STATE.valueAdded.capabilities.blueV.status, "reviewing");
  assert.ok(Array.isArray(DEFAULT_STATE.valueAdded.requests));
});

test("抖音互动中心同时包含作品评论和私信队列", () => {
  assert.ok(DEFAULT_INTERACTION_CENTER.items.some(item => item.channel === "comment"));
  assert.ok(DEFAULT_INTERACTION_CENTER.items.some(item => item.channel === "message"));
  assert.ok(DEFAULT_INTERACTION_CENTER.items.some(item => item.status === "pending" && item.unread));
});

test("互动回复建议引用酒店事实且易变信息强制人工确认", () => {
  const state = clone(DEFAULT_STATE);
  const locationReply = suggestInteractionReply(state, { content: "离古城南门远不远？" });
  assert.ok(locationReply.factReferences.length >= 1);
  assert.ok(locationReply.text.includes("古城") || locationReply.text.includes("地标"));
  const mutableReply = suggestInteractionReply(state, { content: "暑期多少钱一晚，还有房吗？" });
  assert.equal(mutableReply.requiresHumanConfirm, true);
  assert.ok(!/\d+元|特价|仅剩/.test(mutableReply.text));
  assert.ok(mutableReply.text.includes("实时信息"));
});

test("看板聚合只统计已发布内容", () => {
  const metrics = computeDashboard(DEFAULT_STATE.records);
  assert.equal(metrics.published, 3);
  assert.equal(metrics.views, 2054);
  assert.ok(metrics.interactions > 0);
});

test("曝光超过近期均值 200% 时识别峰值", () => {
  const peak = detectPeak(DEFAULT_STATE.records);
  assert.ok(peak);
  assert.ok(peak.ratio >= 200);
});

test("导入数据必须包含核心集合", () => {
  assert.equal(validateImportedState(DEFAULT_STATE).valid, true);
  assert.equal(validateImportedState({ settings: {} }).valid, false);
});
