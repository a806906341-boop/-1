import { RISK_RULES } from "./data.js?v=20260720-43";

export const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
export const clone = value => JSON.parse(JSON.stringify(value));
export const charCount = value => Array.from(String(value || "").trim()).length;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const BODY_TARGET = 120;
export const BODY_MIN = 100;
export const BODY_MAX = 140;
export const CONTENT_IMAGE_LIMIT = 5;

export function normalizeTopicContext(topic = {}, source = "rule-library") {
  const rawSource = String(topic.source || source || "rule-library").toLowerCase();
  const normalizedSource = ["ai", "model", "ai-recommendation"].includes(rawSource) ? "ai-recommendation" : "rule-library";
  return {
    id: String(topic.id || uid("topic")),
    title: String(topic.title || "").trim(),
    type: topic.type || "vertical",
    objective: String(topic.objective || "").trim(),
    targetAudience: String(topic.targetAudience || "").trim(),
    reason: String(topic.reason || "").trim(),
    contentAngle: String(topic.contentAngle || topic.formula || "").trim(),
    materialCategory: topic.materialCategory || topic.material || "room",
    factReferences: Array.isArray(topic.factReferences) ? [...topic.factReferences] : [],
    score: Number(topic.score || 0),
    source: normalizedSource
  };
}

export function computeContentWorkflow(state = {}) {
  const recommendations = Array.isArray(state.aiRecommendations) ? state.aiRecommendations : [];
  const activeTopic = state.activeTopic || state.draft?.topicContext || null;
  const topicConfirmed = Boolean(activeTopic?.id && activeTopic?.title);
  const contentLinked = Boolean(topicConfirmed && state.draft?.topicContext?.id === activeTopic.id && state.draft?.topicId === activeTopic.id);
  const generationStatus = state.contentGenerationJob?.status || (contentLinked ? "completed" : "idle");
  const contentReady = contentLinked && generationStatus === "completed";
  const publishFormReady = Boolean(state.publishForm?.title && state.publishForm?.imageIds?.length);
  const stage = publishFormReady ? "publish-completion"
    : generationStatus === "generating" ? "content-generating"
      : contentReady ? "content-confirmation"
        : topicConfirmed ? "topic-confirmed"
          : recommendations.length ? "topic-recommendation"
            : "knowledge-ready";
  return {
    stage,
    hasRecommendations: recommendations.length > 0,
    recommendationCount: recommendations.length,
    activeTopic,
    topicConfirmed,
    contentLinked,
    contentReady,
    publishFormReady,
    generationStatus
  };
}

export function deriveMineOverview(state = {}) {
  const workflow = computeContentWorkflow(state);
  const settings = state.settings || {};
  const capabilities = state.valueAdded?.capabilities || {};
  const requests = Array.isArray(state.valueAdded?.requests) ? state.valueAdded.requests : [];
  const materials = Array.isArray(state.materials) ? state.materials.filter(item => item?.src) : [];
  const publishedCount = (state.records || []).filter(item => item.status === "published").slice(0, 7).length;
  const unreadNotifications = (state.notifications || []).filter(item => !item.read).length;
  const categoryCount = category => materials.filter(item => item.category === category).length;

  let assistant = {
    tone: "ready", icon: "fa-magic", title: "内容助手已经准备好",
    detail: "可以从首页获取今天的推荐选题，确认后自动准备文案和图片。",
    actionLabel: "回到首页", action: { type: "navigate", view: "dashboard" }
  };
  if (!state.adapters?.ai?.configured) {
    assistant = {
      tone: "warning", icon: "fa-exclamation-circle", title: "内容助手暂时不可用",
      detail: "当前无法生成新的选题和内容，可以联系顾问协助检查。",
      actionLabel: "联系顾问", action: { type: "service", serviceId: "douyin-managed", intent: "consultation" }
    };
  } else if (workflow.generationStatus === "failed") {
    assistant = {
      tone: "warning", icon: "fa-refresh", title: "上次内容没有生成完成",
      detail: "已保留当前选题，可以回到创作重新生成。",
      actionLabel: "重新处理", action: { type: "navigate", view: "editor" }
    };
  } else if (workflow.generationStatus === "generating") {
    assistant = {
      tone: "working", icon: "fa-circle-o-notch fa-spin", title: "正在准备图文内容",
      detail: "系统正在核对酒店资料、生成正文并匹配5张图片。",
      actionLabel: "查看进度", action: { type: "navigate", view: "editor" }
    };
  } else if (workflow.publishFormReady) {
    assistant = {
      tone: "action", icon: "fa-send-o", title: "发布信息等待你确认",
      detail: "文案、5张图片和发布字段已经准备好，确认后再提交。",
      actionLabel: "去确认发布", action: { type: "navigate", view: "creatorPublish" }
    };
  } else if (workflow.contentReady) {
    assistant = {
      tone: "action", icon: "fa-file-text-o", title: "有1篇内容等待确认",
      detail: "正文和5张图片已经生成，可以修改后进入发布确认。",
      actionLabel: "去确认内容", action: { type: "navigate", view: "editor" }
    };
  } else if (workflow.hasRecommendations) {
    assistant = {
      tone: "ready", icon: "fa-lightbulb-o", title: "今天的推荐选题已经准备好",
      detail: `系统准备了${workflow.recommendationCount}个不同方向，选择一个即可生成图文。`,
      actionLabel: "查看今日推荐", action: { type: "navigate", view: "dashboard" }
    };
  }

  let serviceRecommendation = null;
  if (materials.length < 5 || categoryCount("room") < 2 || categoryCount("public") < 2) {
    serviceRecommendation = {
      id: "video-production",
      reason: "酒店可用于持续创作的客房或公共空间素材偏少，可以了解一次到店拍摄。"
    };
  } else if (publishedCount < 2) {
    serviceRecommendation = {
      id: "douyin-managed",
      reason: "近期内容更新较少，如果门店没有专人运营，可以了解账号代运营。"
    };
  } else if (capabilities.groupBuy?.status !== "active" || capabilities.lifeService?.status !== "active") {
    serviceRecommendation = {
      id: "local-life-operations",
      reason: "商品或来客经营连接尚未完成，可以进一步打通内容到预订核销。"
    };
  }

  let help = {
    title: "第一次使用 AI 内容助手？",
    detail: "了解从推荐选题、生成图文到确认发布的完整流程。",
    icon: "fa-compass"
  };
  if (!state.adapters?.ai?.configured) {
    help = { title: "内容助手为什么暂时不可用？", detail: "查看常见原因，或请顾问协助恢复。", icon: "fa-plug" };
  } else if (materials.length < 5) {
    help = { title: "酒店素材不够怎么办？", detail: "查看适合 AI 选图的客房、公区和门店拍摄方法。", icon: "fa-picture-o" };
  } else if (capabilities.blueV?.status !== "active") {
    help = { title: "为什么内容还不能关联酒店地点？", detail: "了解蓝V地点、门店POI和发布定位的关系。", icon: "fa-map-marker" };
  } else if (workflow.publishFormReady) {
    help = { title: "怎样完成发布确认？", detail: "了解地点、声明、权限和发布时间需要检查什么。", icon: "fa-send-o" };
  }

  return {
    assistant,
    serviceRecommendation,
    help,
    requests,
    latestRequest: requests[0] || null,
    unreadNotifications,
    materialCount: materials.length,
    preferences: {
      modeLabel: "自动准备",
      voice: settings.voice || "自然、克制、有画面感",
      defaultTime: settings.defaultTime || "19:30",
      notificationPreference: settings.notificationPreference || "important"
    }
  };
}

export function suggestInteractionReply(state = {}, interaction = {}) {
  const content = String(interaction.content || "");
  const brand = state.settings?.shortName || state.settings?.brandName || "酒店";
  const facts = Array.isArray(state.knowledge?.facts) ? state.knowledge.facts : [];
  const factByLabel = pattern => facts.find(item => pattern.test(String(item.label || "")));
  const locationFact = factByLabel(/地址|区位|附近地标/);
  const parkingFact = facts.find(item => /停车|车位|停车场/.test(String(item.value || "")));
  const childFact = facts.find(item => /儿童|亲子|小朋友/.test(String(item.value || "")));
  const petFact = facts.find(item => /宠物|携宠/.test(String(item.value || "")));
  const mutable = /价格|多少钱|房态|有房|空房|折扣|套餐|仅剩|优惠/.test(content);
  const petQuestion = /宠物|猫|狗/.test(content);
  const childQuestion = /儿童|孩子|小朋友|亲子/.test(content);
  const parkingQuestion = /停车|自驾|车位/.test(content);
  const locationQuestion = /位置|多远|距离|怎么走|古城|南门/.test(content);
  const bookingQuestion = /预订|订房|房型|入住|住三晚|几间房/.test(content);
  let text;
  let references = [];
  let requiresHumanConfirm = false;

  if (mutable) {
    text = `你好，房价和房态会随日期、房型变化，请通过作品中的酒店定位进入官方门店页查看实时信息；如需进一步确认，请告诉我们入住日期和人数。`;
    requiresHumanConfirm = true;
  } else if (parkingQuestion) {
    text = `你好，关于自驾停车，请以${brand}当前门店页和到店指引为准。${parkingFact ? `${parkingFact.value}。` : "当前知识库没有已确认的停车结论，建议到店前人工确认。"}`;
    references = parkingFact ? [parkingFact.id] : [];
    requiresHumanConfirm = !parkingFact;
  } else if (childQuestion) {
    text = `你好，带小朋友入住可重点查看房型和儿童相关配置。${childFact ? `${childFact.value}。` : "当前知识库没有已确认的儿童用品结论，请在预订前人工确认。"}`;
    references = childFact ? [childFact.id] : [];
    requiresHumanConfirm = !childFact;
  } else if (petQuestion) {
    text = petFact
      ? `你好，${petFact.value}。具体携宠数量和清洁要求建议在预订前再次确认。`
      : `你好，宠物入住政策可能因房型和日期变化，当前知识库没有已确认结论，请在预订前向酒店人工确认。`;
    references = petFact ? [petFact.id] : [];
    requiresHumanConfirm = true;
  } else if (locationQuestion) {
    text = `你好，${locationFact ? `${locationFact.value}。` : `${brand}的详细位置已放在作品定位中。`}建议结合当天路线查看地图导航。`;
    references = locationFact ? [locationFact.id] : [];
  } else if (bookingQuestion) {
    text = `你好，可以点击作品中的${brand}定位查看官方房型；如需我们协助判断，请补充入住日期、人数和偏好。`;
    requiresHumanConfirm = true;
  } else {
    text = `谢谢关注${brand}。作品里的酒店定位、房型实拍和周边信息都可以继续查看，有具体入住问题也可以直接告诉我们。`;
  }
  return {
    text: Array.from(text).slice(0, 180).join(""),
    factReferences: references,
    requiresHumanConfirm,
    source: references.length ? "hotel-knowledge" : "safe-service-template"
  };
}

export function localDate(offset = 0, base = new Date()) {
  const date = new Date(base);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function assessRisk({ title = "", body = "", imageAuthenticity = "real" }, rules = RISK_RULES) {
  // “第一次”等日常序数表达不属于广告法意义上的“第一”宣称。
  const text = `${title} ${body}`.replace(/第一(?=次|晚|天|站|步|回|篇|条|个)/g, "首");
  const issues = [];
  const scan = (words, level, category, message) => words.forEach(word => {
    if (text.includes(word)) issues.push({ level, category, word, message });
  });
  scan(rules.absolute, "high", "极限词", "删除绝对化或无法举证的表述");
  scan(rules.sensitive, "high", "敏感词", "该表达存在平台或广告合规风险");
  scan(rules.mutable, "medium", "易变信息", "发布前需由商家确认实时准确性");
  if (charCount(body) > BODY_MAX) issues.push({ level: "medium", category: "正文长度", word: `${charCount(body)}字`, message: `正文建议约${BODY_TARGET}字，最多${BODY_MAX}字` });
  if (charCount(title) > 20) issues.push({ level: "low", category: "标题长度", word: `${charCount(title)}字`, message: "建议标题控制在20字以内" });
  if (imageAuthenticity === "ai-realistic") issues.push({ level: "high", category: "图片真实性", word: "AI拟真图", message: "不得冒充真实房型、设施或景观" });
  const level = issues.some(item => item.level === "high") ? "high" : issues.some(item => item.level === "medium") ? "medium" : issues.length ? "low" : "safe";
  return { level, issues, passed: level !== "high", checkedAt: new Date().toISOString() };
}

const typePattern = ["traffic", "traffic", "vertical", "traffic", "marketing", "vertical", "traffic", "traffic", "vertical", "marketing"];

export function pickTopic(topics, hotelType, history = [], rejected = [], step = 0) {
  const expected = typePattern[(history.length + step) % typePattern.length];
  const used = new Set(history.map(item => item.topicId).filter(Boolean));
  const rejectedSet = new Set(rejected);
  const eligible = topics.filter(topic => topic.hotelTypes.includes(hotelType));
  return eligible.find(topic => topic.type === expected && !used.has(topic.id) && !rejectedSet.has(topic.id))
    || eligible.find(topic => !used.has(topic.id) && !rejectedSet.has(topic.id))
    || eligible[step % Math.max(eligible.length, 1)]
    || topics[0];
}

export function normalizeChineseText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Script=Han}\p{L}\p{N}]+/gu, "");
}

export function charBigramDiceSimilarity(left = "", right = "") {
  const normalizedLeft = normalizeChineseText(left);
  const normalizedRight = normalizeChineseText(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  const leftChars = Array.from(normalizedLeft);
  const rightChars = Array.from(normalizedRight);
  if (leftChars.length < 2 || rightChars.length < 2) return 0;

  const leftBigrams = new Map();
  for (let index = 0; index < leftChars.length - 1; index += 1) {
    const bigram = `${leftChars[index]}${leftChars[index + 1]}`;
    leftBigrams.set(bigram, (leftBigrams.get(bigram) || 0) + 1);
  }
  const rightBigrams = new Map();
  for (let index = 0; index < rightChars.length - 1; index += 1) {
    const bigram = `${rightChars[index]}${rightChars[index + 1]}`;
    rightBigrams.set(bigram, (rightBigrams.get(bigram) || 0) + 1);
  }
  let intersection = 0;
  leftBigrams.forEach((count, bigram) => {
    intersection += Math.min(count, rightBigrams.get(bigram) || 0);
  });
  return (2 * intersection) / ((leftChars.length - 1) + (rightChars.length - 1));
}

export const chineseBigramDiceSimilarity = charBigramDiceSimilarity;

function firstMeaningfulValue(...values) {
  const value = values.find(item => typeof item === "string" && item.trim());
  return value ? value.trim() : "";
}

export function buildTopicFingerprint(topic = {}, content = {}) {
  const topicSource = topic?.topicContext || topic?.topic || topic || {};
  const contentSource = content && Object.keys(content).length ? content : topic || {};
  const parts = [
    firstMeaningfulValue(
      topicSource.coreSellingPoint,
      topicSource.sellingPoint,
      topicSource.objective,
      contentSource.coreSellingPoint,
      contentSource.strategyTopicTitle,
      topicSource.title,
      contentSource.topicTitle,
      contentSource.title
    ),
    firstMeaningfulValue(
      topicSource.targetAudience,
      topicSource.audience,
      contentSource.targetAudience,
      contentSource.audience
    ),
    firstMeaningfulValue(
      topicSource.useScenario,
      topicSource.scene,
      topicSource.scenario,
      contentSource.useScenario,
      contentSource.scene,
      contentSource.scenario,
      contentSource.location?.name
    ),
    firstMeaningfulValue(
      topicSource.contentAngle,
      topicSource.formula,
      contentSource.contentAngle,
      contentSource.angle,
      topicSource.type,
      contentSource.topicType
    )
  ].map(normalizeChineseText);
  if (parts.some(Boolean)) return parts.join("|");
  return normalizeChineseText(topicSource.id || contentSource.topicId || "");
}

function normalizePlatform(platform = "douyin") {
  const value = String(platform || "douyin").trim();
  const aliases = {
    wechat: "wechatChannels",
    weixin: "wechatChannels",
    shipinhao: "wechatChannels",
    redbook: "xiaohongshu",
    xhs: "xiaohongshu"
  };
  return aliases[value.toLowerCase()] || value || "douyin";
}

function recordPlatforms(record = {}) {
  const explicit = [
    record.platform,
    ...(Array.isArray(record.platforms) ? record.platforms : []),
    ...(Array.isArray(record.platformResults) ? record.platformResults.map(item => item?.platform) : []),
    ...Object.keys(record.platformVariants || {})
  ].filter(Boolean).map(normalizePlatform);
  return explicit.length ? [...new Set(explicit)] : ["douyin"];
}

function recordTimestamp(record = {}, fallbackIndex = 0) {
  const raw = record.publishedAt || record.createdAt || record.updatedAt || record.scheduledAt;
  const timestamp = raw ? Date.parse(String(raw).replace(" ", "T")) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : -fallbackIndex;
}

export function filterRecentRecordsByPlatform(recordsOrState = [], platform = "douyin", limit = Infinity) {
  const records = Array.isArray(recordsOrState) ? recordsOrState : (recordsOrState?.records || []);
  const normalizedPlatform = normalizePlatform(platform);
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : Infinity;
  const historyStatuses = new Set(["published", "reviewing", "scheduled", "submitted"]);
  return records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => (!record.status || historyStatuses.has(record.status))
      && recordPlatforms(record).includes(normalizedPlatform))
    .sort((a, b) => recordTimestamp(b.record, b.index) - recordTimestamp(a.record, a.index) || a.index - b.index)
    .slice(0, safeLimit)
    .map(({ record }) => record);
}

function contentVariant(content = {}, platform = "douyin") {
  const normalizedPlatform = normalizePlatform(platform);
  const variant = content.platformVariants?.[normalizedPlatform] || content.publishMeta?.platformVariants?.[normalizedPlatform] || {};
  return {
    title: firstMeaningfulValue(variant.title, content.title),
    body: firstMeaningfulValue(variant.body, variant.description, content.body, content.description),
    imageIds: Array.isArray(variant.imageIds)
      ? variant.imageIds.filter(Boolean)
      : (Array.isArray(content.imageIds)
        ? content.imageIds.filter(Boolean)
        : (Array.isArray(content.materialIds) ? content.materialIds.filter(Boolean) : []))
  };
}

function overlapCount(leftIds = [], rightIds = []) {
  const right = new Set(rightIds);
  return [...new Set(leftIds)].filter(id => right.has(id)).length;
}

function resolveCurrentHotelId(state = {}, content = {}, options = {}) {
  if (options.hotelId || content.hotelId) return String(options.hotelId || content.hotelId);
  const account = (state.testAccounts || []).find(item => item.id === state.activeAccountId);
  return String(account?.hotelId || state.otaSnapshot?.selectedHotelId || "");
}

function detectExplicitConsistencyIssues(state = {}, content = {}, options = {}) {
  const issues = [];
  const account = (state.testAccounts || []).find(item => item.id === state.activeAccountId);
  const stateHotelId = String(options.hotelId || account?.hotelId || state.otaSnapshot?.selectedHotelId || "");
  const expectedHotelId = stateHotelId || String(content.hotelId || "");
  if (content.hotelId && expectedHotelId && String(content.hotelId) !== expectedHotelId) {
    issues.push("内容所属酒店与当前酒店不一致");
  }
  const materialMap = new Map((state.materials || []).map(item => [item.id, item]));
  const selectedMaterials = (contentVariant(content, options.platform).imageIds || [])
    .map(id => materialMap.get(id))
    .filter(Boolean);
  const knownHotelIds = [...new Set(selectedMaterials.map(item => item.hotelId).filter(Boolean).map(String))];
  if (knownHotelIds.length > 1) issues.push("同一篇内容混用了不同酒店的图片");
  if (expectedHotelId && knownHotelIds.some(id => id !== expectedHotelId)) {
    issues.push("所选图片所属酒店与当前酒店不一致");
  }
  if (content.factConsistency === false || content.factsVerified === false) {
    issues.push("内容已明确标记为事实不一致");
  }
  const unsupportedEvidence = (content.claimEvidence || []).some(item => item
    && (item.supported === false
      || item.verified === false
      || ["unsupported", "contradicted", "invalid"].includes(String(item.status || "").toLowerCase())));
  if (unsupportedEvidence) issues.push("内容包含已明确无法被酒店事实支持的表述");
  return [...new Set(issues)];
}

export function evaluateContentReuseRisk(state = {}, content = {}, options = {}) {
  const platform = normalizePlatform(options.platform || content.platform || "douyin");
  const current = contentVariant(content, platform);
  const imageIds = current.imageIds;
  const uniqueImageIds = [...new Set(imageIds)];
  const imageRecords = filterRecentRecordsByPlatform(state, platform, 10);
  const textRecords = filterRecentRecordsByPlatform(state, platform, 30);
  const topicRecords = filterRecentRecordsByPlatform(state, platform, 5);
  const recentImageSet = new Set(imageRecords.flatMap(record => contentVariant(record, platform).imageIds));
  const recentCoverSet = new Set(imageRecords.slice(0, 8).map(record => contentVariant(record, platform).imageIds[0]).filter(Boolean));
  const comparisons = imageRecords.map(record => {
    const historical = contentVariant(record, platform);
    const overlap = overlapCount(uniqueImageIds, historical.imageIds);
    const sameFiveImageSet = uniqueImageIds.length === CONTENT_IMAGE_LIMIT
      && new Set(historical.imageIds).size === CONTENT_IMAGE_LIMIT
      && overlap === CONTENT_IMAGE_LIMIT;
    return {
      recordId: record.id || null,
      overlap,
      sameFiveImageSet,
      sameCover: Boolean(imageIds[0] && historical.imageIds[0] === imageIds[0])
    };
  });
  const strongestImageMatch = comparisons.reduce((best, item) => {
    if (!best || item.overlap > best.overlap || (item.overlap === best.overlap && item.sameCover && !best.sameCover)) return item;
    return best;
  }, null) || { recordId: null, overlap: 0, sameFiveImageSet: false, sameCover: false };
  const textComparisons = textRecords.map(record => {
    const historical = contentVariant(record, platform);
    return {
      recordId: record.id || null,
      imageOverlap: overlapCount(uniqueImageIds, historical.imageIds),
      titleSimilarity: charBigramDiceSimilarity(current.title, historical.title),
      bodySimilarity: charBigramDiceSimilarity(current.body, historical.body)
    };
  });
  const strongestTitleMatch = textComparisons.reduce((best, item) => item.titleSimilarity > (best?.titleSimilarity || 0) ? item : best, null);
  const strongestBodyMatch = textComparisons.reduce((best, item) => item.bodySimilarity > (best?.bodySimilarity || 0) ? item : best, null);
  const bodyAndImageMatch = textComparisons.find(item => item.bodySimilarity >= 0.8 && item.imageOverlap >= 2);
  const topicFingerprint = content.topicFingerprint || buildTopicFingerprint(content.topicContext || content.topic || content, content);
  const repeatedTopicRecord = topicFingerprint ? topicRecords.find(record => {
    const historicalFingerprint = record.topicFingerprint
      || buildTopicFingerprint(record.topicContext || record.topic || record, record);
    return historicalFingerprint && historicalFingerprint === topicFingerprint;
  }) : null;
  const consistencyIssues = detectExplicitConsistencyIssues(state, content, { ...options, platform });
  const materialMap = new Map((state.materials || []).map(item => [item.id, item]));
  const selectedMaterials = uniqueImageIds.map(id => materialMap.get(id)).filter(Boolean);
  const fileKeys = selectedMaterials.map(item => item.fileHash || item.uploadSignature || item.id);
  const visualGroupKeys = selectedMaterials.map(item => item.visualGroupId || item.fileHash || item.id);
  const uniqueFileCount = new Set(fileKeys).size;
  const visualGroupCount = new Set(visualGroupKeys).size;
  const novelImageCount = uniqueImageIds.filter(id => !recentImageSet.has(id)).length;
  const reasons = [];
  const suggestedActions = [];
  let blocked = false;
  let repair = false;

  const block = (reason, action) => {
    blocked = true;
    reasons.push(reason);
    if (action) suggestedActions.push(action);
  };
  const requestRepair = (reason, action) => {
    repair = true;
    reasons.push(reason);
    if (action) suggestedActions.push(action);
  };

  if (imageIds.length !== CONTENT_IMAGE_LIMIT) {
    block(`当前内容需要完整${CONTENT_IMAGE_LIMIT}张图片`, "补齐1张封面和4张内容图");
  }
  if (uniqueImageIds.length !== imageIds.length) {
    block("同一篇内容中存在重复图片ID", "替换篇内重复图片");
  }
  if (selectedMaterials.length === imageIds.length && uniqueFileCount !== imageIds.length) {
    block("同一篇内容中包含文件内容相同的重复图片", "替换重复图片文件");
  }
  if (imageIds.length === CONTENT_IMAGE_LIMIT && selectedMaterials.length === imageIds.length && visualGroupCount < 4) {
    block("5张图片未覆盖至少4个不同视觉场景", "补充或替换相近角度图片");
  }
  consistencyIssues.forEach(reason => block(reason, "核对酒店、图片和事实归属后重新生成"));
  if (strongestImageMatch.sameFiveImageSet || strongestImageMatch.overlap >= 4) {
    block(`与同平台近期内容重合${strongestImageMatch.overlap}张图片`, "重新选择图片组合");
  } else if (strongestImageMatch.overlap === 3) {
    requestRepair("与同平台近期内容重合3张图片", "至少替换1张重复图片");
  } else if (strongestImageMatch.overlap === 2 && strongestImageMatch.sameCover) {
    requestRepair("与同平台近期内容重合2张且封面相同", "更换封面或减少图片重合");
  }
  if (imageIds[0] && recentCoverSet.has(imageIds[0])) {
    requestRepair("封面与同平台最近8篇中的封面重复", "更换封面");
  }
  if ((strongestTitleMatch?.titleSimilarity || 0) >= 0.8) {
    requestRepair("标题与同平台历史标题相似度达到80%", "重写标题");
  }
  if ((strongestBodyMatch?.bodySimilarity || 0) >= 0.85) {
    requestRepair("正文与同平台历史正文相似度达到85%", "重写正文");
  }
  if (bodyAndImageMatch) {
    block("正文相似度达到80%且与同一篇历史内容重合至少2张图片", "更换叙事结构和图片组合");
  }
  if (imageIds.length && novelImageCount < 2) {
    requestRepair("5张图片中少于2张未在同平台最近10篇出现", "优先替换为近期未使用图片");
  }
  if (repeatedTopicRecord) {
    requestRepair("选题指纹与同平台最近5篇中的内容完全一致", "更换目标人群、使用场景或内容角度");
  }

  return {
    level: blocked ? "blocked" : repair ? "repair" : "pass",
    reasons: [...new Set(reasons)],
    metrics: {
      platform,
      imageCount: imageIds.length,
      uniqueImageCount: uniqueImageIds.length,
      uniqueFileCount,
      visualGroupCount,
      recentImageWindow: 10,
      recentTextWindow: 30,
      maxImageOverlap: strongestImageMatch.overlap,
      maxOverlapRecordId: strongestImageMatch.recordId,
      identicalFiveImageSet: strongestImageMatch.sameFiveImageSet,
      coverRepeatedInRecent8: Boolean(imageIds[0] && recentCoverSet.has(imageIds[0])),
      novelImageCount,
      maxTitleSimilarity: strongestTitleMatch?.titleSimilarity || 0,
      maxTitleSimilarityRecordId: strongestTitleMatch?.recordId || null,
      maxBodySimilarity: strongestBodyMatch?.bodySimilarity || 0,
      maxBodySimilarityRecordId: strongestBodyMatch?.recordId || null,
      topicFingerprint,
      topicFingerprintRepeated: Boolean(repeatedTopicRecord),
      topicFingerprintRecordId: repeatedTopicRecord?.id || null,
      comparedImageRecords: imageRecords.length,
      comparedTextRecords: textRecords.length
    },
    suggestedActions: [...new Set(suggestedActions)]
  };
}

function firstSentence(value = "") {
  const text = String(value || "").trim();
  const sentence = text.split(/[。！？!?；;\n]/u).find(item => item.trim()) || text;
  return normalizeChineseText(sentence);
}

export function validateRegeneration(previous = {}, next = {}, state = {}, platform = "douyin") {
  const normalizedPlatform = normalizePlatform(platform);
  const previousContent = contentVariant(previous, normalizedPlatform);
  const nextContent = contentVariant(next, normalizedPlatform);
  const titleSimilarity = charBigramDiceSimilarity(previousContent.title, nextContent.title);
  const previousSet = new Set(previousContent.imageIds);
  const changedImageCount = [...new Set(nextContent.imageIds)].filter(id => !previousSet.has(id)).length;
  const coverChanged = Boolean(previousContent.imageIds[0] && nextContent.imageIds[0])
    && previousContent.imageIds[0] !== nextContent.imageIds[0];
  const firstSentenceChanged = Boolean(firstSentence(previousContent.body) || firstSentence(nextContent.body))
    && firstSentence(previousContent.body) !== firstSentence(nextContent.body);
  const reasons = [];
  if (!coverChanged) reasons.push("封面必须与上一版不同");
  if (changedImageCount < 2) reasons.push("至少需要替换2张图片");
  if (titleSimilarity >= 0.65) reasons.push("标题与上一版相似度必须低于65%");
  if (!firstSentenceChanged) reasons.push("正文首句必须与上一版不同");
  return {
    valid: reasons.length === 0,
    reasons,
    metrics: {
      platform: normalizedPlatform,
      coverChanged,
      changedImageCount,
      titleSimilarity,
      firstSentenceChanged
    }
  };
}

const IMAGE_STORY = {
  room: ["room", "room", "public", "room", "exterior", "poi"],
  public: ["public", "public", "room", "public", "exterior", "poi"],
  exterior: ["exterior", "public", "room", "exterior", "poi", "public"],
  dining: ["dining", "dining", "public", "room", "exterior", "poi"],
  poi: ["poi", "exterior", "public", "room", "poi", "exterior"]
};

const IMAGE_ROLES = ["封面主题", "环境建立", "核心证据", "细节补充", "位置承接"];

function recentImageUsage(records = [], limit = 8) {
  const usage = new Map();
  records.slice(0, limit).forEach((record, recordIndex) => {
    (record.imageIds || []).forEach(id => {
      const current = usage.get(id) || { count: 0, lastIndex: recordIndex };
      current.count += 1;
      current.lastIndex = Math.min(current.lastIndex, recordIndex);
      usage.set(id, current);
    });
  });
  return usage;
}

export function rankMaterialPool(state, options = {}) {
  const selectedIds = [...new Set((options.selectedIds || []).filter(Boolean))];
  const selectedSet = new Set(selectedIds);
  const preferredCategory = options.preferredCategory || "room";
  const filter = options.filter || "recommended";
  const sort = options.sort || "smart";
  const query = String(options.query || "").trim().toLowerCase();
  const limit = Math.max(1, Number(options.limit || 24));
  const recentUsage = recentImageUsage(state.records || []);
  const materials = (state.materials || []).filter(item => item.src).map(item => {
    const recent = recentUsage.get(item.id);
    const selectedIndex = selectedIds.indexOf(item.id);
    const used = Number(item.used || 0);
    const score = (item.category === preferredCategory ? 60 : 0)
      + (selectedSet.has(item.id) ? 120 : 0)
      + Math.max(0, 24 - used * 4)
      - (recent ? 80 + recent.count * 10 - recent.lastIndex * 3 : 0);
    return {
      ...item,
      used,
      selected: selectedSet.has(item.id),
      selectedIndex,
      recentlyUsed: Boolean(recent),
      recentCount: recent?.count || 0,
      recentPosition: recent?.lastIndex ?? null,
      recommended: item.category === preferredCategory && !recent,
      score
    };
  });

  const matchesQuery = item => !query || [item.title, item.source, item.category]
    .some(value => String(value || "").toLowerCase().includes(query));
  let items = materials.filter(matchesQuery).filter(item => {
    if (filter === "selected") return item.selected;
    if (["recommended", "all"].includes(filter)) return true;
    return item.category === filter;
  });
  const selectedFirst = (a, b) => Number(b.selected) - Number(a.selected);
  if (sort === "unused") {
    items.sort((a, b) => selectedFirst(a, b) || Number(a.recentlyUsed) - Number(b.recentlyUsed) || a.used - b.used || b.score - a.score);
  } else if (sort === "newest") {
    items.sort((a, b) => selectedFirst(a, b) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || b.score - a.score);
  } else {
    items.sort((a, b) => selectedFirst(a, b) || b.score - a.score || a.used - b.used);
  }

  const selectedMaterials = materials.filter(item => item.selected);
  return {
    items: items.slice(0, limit),
    totalMatched: items.length,
    totalImages: materials.length,
    unusedCount: materials.filter(item => item.used === 0).length,
    recentCount: materials.filter(item => item.recentlyUsed).length,
    selectedRecentCount: selectedMaterials.filter(item => item.recentlyUsed).length,
    selectedCategoryCount: new Set(selectedMaterials.map(item => item.category)).size
  };
}

export function buildImageLayout(materials = [], imageIds = [], preferredCategory = "room", requestedPlan = []) {
  const materialMap = new Map(materials.map(item => [item.id, item]));
  const requestedMap = new Map((requestedPlan || []).filter(item => item?.materialId).map(item => [item.materialId, item]));
  return imageIds.map((materialId, index) => {
    const material = materialMap.get(materialId) || {};
    const requested = requestedMap.get(materialId) || {};
    return {
      order: index + 1,
      materialId,
      category: material.category || requested.category || preferredCategory,
      role: requested.purpose || IMAGE_ROLES[index] || "补充画面",
      aspectRatio: "3:4",
      cropMode: requested.cropMode || (index === 0 ? "主体居中，预留标题安全区" : "保留主体与环境关系"),
      selectionReason: requested.selectionReason || (index === 0 ? "主题匹配、低重复，作为首图" : "补足图文叙事层次")
    };
  });
}

export function optimizeImageSelection(state, options = {}) {
  const platform = normalizePlatform(options.platform || "douyin");
  const expectedHotelId = resolveCurrentHotelId(state, {}, options);
  const materials = (state.materials || []).filter(item => item.src
    && (!expectedHotelId || !item.hotelId || String(item.hotelId) === expectedHotelId));
  const preferredCategory = options.preferredCategory || "room";
  const requestedIds = [...new Set((options.requestedIds || []).filter(Boolean))];
  const requestedRanks = new Map(requestedIds.map((id, index) => [id, index]));
  const avoidIds = new Set((options.avoidIds || []).filter(Boolean));
  const recentRecords = filterRecentRecordsByPlatform(state, platform, 10);
  const recentCoverIds = new Set(recentRecords.slice(0, 8).map(record => contentVariant(record, platform).imageIds[0]).filter(Boolean));
  const recentImageIds = new Set(recentRecords.flatMap(record => contentVariant(record, platform).imageIds));
  const recentRecordSets = recentRecords.map(record => ({
    recordId: record.id || null,
    imageIds: new Set(contentVariant(record, platform).imageIds)
  }));
  const story = IMAGE_STORY[preferredCategory] || IMAGE_STORY.room;
  const limit = Math.min(CONTENT_IMAGE_LIMIT, Math.max(1, Number(options.limit || CONTENT_IMAGE_LIMIT)));
  const materialMap = new Map(materials.map(item => [item.id, item]));

  const baseScore = (item, index) => {
    const requestedRank = requestedRanks.get(item.id);
    return (requestedRank === undefined ? 0 : 100 - requestedRank * 5)
      + (item.category === preferredCategory ? 34 : 0)
      + Math.max(0, 14 - Number(item.used || 0) * 3)
      + (!recentImageIds.has(item.id) ? 34 : 0)
      - (avoidIds.has(item.id) ? 48 : 0)
      - (index === 0 && recentCoverIds.has(item.id) ? 120 : 0);
  };

  const maxOverlapWithHistory = ids => recentRecordSets.reduce((maximum, record) => {
    const overlap = ids.filter(id => record.imageIds.has(id)).length;
    return Math.max(maximum, overlap);
  }, 0);

  const search = strict => {
    let beam = [{ ids: [], score: 0, freshCount: 0 }];
    const beamWidth = Math.max(40, Math.min(120, Number(options.beamWidth || 80)));
    for (let index = 0; index < limit; index += 1) {
      const desiredCategory = story[index] || preferredCategory;
      const expanded = [];
      beam.forEach(candidate => {
        materials.forEach(item => {
          if (candidate.ids.includes(item.id)) return;
          if (strict && (avoidIds.has(item.id) || recentImageIds.has(item.id))) return;
          if (strict && index === 0 && recentCoverIds.has(item.id)) return;
          const ids = [...candidate.ids, item.id];
          if (strict && maxOverlapWithHistory(ids) > 2) return;
          const freshCount = candidate.freshCount + Number(!recentImageIds.has(item.id));
          const remainingSlots = limit - ids.length;
          if (strict && freshCount + remainingSlots < Math.min(2, limit)) return;
          const overlapPenalty = maxOverlapWithHistory(ids) * 26;
          const score = candidate.score
            + baseScore(item, index)
            + (item.category === desiredCategory ? 42 : 0)
            - overlapPenalty;
          expanded.push({ ids, score, freshCount });
        });
      });
      if (!expanded.length) break;
      beam = expanded
        .sort((a, b) => b.score - a.score
          || b.freshCount - a.freshCount
          || a.ids.join("|").localeCompare(b.ids.join("|")))
        .slice(0, beamWidth);
    }
    const complete = beam.find(candidate => candidate.ids.length === limit
      && (!strict || (candidate.freshCount >= Math.min(2, limit)
        && !recentCoverIds.has(candidate.ids[0])
        && (!avoidIds.size || !avoidIds.has(candidate.ids[0]))
        && maxOverlapWithHistory(candidate.ids) <= 2
        && (!avoidIds.size || candidate.ids.filter(id => !avoidIds.has(id)).length >= Math.min(2, limit))))) || null;
    return complete || (!strict ? beam[0] || null : null);
  };

  const strictSelection = search(true);
  const fallbackSelection = strictSelection || search(false) || { ids: [], score: 0, freshCount: 0 };
  const imageIds = [...new Set(fallbackSelection.ids)].slice(0, limit);
  const reuseRisk = evaluateContentReuseRisk(state, {
    imageIds,
    hotelId: expectedHotelId,
    topicContext: options.topicContext || null,
    topicFingerprint: options.topicFingerprint || ""
  }, { platform, hotelId: expectedHotelId });
  const selectedFreshCount = imageIds.filter(id => !recentImageIds.has(id)).length;
  const selectedMaxOverlap = maxOverlapWithHistory(imageIds);
  const coverRepeated = Boolean(imageIds[0] && recentCoverIds.has(imageIds[0]));
  const avoidedRecentCount = [...recentImageIds].filter(id => materialMap.has(id) && !imageIds.includes(id)).length;
  return {
    imageIds,
    imageLayout: buildImageLayout(materials, imageIds, preferredCategory, options.requestedPlan),
    reuseRisk,
    imageSelectionMeta: {
      mode: "auto",
      platform,
      preferredCategory,
      recentWindow: 10,
      coverWindow: 8,
      avoidedRecentCount,
      avoidedPreviousCount: [...avoidIds].filter(id => materials.some(item => item.id === id) && !imageIds.includes(id)).length,
      selectedCount: imageIds.length,
      selectedFreshCount,
      maxRecentOverlap: selectedMaxOverlap,
      coverRepeated,
      idealConstraintsMet: Boolean(strictSelection),
      reuseRisk,
      strategy: "固定5图 + 分镜分类匹配 + 至少2张近期新图优先 + 封面避开最近8篇 + 任一最近10篇重合不超过2张"
    }
  };
}

function fitGeneratedBody(value) {
  const additions = [
    "先收藏这份信息，再结合同行人数和当天路线查看官方详情。",
    "画面均以当前酒店素材为准，具体服务和房态请以发布前确认结果为准。"
  ];
  let text = String(value || "").replace(/\s+/g, "").trim();
  for (const addition of additions) {
    if (charCount(text) >= BODY_MIN) break;
    text += addition;
  }
  return Array.from(text).slice(0, BODY_MAX).join("");
}

export function generateContent(state, topic, variation = 0) {
  const brand = state.settings.shortName || state.settings.brandName;
  const city = state.settings.city || "本地";
  const templates = [
    `${topic.title}。如果你正在安排${city}行程，可以先从位置、睡眠和公共空间三个维度判断是否适合自己。${brand}会把能够确认的房间、公区和周边信息放进实拍内容里，让住宿选择更直观，也避免只被滤镜和空泛形容词影响。`,
    `来${city}不必急着把行程排满。围绕“${topic.title}”，这组内容会先看真实空间，再看与出行场景有关的细节。${brand}使用当前素材库里的酒店实拍，按封面、环境、核心证据和位置顺序呈现，方便你快速判断是否符合自己的住宿需求。`,
    `${city}的旅行可以松弛，但住宿最好提前看清楚。${brand}这次围绕“${topic.title}”整理可核验的信息：先用首图说明主题，再用房间、公区或周边画面补足证据。内容不替你做决定，只帮助你结合人数、路线和偏好看懂真实入住条件。`
  ];
  const body = fitGeneratedBody(templates[variation % templates.length]);
  const visual = optimizeImageSelection(state, { preferredCategory: topic.material || "room", limit: CONTENT_IMAGE_LIMIT });
  const tags = [`#${city}民宿`, `#${city}旅行`, "#民宿推荐", topic.type === "marketing" ? "#旅行住宿" : "#慢旅行"];
  const draft = {
    id: uid("draft"),
    topicId: topic.id,
    topicType: topic.type,
    title: Array.from(topic.title).slice(0, 20).join(""),
    body,
    tags,
    music: "由抖音发布页智能匹配",
    imageIds: visual.imageIds,
    imageLayout: visual.imageLayout,
    imageSelectionMeta: visual.imageSelectionMeta,
    imageAuthenticity: "real",
    status: "draft",
    source: "rule-fallback",
    variation,
    createdAt: new Date().toISOString()
  };
  draft.risk = assessRisk(draft);
  return draft;
}

const WEEK_TYPE_PATTERNS = [
  ["traffic", "vertical", "traffic", "marketing", "traffic", "vertical", "traffic"],
  ["vertical", "traffic", "marketing", "traffic", "vertical", "traffic", "traffic"],
  ["traffic", "marketing", "vertical", "traffic", "traffic", "vertical", "traffic"]
];

export function createWeekPlan(state, base = new Date(), options = {}) {
  const previousPlan = Array.isArray(options.previousPlan)
    ? options.previousPlan
    : (Array.isArray(state.weekPlan) ? state.weekPlan : []);
  const previousRevision = Math.max(0, ...previousPlan.map(item => Number(item.planRevision || 0)));
  const revision = Number.isFinite(Number(options.revision))
    ? Math.max(0, Number(options.revision))
    : (previousPlan.length ? previousRevision + 1 : 1);
  const eligible = state.topics.filter(topic => topic.hotelTypes.includes(state.settings.hotelType));
  const previousTopicIds = new Set(previousPlan.map(item => item.topicId).filter(Boolean));
  const previousImageIds = new Set(previousPlan.flatMap(item => item.imageIds || []));
  const currentTopicIds = new Set();
  const currentImageIds = new Set();
  const typePattern = WEEK_TYPE_PATTERNS[(revision - 1) % WEEK_TYPE_PATTERNS.length];

  return Array.from({ length: 7 }, (_, index) => {
    const expectedType = typePattern[index];
    const typeCandidates = eligible.filter(topic => topic.type === expectedType);
    const freshCandidates = typeCandidates.filter(topic => !previousTopicIds.has(topic.id) && !currentTopicIds.has(topic.id));
    const unusedCandidates = typeCandidates.filter(topic => !currentTopicIds.has(topic.id));
    const candidates = freshCandidates.length ? freshCandidates : (unusedCandidates.length ? unusedCandidates : typeCandidates);
    const candidateOffset = (revision + index) % Math.max(candidates.length, 1);
    const topic = candidates[candidateOffset]
      || eligible.find(item => !currentTopicIds.has(item.id))
      || eligible[0]
      || state.topics[0];
    currentTopicIds.add(topic.id);

    const content = generateContent(state, topic, revision + index);
    const visual = optimizeImageSelection(state, {
      preferredCategory: topic.material || "room",
      avoidIds: [...previousImageIds, ...currentImageIds],
      limit: CONTENT_IMAGE_LIMIT
    });
    visual.imageIds.forEach(id => currentImageIds.add(id));

    return {
      id: uid("plan"),
      date: previousPlan[index]?.date || localDate(index + 1, base),
      time: previousPlan[index]?.time || state.settings.defaultTime,
      topicId: topic.id,
      topicType: topic.type,
      title: content.title,
      body: content.body,
      imageIds: visual.imageIds,
      imageLayout: visual.imageLayout,
      platforms: ["douyin", "xiaohongshu", "wechatChannels"],
      planRevision: revision,
      regeneratedAt: new Date().toISOString(),
      status: "topic-ready"
    };
  });
}

export function computeDashboard(records) {
  const published = records.filter(item => item.status === "published");
  const sum = field => published.reduce((total, item) => total + Number(item[field] || 0), 0);
  const views = sum("views");
  const interactions = sum("likes") + sum("comments") + sum("shares");
  const attempted = records.filter(item => ["published", "failed"].includes(item.status)).length;
  return {
    published: published.length,
    views,
    interactions,
    successRate: attempted ? Math.round((published.length / attempted) * 100) : 0,
    engagementRate: views ? ((interactions / views) * 100).toFixed(1) : "0.0"
  };
}

export function detectPeak(records) {
  const published = records.filter(item => item.status === "published" && item.views > 0);
  if (published.length < 2) return null;
  const latest = published[0];
  const previous = published.slice(1, 8);
  const average = previous.reduce((sum, item) => sum + item.views, 0) / previous.length;
  const ratio = average ? latest.views / average : 0;
  return ratio >= 2 ? { record: latest, average: Math.round(average), ratio: Math.round(ratio * 100) } : null;
}

export function validateImportedState(value) {
  if (!value || typeof value !== "object") return { valid: false, reason: "文件不是有效对象" };
  const required = ["settings", "knowledge", "topics", "materials", "records", "notifications"];
  const missing = required.filter(key => !(key in value));
  if (missing.length) return { valid: false, reason: `缺少字段：${missing.join("、")}` };
  if (!Array.isArray(value.records) || !Array.isArray(value.materials)) return { valid: false, reason: "记录或素材格式不正确" };
  return { valid: true };
}
