const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const SIZE = 81;
const ORANGE = [255, 90, 61, 255];
const GRAY = [196, 196, 196, 255];
const CLEAR = [0, 0, 0, 0];

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
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
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

function drawHome(color) {
  const c = createCanvas();
  fillPoly(c, [
    [40, 14],
    [66, 36],
    [14, 36],
  ], color);
  fillRect(c, 54, 18, 7, 14, color);
  fillRect(c, 22, 36, 37, 30, color);
  fillRect(c, 35, 48, 12, 18, CLEAR);
  return c;
}

function drawCategory(color) {
  const c = createCanvas();
  const gap = 5;
  const s = 18;
  const positions = [
    [18, 18],
    [18 + s + gap, 18],
    [18, 18 + s + gap],
    [18 + s + gap, 18 + s + gap],
  ];
  positions.forEach(([x, y]) => fillRect(c, x, y, s, s, color));
  // light check mark cut on top-left tile
  fillRect(c, 22, 28, 3, 3, CLEAR);
  fillRect(c, 25, 31, 3, 3, CLEAR);
  fillRect(c, 28, 28, 3, 3, CLEAR);
  fillRect(c, 31, 25, 3, 3, CLEAR);
  return c;
}

function drawCart(color) {
  const c = createCanvas();
  fillPoly(c, [
    [20, 28],
    [62, 28],
    [58, 52],
    [24, 52],
  ], color);
  fillRect(c, 18, 22, 4, 10, color);
  fillRect(c, 18, 20, 16, 4, color);
  fillCircle(c, 30, 60, 5, color);
  fillCircle(c, 52, 60, 5, color);
  return c;
}

function drawMine(color) {
  const c = createCanvas();
  fillCircle(c, 40, 28, 12, color);
  fillCircle(c, 40, 52, 18, color);
  fillRect(c, 16, 58, 49, 12, color);
  return c;
}

const outDir = path.join(__dirname, "../src/static/tab");
fs.mkdirSync(outDir, { recursive: true });

const icons = [
  ["home", drawHome],
  ["category", drawCategory],
  ["cart", drawCart],
  ["mine", drawMine],
];

for (const [name, draw] of icons) {
  fs.writeFileSync(path.join(outDir, `${name}.png`), encodePng(draw(GRAY)));
  fs.writeFileSync(path.join(outDir, `${name}-active.png`), encodePng(draw(ORANGE)));
}

console.log("icons written to", outDir);
