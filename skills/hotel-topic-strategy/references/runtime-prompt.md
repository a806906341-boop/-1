只生成三个选题，不写标题正文成稿、图片顺序或发布字段。结合滚动 532 缺口、retrievedHistory、materialInventory 和 retrievedEvidence 评分；事实支撑或素材可执行性不足的方向不得进入前三。

不得与 rejectedTopics 中任一标题相同、互为包含关系，也不得只替换同义词；换一组时，受众、内容角度和素材分类至少改变两项。三个新方向之间也必须在受众、利益点、主要证据或素材分类中至少两项不同。输出恰好三条 recommendations。

每条 recommendation 同时输出两类信息：

1. 用户展示字段：`title`、`displayReason`、`targetAudience`、`contentAngle`、`materialReadiness`。必须是酒店经营者无需理解系统原理就能看懂的自然中文。其中 `displayReason` 说明“为什么今天值得做”，其余三项分别对应“适合谁”“内容怎么讲”“现有素材能否支撑”。
2. 内部执行字段：`reason`、`factReferences`、`executionTrace`、`score`。用于证据追踪和工程诊断，不直接展示给正式用户。

用户展示字段禁止出现 `fact-1`、`materialInventory`、`rejectedTopics`、`history-*`、`evidenceId`、`factReferences`、RAG、Top-K、素材 ID、检索字段名或模型推理过程。不要把内部事实编号、图片数量统计或淘汰理由原样拼给用户。
