"""将大理 100 家酒店 OTA 抓取交付结果转换为前端可直接消费的只读快照。"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DELIVERY_NAME = "大理100家酒店调研交付_20260716"
DELIVERY_ROOT = ROOT / DELIVERY_NAME / DELIVERY_NAME
WORKBOOK = DELIVERY_ROOT / "OTA信息字段重要程度说明_大理100家酒店数据_补齐品牌图片地标.xlsx"
OUTPUT = ROOT / "src" / "ota-snapshot.js"
FULL_IMAGE_HOTEL_IDS = {"514254", "878958", "6078734"}


def text(value) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def number(value, default=0):
    if pd.isna(value):
        return default
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def category(value: str) -> str:
    return {
        "房间": "room",
        "公共区域": "public",
        "休闲": "public",
        "家庭亲子": "public",
        "其他": "public",
        "外观": "exterior",
        "餐饮": "dining",
        "周边": "poi",
    }.get(value, "public")


def main() -> None:
    hotels = pd.read_excel(WORKBOOK, sheet_name="大理100家酒店数据")
    images = pd.read_excel(WORKBOOK, sheet_name="图片明细")
    pois = pd.read_excel(WORKBOOK, sheet_name="附近POI明细")

    images["酒店ID"] = images["酒店ID"].astype(str)
    pois["酒店ID"] = pois["酒店ID"].astype(str)

    hotel_items = []
    for _, row in hotels.iterrows():
        hotel_id = text(row["酒店ID"]).split(".")[0]
        hotel_images = images[images["酒店ID"].str.split(".").str[0] == hotel_id].copy()
        hotel_images["精选排序"] = hotel_images["是否精选"].map(lambda value: 0 if text(value) == "是" else 1)
        hotel_images = hotel_images.sort_values(["精选排序", "序号"])
        if hotel_id not in FULL_IMAGE_HOTEL_IDS:
            hotel_images = hotel_images.head(16)
        image_items = []
        for _, image in hotel_images.iterrows():
            relative = text(image["图片路径（相对交付目录）"])
            if not relative:
                continue
            image_items.append({
                "id": text(image["图片ID"]).split(".")[0],
                "category": category(text(image["图片分类"])),
                "source": text(image["上传来源"]),
                "featured": text(image["是否精选"]) == "是",
                "title": text(image["图片标题/评论摘要"]) or text(image["图片分类"]),
                "path": f"./{DELIVERY_NAME}/{DELIVERY_NAME}/{relative}",
                "originalUrl": text(image["原始图片URL"]),
            })

        hotel_pois = pois[pois["酒店ID"].str.split(".").str[0] == hotel_id].sort_values("距离（米）").head(12)
        poi_items = [{
            "name": text(poi["POI名称"]),
            "type": text(poi["POI类型"]),
            "displayDistance": text(poi["展示距离"]),
            "distanceMeters": number(poi["距离（米）"]),
            "distanceType": text(poi["距离口径"]),
        } for _, poi in hotel_pois.iterrows()]

        source_url = ""
        if not hotel_images.empty:
            source_url = text(hotel_images.iloc[0]["酒店详情页"])
        if not source_url and not hotel_pois.empty:
            source_url = text(hotel_pois.iloc[0]["酒店详情页"])

        hotel_items.append({
            "id": hotel_id,
            "name": text(row["酒店全称、别名"]),
            "tier": text(row["钻级/星级"]),
            "sampleTier": text(row["样本分层"]),
            "themeTags": text(row["主题标签"]),
            "platformTags": text(row["携程榜单及分类标签"]),
            "brand": text(row["品牌字段"]),
            "summary": text(row["商家自定义简介"]),
            "address": text(row["详细地址、商圈/景区归属"]),
            "landmarkSummary": text(row["附近地标距离"]),
            "coordinates": text(row["地图坐标"]),
            "rating": text(row["总评分/分项评分"]),
            "reviewTags": text(row["评价标签"]),
            "facilities": text(row["宠物友好、儿童乐园、停车场等特色设施"]),
            "basicFacilities": text(row["基础设施（WIFI、电梯、接机服务）"]),
            "services": text(row["特色服务（管家、叫醒、当地体验）"]),
            "updatedAt": text(row["数据更新时间"]),
            "completeness": text(row["数据完整度"]),
            "sourceUrl": source_url or f"https://hotels.ctrip.com/hotels/{hotel_id}.html",
            "imageCount": int((images["酒店ID"].str.split(".").str[0] == hotel_id).sum()),
            "poiCount": int((pois["酒店ID"].str.split(".").str[0] == hotel_id).sum()),
            "images": image_items,
            "pois": poi_items,
        })

    snapshot = {
        "meta": {
            "sourceType": "ota-crawl-result",
            "sourceFolder": DELIVERY_NAME,
            "workbook": WORKBOOK.name,
            "hotelCount": len(hotel_items),
            "imageCount": len(images),
            "poiCount": len(pois),
            "generatedAt": "2026-07-16",
        },
        "hotels": hotel_items,
    }
    OUTPUT.write_text(
        "// 此文件由 scripts/build_ota_snapshot.py 从 OTA 抓取交付结果生成，请勿手工编辑。\n"
        f"export const OTA_SNAPSHOT = {json.dumps(snapshot, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"generated {OUTPUT.relative_to(ROOT)}: {len(hotel_items)} hotels, {len(images)} images, {len(pois)} POIs")


if __name__ == "__main__":
    main()
