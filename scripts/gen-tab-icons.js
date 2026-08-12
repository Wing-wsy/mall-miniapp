const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const SIZE = 81;
const CLEAR = [0, 0, 0, 0];

const THEMES = {
  default: {
    gray: [176, 176, 176, 255],
    active: [255, 90, 61, 255],
  },
  zhongqiu: {
    // 中秋：暖金 / 月白灰
    gray: [196, 168, 130, 255],
    active: [230, 126, 34, 255],
  },
  duanwu: {
    // 端午：竹青
    gray: [140, 160, 145, 255],
    active: [46, 125, 79, 255],
  },
};

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(rgba) {
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const o = y * (SIZE * 4 + 1) + 1 + x * 4;
      raw[o] = rgba[i];
      raw[o + 1] = rgba[i + 1];
      raw[o + 2] = rgba[i + 2];
      raw[o + 3] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function createCanvas() {
  return new Uint8Array(SIZE * SIZE * 4);
}

function setPx(canvas, x, y, color) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  canvas[i] = color[0];
  canvas[i + 1] = color[1];
  canvas[i + 2] = color[2];
  canvas[i + 3] = color[3];
}

function fillRect(canvas, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setPx(canvas, x, y, color);
  }
}

function fillCircle(canvas, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPx(canvas, cx + x, cy + y, color);
    }
  }
}

function fillRing(canvas, cx, cy, rOuter, rInner, color) {
  for (let y = -rOuter; y <= rOuter; y++) {
    for (let x = -rOuter; x <= rOuter; x++) {
      const d2 = x * x + y * y;
      if (d2 <= rOuter * rOuter && d2 >= rInner * rInner) setPx(canvas, cx + x, cy + y, color);
    }
  }
}

function fillPoly(canvas, points, color) {
  const minY = Math.min(...points.map((p) => p[1]));
  const maxY = Math.max(...points.map((p) => p[1]));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length; i += 2) {
      const xStart = Math.ceil(xs[i]);
      const xEnd = Math.floor(xs[i + 1]);
      for (let x = xStart; x <= xEnd; x++) setPx(canvas, x, y, color);
    }
  }
}

function drawHome(color, theme) {
  const c = createCanvas();
  if (theme === "zhongqiu") {
    // 灯笼屋：圆顶 + 房身
    fillCircle(c, 40, 28, 16, color);
    fillRect(c, 24, 28, 33, 28, color);
    fillRect(c, 36, 40, 9, 16, CLEAR);
    fillRect(c, 38, 12, 5, 6, color);
  } else if (theme === "duanwu") {
    // 带「端」感的屋：尖顶 + 横梁
    fillPoly(c, [[40, 12], [68, 36], [12, 36]], color);
    fillRect(c, 22, 36, 37, 28, color);
    fillRect(c, 34, 46, 14, 18, CLEAR);
    fillRect(c, 22, 42, 37, 4, CLEAR);
  } else {
    fillPoly(c, [[40, 14], [66, 36], [14, 36]], color);
    fillRect(c, 54, 18, 7, 14, color);
    fillRect(c, 22, 36, 37, 30, color);
    fillRect(c, 35, 48, 12, 18, CLEAR);
  }
  return c;
}

function drawCategory(color, theme) {
  const c = createCanvas();
  if (theme === "zhongqiu") {
    // 满月 + 宫格感
    fillRing(c, 40, 40, 26, 18, color);
    fillRect(c, 28, 28, 10, 10, color);
    fillRect(c, 43, 28, 10, 10, color);
    fillRect(c, 28, 43, 10, 10, color);
    fillRect(c, 43, 43, 10, 10, color);
  } else if (theme === "duanwu") {
    // 粽叶形四格
    const positions = [[18, 20], [44, 20], [18, 46], [44, 46]];
    positions.forEach(([x, y]) => {
      fillRect(c, x, y, 18, 16, color);
      fillPoly(c, [[x + 9, y - 4], [x + 18, y + 4], [x, y + 4]], color);
    });
  } else {
    const gap = 5;
    const s = 18;
    [
      [18, 18],
      [18 + s + gap, 18],
      [18, 18 + s + gap],
      [18 + s + gap, 18 + s + gap],
    ].forEach(([x, y]) => fillRect(c, x, y, s, s, color));
  }
  return c;
}

function drawCart(color, theme) {
  const c = createCanvas();
  fillPoly(c, [[20, 28], [62, 28], [58, 52], [24, 52]], color);
  fillRect(c, 18, 22, 4, 10, color);
  fillRect(c, 18, 20, 16, 4, color);
  fillCircle(c, 30, 60, 5, color);
  fillCircle(c, 52, 60, 5, color);
  if (theme === "zhongqiu") {
    fillCircle(c, 41, 38, 6, CLEAR);
  } else if (theme === "duanwu") {
    fillRect(c, 36, 34, 10, 3, CLEAR);
    fillRect(c, 39, 31, 4, 12, CLEAR);
  }
  return c;
}

function drawMine(color, theme) {
  const c = createCanvas();
  fillCircle(c, 40, 28, 12, color);
  fillCircle(c, 40, 52, 18, color);
  fillRect(c, 16, 58, 49, 12, color);
  if (theme === "zhongqiu") {
    fillCircle(c, 52, 22, 5, color);
  } else if (theme === "duanwu") {
    fillRect(c, 36, 18, 8, 3, CLEAR);
  }
  return c;
}

const root = path.join(__dirname, "../src/static/tab");
fs.mkdirSync(root, { recursive: true });

const drawers = [
  ["home", drawHome],
  ["category", drawCategory],
  ["cart", drawCart],
  ["mine", drawMine],
];

for (const [themeCode, colors] of Object.entries(THEMES)) {
  const dir = themeCode === "default" ? root : path.join(root, themeCode);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, draw] of drawers) {
    fs.writeFileSync(path.join(dir, `${name}.png`), encodePng(draw(colors.gray, themeCode)));
    fs.writeFileSync(path.join(dir, `${name}-active.png`), encodePng(draw(colors.active, themeCode)));
  }
  console.log("wrote", dir);
}

console.log("done");
