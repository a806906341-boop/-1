import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assessRisk, BODY_MAX, BODY_MIN, BODY_TARGET, charCount, CONTENT_IMAGE_LIMIT } from "./src/domain.js";
import {
  buildSystemPrompt,
  buildUserPrompt,
  cleanAiPayload,
  STAGES,
  getRulesManifest
} from "./src/skill-engine.js";

export { buildSystemPrompt, buildUserPrompt, cleanAiPayload, STAGES, getRulesManifest } from "./src/skill-engine.js";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_BASE_URL = "https://llm-tm83obzb740cjjya.cn-beijing.maas.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "qwen3.7-max-2026-06-08";
const MAX_BODY_BYTES = 1024 * 1024;
const STAGE_MODEL_OPTIONS = {
  test: { timeoutMs: 90_000, maxTokens: 400, temperature: 0.1 },
  [STAGES.TOPIC]: { timeoutMs: 120_000, maxTokens: 1600, temperature: 0.45 },
  [STAGES.CONTENT]: { timeoutMs: 150_000, maxTokens: 3200, temperature: 0.55 }
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

const ACTIVE_HTML_ENTRIES = new Set(["/index.html", "/user-a.html"]);
const LEGACY_USER_ENTRIES = new Set(["/user.html", "/user-v2.html", "/v12.html", "/v123.html"]);

export function resolveStaticRoute(pathname) {
  if (LEGACY_USER_ENTRIES.has(pathname)) return { kind: "redirect", location: "/user-a.html" };
  if (pathname !== "/" && extname(pathname).toLowerCase() === ".html" && !ACTIVE_HTML_ENTRIES.has(pathname)) {
    return { kind: "historical" };
  }
  return { kind: "file", relative: decodeURIComponent(pathname === "/" ? "/index.html" : pathname) };
}

const runtimeConfig = {
  apiKey: process.env.DASHSCOPE_API_KEY || "",
  baseUrl: process.env.AI_BASE_URL || DEFAULT_BASE_URL,
  model: process.env.AI_MODEL || DEFAULT_MODEL,
  projectId: process.env.AI_PROJECT_ID || "2980584",
  source: process.env.DASHSCOPE_API_KEY ? "environment" : "none"
};

const douyinInteractionConfig = {
  gatewayUrl: process.env.DOUYIN_INTERACTION_GATEWAY || "",
  accessToken: process.env.DOUYIN_ACCESS_TOKEN || "",
  clientKey: process.env.DOUYIN_CLIENT_KEY || "",
  source: process.env.DOUYIN_ACCESS_TOKEN ? "environment" : "none"
};

export function validateDouyinInteractionConfig({ gatewayUrl, accessToken, clientKey }) {
  if (!gatewayUrl || !accessToken || !clientKey) throw new Error("缺少抖音互动网关、Access Token 或 Client Key");
  let url;
  try { url = new URL(gatewayUrl); } catch { throw new Error("抖音互动网关不是有效 URL"); }
  if (url.protocol !== "https:") throw new Error("抖音互动网关必须使用 HTTPS");
  return { gatewayUrl: gatewayUrl.replace(/\/+$/, ""), accessToken: accessToken.trim(), clientKey: clientKey.trim() };
}

function publicDouyinInteractionConfig() {
  const configured = Boolean(douyinInteractionConfig.gatewayUrl && douyinInteractionConfig.accessToken && douyinInteractionConfig.clientKey);
  return {
    configured,
    mode: configured ? "connected" : "demo",
    provider: "抖音开放平台互动适配器",
    scopes: ["comment.list", "comment.reply", "message.list", "message.reply"],
    credentialSource: configured ? douyinInteractionConfig.source : "none"
  };
}

async function callDouyinInteractionGateway(action, payload) {
  const config = validateDouyinInteractionConfig(douyinInteractionConfig);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${config.gatewayUrl}/${action}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.accessToken}`,
        "X-Douyin-Client-Key": config.clientKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`抖音互动网关调用失败：${compact(data.error || data.message || `HTTP ${response.status}`, 240)}`);
    return data;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("抖音互动网关请求超过30秒，已取消");
    throw error;
  } finally { clearTimeout(timer); }
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

function publicConfig() {
  let endpoint = "未配置";
  try { endpoint = new URL(runtimeConfig.baseUrl).host; } catch { /* validated later */ }
  return {
    configured: Boolean(runtimeConfig.apiKey),
    provider: "阿里云百炼 · 通义千问",
    protocol: "openai-chat-completions",
    model: runtimeConfig.model,
    endpoint,
    baseUrl: runtimeConfig.baseUrl,
    projectId: runtimeConfig.projectId,
    credentialSource: runtimeConfig.source
  };
}

export function validateModelConfig({ baseUrl, model, apiKey }) {
  if (!apiKey || typeof apiKey !== "string" || apiKey.length < 12) throw new Error("API Key 无效或为空");
  if (!model || !/^[a-zA-Z0-9._:-]{2,100}$/.test(model)) throw new Error("模型名称格式无效");
  let url;
  try { url = new URL(baseUrl); } catch { throw new Error("接口地址不是有效 URL"); }
  if (url.protocol !== "https:") throw new Error("模型接口必须使用 HTTPS");
  if (!(url.hostname === "dashscope.aliyuncs.com" || url.hostname.endsWith(".maas.aliyuncs.com"))) {
    throw new Error("当前版本仅允许阿里云百炼官方域名");
  }
  return { apiKey: apiKey.trim(), baseUrl: baseUrl.replace(/\/+$/, ""), model: model.trim() };
}

function compact(value, max = 600) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function topicFingerprint(value) {
  return String(value || "").toLowerCase().replace(/[\s，。！？、：；,.!?:;“”‘’'"（）()《》【】\-_]/g, "");
}

function topicTitlesOverlap(left, right) {
  const a = topicFingerprint(left);
  const b = topicFingerprint(right);
  if (!a || !b) return false;
  return a === b || (Math.min(a.length, b.length) >= 6 && (a.includes(b) || b.includes(a)));
}

function contentFingerprint(value) {
  return Array.from(String(value || "").toLowerCase().replace(/[\s，。！？、：；,.!?:;“”‘’'"（）()《》【】\-_]/g, ""));
}

export function contentSimilarity(left, right) {
  const grams = value => {
    const chars = contentFingerprint(value);
    if (chars.length < 2) return new Set(chars);
    return new Set(chars.slice(0, -1).map((char, index) => `${char}${chars[index + 1]}`));
  };
  const a = grams(left);
  const b = grams(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter(item => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? Number((intersection / union).toFixed(3)) : 0;
}

function recordMatchesPlatform(record = {}, platform = "douyin") {
  if (record.platform) return record.platform === platform;
  if (Array.isArray(record.platforms) && record.platforms.length) return record.platforms.includes(platform);
  return platform === "douyin";
}

function recentPublishedRecords(payload = {}, platform = "douyin", limit = 30) {
  const eligibleStatuses = new Set(["published", "reviewing", "scheduled"]);
  return (Array.isArray(payload.records) ? payload.records : [])
    .filter(record => eligibleStatuses.has(record?.status) && recordMatchesPlatform(record, platform))
    .slice(0, limit);
}

function validateHistoryOriginality(content, payload = {}) {
  const platform = compact(payload.targetPlatform, 30) || "douyin";
  const currentIds = new Set(content.materialIds || []);
  const conflict = recentPublishedRecords(payload, platform, 30).map(record => {
    const titleSimilarity = contentSimilarity(content.title, record.title);
    const bodySimilarity = contentSimilarity(content.body, record.body);
    const imageOverlap = (record.imageIds || []).filter(id => currentIds.has(id)).length;
    return { record, titleSimilarity, bodySimilarity, imageOverlap };
  }).find(item => item.titleSimilarity >= 0.8
    || item.bodySimilarity >= 0.85
    || (item.bodySimilarity >= 0.8 && item.imageOverlap >= 2));
  if (!conflict) return;
  const error = new Error(`生成内容与${platform}历史作品《${compact(conflict.record.title, 30)}》过于相似（标题${Math.round(conflict.titleSimilarity * 100)}%、正文${Math.round(conflict.bodySimilarity * 100)}%、图片重合${conflict.imageOverlap}张）`);
  error.code = "CONTENT_HISTORY_SIMILAR";
  error.similarity = Math.max(conflict.titleSimilarity, conflict.bodySimilarity);
  throw error;
}

function normalizeLocation(context = {}) {
  const latitude = Number(context.latitude);
  const longitude = Number(context.longitude);
  return {
    hotelId: limited(context.hotelId, 80),
    name: limited(context.name, 120),
    address: limited(context.address, 240),
    city: limited(context.city, 40),
    latitude: Number.isFinite(latitude) && latitude ? latitude : null,
    longitude: Number.isFinite(longitude) && longitude ? longitude : null,
    coordinateText: limited(context.coordinateText, 100),
    source: limited(context.source, 50) || "商家设置",
    platformPoiId: limited(context.platformPoiId, 100),
    status: context.platformPoiId ? "matched" : "pending-platform-match"
  };
}

export function parseModelJson(text) {
  const raw = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("模型未返回有效 JSON");
  try { return JSON.parse(raw.slice(start, end + 1)); }
  catch { throw new Error("模型返回的 JSON 无法解析"); }
}

function limited(value, max) { return Array.from(compact(value, max * 3)).slice(0, max).join(""); }
const USER_INTERNAL_TERM_PATTERN = /(?:fact[-_]?\d+|materialInventory|rejectedTopics|history[-_]|evidenceId|factReferences|RAG|Top[- ]?K|素材ID|字段名[｜|]来源)/i;
function normalizeUserFacingTopicText(value, fallback, max) {
  const text = limited(value, max);
  return !text || USER_INTERNAL_TERM_PATTERN.test(text) ? fallback : text;
}

function stringList(value, maxItems = 8, maxLength = 120) {
  return Array.isArray(value) ? value.slice(0, maxItems).map(item => limited(item, maxLength)).filter(Boolean) : [];
}

function boundedScore(value, fallback = 0) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : fallback;
}

function normalizeSteps(value, maxItems = 8) {
  return Array.isArray(value) ? value.slice(0, maxItems).map((item, index) => ({
    order: Number(item?.order || index + 1),
    scene: limited(item?.scene || item?.purpose || "", 120),
    overlay: limited(item?.overlay || "", 40)
  })).filter(item => item.scene) : [];
}

function evaluateNormalizedContent(content, payload, focusTopic = {}, ragContext = null) {
  const evidence = ragContext?.retrievedEvidence || payload?.knowledge?.facts || [];
  const knownLabels = new Set(evidence.map(item => compact(item.label, 80)).filter(Boolean));
  const referencedLabels = content.factReferences.map(item => item.split("｜")[0].trim());
  const unknownReferences = referencedLabels.filter(label => label && ![...knownLabels].some(known => known.includes(label) || label.includes(known)));
  const grounding = content.factReferences.length ? Math.max(10, 25 - unknownReferences.length * 5) : 5;
  const compliance = content.risk.level === "high" ? 0 : content.risk.level === "medium" ? 12 : content.risk.level === "low" ? 16 : 20;
  const strategy = focusTopic?.objective && focusTopic?.targetAudience && (focusTopic?.reason || focusTopic?.contentAngle) ? 15 : 9;
  const hasBrandVoice = Boolean(compact(payload?.settings?.voice, 160));
  const brand = content.title && content.body ? (hasBrandVoice ? 10 : 8) : 3;
  const platform = Math.min(15, (content.tags.length >= 3 ? 5 : 2) + (content.coverText ? 3 : 0) + (content.hook ? 3 : 0) + (content.cta ? 2 : 0) + 2);
  const imagePoints = content.materialIds.length === CONTENT_IMAGE_LIMIT && content.imagePlan.length >= CONTENT_IMAGE_LIMIT
    ? 8
    : content.materialIds.length && content.imagePlan.length ? 4 : content.materialIds.length ? 2 : 0;
  const material = Math.min(15, imagePoints + (content.shotPlan.length ? 5 : 0) + (content.materialCategory ? 2 : 0));
  const scoreBreakdown = { grounding, compliance, strategy, brand, platform, material };
  const qualityScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);
  const requiresConfirmation = content.requiresConfirmation || content.manualConfirmations.length > 0 || unknownReferences.length > 0;
  const issues = [
    ...content.risk.issues.map(item => `${item.category}：${item.message}`),
    ...unknownReferences.map(item => `事实引用“${item}”未匹配当前知识库字段`)
  ];
  const publishGate = content.risk.level === "high" ? "blocked" : qualityScore < 70 ? "revise" : requiresConfirmation ? "needs-confirmation" : "ready";
  return { qualityScore, scoreBreakdown, riskLevel: content.risk.level, issues, publishGate, requiresConfirmation };
}

function normalizeExecutionTrace(raw) {
  return {
    skills: stringList(raw?.skills, 12, 80),
    decisions: stringList(raw?.decisions, 12, 160),
    evidenceGaps: stringList(raw?.evidenceGaps, 12, 160),
    manualConfirmations: stringList(raw?.manualConfirmations, 12, 160)
  };
}

export function normalizeTopicOutput(raw, payload = {}) {
  const allowedTypes = new Set(["traffic", "vertical", "marketing"]);
  const allowedCategories = new Set(["room", "public", "exterior", "dining", "poi"]);
  if (!raw || !Array.isArray(raw.recommendations)) throw new Error("模型返回缺少 recommendations");
  const recommendations = raw.recommendations.slice(0, 3).map((item, index) => ({
    id: `ai_${Date.now()}_${index}`,
    title: limited(item.title, 24),
    type: allowedTypes.has(item.type) ? item.type : ["traffic", "vertical", "marketing"][index],
    displayReason: normalizeUserFacingTopicText(item.displayReason, "结合当前酒店客群、内容方向和现有实拍素材推荐。", 80),
    reason: limited(item.reason, 120),
    materialCategory: allowedCategories.has(item.materialCategory) ? item.materialCategory : "room",
    hook: limited(item.hook, 60),
    objective: limited(item.objective, 30),
    targetAudience: normalizeUserFacingTopicText(item.targetAudience, "适合正在比较大理住宿体验的目标客人", 100),
    contentAngle: normalizeUserFacingTopicText(item.contentAngle, "从真实入住场景切入，突出酒店体验价值", 120),
    materialReadiness: normalizeUserFacingTopicText(item.materialReadiness, "当前酒店素材库已有相关实拍图片可供使用", 100),
    materialPlan: stringList(item.materialPlan, 6, 100),
    factReferences: stringList(item.factReferences, 8, 80),
    riskHints: stringList(item.riskHints, 6, 100),
    score: boundedScore(item.score, 60),
    source: "ai"
  })).filter(item => item.title);
  if (recommendations.length < 3) throw new Error("模型推荐不足3条");
  const rejected = Array.isArray(payload.rejectedTopics) ? payload.rejectedTopics : [];
  const repeated = recommendations.find(item => rejected.some(old => topicTitlesOverlap(item.title, old?.title)));
  const internalDuplicate = recommendations.find((item, index) => recommendations.some((other, otherIndex) => otherIndex < index && topicTitlesOverlap(item.title, other.title)));
  if (repeated || internalDuplicate) {
    const error = new Error(`模型返回重复选题：${repeated?.title || internalDuplicate?.title}`);
    error.code = "DUPLICATE_TOPICS";
    throw error;
  }
  return {
    strategySummary: limited(raw.strategySummary, 100),
    executionTrace: normalizeExecutionTrace(raw.executionTrace),
    recommendations
  };
}

export function normalizeContentOutput(raw, payload = {}, focusTopic = {}, ragContext = null) {
  const allowedCategories = new Set(["room", "public", "exterior", "dining", "poi"]);
  if (!raw?.content) throw new Error("模型返回缺少 content");
  const fallbackCategory = allowedCategories.has(focusTopic.materialCategory) ? focusTopic.materialCategory : "room";
  const allowedMaterialIds = new Set((ragContext?.materialCandidates || []).map(item => item.materialId));
  const bodyText = compact(raw.content.body, BODY_MAX * 4);
  const bodyLength = charCount(bodyText);
  if (bodyLength < BODY_MIN || bodyLength > BODY_MAX) {
    const error = new Error(`模型正文长度为${bodyLength}字，要求${BODY_MIN}至${BODY_MAX}字并以${BODY_TARGET}字为目标`);
    error.code = "CONTENT_LENGTH";
    throw error;
  }
  const materialIds = [...new Set(stringList(raw.content.materialIds, 50, 100).filter(id => allowedMaterialIds.has(id)))].slice(0, CONTENT_IMAGE_LIMIT);
  if (materialIds.length !== CONTENT_IMAGE_LIMIT) {
    const error = new Error(`模型返回${materialIds.length}张有效候选图片，要求固定${CONTENT_IMAGE_LIMIT}张且全部来自本轮素材白名单`);
    error.code = "CONTENT_MATERIALS";
    throw error;
  }
  const content = {
    title: limited(raw.content.title || focusTopic.title, 20),
    body: bodyText,
    tags: Array.isArray(raw.content.tags) ? raw.content.tags.slice(0, 5).map(tag => {
      const clean = limited(tag, 20); return clean.startsWith("#") ? clean : `#${clean}`;
    }).filter(tag => tag.length > 1) : [],
    materialCategory: allowedCategories.has(raw.content.materialCategory) ? raw.content.materialCategory : fallbackCategory,
    materialIds,
    requiresConfirmation: Boolean(raw.content.requiresConfirmation),
    coverText: limited(raw.content.coverText, 12),
    hook: limited(raw.content.hook, 60),
    cta: limited(raw.content.cta, 60),
    commentPrompt: limited(raw.content.commentPrompt, 80),
    rewriteSummary: limited(raw.content.rewriteSummary, 180),
    location: normalizeLocation(payload.locationContext || {}),
    musicMood: limited(raw.content.musicMood, 50),
    factReferences: stringList(raw.content.factReferences, 8, 80),
    manualConfirmations: stringList(raw.content.manualConfirmations, 8, 120),
    claimEvidence: Array.isArray(raw.content.claimEvidence) ? raw.content.claimEvidence.slice(0, 12).map(item => ({
      claim: limited(item?.claim, 120), evidence: limited(item?.evidence, 120)
    })).filter(item => item.claim && item.evidence) : [],
    imagePlan: Array.isArray(raw.content.imagePlan) ? raw.content.imagePlan.slice(0, CONTENT_IMAGE_LIMIT).map((item, index) => ({
      order: Number(item?.order || index + 1),
      materialId: allowedMaterialIds.has(item?.materialId) ? limited(item.materialId, 100) : "",
      category: allowedCategories.has(item?.category) ? item.category : "room",
      purpose: limited(item?.purpose, 100),
      cropMode: limited(item?.cropMode, 100),
      selectionReason: limited(item?.selectionReason || item?.selectionRule, 140)
    })).filter(item => item.materialId && materialIds.includes(item.materialId))
      .sort((a, b) => a.order - b.order) : [],
    shotPlan: normalizeSteps(raw.content.shotPlan)
  };
  if (payload.mode === "regenerate" && payload.previousContent?.body) {
    const similarity = contentSimilarity(content.body, payload.previousContent.body);
    const sameTitle = topicFingerprint(content.title) === topicFingerprint(payload.previousContent.title);
    const sameOpening = topicFingerprint(content.body).slice(0, 24) === topicFingerprint(payload.previousContent.body).slice(0, 24);
    if (similarity >= 0.68 || (sameTitle && sameOpening)) {
      const error = new Error(`重写结果与上一版相似度${Math.round(similarity * 100)}%，未形成实质变化`);
      error.code = "CONTENT_TOO_SIMILAR";
      error.similarity = similarity;
      throw error;
    }
    content.rewriteSimilarity = similarity;
    if (!content.rewriteSummary) content.rewriteSummary = "已更换开头钩子、信息顺序或行动引导，并重新选择图片组合";
  } else {
    content.rewriteSimilarity = null;
  }
  validateHistoryOriginality(content, payload);
  content.risk = assessRisk({ ...content, imageAuthenticity: "real" });
  if (!content.title || !content.body) throw new Error("模型生成内容为空");
  const deterministicReview = evaluateNormalizedContent(content, payload, focusTopic, ragContext);
  content.requiresConfirmation = deterministicReview.requiresConfirmation;
  content.selfReview = deterministicReview;
  return { executionTrace: normalizeExecutionTrace(raw.executionTrace), content };
}

// 兼容旧测试和外部调用；正式请求使用两个独立阶段规范化函数。
export function normalizeModelOutput(raw, payload = {}) {
  const topic = normalizeTopicOutput(raw);
  const ragContext = cleanAiPayload(payload, STAGES.CONTENT);
  const content = normalizeContentOutput(raw, payload, topic.recommendations[0], ragContext);
  return { ...topic, ...content };
}

async function callQwen(messages, override = {}, { stage = "test" } = {}) {
  const config = validateModelConfig({ ...runtimeConfig, ...override });
  const options = STAGE_MODEL_OPTIONS[stage] || STAGE_MODEL_OPTIONS.test;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        enable_thinking: false
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || data?.message || `HTTP ${response.status}`;
      throw new Error(`模型接口调用失败：${compact(detail, 300)}`);
    }
    const output = data?.choices?.[0]?.message?.content;
    if (!output) throw new Error("模型接口返回内容为空");
    return { text: output, model: data.model || config.model, usage: data.usage || null, durationMs: Date.now() - startedAt };
  } catch (error) {
    if (error.name === "AbortError") throw new Error(`模型请求超过${Math.round(options.timeoutMs / 1000)}秒，已取消`);
    throw error;
  } finally { clearTimeout(timer); }
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("请求体超过1MB限制");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new Error("请求体不是有效 JSON"); }
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/douyin/interactions/status") return json(res, 200, publicDouyinInteractionConfig());
  if (req.method === "POST" && pathname === "/api/douyin/interactions/sync") {
    if (!publicDouyinInteractionConfig().configured) return json(res, 409, { error: "尚未配置抖音互动授权", required: ["DOUYIN_INTERACTION_GATEWAY", "DOUYIN_ACCESS_TOKEN", "DOUYIN_CLIENT_KEY"] });
    const body = await readBody(req);
    const result = await callDouyinInteractionGateway("sync", { accountId: limited(body.accountId, 100) });
    return json(res, 200, { items: Array.isArray(result.items) ? result.items : [], syncedAt: result.syncedAt || new Date().toISOString(), source: "douyin-open-platform" });
  }
  if (req.method === "POST" && pathname === "/api/douyin/interactions/reply") {
    if (!publicDouyinInteractionConfig().configured) return json(res, 409, { error: "尚未配置抖音互动授权", required: ["DOUYIN_INTERACTION_GATEWAY", "DOUYIN_ACCESS_TOKEN", "DOUYIN_CLIENT_KEY"] });
    const body = await readBody(req);
    const reply = limited(body.reply, 180);
    if (!reply || !body.interactionId || !["comment", "message"].includes(body.channel)) return json(res, 400, { error: "互动ID、类型或回复内容无效" });
    const result = await callDouyinInteractionGateway("reply", { accountId: limited(body.accountId, 100), interactionId: limited(body.interactionId, 120), channel: body.channel, reply });
    return json(res, 200, { submitted: Boolean(result.submitted), platformReplyId: limited(result.platformReplyId, 120), repliedAt: result.repliedAt || new Date().toISOString() });
  }
  if (req.method === "GET" && pathname === "/api/ai/status") return json(res, 200, publicConfig());
  if (req.method === "GET" && pathname === "/api/ai/rules") return json(res, 200, getRulesManifest());
  if (req.method === "POST" && pathname === "/api/ai/configure") {
    const body = await readBody(req);
    if (body.clearKey) {
      runtimeConfig.apiKey = ""; runtimeConfig.source = "none";
      return json(res, 200, publicConfig());
    }
    const next = validateModelConfig({
      apiKey: body.apiKey || runtimeConfig.apiKey,
      baseUrl: body.baseUrl || runtimeConfig.baseUrl,
      model: body.model || runtimeConfig.model
    });
    Object.assign(runtimeConfig, next, { projectId: compact(body.projectId || runtimeConfig.projectId, 80), source: body.apiKey ? "memory" : runtimeConfig.source });
    return json(res, 200, publicConfig());
  }
  if (req.method === "POST" && pathname === "/api/ai/test") {
    const result = await callQwen([
      { role: "system", content: "只返回纯JSON：{\"ok\":true,\"message\":\"连接成功\"}" },
      { role: "user", content: "执行连接测试" }
    ], {}, { stage: "test" });
    return json(res, 200, { ok: true, model: result.model, usage: result.usage, durationMs: result.durationMs });
  }
  if (req.method === "POST" && pathname === "/api/ai/topics") {
    if (!runtimeConfig.apiKey) return json(res, 409, { error: "模型尚未配置，请先在系统设置中输入 API Key" });
    const body = await readBody(req);
    const stage = STAGES.TOPIC;
    const ragContext = cleanAiPayload(body, stage);
    const messages = [
      { role: "system", content: buildSystemPrompt(stage) },
      { role: "user", content: buildUserPrompt(stage, body) }
    ];
    let result = await callQwen(messages, {}, { stage });
    let normalized;
    let retryCount = 0;
    try {
      normalized = normalizeTopicOutput(parseModelJson(result.text), body);
    } catch (error) {
      if (error.code !== "DUPLICATE_TOPICS") throw error;
      retryCount = 1;
      result = await callQwen([
        ...messages,
        { role: "assistant", content: result.text },
        { role: "user", content: `上一版违反换题规则：${error.message}。删除所有与 rejectedTopics 相同或互为包含关系的方向，改变受众、内容角度和素材分类后，重新返回恰好三条。` }
      ], {}, { stage });
      normalized = normalizeTopicOutput(parseModelJson(result.text), body);
    }
    return json(res, 200, {
      ...normalized,
      stage,
      retrieval: ragContext.retrieval,
      model: result.model,
      usage: result.usage,
      retryCount,
      durationMs: result.durationMs,
      generatedAt: new Date().toISOString()
    });
  }
  if (req.method === "POST" && pathname === "/api/ai/content") {
    if (!runtimeConfig.apiKey) return json(res, 409, { error: "模型尚未配置，请先在系统设置中输入 API Key" });
    const body = await readBody(req);
    if (!body.focusTopic?.title) return json(res, 400, { error: "内容生成必须先选择 focusTopic" });
    const stage = STAGES.CONTENT;
    const ragContext = cleanAiPayload(body, stage);
    const messages = [
      { role: "system", content: buildSystemPrompt(stage) },
      { role: "user", content: buildUserPrompt(stage, body) }
    ];
    let conversation = [...messages];
    let result;
    let normalized;
    let retryCount = 0;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      result = await callQwen(conversation, {}, { stage });
      try {
        normalized = normalizeContentOutput(parseModelJson(result.text), body, body.focusTopic, ragContext);
        break;
      } catch (error) {
        if (!["CONTENT_LENGTH", "CONTENT_TOO_SIMILAR", "CONTENT_HISTORY_SIMILAR", "CONTENT_MATERIALS"].includes(error.code) || attempt === 2) throw error;
        retryCount += 1;
        const correction = error.code === "CONTENT_LENGTH"
          ? `本轮正文长度不合格：${error.message}。完整重写，目标约${BODY_TARGET}字且必须在${BODY_MIN}至${BODY_MAX}字之间，不要截断句子。`
          : error.code === "CONTENT_HISTORY_SIMILAR"
            ? `本轮内容与当前平台历史作品过于相似：${error.message}。保留事实，但更换目标场景、首句钩子、信息组织顺序、标题表达和图片组合。`
            : error.code === "CONTENT_MATERIALS"
              ? `本轮五图不合格：${error.message}。必须从 materialCandidates 白名单中选择恰好${CONTENT_IMAGE_LIMIT}个互不重复的素材ID，并给出对应图片计划。`
              : `本轮重写没有形成实质变化：${error.message}。必须更换首句钩子和信息组织顺序，同时改变CTA/评论引导及图片封面，不得只替换同义词。`;
        conversation = [
          ...conversation,
          { role: "assistant", content: result.text },
          { role: "user", content: `${correction} 保留 focusTopic、已核验事实和 locationContext；在 rewriteSummary 列出至少两个变化。图片固定选择${CONTENT_IMAGE_LIMIT}张不重复素材（1张封面、4张内容图），优先 selectedPreviously=false。` }
        ];
      }
    }
    return json(res, 200, {
      ...normalized,
      stage,
      retrieval: ragContext.retrieval,
      model: result.model,
      usage: result.usage,
      retryCount,
      durationMs: result.durationMs,
      generatedAt: new Date().toISOString()
    });
  }
  if (req.method === "POST" && pathname === "/api/ai/recommend") {
    return json(res, 410, { error: "旧的一体化接口已停用，请先调用 /api/ai/topics，再调用 /api/ai/content" });
  }
  return json(res, 404, { error: "API 路径不存在" });
}

async function serveStatic(req, res, pathname) {
  const route = resolveStaticRoute(pathname);
  if (route.kind === "redirect") {
    res.writeHead(308, {
      "Location": route.location,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    return res.end();
  }
  if (route.kind === "historical") {
    return json(res, 404, { error: "该页面是历史原型文件，不属于现役应用入口" });
  }
  const relative = route.relative;
  const filePath = resolve(ROOT, `.${relative}`);
  if (!(filePath === resolve(ROOT, "index.html") || filePath.startsWith(resolve(ROOT) + sep))) return json(res, 403, { error: "禁止访问" });
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not file");
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": [".html", ".js", ".css"].includes(extname(filePath)) ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    });
    if (req.method === "HEAD") return res.end();
    res.end(body);
  } catch { json(res, 404, { error: "文件不存在" }); }
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    try {
      if (url.pathname.startsWith("/api/")) await handleApi(req, res, url.pathname);
      else if (["GET", "HEAD"].includes(req.method || "")) await serveStatic(req, res, url.pathname);
      else json(res, 405, { error: "请求方法不允许" });
    } catch (error) {
      console.error(`[${new Date().toISOString()}]`, error.message);
      json(res, 500, { error: error.message || "服务器内部错误" });
    }
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const port = Number(process.env.PORT || 5173);
  const server = createAppServer();
  server.listen(port, "127.0.0.1", () => {
    const status = runtimeConfig.apiKey ? `已配置 ${runtimeConfig.model}` : "未配置模型 Key";
    console.log(`住得满 AI 新媒体：http://localhost:${port}（${status}）`);
  });
}
