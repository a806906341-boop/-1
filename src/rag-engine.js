const CATEGORY_KEYWORDS = {
  room: ["房间", "房型", "客房", "床", "卫浴", "浴缸", "窗", "入住", "睡眠"],
  public: ["公区", "公共", "花园", "大堂", "露台", "泳池", "茶室", "休闲", "设施"],
  exterior: ["外观", "门头", "建筑", "入口", "院子", "位置", "抵达"],
  dining: ["早餐", "餐厅", "餐饮", "咖啡", "茶", "餐食"],
  poi: ["周边", "附近", "地标", "古城", "景点", "交通", "距离", "攻略"]
};

const FACT_PRIORITY = ["名称", "地址", "位置", "特色", "主题", "设施", "服务", "周边", "地标", "评分", "点评", "简介"];
const MUTABLE_PATTERN = /价格|房态|优惠|套餐|活动|库存|营业时间|天气|折扣|限时|今日/;

function compact(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function extractTerms(value) {
  const text = compact(value, 1200).toLowerCase();
  const latin = text.match(/[a-z0-9][a-z0-9._-]{1,}/g) || [];
  const chineseRuns = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const bigrams = chineseRuns.flatMap(run => Array.from({ length: Math.max(0, run.length - 1) }, (_, index) => run.slice(index, index + 2)));
  const dictionary = Object.values(CATEGORY_KEYWORDS).flat().filter(term => text.includes(term));
  return unique([...latin, ...bigrams, ...dictionary]).slice(0, 60);
}

function scoreText(value, terms) {
  const text = compact(value, 1600).toLowerCase();
  return terms.reduce((score, term) => score + (text.includes(term) ? Math.min(5, Math.max(1, term.length - 1)) : 0), 0);
}

function categoryForQuery(query, preferred) {
  if (CATEGORY_KEYWORDS[preferred]) return preferred;
  const scores = Object.entries(CATEGORY_KEYWORDS).map(([category, words]) => ({
    category,
    score: words.reduce((sum, word) => sum + (query.includes(word) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  return scores[0]?.score ? scores[0].category : "room";
}

function normalizedRecord(item, index) {
  const views = Number(item.views || 0);
  const interactions = Number(item.likes || 0) + Number(item.comments || 0) + Number(item.shares || 0);
  return {
    recordId: compact(item.id || `record-${index + 1}`, 80),
    topicId: compact(item.topicId, 80),
    topicFingerprint: compact(item.topicFingerprint, 240),
    title: compact(item.title, 100),
    body: compact(item.body, 160),
    imageIds: Array.isArray(item.imageIds) ? item.imageIds.slice(0, 5).map(id => compact(id, 100)) : [],
    coverId: compact(item.coverId || item.imageIds?.[0], 100),
    platform: compact(item.platform, 30),
    platforms: Array.isArray(item.platforms) ? item.platforms.slice(0, 3).map(value => compact(value, 30)) : [],
    type: compact(item.topicType, 30),
    status: compact(item.status, 30),
    views,
    interactions,
    engagementRate: views ? Number(((interactions / views) * 100).toFixed(2)) : null,
    publishedAt: compact(item.publishedAt, 40)
  };
}

function recordMatchesPlatform(record = {}, platform = "douyin") {
  if (record.platform) return record.platform === platform;
  if (Array.isArray(record.platforms) && record.platforms.length) return record.platforms.includes(platform);
  return platform === "douyin";
}

function retrieveFacts(payload, terms, limit) {
  const facts = Array.isArray(payload.knowledge?.facts) ? payload.knowledge.facts : [];
  return facts.map((item, index) => {
    const label = compact(item.label, 80);
    const value = compact(item.value, 700);
    const priority = FACT_PRIORITY.findIndex(field => label.includes(field));
    const base = priority >= 0 ? FACT_PRIORITY.length - priority : 0;
    return {
      evidenceId: `fact-${index + 1}`,
      label,
      value,
      source: compact(item.source, 50) || "未标注",
      mutable: MUTABLE_PATTERN.test(`${label}${value}`),
      retrievalScore: base + scoreText(`${label} ${value}`, terms) * 4
    };
  }).sort((a, b) => b.retrievalScore - a.retrievalScore).slice(0, limit);
}

function summarizeMaterials(materials) {
  const groups = new Map();
  materials.forEach(item => {
    const category = compact(item.category, 30) || "unknown";
    const group = groups.get(category) || { category, count: 0, unusedCount: 0, totalUses: 0, examples: [] };
    const used = Number(item.used || 0);
    group.count += 1;
    group.totalUses += used;
    if (!used) group.unusedCount += 1;
    if (group.examples.length < 3 && item.title) group.examples.push(compact(item.title, 50));
    groups.set(category, group);
  });
  return [...groups.values()].map(group => ({
    category: group.category,
    count: group.count,
    unusedCount: group.unusedCount,
    averageUses: group.count ? Number((group.totalUses / group.count).toFixed(2)) : 0,
    examples: group.examples
  }));
}

function retrieveMaterials(payload, terms, preferredCategory, limit) {
  const materials = Array.isArray(payload.materials) ? payload.materials : [];
  const previousSelection = new Set(Array.isArray(payload.previousContent?.materialIds) ? payload.previousContent.materialIds : []);
  const recentImageIds = new Map();
  const targetPlatform = compact(payload.targetPlatform, 30) || "douyin";
  const platformHistory = (Array.isArray(payload.records) ? payload.records : [])
    .filter(record => recordMatchesPlatform(record, targetPlatform));
  const recentCoverIds = new Set(platformHistory.slice(0, 8).map(record => record.coverId || record.imageIds?.[0]).filter(Boolean));
  platformHistory.slice(0, 10).forEach((record, recordIndex) => {
    (Array.isArray(record.imageIds) ? record.imageIds : []).forEach(id => {
      const current = recentImageIds.get(id) || { count: 0, lastIndex: recordIndex };
      current.count += 1;
      current.lastIndex = Math.min(current.lastIndex, recordIndex);
      recentImageIds.set(id, current);
    });
  });
  return materials.map(item => {
    const category = compact(item.category, 30) || "unknown";
    const used = Number(item.used || 0);
    const recent = recentImageIds.get(item.id);
    const selectedPreviously = previousSelection.has(item.id);
    const categoryBoost = category === preferredCategory ? 20 : 0;
    const unusedBoost = Math.max(0, 5 - used);
    return {
      materialId: compact(item.id, 100),
      category,
      title: compact(item.title, 80),
      source: compact(item.source, 50),
      used,
      recentlyUsed: Boolean(recent),
      coverRecentlyUsed: recentCoverIds.has(item.id),
      recentUseCount: recent?.count || 0,
      selectedPreviously,
      retrievalScore: categoryBoost + unusedBoost + scoreText(`${item.title || ""} ${item.category || ""}`, terms) - (recent ? 35 + recent.count * 5 : 0) - (selectedPreviously ? 45 : 0)
    };
  }).filter(item => item.materialId).sort((a, b) => b.retrievalScore - a.retrievalScore || a.used - b.used).slice(0, limit);
}

function retrieveHistory(payload, terms, stage, focusType, limit) {
  const records = Array.isArray(payload.records) ? payload.records : [];
  const targetPlatform = compact(payload.targetPlatform, 30) || "douyin";
  return records.filter(record => recordMatchesPlatform(record, targetPlatform)).map(normalizedRecord).map((item, index) => {
    const performance = Math.log10(Math.max(1, item.views + item.interactions * 4));
    const similarity = scoreText(`${item.title} ${item.body}`, terms);
    const typeBoost = focusType && item.type === focusType ? 4 : 0;
    const recency = Math.max(0, 4 - index * 0.2);
    return { ...item, retrievalScore: Number((performance + similarity + typeBoost + recency).toFixed(2)) };
  }).filter(item => stage === "content-generation" ? item.status === "published" : true)
    .sort((a, b) => b.retrievalScore - a.retrievalScore)
    .slice(0, limit);
}

function merchantContext(payload) {
  return {
    brandName: compact(payload.settings?.brandName, 120),
    shortName: compact(payload.settings?.shortName, 40),
    city: compact(payload.settings?.city, 30),
    hotelType: compact(payload.settings?.hotelType, 50),
    voice: compact(payload.settings?.voice, 160),
    forbidden: compact(payload.settings?.forbidden, 300)
  };
}

export function retrieveStageContext(payload = {}, stage = "topic-recommendation") {
  const focusTopic = payload.focusTopic || null;
  const focusText = [focusTopic?.title, focusTopic?.reason, focusTopic?.hook, focusTopic?.contentAngle, payload.settings?.city, payload.settings?.hotelType].filter(Boolean).join(" ");
  const terms = extractTerms(focusText);
  const preferredCategory = categoryForQuery(focusText, focusTopic?.materialCategory || focusTopic?.material);
  const topicStage = stage === "topic-recommendation";
  const evidence = retrieveFacts(payload, terms, topicStage ? 8 : 10);
  const history = retrieveHistory(payload, terms, stage, focusTopic?.type, topicStage ? 8 : 5);
  const allMaterials = Array.isArray(payload.materials) ? payload.materials : [];
  const materialInventory = summarizeMaterials(allMaterials)
    .sort((a, b) => (b.category === preferredCategory) - (a.category === preferredCategory) || b.count - a.count)
    .slice(0, topicStage ? 5 : 3);
  const materialCandidates = topicStage ? [] : retrieveMaterials(payload, terms, preferredCategory, 12);
  const rejectedTopics = topicStage && Array.isArray(payload.rejectedTopics) ? payload.rejectedTopics.slice(-30).map(item => ({
    id: compact(item?.id, 80),
    title: compact(item?.title, 120),
    type: compact(item?.type, 30),
    targetAudience: compact(item?.targetAudience, 100),
    contentAngle: compact(item?.contentAngle, 120),
    materialCategory: compact(item?.materialCategory, 30),
    reason: compact(item?.reason, 180)
  })).filter(item => item.title) : [];
  const locationContext = !topicStage && payload.locationContext ? {
    hotelId: compact(payload.locationContext.hotelId, 80),
    name: compact(payload.locationContext.name, 120),
    address: compact(payload.locationContext.address, 220),
    city: compact(payload.locationContext.city, 30),
    latitude: Number(payload.locationContext.latitude) || null,
    longitude: Number(payload.locationContext.longitude) || null,
    coordinateText: compact(payload.locationContext.coordinateText, 100),
    source: compact(payload.locationContext.source, 50),
    platformPoiId: compact(payload.locationContext.platformPoiId, 100),
    status: compact(payload.locationContext.status, 50),
    nearbyPois: Array.isArray(payload.locationContext.nearbyPois) ? payload.locationContext.nearbyPois.slice(0, 5).map(item => ({
      name: compact(item?.name, 100), type: compact(item?.type, 40), distance: compact(item?.distance, 40)
    })) : []
  } : null;
  const previousContent = !topicStage && payload.previousContent ? {
    title: compact(payload.previousContent.title, 40),
    body: compact(payload.previousContent.body, 220),
    hook: compact(payload.previousContent.hook, 100),
    cta: compact(payload.previousContent.cta, 100),
    materialIds: Array.isArray(payload.previousContent.materialIds) ? payload.previousContent.materialIds.slice(0, 5).map(item => compact(item, 100)) : [],
    materialCategory: compact(payload.previousContent.materialCategory, 30),
    regenerationCount: Number(payload.previousContent.regenerationCount || 0)
  } : null;
  return {
    account: {
      accountId: compact(payload.accountId, 80),
      hotelId: compact(payload.hotelId || payload.otaSnapshot?.selectedHotelId, 80)
    },
    merchant: merchantContext(payload),
    focusTopic: focusTopic ? {
      id: compact(focusTopic.id, 100),
      title: compact(focusTopic.title, 120),
      type: compact(focusTopic.type, 30),
      objective: compact(focusTopic.objective, 30),
      targetAudience: compact(focusTopic.targetAudience, 100),
      reason: compact(focusTopic.reason, 240),
      hook: compact(focusTopic.hook, 100),
      contentAngle: compact(focusTopic.contentAngle, 120),
      materialCategory: preferredCategory,
      factReferences: Array.isArray(focusTopic.factReferences) ? focusTopic.factReferences.slice(0, 8).map(item => compact(item, 80)) : []
    } : null,
    retrievedEvidence: evidence,
    materialInventory,
    materialCandidates,
    retrievedHistory: history,
    rejectedTopicIds: topicStage && Array.isArray(payload.rejectedTopicIds) ? payload.rejectedTopicIds.slice(0, 30).map(item => compact(item, 80)) : [],
    rejectedTopics,
    locationContext,
    previousContent,
    rewriteRequirements: previousContent ? {
      mustChange: ["开头钩子", "信息组织顺序", "CTA或评论引导", "图片组合/封面中至少两项"],
      forbidden: ["复用上一版首句", "只替换同义词", "保持完全相同图片顺序"],
      preserve: ["focusTopic", "酒店事实", "地点定位"]
    } : null,
    retrieval: {
      strategy: "local-lexical-rag-v2-media-dedup",
      stage,
      queryTerms: terms.slice(0, 20),
      mediaDedupWindow: topicStage ? 0 : 10,
      coverDedupWindow: topicStage ? 0 : 8,
      targetPlatform: compact(payload.targetPlatform, 30) || "douyin",
      preferredCategory,
      sourceCounts: {
        factsAvailable: Array.isArray(payload.knowledge?.facts) ? payload.knowledge.facts.length : 0,
        factsRetrieved: evidence.length,
        materialsAvailable: allMaterials.length,
        materialsRetrieved: materialCandidates.length,
        historyAvailable: Array.isArray(payload.records) ? payload.records.length : 0,
        historyRetrieved: history.length
      }
    }
  };
}
