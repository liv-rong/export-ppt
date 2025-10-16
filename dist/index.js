'use strict';

var pptxgen = require('pptxgenjs');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var pptxgen__default = /*#__PURE__*/_interopDefault(pptxgen);

// src/utils/exportPpt.ts
function isImageObject(obj) {
  return obj.type === "image" && typeof obj.src === "string";
}
function isPathType(obj) {
  return obj.type === "path" && Array.isArray(obj?.path);
}
function isTextObject(obj) {
  return ["textbox", "text", "i-text"].includes(obj.type || "") && typeof obj.text === "string";
}
var isBase64Image = (src) => {
  return /^data:image\/[a-zA-Z]+;base64,/.test(src);
};
var httpToBase64 = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
var CANVAS_W = 800;
var CANVAS_H = 450;
function buildSvgPathData(pathCommands = [], offset = { x: 0, y: 0 }) {
  try {
    return pathCommands.map((seg) => {
      if (!Array.isArray(seg) || seg.length === 0) return "";
      const [cmd, ...nums] = seg;
      const nums2 = nums.map(
        (n, i) => i % 2 === 0 ? n - offset.x : n - offset.y
      );
      return [cmd, ...nums2].join(" ");
    }).join(" ");
  } catch {
    return "";
  }
}
function parseColorToRgba(color) {
  if (!color) return "rgba(0,0,0,1)";
  if (color.startsWith("rgba")) return color;
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((x) => x + x).join("");
    }
    let r = 0, g = 0, b = 0, a = 255;
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16);
    }
    const alpha = +(a / 255).toFixed(3);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}
function calculateTopLeftAndSize(obj) {
  const angle = obj.angle || 0;
  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  const width = (obj.width || 0) * scaleX;
  const height = (obj.height || 0) * scaleY;
  const originX = obj.originX || "center";
  const originY = obj.originY || "center";
  const objCenterX = obj?.left || 0;
  const objCenterY = obj.top || 0;
  let centerOffsetX = 0;
  let centerOffsetY = 0;
  if (originX === "left") centerOffsetX = width / 2;
  else if (originX === "right") centerOffsetX = -width / 2;
  if (originY === "top") centerOffsetY = height / 2;
  else if (originY === "bottom") centerOffsetY = -height / 2;
  const rad = angle * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotatedX = objCenterX + centerOffsetX * cos - centerOffsetY * sin - width / 2;
  const rotatedY = objCenterY + centerOffsetX * sin + centerOffsetY * cos - height / 2;
  return {
    left: rotatedX,
    top: rotatedY,
    width,
    height,
    angle
  };
}
var exportPptFile = async (canvasList) => {
  const pptx = new pptxgen__default.default();
  for (const item of canvasList) {
    const { objects } = item;
    if (!objects || !Array.isArray(objects)) return;
    const slide = pptx.addSlide({});
    for (const obj of objects) {
      const pos = calculateTopLeftAndSize(obj);
      if (isImageObject(obj)) {
        const xywh = {
          x: `${(pos.left || 0) / CANVAS_W * 100}%`,
          y: `${(pos.top || 0) / CANVAS_H * 100}%`,
          w: `${(pos.width || 100) / CANVAS_W * 100}%`,
          h: `${(pos.height || 100) / CANVAS_H * 100}%`
        };
        const { src } = obj;
        if (!src) return;
        let srcData = src;
        if (!isBase64Image(src)) {
          srcData = await httpToBase64(src);
        }
        slide.addImage({
          data: srcData,
          ...xywh,
          transparency: Math.max(0, Math.min(100, (1 - Number(obj?.opacity ?? 1)) * 100)),
          rotate: pos.angle,
          flipH: obj.flipX || false,
          flipV: obj.flipY || false
        });
      }
      if (isTextObject(obj)) {
        const fontSize = (obj?.fontSize || 16) * 0.9;
        slide.addText(obj.text || "", {
          isTextBox: true,
          // 位置用百分比，尺寸用英寸（避免放大变糊）
          x: `${(pos.left || 0) / CANVAS_W * 100}%`,
          y: `${(pos.top || 0) / CANVAS_H * 100}%`,
          w: `${(pos.width || 100) / CANVAS_W * 100}%`,
          h: `${(pos.height || 100) / CANVAS_H * 100}%`,
          fontSize,
          fontFace: obj.fontFamily || "Arial",
          color: obj.fill || "#000000",
          bold: obj.fontWeight === "bold" || typeof obj.fontWeight === "number" && obj.fontWeight >= 600,
          italic: obj.fontStyle === "italic" || obj.fontStyle === "oblique",
          underline: obj.underline ? { style: "sng", color: obj.fill || "#000000" } : void 0,
          // 对齐方式
          align: obj.textAlign || "left",
          valign: "middle",
          // 字符和行间距
          lineSpacing: obj.lineHeight ? obj.lineHeight * (obj?.fontSize || 12) : void 0,
          // 文本装饰
          strike: obj.linethrough ? "sngStrike" : void 0,
          subscript: obj.subscript ? true : void 0,
          superscript: obj.superscript ? true : void 0,
          // 文本框属性：固定宽高，禁止自动收缩，保证旋转中心稳定
          wrap: true,
          margin: [0, 0, 0, 0],
          autoFit: false,
          // 变换属性
          rotate: pos.angle,
          flipH: obj.flipX || false,
          flipV: obj.flipY || false,
          // 样式属性
          highlight: obj.textBackgroundColor ?? void 0,
          transparency: Math.max(0, Math.min(100, (1 - Number(obj?.opacity ?? 1)) * 100))
        });
      }
      if (isPathType(obj)) {
        const posPath = calculateTopLeftAndSize(obj);
        const pathOffset = obj?.pathOffset || { x: 0, y: 0 };
        const svgD = buildSvgPathData(obj.path, pathOffset);
        const stroke = parseColorToRgba(typeof obj?.stroke === "string" ? obj.stroke : void 0) || "rgba(0,0,0,1)";
        const strokeWidth = (obj?.strokeWidth || 0) * 1.5;
        const fill = parseColorToRgba(typeof obj?.fill === "string" ? obj.fill : void 0) || "none";
        const strokeLinecap = obj?.strokeLineCap || "butt";
        const strokeLinejoin = obj?.strokeLineJoin || "miter";
        const dashArray = obj?.strokeDashArray;
        const opacity = typeof obj.opacity === "number" ? obj.opacity : 1;
        const dashAttr = dashArray && dashArray.length ? ` stroke-dasharray="${dashArray.join(" ")}"` : "";
        const origW = obj.width || 0;
        const origH = obj.height || 0;
        const scaledW = obj.scaleX === 0 ? 0 : origW * ((obj.scaleX ?? 1) || 1);
        const scaledH = obj.scaleY === 0 ? 0 : origH * ((obj.scaleY ?? 1) || 1);
        const strokePadding = strokeWidth / 2;
        const viewBoxW = origW + strokeWidth;
        const viewBoxH = origH + strokeWidth;
        const viewBoxX = -strokePadding;
        const viewBoxY = -strokePadding;
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${scaledW + strokeWidth}" height="${scaledH + strokeWidth}" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}">
  <path d="${svgD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}"${dashAttr} opacity="${opacity}" vector-effect="non-scaling-stroke" />
</svg>`;
        slide.addImage({
          data: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`,
          x: `${(posPath.left - strokeWidth / 4) / CANVAS_W * 100}%`,
          y: `${(posPath.top - strokeWidth / 4) / CANVAS_H * 100}%`,
          w: `${(scaledW + strokeWidth) / CANVAS_W * 100}%`,
          h: `${(scaledH + strokeWidth) / CANVAS_H * 100}%`,
          rotate: posPath.angle,
          line: { type: "none" }
        });
      }
    }
  }
  pptx.writeFile({
    fileName: "index.pptx",
    compression: true
  });
  return pptx;
};

// src/types/pptJson.ts
var sliceTypeMap = {
  0: "contents-0" /* ContentsZero */,
  1: "contents-1" /* ContentsOne */,
  2: "contents-2" /* ContentsTwo */,
  3: "contents-3" /* ContentsThree */,
  4: "contents-4" /* ContentsFour */,
  5: "contents-5" /* ContentsFive */,
  6: "contents-6" /* ContentsSix */,
  7: "contents-7" /* ContentsSeven */,
  8: "contents-8" /* ContentsEight */
};

// src/utils/mdPpt.ts
function trimMd(str) {
  return (str || "").replace(/\r/g, "").replace(/\\n/g, "\n").replace(/\s*chunks\s*$/i, "").trim();
}
function extractBulletList(lines) {
  const items = [];
  for (const line of lines) {
    const m = line.match(/^\s*-\s+(.*)$/);
    if (m) items.push(m[1].trim());
  }
  return items;
}
function parsePptMarkdown(md) {
  const content = trimMd(md);
  if (!content) return [];
  const lines = content.split("\n");
  const slices = [];
  const sections = [];
  let current = [];
  for (const line of lines) {
    if (/^#\s+/.test(line) || /^##\s+/.test(line) || /^###\s+/.test(line) || /^####\s+/.test(line)) {
      if (current.length) sections.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) sections.push(current.join("\n"));
  const extractBulletPairs = (ls) => {
    const items = [];
    for (let i = 0; i < ls.length; i++) {
      const line = ls[i];
      const m = line.match(/^\s*-\s+(.+)$/);
      if (m) {
        const title = m[1].trim();
        let text;
        const next = i + 1 < ls.length ? ls[i + 1] : "";
        const m2 = next.match(/^\s{2,}-\s+(.+)$/);
        if (m2) {
          text = m2[1].trim();
          i++;
        }
        if (title) items.push({ title, ...text ? { text } : {} });
      }
    }
    return items;
  };
  for (const raw of sections) {
    const s = trimMd(raw);
    if (!s) continue;
    const ls = s.split("\n");
    const header = ls[0] || "";
    if (/^#\s+/.test(header) && !/谢谢观看/.test(header)) {
      const title = header.replace(/^#\s+/, "").trim();
      let text = "";
      if (ls.length > 1) {
        const next = ls[1]?.trim() || "";
        if (/^-\s+/.test(next)) {
          text = next.replace(/^-\s+/, "").trim();
        }
      }
      slices.push({
        type: "cover" /* Cover */,
        data: { title, ...text ? { text } : {} }
      });
      continue;
    }
    if (/^#+\s*谢谢观看/.test(header)) {
      const title = "\u8C22\u8C22\u89C2\u770B";
      let text = "";
      if (ls.length > 1) {
        const next = ls[1]?.trim() || "";
        if (next && !/^#/.test(next)) {
          text = next;
        }
      }
      slices.push({
        type: "end" /* End */,
        data: { title, ...text ? { text } : {} }
      });
      continue;
    }
    if (/^##\s*目录页/.test(header)) {
      const items = extractBulletList(ls);
      slices.push({ type: "contents" /* Contents */, data: { items } });
      continue;
    }
    if (/^###\s+/.test(header)) {
      const title = header.replace(/^###\s+/, "").trim();
      let text = "";
      if (ls.length > 1) {
        const next = ls[1]?.trim() || "";
        if (/^-\s+/.test(next)) {
          text = next.replace(/^-\s+/, "").trim();
        }
      }
      slices.push({
        type: "transition" /* Transition */,
        data: { title, ...text ? { text } : {} }
      });
      continue;
    }
    if (/^####\s+/.test(header)) {
      const title = header.replace(/^####\s+/, "").trim();
      const body = ls.slice(1);
      const items = extractBulletPairs(body).slice(0, 4);
      slices.push({ type: "content" /* Content */, data: { title, items } });
      continue;
    }
  }
  console.log("parsed slices:", slices);
  return slices;
}

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
    getRandomValues = crypto.getRandomValues.bind(crypto);
  }
  return getRandomValues(rnds8);
}

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = { randomUUID };

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/v4.js
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  return _v4(options, buf, offset);
}
var v4_default = v4;

// src/utils/replatePpt.ts
var handlePptData = (jsonData, templateData) => {
  const value = [];
  jsonData.forEach((item) => {
    let objects = [];
    const id = v4_default();
    let title = item.type;
    if (item.type === "content" /* Content */) {
      const itemsLength = item.data.items.length;
      if (itemsLength === 1) {
        title = "contents-1" /* ContentsOne */;
      }
      if (itemsLength === 2) {
        title = "contents-2" /* ContentsTwo */;
      }
      if (itemsLength === 3) {
        title = "contents-3" /* ContentsThree */;
      }
      if (itemsLength === 4) {
        title = "contents-4" /* ContentsFour */;
      }
    }
    let temp = templateData.get(title);
    const isContent = item.type === "content" /* Content */;
    if (isContent) {
      if (!temp || Array.isArray(temp) && temp.length <= 0) {
        const itemsLength = item.data.items.length;
        const result = findSuitableTemplate(itemsLength, templateData);
        if (result) {
          temp = result.temp;
          title = result.title;
        }
      }
    }
    if (!temp || temp.length <= 0) {
      console.warn(`\u672A\u627E\u5230\u5408\u9002\u7684\u6A21\u677F\uFF1A${title}\uFF0C\u8DF3\u8FC7\u6B64\u9879\u76EE`);
      return;
    }
    const randomIndex = Math.floor(Math.random() * temp.length);
    const selectedTemplate = temp[randomIndex];
    if (!selectedTemplate) {
      console.warn(`\u6A21\u677F\u6570\u636E\u4E3A\u7A7A\uFF1A${title}\uFF0C\u8DF3\u8FC7\u6B64\u9879\u76EE`);
      return;
    }
    if (item.type === "cover" /* Cover */ || item.type === "end" /* End */) {
      try {
        const templateData2 = JSON.parse(selectedTemplate);
        objects = templateData2.objects.map((obj) => {
          if (obj.type === "textbox") {
            if ("text" in obj && obj?.data === "h1_custom" /* H1 */) {
              return {
                ...obj,
                text: item.data.title
              };
            }
            if ("text" in obj && obj?.data === "p_custom" /* P */) {
              return {
                ...obj,
                text: item.data.text
              };
            }
          }
          return obj;
        }).filter((obj) => {
          if (obj.type === "textbox") {
            if (!obj.text) return false;
          }
          return true;
        });
      } catch (error) {
        console.error(`\u89E3\u6790\u6A21\u677F\u6570\u636E\u5931\u8D25\uFF1A${title}`, error);
        return;
      }
    } else if (item.type === "contents" /* Contents */) {
      let templateObjects;
      try {
        templateObjects = JSON.parse(selectedTemplate).objects;
      } catch (error) {
        console.error(`\u89E3\u6790\u6A21\u677F\u6570\u636E\u5931\u8D25\uFF1A${title}`, error);
        return;
      }
      const h2Objects = templateObjects.filter(
        (obj) => obj.type === "textbox" && "text" in obj && obj.data === "h2_custom" /* H2 */
      );
      const minLength = Math.min(item.data.items.length, h2Objects.length);
      let h2Index = 0;
      objects = templateObjects.map((obj) => {
        if (obj.type === "textbox") {
          if ("text" in obj && obj.data === "h2_custom" /* H2 */) {
            if (h2Index >= minLength) {
              return null;
            }
            const result = {
              ...obj,
              text: `${h2Index + 1}. ${item.data.items[h2Index]}`
            };
            h2Index++;
            return result;
          }
        }
        return obj;
      }).filter((obj) => {
        if (obj === null) return false;
        if (obj.type === "textbox") {
          if (!obj.text) return false;
        }
        return true;
      });
    } else if (item.type === "transition" /* Transition */) {
      try {
        const templateData2 = JSON.parse(selectedTemplate);
        objects = templateData2.objects.map((obj) => {
          if (obj.type === "textbox") {
            if ("text" in obj && obj.data === "h1_custom" /* H1 */) {
              return {
                ...obj,
                text: item.data.title
              };
            }
            if ("text" in obj && obj.data === "p_custom" /* P */) {
              return {
                ...obj,
                text: item.data.text
              };
            }
          }
          return obj;
        }).filter((obj) => {
          if (obj.type === "textbox") {
            if (!obj.text) return false;
          }
          return true;
        });
      } catch (error) {
        console.error(`\u89E3\u6790\u6A21\u677F\u6570\u636E\u5931\u8D25\uFF1A${title}`, error);
        return;
      }
    } else if (item.type === "content" /* Content */) {
      let templateObjects;
      try {
        templateObjects = JSON.parse(selectedTemplate).objects;
      } catch (error) {
        console.error(`\u89E3\u6790\u6A21\u677F\u6570\u636E\u5931\u8D25\uFF1A${title}`, error);
        return;
      }
      const idToObj = {};
      const h2List = [];
      const pList = [];
      templateObjects.forEach((o) => {
        if (o && o.id) idToObj[o.id] = o;
        if (o?.type === "textbox" && o.data === "h2_custom" /* H2 */) h2List.push(o);
        if (o?.type === "textbox" && o.data === "p_custom" /* P */) pList.push(o);
      });
      const usedPIds = /* @__PURE__ */ new Set();
      const pairs = [];
      h2List.forEach((h2) => {
        let p = null;
        if (h2.linkId && idToObj[h2.linkId] && idToObj[h2.linkId].data === "p_custom" /* P */) {
          p = idToObj[h2.linkId];
          usedPIds.add(p.id);
        } else {
          p = pList.find((pp) => !usedPIds.has(pp.id) && pp.linkId === h2.id) || null;
          if (p) usedPIds.add(p.id);
        }
        pairs.push({ h2, p });
      });
      pList.forEach((pp) => {
        if (!usedPIds.has(pp.id)) {
          pairs.push({ h2: null, p: pp });
        }
      });
      const dataItems = item.data.items;
      const keepCount = Math.min(dataItems.length, pairs.length);
      const h2IdToIndex = /* @__PURE__ */ new Map();
      const pIdToIndex = /* @__PURE__ */ new Map();
      for (let i = 0; i < keepCount; i++) {
        const pair = pairs[i];
        if (pair.h2) h2IdToIndex.set(pair.h2.id, i);
        if (pair.p) pIdToIndex.set(pair.p.id, i);
      }
      objects = templateObjects.map((obj) => {
        if (obj?.type === "textbox") {
          if (obj.data === "h2_custom" /* H2 */) {
            const idx = h2IdToIndex.get(obj.id);
            if (idx === void 0) return null;
            return {
              ...obj,
              text: dataItems[idx]?.title || ""
            };
          }
          if (obj.data === "p_custom" /* P */) {
            const idx = pIdToIndex.get(obj.id);
            if (idx === void 0) return null;
            return {
              ...obj,
              text: dataItems[idx]?.text || ""
            };
          }
          if (obj.data === "h1_custom" /* H1 */) {
            return {
              ...obj,
              text: item.data.title || ""
            };
          }
        }
        return obj;
      }).filter((obj) => obj !== null);
    }
    if (objects.length > 0) {
      value.push({
        objects,
        id,
        title
      });
    }
  });
  return value;
};
var findSuitableTemplate = (itemsLength, templateData) => {
  if (itemsLength <= 0) {
    return null;
  }
  const name = sliceTypeMap[itemsLength];
  const temp = templateData.get(name);
  if (temp && temp.length > 0) {
    return { temp, title: name };
  } else {
    const res = findSuitableTemplate(itemsLength - 1, templateData);
    if (res && res.temp && res.temp.length > 0) {
      return { temp: res.temp, title: res.title };
    }
  }
  return null;
};

// src/utils/tempate.ts
var replacePptJsonText = (template, aiText) => {
  try {
    const templateJson = JSON.parse(template);
    const aiTextJson = JSON.parse(aiText);
    const templateMap = /* @__PURE__ */ new Map([
      ["cover" /* Cover */, []],
      ["contents-0" /* ContentsZero */, []],
      ["contents-5" /* ContentsFive */, []],
      ["contents-6" /* ContentsSix */, []],
      ["contents-7" /* ContentsSeven */, []],
      ["contents-8" /* ContentsEight */, []],
      ["contents-4" /* ContentsFour */, []],
      ["contents-1" /* ContentsOne */, []],
      ["contents-3" /* ContentsThree */, []],
      ["contents-2" /* ContentsTwo */, []],
      ["transition" /* Transition */, []],
      ["contents" /* Contents */, []],
      ["end" /* End */, []]
    ]);
    templateJson.forEach((item) => {
      if (item && item.title && templateMap?.has(item.title)) {
        templateMap?.get(item.title)?.push(JSON.stringify(item));
      }
    });
    console.log(aiTextJson, "aiTextJson");
    console.log(templateMap, "templateMap");
    const res = handlePptData(aiTextJson, templateMap);
    return res;
  } catch (error) {
    return [];
  }
};

// src/ppt.ts
var exportPpt = async (template, aiText) => {
  const pptSlices = parsePptMarkdown(aiText);
  console.log("parsed pptSlices:", pptSlices);
  const aiTextJson = JSON.stringify(pptSlices);
  const resJson = replacePptJsonText(template, aiTextJson);
  console.log(resJson, "resJson");
  const resPpt = await exportPptFile(resJson);
  return resPpt;
};

exports.exportPpt = exportPpt;
exports.parsePptMarkdown = parsePptMarkdown;
