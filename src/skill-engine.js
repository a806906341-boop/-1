import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { retrieveStageContext } from "./rag-engine.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RULESET_VERSION = "2026.07.24-v9";

export const STAGES = {
  TOPIC: "topic-recommendation",
  CONTENT: "content-generation",
  PUBLISH: "publish-preparation",
  PERFORMANCE: "performance-analysis"
};

export const SKILL_REGISTRY = [
  { id: "hotel-media-orchestrator", name: "酒店新媒体总编排", stage: "orchestration", purpose: "限制当前阶段边界、维护账号隔离和执行轨迹", triggers: ["所有阶段"], stages: Object.values(STAGES) },
  { id: "hotel-fact-grounding", name: "酒店事实约束", stage: "grounding", purpose: "只从阶段 RAG 结果建立事实证据与待确认项", triggers: ["选题检索后", "内容检索后", "发布前"], stages: [STAGES.TOPIC, STAGES.CONTENT, STAGES.PUBLISH] },
  { id: "hotel-topic-strategy", name: "酒店选题策略", stage: "strategy", purpose: "使用检索事实、历史和素材聚合生成三个选题", triggers: ["今日推荐", "换一组"], stages: [STAGES.TOPIC] },
  { id: "hotel-content-production", name: "酒店内容生产", stage: "creation", purpose: "围绕已选方向生成一条成稿，不重新推荐选题", triggers: ["选择方向", "重新生成"], stages: [STAGES.CONTENT] },
  { id: "hotel-visual-director", name: "酒店视觉选材", stage: "visual", purpose: "只从 RAG 返回的素材候选选择图片与镜头顺序", triggers: ["内容生成配图"], stages: [STAGES.CONTENT] },
  { id: "hotel-compliance-review", name: "酒店内容合规审核", stage: "review", purpose: "审核单条成稿或发布表单并生成质量门禁", triggers: ["内容生成后", "发布前"], stages: [STAGES.CONTENT, STAGES.PUBLISH] },
  { id: "douyin-publish-completion", name: "多平台发布补全", stage: "publish", purpose: "把已审核内容映射为抖音、小红书和微信视频号版本，并标明直发或客户端接力", triggers: ["确认发布"], stages: [STAGES.PUBLISH] },
  { id: "hotel-performance-loop", name: "酒店数据复盘", stage: "analytics", purpose: "只分析检索到的指标和历史，回写实验策略", triggers: ["日周月复盘"], stages: [STAGES.PERFORMANCE] }
];

const SUPPORTING_SOURCES = [
  { name: "产品 PRD v1.4", purpose: "当前实施基线、产品边界、532、内容长度、平台权限和验收指标", source: "住得满AI内容助手_产品需求文档_PRD_v1.4.md", kind: "产品约束" },
  { name: "大理 100 家酒店 OTA 快照", purpose: "由调研交付生成的酒店事实、图片索引和 POI 本地检索数据源", source: "src/ota-snapshot.js", kind: "RAG 数据源" }
];

const REFERENCE_FILES = {
  "hotel-media-orchestrator": "execution-contract.md",
  "hotel-fact-grounding": "evidence-policy.md",
  "hotel-topic-strategy": "strategy-framework.md",
  "hotel-content-production": "platform-playbook.md",
  "hotel-visual-director": "visual-spec.md",
  "hotel-compliance-review": "review-matrix.md",
  "douyin-publish-completion": "field-mapping.md",
  "hotel-performance-loop": "metrics-loop.md"
};

const STAGE_ALIASES = {
  daily: STAGES.TOPIC,
  swap: STAGES.TOPIC,
  "focus-topic": STAGES.CONTENT,
  regenerate: STAGES.CONTENT,
  publish: STAGES.PUBLISH,
  performance: STAGES.PERFORMANCE
};

function readText(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\s*[\s\S]*?\s---\s*/, "").trim();
}

function skillPath(id) {
  return `skills/${id}/SKILL.md`;
}

function referencePath(id) {
  return `skills/${id}/references/${REFERENCE_FILES[id]}`;
}

function runtimePromptPath(id) {
  return `skills/${id}/references/runtime-prompt.md`;
}

export function resolveStage(value = STAGES.TOPIC) {
  const stage = STAGE_ALIASES[value] || value;
  return Object.values(STAGES).includes(stage) ? stage : STAGES.TOPIC;
}

export function resolveExecutionPlan(value = STAGES.TOPIC) {
  const stage = resolveStage(value);
  return SKILL_REGISTRY.filter(skill => skill.stages.includes(stage)).map(skill => skill.id);
}

const CORE_PROMPT = `你是“住得满AI新媒体”的分阶段执行引擎。一次调用只能完成当前阶段，禁止提前执行后续阶段。

全局规则：
1. 只使用用户提示词中本阶段 RAG 挂载的数据，不请求、不假设未检索内容。
2. 只处理当前 accountId 和 hotelId，禁止跨酒店引用事实、图片和历史。
3. 酒店事实必须带 evidenceId 或“字段名｜来源”；缺证据就删除并记录 evidenceGaps。
4. 价格、房态、优惠、套餐、活动等易变信息必须人工确认。
5. 禁止极限词、虚假承诺、虚假稀缺、联系方式和私下交易引导。
6. 返回纯 JSON，不要 Markdown、解释、思考过程或代码围栏。`;

const TOPIC_CONTRACT = `当前阶段只做选题推荐，不生成标题正文成稿、图片顺序或发布字段。

输出结构：
{
  "strategySummary":"100字内策略",
  "executionTrace":{"skills":[],"decisions":[],"evidenceGaps":[],"manualConfirmations":[]},
  "recommendations":[
    {
      "title":"24字内选题名",
      "type":"traffic|vertical|marketing",
      "objective":"曝光|信任|转化",
      "targetAudience":"具体人群与场景",
      "displayReason":"35-60字、可直接展示给酒店用户的推荐说明",
      "reason":"引用检索事实、历史或素材库存说明依据",
      "hook":"开头钩子",
      "contentAngle":"唯一核心角度",
      "materialCategory":"room|public|exterior|dining|poi",
      "materialReadiness":"30-60字、说明现有图片能支撑哪些用户看得懂的真实场景",
      "materialPlan":["画面需求"],
      "factReferences":["字段名｜来源"],
      "riskHints":[],
      "score":0
    }
  ]
}
recommendations 必须恰好三条且不重复。不得输出 content 字段。
displayReason、targetAudience、contentAngle、materialReadiness 是正式用户界面文案，必须使用酒店经营者能直接理解的自然中文；不得出现 fact-1、materialInventory、rejectedTopics、history-*、evidenceId、RAG、Top-K、素材ID或检索过程。内部证据只能写入 reason、factReferences 和 executionTrace。`;

const CONTENT_CONTRACT = `当前阶段只围绕 focusTopic 生成一条内容，不再推荐或替换选题。

输出结构：
{
  "executionTrace":{"skills":[],"decisions":[],"evidenceGaps":[],"manualConfirmations":[]},
  "content":{
    "title":"20字内标题",
    "body":"100至140字正文，目标约120字",
    "tags":["#标签1","#标签2","#标签3"],
    "coverText":"12字内封面字",
    "hook":"一秒钩子",
    "cta":"轻量行动引导",
    "commentPrompt":"自然评论引导",
    "rewriteSummary":"首次生成留空；重写时说明与上一版至少两个实质变化",
    "location":{"name":"酒店/门店名","address":"事实地址","latitude":0,"longitude":0,"platformPoiId":"只能沿用locationContext，禁止编造","status":"matched|pending-platform-match","source":"OTA抓取|商家设置"},
    "materialCategory":"room|public|exterior|dining|poi",
    "materialIds":["只能来自 materialCandidates 的ID，按发布顺序返回5张且不得重复：1张封面、4张内容图"],
    "imagePlan":[{"order":1,"materialId":"候选素材ID","category":"room","purpose":"封面主题","cropMode":"3:4主体居中并预留安全区","selectionReason":"与选题匹配且近期未使用"}],
    "shotPlan":[{"order":1,"scene":"画面","overlay":"可选短字"}],
    "musicMood":"音乐氛围",
    "factReferences":["字段名｜来源"],
    "claimEvidence":[{"claim":"文案宣称","evidence":"证据字段"}],
    "requiresConfirmation":false,
    "manualConfirmations":[],
    "selfReview":{"qualityScore":0,"riskLevel":"safe|low|medium|high","issues":[],"publishGate":"ready|needs-confirmation|revise|blocked"}
  }
}
不得输出 recommendations 字段。正文目标120字，必须在100至140字之间。location 必须沿用 locationContext 的酒店名、地址、经纬度和平台POI状态，禁止生成新地址或平台POI ID。materialIds 固定选择5个候选素材并按“封面主题—环境建立—核心证据—细节补充—位置承接”排序，即1张封面、4张内容图；不足5张时记录素材缺口，不得用重复ID补齐。优先 recentlyUsed=false、coverRecentlyUsed=false 且 selectedPreviously=false，但近期使用只降权、不永久禁用。新组合与同平台近期内容不得机械重复。regenerate 模式必须对照 previousContent：首图必须改变，至少替换2张图片，标题与上一版形成明显差异，首句不得复用，并改变信息顺序，禁止只替换同义词。`;

const SIMPLE_CONTRACTS = {
  [STAGES.PUBLISH]: "只输出 publishForm、executionTrace 和发布门禁，不生成选题或重写正文。",
  [STAGES.PERFORMANCE]: "只输出 performanceSummary、wins、losses、nextExperiments 和 executionTrace，不生成选题成稿。"
};

function contractFor(stage) {
  if (stage === STAGES.TOPIC) return TOPIC_CONTRACT;
  if (stage === STAGES.CONTENT) return CONTENT_CONTRACT;
  return SIMPLE_CONTRACTS[stage];
}

export function buildSystemPrompt(value = STAGES.TOPIC) {
  const stage = resolveStage(value);
  const skills = SKILL_REGISTRY.filter(skill => skill.stages.includes(stage));
  const fragments = skills.map(skill => `【${skill.id}】\n${readText(runtimePromptPath(skill.id)).trim()}`).join("\n\n");
  return `${CORE_PROMPT}\n\n当前阶段：${stage}\nSkill执行顺序：${skills.map(item => item.id).join(" → ")}\n\n${fragments}\n\n【阶段输出契约】\n${contractFor(stage)}`;
}

export function buildUserPrompt(value, payload = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    payload = value;
    value = payload.mode || STAGES.TOPIC;
  }
  const stage = resolveStage(value);
  const context = retrieveStageContext(payload, stage);
  const rewriteRoutes = [
    "本轮采用：先给适用人群结论 → 设施证据 → 地点价值 → 评论互动；首句不用问句，首图不得沿用上一版。",
    "本轮采用：具体抵达场景 → 一个痛点 → 两项事实 → 收藏建议；改用不同素材分类作为首图。",
    "本轮采用：三点选择清单 → 适合/不适合人群 → 地点定位 → 查看官方详情；正文句式与上一版完全重排。"
  ];
  const rewriteRoute = rewriteRoutes[Number(payload.previousContent?.regenerationCount || 0) % rewriteRoutes.length];
  const action = stage === STAGES.TOPIC
    ? (payload.mode === "swap" ? "排除 rejectedTopics 中的标题、受众和内容角度后生成全新三条选题。" : "生成今日三个选题方向；如果存在 rejectedTopics，同样不得重复。")
    : stage === STAGES.CONTENT
      ? (payload.mode === "regenerate" ? `围绕同一 focusTopic 实质重写一条内容。逐项对照 previousContent，至少改变钩子、信息组织顺序、CTA/评论引导、图片组合/封面中的两项；不得复用上一版首句或只替换同义词。保留已核验事实与 locationContext 地点定位，并在 rewriteSummary 中说明变化。${rewriteRoute}` : "围绕 focusTopic 生成一条内容，并从 locationContext 绑定酒店地点定位。")
      : "执行当前阶段。";
  return `任务：${action}\n只使用以下阶段 RAG 上下文：\n${JSON.stringify({
    execution: { rulesetVersion: RULESET_VERSION, stage, skillPlan: resolveExecutionPlan(stage) },
    ...context
  }, null, 2)}`;
}

// 兼容测试和调试入口；正式调用应显式传入阶段。
export function cleanAiPayload(payload = {}, stage = STAGES.TOPIC) {
  return retrieveStageContext(payload, resolveStage(stage));
}

export function getRulesManifest() {
  const skills = SKILL_REGISTRY.map(skill => ({
    ...skill,
    modes: skill.stages,
    source: skillPath(skill.id),
    reference: referencePath(skill.id),
    runtimeSource: runtimePromptPath(skill.id),
    instructions: stripFrontmatter(readText(skillPath(skill.id))),
    runtimePrompt: readText(runtimePromptPath(skill.id)).trim(),
    referenceText: readText(referencePath(skill.id)).trim()
  }));
  const stagePrompts = [STAGES.TOPIC, STAGES.CONTENT, STAGES.PUBLISH, STAGES.PERFORMANCE].map(stage => ({
    stage,
    description: {
      [STAGES.TOPIC]: "检索事实、历史与素材聚合，只返回三个选题",
      [STAGES.CONTENT]: "按选中方向检索事实与素材候选，只返回一条成稿",
      [STAGES.PUBLISH]: "审核并映射发布字段",
      [STAGES.PERFORMANCE]: "检索指标与历史，只做复盘"
    }[stage],
    skills: resolveExecutionPlan(stage),
    prompt: buildSystemPrompt(stage)
  }));
  return {
    version: RULESET_VERSION,
    architecture: "staged-skills-local-rag-v1",
    systemPrompt: stagePrompts[0].prompt,
    stagePrompts,
    promptVariants: stagePrompts.map(item => ({ mode: item.stage, description: item.description, skills: item.skills })),
    ragPolicy: {
      engine: "本地词法检索 + 字段权重 + 分类召回",
      topic: "Top 8事实 + Top 8历史 + 最多5类素材聚合；不挂载单图",
      content: "Top 10相关事实 + Top 5相似历史 + Top 12素材候选",
      isolation: "每次只检索当前账号和当前酒店",
      excluded: "未命中事实、未召回图片、无关Skill、完整素材库和其他账号数据"
    },
    selectionRules: [
      "选题阶段只加载总编排、事实约束和选题策略三个 Skill",
      "选题阶段不生成成稿，不挂载单张图片，只读取素材分类聚合",
      "事实、历史和素材均由 RAG Top-K 召回，不再固定全量截取",
      "每次恰好返回三个受众、利益点或素材方向不同的选题",
      "换一组必须排除拒绝项并改变至少两个核心维度"
    ],
    contentRules: [
      "内容阶段只加载总编排、事实、内容、视觉和合规 Skill",
      "内容阶段必须有 focusTopic，不允许重新推荐选题",
      "模型只能从 Top 12 materialCandidates 中返回 materialIds；最近10篇使用图片和最近8篇封面只降权，不永久禁用",
      "标题最多20字、正文目标120字且限制在100至140字，并绑定事实证据",
      "内容必须绑定当前酒店名称、事实地址、经纬度和抖音门店POI匹配状态，不得编造平台POI ID",
      "重新生成必须更换封面和至少2张图片，并重写标题、首句和信息顺序；服务端最多自动纠正3轮",
      "图片固定按封面主题、环境建立、核心证据、细节补充、位置承接五个角色排序；与同平台最近内容重合3张时重选，4张及以上阻断",
      "每篇至少2张图片未出现在同平台最近10篇；确实无法满足时停止强行生成并给出不超过6张的补拍清单",
      "服务端再执行长度、素材白名单、重复ID、事实引用、风险与质量门禁"
    ],
    workflow: ["选题RAG", "选题推荐", "用户选择", "内容RAG", "内容生成", "确定性审核", "发布补全", "数据回收"],
    skills,
    skillSources: [...skills.map(item => ({ name: item.name, purpose: item.purpose, source: item.source, kind: "阶段 Skill" })), ...SUPPORTING_SOURCES]
  };
}
