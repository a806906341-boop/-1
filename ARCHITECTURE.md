# 系统架构与生产化边界

## 当前 MVP

当前版本由原生 SPA 和本地 Node.js 后端组成。后端负责静态文件、模型凭证、提示词编排、通义千问调用、结构化输出解析和二次风控；浏览器层保存商家设置、知识库、草稿、排期、素材元数据、发布记录和通知。

现役前端有两个系统入口，并共享业务状态、领域逻辑和后端 API：

- `index.html` → `src/entry-internal.js`：内部工程版，允许展示知识库、规则、模型和适配器诊断。
- `user-a.html` → `src/entry-user.js`：嵌入住得满的正式用户版，使用“首页、创作、内容、互动、我的”任务架构。

工程版与正式用户版通过 `mountApp` 挂载 `src/app.js`，共享同一个 `AppStore` 和 `STORAGE_KEY`，因此两端看到的是同一批酒店、草稿、周计划和发布记录。历史用户入口由本地服务兼容重定向至 `user-a.html`，但旧 HTML 不进入本次交付包。

```text
双入口界面层
  ├─ entry-internal.js → mountApp({ edition: "internal" })
  └─ entry-user.js → mountApp({ edition: "user" })
  ↓ /api/ai/*
本地 Node.js 后端（server.mjs）
  ├─ 通义千问 OpenAI 兼容适配器
  ├─ Stage Router + Skills Runtime（src/skill-engine.js）
  │   ├─ 选题 / 内容 / 发布 / 复盘四阶段契约隔离
  │   ├─ 每阶段仅读取对应 references/runtime-prompt.md
  │   ├─ 选题与内容阶段由模型 API 执行
  │   └─ 发布与复盘阶段当前由本地规则执行，模型契约预留
  ├─ Local RAG（src/rag-engine.js）
  │   ├─ 账号与酒店硬隔离
  │   ├─ 选题：Top 8事实 + Top 8历史 + 素材分类聚合
  │   └─ 内容：Top 10事实 + Top 5历史 + Top 12图片候选，并挂载目标平台近期用图摘要
  ├─ 结构化 JSON 契约与输出规范化
  └─ 服务端事实引用、字数、历史文本相似度、风险、质量分与发布门禁
  ↓
浏览器状态（AppStore）/ OTA 抓取结果快照 / 抖音演示适配器
```

## 当前模型调用链

```text
点击“推荐选题”
  → /api/ai/topics
  → 选题 RAG
  → 仅加载总编排、事实、选题 Skill
  → 返回恰好 3 个选题
  → 用户明确选择一个方向
  → /api/ai/content
  → 围绕 focusTopic 做内容 RAG
  → 仅加载总编排、事实、内容、视觉、合规 Skill
  → 返回 1 条成稿和候选素材 ID
  → 服务端只接受恰好 5 个白名单素材 ID
  → 前端按素材签名、视觉组和目标平台历史排成 1 张封面 + 4 张内容图
  → 检查最近 10 篇用图、最近 8 篇封面、最近 30 篇文案与最近 5 篇选题指纹
  → 失败时按换图、换角度、换题最多修复 3 轮
  → 仍失败则停止进入发布，并只向用户展示具体补拍建议
  → 服务端白名单、事实、风险、质量分与发布门禁
```

通义千问请求按阶段限制输出长度，关闭思考模式；选题超时 120 秒，内容超时 150 秒。旧的一体化 `/api/ai/recommend` 返回 410，避免架构回退。

发布补全和数据复盘当前没有独立模型 API：发布表单、演示发布记录、看板和峰值提醒由前端领域逻辑确定性执行。对应 Skills 用于约束字段、风险和未来官方适配器，不能据此声称已调用抖音或已完成模型化复盘。

## 生产版建议架构

```text
Web / H5
  ↓ HTTPS
API Gateway + 身份认证 + 租户隔离
  ├─ 商家与知识库服务 ─ PostgreSQL
  ├─ 素材服务 ─ 对象存储 + CDN + 图片审核/打标
  ├─ 内容编排服务 ─ LLM Provider Adapter + Prompt Registry
  ├─ 风控服务 ─ 词库 + 事实校验 + 人工审核队列
  ├─ 发布服务 ─ Douyin Adapter + 幂等键 + 重试/死信队列
  ├─ OTA 接入服务 ─ 官方/授权数据源 Adapter
  └─ 数据服务 ─ 指标回收 + 报告 + 峰值告警
```

## 关键数据实体

- Tenant / Merchant：租户与商家
- PlatformAccount / Authorization：平台账号与授权生命周期
- KnowledgeFact：事实、来源、确认状态、有效期
- MaterialAsset：素材、分类、来源、版权、质量、文件签名、视觉组、分平台使用次数和最近使用时间
- ContentFingerprint：酒店、平台、选题指纹、标题正文特征、五图 ID、封面 ID 与发布时间
- TopicTemplate / PromptVersion：选题模板与提示词版本
- SkillDefinition / SkillExecution：技能定义、模式路由、执行轨迹和版本
- ContentDraft / RiskFinding：内容草稿与风险项
- PublishJob / PublishAttempt：发布任务、幂等与重试记录
- MetricSnapshot / Alert：平台数据快照与峰值提醒

## 生产安全要求

- OAuth token 和模型密钥只保存在服务端密钥管理系统中。
- 每个发布任务必须有租户、账号、内容摘要和幂等键。
- 高风险内容不得绕过人工确认；所有修改和发布操作保留审计日志。
- OTA 图片必须记录来源、授权边界和删除机制。
- 图片历史按酒店与平台隔离；历史素材只降权、不永久禁用，发布时必须留下本次使用和封面使用记录。
- 定时任务使用任务队列，指数退避重试，超过阈值进入人工处理。
