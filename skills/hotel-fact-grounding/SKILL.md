---
name: hotel-fact-grounding
description: 把 OTA 抓取快照、商家知识库、人工设置和历史内容整理成可引用证据包，并识别易变信息、冲突事实、缺失字段和跨账号污染。用于任何酒店选题、文案、视觉说明、发布补全或复盘前的事实核验。
---

# 酒店事实约束

## 工作流

1. 只读取当前账号的 `settings`、`knowledge.facts`、OTA 酒店详情和当前账号素材。
2. 为每条事实建立 `label`、`value`、`source`、`stability` 和 `usableForCopy`。
3. 将价格、房态、套餐、优惠、营业时间、活动、交通耗时标记为易变信息。
4. 对名称、地址、距离、设施、服务、评分、点评标签进行冲突检查。
5. 输出允许引用的 `evidencePack`、必须确认的 `mutableClaims` 和缺失的 `evidenceGaps`。

## 硬规则

- 输入没有的事实一律不得补写。
- POI 直线距离不得改写为步行时间或驾车时间。
- 点评分数必须连同来源和更新时间理解，不能泛化为永久评价。
- 用户点评标签只能表述为“部分住客提到”，不能冒充酒店官方承诺。
- 酒店上传图与用户上传图均可作为实拍素材，但不得从图片自行推断未标注设施。
- 不得把同城其他酒店信息当作当前酒店信息。
- 事实引用使用字段标签，不使用含糊的“来自资料”。

## 输出

输出 `groundingSummary`、`evidencePack`、`mutableClaims`、`conflicts`、`evidenceGaps`。对外文案中的每个可核验宣称都应能映射到 `factReferences`。

完整证据分级和冲突处理见 [references/evidence-policy.md](references/evidence-policy.md)。
