import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { OTA_SNAPSHOT } from "../src/ota-snapshot.js";

test("OTA 抓取快照包含 100 家酒店和完整汇总", () => {
  assert.equal(OTA_SNAPSHOT.hotels.length, 100);
  assert.equal(OTA_SNAPSHOT.meta.imageCount, 18808);
  assert.equal(OTA_SNAPSHOT.meta.poiCount, 2260);
  assert.ok(OTA_SNAPSHOT.hotels.every(hotel => hotel.id && hotel.name && hotel.sourceUrl));
});

test("快照图片均有可移植原图地址，本地缓存存在时文件完整", () => {
  const images = OTA_SNAPSHOT.hotels.flatMap(hotel => hotel.images);
  assert.ok(images.length >= 1000);
  assert.ok(images.every(image => /^https:\/\//.test(image.originalUrl || "")));

  const cacheRoot = resolve(process.cwd(), "大理100家酒店调研交付_20260716");
  if (existsSync(cacheRoot)) {
    const missing = images
      .map(image => image.path)
      .filter(path => !existsSync(resolve(process.cwd(), path.replace(/^\.\//, ""))));
    assert.deepEqual(missing, []);
  }
});

test("三个测试账号均包含完整酒店信息和实拍图片", () => {
  const expected = new Map([
    ["514254", { name: "大理THE ONE古城一号院", imageCount: 293 }],
    ["878958", { name: "大理丽舍海景套房民宿", imageCount: 242 }],
    ["6078734", { name: "泊心云舍·MCA(大理古城店)", imageCount: 389 }]
  ]);
  for (const [id, value] of expected) {
    const hotel = OTA_SNAPSHOT.hotels.find(item => item.id === id);
    assert.ok(hotel, `缺少测试酒店 ${id}`);
    assert.equal(hotel.name, value.name);
    assert.equal(hotel.images.length, value.imageCount);
    assert.ok(hotel.address && hotel.summary && hotel.sourceUrl);
    assert.ok(hotel.pois.length >= 10);
    assert.ok(hotel.images.every(image => image.path && image.originalUrl && image.category && image.source));
  }
});

test("三个测试账号的全部照片已打包且可供本地素材检索", () => {
  const bundledHotelIds = new Set(["514254", "878958", "6078734"]);
  const bundledHotels = OTA_SNAPSHOT.hotels.filter(hotel => bundledHotelIds.has(hotel.id));
  const missing = bundledHotels.flatMap(hotel => hotel.images.map(image => {
    const relativePath = image.path.split("/images/")[1];
    return resolve(process.cwd(), "assets/hotels", relativePath);
  })).filter(path => !existsSync(path));

  assert.equal(bundledHotels.length, 3);
  assert.equal(bundledHotels.reduce((total, hotel) => total + hotel.images.length, 0), 924);
  assert.deepEqual(missing, []);
});
