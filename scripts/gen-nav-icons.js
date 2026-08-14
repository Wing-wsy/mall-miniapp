const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const SIZE = 81;
const CLEAR = [0, 0, 0, 0];
const COLOR = [230, 126, 34, 255];

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

function drawCategory() {
  const c = createCanvas();
  [
    [18, 18],
    [45, 18],
    [18, 45],
    [45, 45],
  ].forEach(([x, y]) => fillRect(c, x, y, 18, 18, COLOR));
  return c;
}

function drawFestival() {
  const c = createCanvas();
  fillPoly(c, [[40, 10], [48, 32], [70, 32], [52, 46], [60, 68], [40, 54], [20, 68], [28, 46], [10, 32], [32, 32]], COLOR);
  return c;
}

function drawGoodsList() {
  const c = createCanvas();
  fillRect(c, 20, 22, 41, 40, COLOR);
  fillRect(c, 28, 30, 25, 6, CLEAR);
  fillRect(c, 28, 42, 25, 6, CLEAR);
  fillRect(c, 32, 16, 18, 10, COLOR);
  return c;
}

function drawFestivalGoods() {
  const c = createCanvas();
  fillRect(c, 18, 34, 45, 30, COLOR);
  fillRect(c, 22, 22, 37, 16, COLOR);
  fillRect(c, 37, 18, 8, 46, CLEAR);
  fillRect(c, 18, 36, 45, 6, CLEAR);
  return c;
}

function drawProduct() {
  const c = createCanvas();
  fillPoly(c, [[18, 28], [52, 14], [66, 48], [32, 62]], COLOR);
  fillCircle(c, 32, 30, 5, CLEAR);
  return c;
}

function drawPage() {
  const c = createCanvas();
  fillRect(c, 22, 14, 32, 44, COLOR);
  fillPoly(c, [[54, 14], [66, 26], [54, 26]], COLOR);
  fillRect(c, 28, 36, 20, 5, CLEAR);
  fillRect(c, 28, 46, 16, 5, CLEAR);
  return c;
}

function drawNone() {
  const c = createCanvas();
  fillCircle(c, 28, 28, 12, COLOR);
  fillCircle(c, 28, 28, 5, CLEAR);
  fillCircle(c, 52, 52, 12, COLOR);
  fillCircle(c, 52, 52, 5, CLEAR);
  fillRect(c, 36, 38, 10, 6, COLOR);
  fillRect(c, 38, 36, 6, 10, COLOR);
  return c;
}

const root = path.join(__dirname, "../src/static/nav");
fs.mkdirSync(root, { recursive: true });

const drawers = [
  ["category", drawCategory],
  ["festival", drawFestival],
  ["goodsList", drawGoodsList],
  ["festivalGoods", drawFestivalGoods],
  ["product", drawProduct],
  ["page", drawPage],
  ["none", drawNone],
];

for (const [name, draw] of drawers) {
  fs.writeFileSync(path.join(root, `${name}.png`), encodePng(draw()));
  console.log("wrote", name);
}
console.log("done");
