const SAMPLE_IMAGE_BASE = "./assets/hotels/514254_大理THE ONE古城一号院/用户上传";

export const MATERIAL_CATEGORIES = [
  { id: "room", name: "房间展示", icon: "fa-bed", minimum: 10 },
  { id: "public", name: "公共区域及设施", icon: "fa-building-o", minimum: 10 },
  { id: "exterior", name: "门头和周边环境", icon: "fa-map-marker", minimum: 5 },
  { id: "dining", name: "餐厅和餐品", icon: "fa-cutlery", minimum: 5 },
  { id: "poi", name: "周边景点地标", icon: "fa-map-o", minimum: 5 },
  { id: "copy", name: "文案卖点资料", icon: "fa-file-text-o", minimum: 3 }
];

export const HOTEL_TYPES = [
  "精品民宿", "亲子主题酒店", "情侣/浪漫酒店", "温泉疗养酒店", "设计师/艺术酒店",
  "青年旅舍", "别墅/私密整租", "服务式公寓", "客栈/农家乐", "经济型/商旅酒店",
  "景区目的地酒店", "海滨度假酒店", "高端奢华酒店", "商务会议酒店", "宠物友好酒店"
];

export const TEST_ACCOUNTS = [
  { id: "account-one", hotelId: "514254", name: "古城一号院", handle: "@大理THEONE古城一号院", color: "#0f766e" },
  { id: "account-lishe", hotelId: "878958", name: "丽舍海景民宿", handle: "@大理丽舍海景套房民宿", color: "#2563eb" },
  { id: "account-boxin", hotelId: "6078734", name: "泊心云舍MCA", handle: "@泊心云舍MCA大理古城店", color: "#7c3aed" }
];

export const VALUE_ADDED_SERVICE_CATALOG = [
  {
    id: "douyin-managed",
    name: "抖音账号代运营",
    icon: "fa-magic",
    accent: "teal",
    summary: "从月度策略、选题拍摄到发布复盘，持续运营酒店抖音账号。",
    objective: "稳定获得内容曝光、有效咨询与可复用的运营方法",
    fit: "缺少专职新媒体人员，或账号更新不稳定的酒店",
    deliverables: ["月度内容策略", "短视频策划与发布", "评论私信运营", "数据周报与复盘"],
    plans: ["基础运营方案", "增长运营方案", "定制运营方案"],
    cycle: "按月服务",
    quote: "方案报价"
  },
  {
    id: "influencer-live",
    name: "达人探店与直播",
    icon: "fa-video-camera",
    accent: "purple",
    summary: "匹配酒旅达人，完成探店、直播排期、商品挂载和成交复盘。",
    objective: "集中放大节点流量，获得探店内容与直播成交",
    fit: "有明确房型套餐、节假日档期或开业推广需求的门店",
    deliverables: ["达人筛选与邀约", "探店/直播脚本", "现场执行协同", "GMV与线索复盘"],
    plans: ["达人探店专场", "单场达人直播", "达人矩阵直播"],
    cycle: "按场服务",
    quote: "达人档期报价"
  },
  {
    id: "video-production",
    name: "短视频到店拍摄",
    icon: "fa-camera",
    accent: "orange",
    summary: "围绕房型、公区、餐饮和周边路线完成到店拍摄与竖屏成片。",
    objective: "一次补齐可持续使用的真实酒店图片与短视频素材",
    fit: "素材老旧、缺少竖屏内容或需要统一品牌视觉的酒店",
    deliverables: ["拍摄脚本", "半天/全天拍摄", "竖屏剪辑与字幕", "封面和多版本钩子"],
    plans: ["半天轻拍摄", "全天标准拍摄", "月度素材包"],
    cycle: "按次服务",
    quote: "按拍摄清单报价"
  },
  {
    id: "local-life-operations",
    name: "团购与本地生活运营",
    icon: "fa-shopping-bag",
    accent: "blue",
    summary: "协助门店接入、商品上架、团购配置和内容挂载，承接内容转化。",
    objective: "让内容、直播和咨询有清晰的预订与核销承接",
    fit: "已有内容流量，但商品、门店或成交数据尚未打通的酒店",
    deliverables: ["抖音门店接入", "团购商品上架", "内容商品挂载", "核销与转化诊断"],
    plans: ["门店接入协助", "团购上架代办", "本地生活月运营"],
    cycle: "项目/按月",
    quote: "方案报价"
  }
];

export const DEFAULT_VALUE_ADDED_STATE = {
  foundation: {
    version: "hotel-growth-v2",
    goal: "打通内容曝光、咨询承接、预订与核销",
    updatedAt: "2026-07-17"
  },
  capabilities: {
    douyinAccount: { status: "active", updatedAt: "2026-07-17" },
    blueV: { status: "reviewing", progress: 68, submittedDays: 2, etaDays: 3 },
    groupBuy: { status: "inactive" },
    lifeService: { status: "inactive" }
  },
  requests: []
};

export const DEFAULT_INTERACTION_CENTER = {
  source: "douyin-demo-adapter",
  connectionStatus: "demo",
  lastSyncedAt: "2026-07-17 13:06",
  syncCount: 0,
  items: [
    { id: "dyc-01", channel: "comment", userName: "准备去大理", content: "自驾过去停车方便吗？", workTitle: "自驾大理古城停车不绕路", receivedAt: "今天 12:46", status: "pending", unread: true, leadLevel: "high", sentiment: "question" },
    { id: "dyc-02", channel: "comment", userName: "山风慢慢", content: "带小朋友住的话有儿童用品吗？", workTitle: "大理古城南门旁亲子安心住", receivedAt: "今天 11:32", status: "pending", unread: true, leadLevel: "medium", sentiment: "question" },
    { id: "dyc-03", channel: "comment", userName: "阿布旅行记", content: "院子看起来很舒服，离古城南门远不远？", workTitle: "大理古城的清晨，适合慢慢醒来", receivedAt: "昨天 20:18", status: "replied", unread: false, leadLevel: "medium", sentiment: "positive", reply: "谢谢喜欢，酒店详细位置和附近地标已放在作品定位里，可以结合当天路线查看。" },
    { id: "dyc-04", channel: "comment", userName: "周末出发", content: "暑期多少钱一晚，还有房吗？", workTitle: "暑期出行住宿选择清单", receivedAt: "昨天 18:06", status: "pending", unread: true, leadLevel: "high", sentiment: "question" },
    { id: "dym-01", channel: "message", userName: "海边的树", content: "你好，想订两间房住三晚，怎么查看房型？", workTitle: "私信咨询", receivedAt: "今天 13:06", status: "pending", unread: true, leadLevel: "high", sentiment: "question" },
    { id: "dym-02", channel: "message", userName: "小城旅人", content: "可以带宠物入住吗？", workTitle: "私信咨询", receivedAt: "今天 10:22", status: "pending", unread: true, leadLevel: "medium", sentiment: "question" },
    { id: "dym-03", channel: "message", userName: "木木", content: "谢谢，已经看到酒店位置了。", workTitle: "私信咨询", receivedAt: "昨天 21:40", status: "handled", unread: false, leadLevel: "low", sentiment: "positive" }
  ]
};

export const TOPICS = [
  { id: "g01", type: "traffic", hotelTypes: HOTEL_TYPES, title: "第一次来大理，住宿怎么选更省心", formula: "新客痛点 + 决策建议", material: "exterior", reason: "适用于全类型酒店的目的地决策内容" },
  { id: "g02", type: "traffic", hotelTypes: HOTEL_TYPES, title: "旅行慢下来，一晚好住有多重要", formula: "情绪共鸣 + 入住价值", material: "room", reason: "适用于全类型酒店的情绪内容" },
  { id: "g03", type: "vertical", hotelTypes: HOTEL_TYPES, title: "选酒店先看位置、房间和公共空间", formula: "真实信息 + 入住决策", material: "room", reason: "使用 OTA 已抓取的事实与实拍素材" },
  { id: "g04", type: "traffic", hotelTypes: HOTEL_TYPES, title: "到大理的第一晚，应该怎么安排", formula: "场景问题 + 旅行节奏", material: "public", reason: "目的地到达场景" },
  { id: "g05", type: "marketing", hotelTypes: HOTEL_TYPES, title: "暑期出行住宿选择清单", formula: "决策清单 + 轻转化", material: "exterior", reason: "暑期预订决策期" },
  { id: "g06", type: "vertical", hotelTypes: HOTEL_TYPES, title: "从房间到公区，一次看懂真实入住感", formula: "空间实拍 + 真实体验", material: "public", reason: "优先匹配 OTA 实拍素材" },
  { id: "g07", type: "traffic", hotelTypes: HOTEL_TYPES, title: "不赶行程的大理一天", formula: "反忙碌 + 松弛情绪", material: "poi", reason: "大理慢旅行内容" },
  { id: "g08", type: "traffic", hotelTypes: HOTEL_TYPES, title: "住得舒服，是旅行的隐藏加分项", formula: "情绪价值 + 居住体验", material: "room", reason: "适用于全类型酒店的体验表达" },
  { id: "g09", type: "vertical", hotelTypes: HOTEL_TYPES, title: "适合谁住，用真实信息做选择", formula: "客群匹配 + 事实说明", material: "public", reason: "避免夸张承诺的理性决策内容" },
  { id: "g10", type: "marketing", hotelTypes: HOTEL_TYPES, title: "出发前确认这份住宿清单", formula: "出行清单 + 行动引导", material: "exterior", reason: "稳定的收藏与转化选题" },
  { id: "t01", type: "traffic", hotelTypes: ["精品民宿", "设计师/艺术酒店"], title: "大理古城的清晨，适合慢慢醒来", formula: "目的地情绪 + 清晨氛围", material: "public", reason: "暑期慢旅行热度 + 古城区位" },
  { id: "t02", type: "vertical", hotelTypes: ["精品民宿", "景区目的地酒店"], title: "住在大理古城南门旁是什么体验", formula: "区位 + 入住体验", material: "exterior", reason: "大理古城直线约858米" },
  { id: "t03", type: "traffic", hotelTypes: ["精品民宿", "设计师/艺术酒店"], title: "不用赶景点的大理一天", formula: "反常识 + 松弛感", material: "public", reason: "小城慢生活内容近期表现稳定" },
  { id: "t04", type: "marketing", hotelTypes: ["精品民宿", "经济型/商旅酒店"], title: "暑期来大理，先把住处选明白", formula: "决策指南 + 轻转化", material: "room", reason: "暑期预订决策期" },
  { id: "t05", type: "vertical", hotelTypes: ["精品民宿", "情侣/浪漫酒店"], title: "院子里的光，才是大理的隐藏玩法", formula: "空间细节 + 情绪价值", material: "public", reason: "公共区域素材丰富" },
  { id: "t06", type: "traffic", hotelTypes: ["精品民宿", "景区目的地酒店"], title: "大理古城附近的散步路线", formula: "本地攻略 + 收藏价值", material: "poi", reason: "周边POI信息完整" },
  { id: "t07", type: "vertical", hotelTypes: ["精品民宿", "情侣/浪漫酒店"], title: "推门见院，住进白族小院的日常", formula: "建筑特色 + 沉浸体验", material: "exterior", reason: "建筑与庭院素材匹配" },
  { id: "t08", type: "traffic", hotelTypes: ["精品民宿", "青年旅舍"], title: "第一次来大理，别把行程排太满", formula: "新客建议 + 情绪共鸣", material: "poi", reason: "新客攻略型内容" },
  { id: "t09", type: "marketing", hotelTypes: ["精品民宿", "景区目的地酒店"], title: "古城步行圈住哪里更省心", formula: "选择指南 + 行动引导", material: "exterior", reason: "区位转化选题" },
  { id: "t10", type: "traffic", hotelTypes: ["精品民宿", "设计师/艺术酒店"], title: "在大理，把时间交给一座院子", formula: "情绪钩子 + 空间氛围", material: "public", reason: "院落氛围素材充足" },
  { id: "t11", type: "vertical", hotelTypes: ["经济型/商旅酒店", "商务会议酒店"], title: "赶早班车，酒店位置要这样选", formula: "痛点 + 选址方法", material: "poi", reason: "交通决策内容" },
  { id: "t12", type: "marketing", hotelTypes: ["亲子主题酒店"], title: "带娃住酒店，先确认这四件事", formula: "避坑清单 + 轻转化", material: "room", reason: "亲子决策清单" },
  { id: "t13", type: "vertical", hotelTypes: ["海滨度假酒店"], title: "海景房怎么选，先看窗外再看面积", formula: "选房指南 + 景观事实", material: "room", reason: "房型对比内容" },
  { id: "t14", type: "traffic", hotelTypes: ["客栈/农家乐"], title: "旅行里最难忘的，常常是一顿家常饭", formula: "烟火气 + 主人故事", material: "dining", reason: "在地生活内容" },
  { id: "t15", type: "vertical", hotelTypes: ["温泉疗养酒店"], title: "泡汤房怎么选，私汤和公汤差在哪", formula: "设施科普 + 选房", material: "room", reason: "高意向搜索问题" }
];

export const RISK_RULES = {
  absolute: ["最", "第一", "唯一", "顶级", "绝对", "百分百", "全网最低", "国家级", "世界级"],
  sensitive: ["返现", "刷单", "私下交易", "包治", "疗效", "零风险", "加微信", "手机号"],
  mutable: ["价格", "仅剩", "房态", "限时", "折扣", "免费接送", "套餐", "今日特价"]
};

const material = (id, category, path, title, source = "用户上传", used = 0) => ({
  id, category, src: `${SAMPLE_IMAGE_BASE}/${path}`, title, source, used, selected: false, createdAt: "2026-07-16",
  fileHash: id, visualGroupId: id, usageByPlatform: {}, lastUsedAtByPlatform: {}, coverUsedByPlatform: {}
});

export const SAMPLE_MATERIALS = [
  material("m01", "exterior", "外观/0000_5877b5f380f4310e.jpg", "古城院落外观", "用户上传", 1),
  material("m02", "exterior", "外观/0001_fe72f90bc8952f49.jpg", "门头与街巷", "用户上传", 2),
  material("m03", "room", "房间/0009_0b7b4b38cc48902f.jpg", "庭院客房", "用户上传", 1),
  material("m04", "room", "房间/0010_bdf052165c21ee4f.jpg", "大床房实拍", "用户上传", 0),
  material("m05", "room", "房间/0011_2e7c4a64b4f90ec2.jpg", "客房细节", "用户上传", 3),
  material("m06", "public", "公共区域/0051_3ae71aa2798fe662.jpg", "院落公共区域", "用户上传", 1),
  material("m07", "public", "公共区域/0052_4a03573f748bba6b.jpg", "庭院休憩区", "用户上传", 0),
  material("m08", "public", "公共区域/0053_9b8e61610499e6d8.jpg", "白族庭院细节", "用户上传", 2),
  material("m09", "poi", "周边/0097_28b3e781b13d7b4a.jpg", "大理古城周边", "用户上传", 1),
  material("m10", "poi", "周边/0098_988d44f37a85b46c.jpg", "古城街巷", "用户上传", 0),
  material("m11", "public", "公共区域/0054_e4cabdf6fa42fecb.jpg", "院落光影", "用户上传", 4),
  { id: "m12", category: "copy", title: "卖点：白族小院、古城步行圈、安静院落", source: "AI提取", used: 2, selected: false, createdAt: "2026-07-16" }
];

export const DEFAULT_STATE = {
  version: 1,
  onboardingCompleted: false,
  testAccounts: TEST_ACCOUNTS,
  activeAccountId: "account-one",
  accountWorkspaces: {},
  ui: { view: "dashboard", device: "desktop", recordFilter: "all", materialFilter: "all", materialSourceFilter: "all", materialQuery: "", draftMaterialFilter: "recommended", draftMaterialSort: "smart", draftMaterialQuery: "", interactionChannel: "all", interactionFilter: "pending", selectedInteractionId: null, selectedPlanId: null, planPlatformFilter: "all", valueCapabilityId: "douyinAccount", valueServiceId: "douyin-managed", notificationOpen: false },
  settings: {
    brandName: "大理THE ONE古城一号院",
    shortName: "古城一号院",
    hotelType: "精品民宿",
    otaUrl: "https://hotels.ctrip.com/hotels/514254.html",
    city: "大理",
    address: "云南大理市大理镇博爱路9号",
    defaultTime: "19:30",
    voice: "自然、克制、有画面感",
    forbidden: "不提免费接送；不使用绝对化表述",
    autoManage: true,
    notificationPreference: "important"
  },
  adapters: {
    mode: "demo",
    ai: {
      status: "disconnected",
      configured: false,
      provider: "阿里云百炼 · 通义千问",
      protocol: "openai-chat-completions",
      model: "qwen3.7-max-2026-06-08",
      baseUrl: "https://llm-tm83obzb740cjjya.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
      projectId: "2980584"
    },
    ota: { status: "connected", provider: "OTA 抓取结果快照 · 100 家" },
    douyin: { status: "demo", account: "古城一号院（演示）", expiresAt: null, interactionMode: "demo", interactionScopes: ["comment.list", "comment.reply", "message.list", "message.reply"] },
    lifeService: { status: "disconnected", shopId: null }
  },
  publishingPlatforms: {
    douyin: { id: "douyin", name: "抖音", icon: "fa-music", status: "demo", account: "古城一号院（演示）", delivery: "direct", capability: "授权后可直接发布", lastSyncedAt: "2026-07-16 19:30" },
    xiaohongshu: { id: "xiaohongshu", name: "小红书", icon: "fa-book", status: "disconnected", account: "", delivery: "handoff", capability: "生成平台版本后，在客户端确认发布", lastSyncedAt: null },
    wechatChannels: { id: "wechatChannels", name: "微信视频号", icon: "fa-weixin", status: "disconnected", account: "", delivery: "handoff", capability: "生成发布包后，在视频号确认发布", lastSyncedAt: null }
  },
  otaSnapshot: {
    selectedHotelId: "514254",
    sourceFolder: "大理100家酒店调研交付_20260716",
    hotelCount: 100,
    imageCount: 18808,
    poiCount: 2260,
    syncedAt: "2026-07-16"
  },
  knowledge: {
    confirmed: true,
    completeness: 82,
    facts: [
      { id: "k01", label: "酒店定位", value: "白族院落精品民宿", source: "OTA" },
      { id: "k02", label: "区位", value: "大理古城南门附近，距大理古城约858米（直线）", source: "OTA" },
      { id: "k03", label: "核心卖点", value: "白族院落、古城步行圈、安静庭院、在地文化体验", source: "AI提取" },
      { id: "k04", label: "周边地标", value: "大理市博物馆224米、大理古城南门楼267米、红龙井277米（均为直线距离）", source: "OTA" },
      { id: "k05", label: "适合客群", value: "情侣、朋友出行、喜欢古城慢生活的游客", source: "运营确认" }
    ]
  },
  topics: TOPICS,
  rejectedTopicIds: [],
  rejectedTopics: [],
  aiRecommendations: [],
  activeTopic: null,
  contentGenerationJob: null,
  lastAiRun: null,
  valueAdded: DEFAULT_VALUE_ADDED_STATE,
  interactionCenter: DEFAULT_INTERACTION_CENTER,
  materials: SAMPLE_MATERIALS,
  draft: null,
  publishForm: null,
  weeklyAutomation: {
    status: "idle",
    mode: "review",
    startDate: "",
    defaultTime: "19:30",
    platforms: ["douyin"],
    notify: "exceptions",
    runDays: [0, 1, 2, 3, 4, 5, 6],
    contentRules: {
      voice: "自然、克制、有画面感",
      forbidden: "",
      materialFallback: "change-topic",
      autoFactCheck: true,
      autoPlatformVariants: true
    },
    publishRules: {
      requireConfirmation: true,
      autoLocation: true,
      autoProduct: false,
      retryOnFailure: true
    },
    startedAt: null,
    completedAt: null
  },
  weekPlan: [],
  records: [
    { id: "r01", title: "住在大理古城旁，早起先逛一条老街", body: "从古城南门慢慢走回院子，大理的一天不用赶。", status: "published", mode: "立即发布", publishedAt: "2026-07-15 19:32", views: 1260, likes: 86, comments: 12, shares: 9, topicType: "traffic", link: "#" },
    { id: "r02", title: "推门见院，住进白族小院的日常", body: "白墙青瓦围住一院光影，住在古城边也能很安静。", status: "published", mode: "周计划", publishedAt: "2026-07-14 19:30", views: 438, likes: 31, comments: 5, shares: 3, topicType: "vertical", link: "#" },
    { id: "r03", title: "古城步行圈住哪里更省心", body: "离南门楼直线约267米，逛完古城慢慢走回院子。", status: "published", mode: "周计划", publishedAt: "2026-07-13 19:30", views: 356, likes: 24, comments: 3, shares: 2, topicType: "marketing", link: "#" },
    { id: "r04", title: "院子里的光，才是大理的隐藏玩法", body: "午后的光落在白墙上，旅行也可以只在院子里发呆。", status: "failed", mode: "立即发布", publishedAt: "2026-07-12 18:20", views: 0, likes: 0, comments: 0, shares: 0, topicType: "vertical", error: "演示：授权已过期" },
    { id: "r05", title: "第一次来大理，别把行程排太满", body: "住进古城旁的小院，留半天给街巷和风。", status: "reviewing", mode: "周计划", publishedAt: "2026-07-16 19:30", views: 0, likes: 0, comments: 0, shares: 0, topicType: "traffic" }
  ],
  notifications: [
    { id: "n01", type: "peak", title: "内容曝光达到峰值", detail: "7月15日内容曝光为近7条均值的 284%，建议延展古城散步主题。", read: false, createdAt: "今天 09:10" },
    { id: "n02", type: "warning", title: "素材需要补充", detail: "公共区域素材已有图片使用超过3次。", read: false, createdAt: "昨天 18:30" },
    { id: "n03", type: "success", title: "内容发布成功", detail: "《推门见院，住进白族小院的日常》已发布。", read: true, createdAt: "7月14日 19:31" }
  ],
  feedback: []
};
