# 抖音发布字段映射

## 目录

1. 基础信息
2. 扩展信息
3. 发布设置
4. 提交结果

## 1. 基础信息

- `description`：正文加标签，不额外生成未审核事实。
- `title`：使用审核通过的20字内作品标题；`description` 保留约120字正文与话题换行。
- `coverImageId`：必须属于 `imageIds`。
- `imageIds`：沿用视觉技能的 5 张去重排序，即 1 张封面和 4 张内容图；素材不足 5 张时使用现有全部。
- `officialActivity`：默认空。
- `collection`：使用账号已有合集，不自动创建。
- `declaration`：`原创`、`AI辅助`、`品牌内容` 或项目实际支持值。
- `completionStatus`：逐字段记录 `filled`、`source` 和 `reason`，用于发布助手显示自动补全结果。
- `location`：包含酒店/门店名称、事实地址、经纬度、来源和 `platformPoiId`；无授权门店 ID 时状态为 `pending-platform-match`，界面显示“待抖音门店匹配”，不冒充已关联定位。

## 2. 扩展信息

- `musicMood`：自然、松弛、轻快等氛围建议。
- `contentLabels`：住宿、旅行、城市、场景。
- `hotspot`：默认空，只有实时热点适配器结果可填。
- `poi` 与门店：必须来自已授权抖音门店或来客适配器。

## 3. 发布设置

- `crossPost`：是否同步到其他已授权平台。
- `visibility`：公开、好友可见、仅自己可见。
- `allowSave`：允许或禁止下载保存。
- `publishMode`：立即或定时。
- `scheduledAt`：定时发布时必填，必须晚于当前时间。

## 4. 提交结果

本地模拟记录 `localRecordId`；真实提交记录 `platformTaskId`、`itemId`、状态、错误码、重试次数和最后查询时间。提交操作应使用幂等键，避免重复发布。
