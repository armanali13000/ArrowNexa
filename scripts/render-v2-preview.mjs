import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const inputPath = process.argv[2] ?? 'assets/levels/levels-v2-four-gate.json';
const outputDir = process.argv[3] ?? 'reports/levels-v2-previews';
const data = JSON.parse(readFileSync(join(process.cwd(), inputPath), 'utf8'));

mkdirSync(join(process.cwd(), outputDir), { recursive: true });

const directionGlyph = {
  UP: '^',
  DOWN: 'v',
  LEFT: '<',
  RIGHT: '>',
};

const colorFor = (index) => {
  const colors = ['#18d9ff', '#f7f2ff', '#62ffb3', '#ffd166', '#ff5b9f', '#8d7cff'];
  return colors[index % colors.length];
};

const renderLevel = (level) => {
  const cell = 30;
  const margin = 34;
  const titleHeight = 54;
  const width = level.size.cols * cell + margin * 2;
  const height = level.size.rows * cell + margin * 2 + titleHeight;
  const boardTop = margin + titleHeight;
  const cellCenter = ({ row, col }) => ({
    x: margin + col * cell + cell / 2,
    y: boardTop + row * cell + cell / 2,
  });

  const grid = [];
  for (let row = 0; row <= level.size.rows; row += 1) {
    const y = boardTop + row * cell;
    grid.push(`<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" class="grid" />`);
  }
  for (let col = 0; col <= level.size.cols; col += 1) {
    const x = margin + col * cell;
    grid.push(`<line x1="${x}" y1="${boardTop}" x2="${x}" y2="${height - margin}" class="grid" />`);
  }

  const arrows = level.arrows.map((arrow, index) => {
    const color = colorFor(index);
    const points = arrow.path.map(cellCenter);
    const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
    const head = points[points.length - 1];
    return [
      `<polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.92" />`,
      `<circle cx="${head.x}" cy="${head.y}" r="12" fill="${color}" />`,
      `<text x="${head.x}" y="${head.y + 6}" class="glyph">${directionGlyph[arrow.direction]}</text>`,
    ].join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .bg { fill: #07152f; }
    .panel { fill: #eef4ff; }
    .grid { stroke: #c7d5f0; stroke-width: 1; }
    .title { fill: #f7fbff; font: 700 22px Arial, sans-serif; }
    .meta { fill: #9fc7ff; font: 600 13px Arial, sans-serif; }
    .glyph { fill: #06132c; font: 700 19px Arial, sans-serif; text-anchor: middle; }
  </style>
  <rect class="bg" width="${width}" height="${height}" rx="18" />
  <text x="${margin}" y="34" class="title">Level ${level.levelNumber}</text>
  <text x="${margin}" y="52" class="meta">${level.size.rows}x${level.size.cols} - ${level.arrows.length} arrows - ${level.difficulty}</text>
  <rect class="panel" x="${margin}" y="${boardTop}" width="${level.size.cols * cell}" height="${level.size.rows * cell}" rx="12" />
  ${grid.join('\n  ')}
  ${arrows}
</svg>`;
};

const outputs = data.levels.map((level) => {
  const filename = `level-${String(level.levelNumber).padStart(3, '0')}.svg`;
  const outputPath = join(process.cwd(), outputDir, filename);
  writeFileSync(outputPath, renderLevel(level), 'utf8');
  return join(outputDir, filename).replaceAll('\\', '/');
});

const makeBitmap = (width, height, fill) => {
  const pixels = new Uint8Array(width * height * 3);
  for (let index = 0; index < pixels.length; index += 3) {
    pixels[index] = fill[2];
    pixels[index + 1] = fill[1];
    pixels[index + 2] = fill[0];
  }
  return pixels;
};

const setPixel = (pixels, width, height, x, y, color) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const index = (y * width + x) * 3;
  pixels[index] = color[2];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[0];
};

const fillRect = (pixels, width, height, x, y, w, h, color) => {
  for (let row = Math.max(0, y); row < Math.min(height, y + h); row += 1) {
    for (let col = Math.max(0, x); col < Math.min(width, x + w); col += 1) setPixel(pixels, width, height, col, row, color);
  }
};

const drawCircle = (pixels, width, height, cx, cy, radius, color) => {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) setPixel(pixels, width, height, x, y, color);
    }
  }
};

const drawLine = (pixels, width, height, from, to, color) => {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(from.x + (to.x - from.x) * (step / steps));
    const y = Math.round(from.y + (to.y - from.y) * (step / steps));
    drawCircle(pixels, width, height, x, y, 3, color);
  }
};

const writeBmp = (path, width, height, pixels) => {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = Buffer.alloc(fileSize);
  buffer.write('BM', 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(pixelArraySize, 34);
  for (let row = 0; row < height; row += 1) {
    const sourceRow = height - 1 - row;
    pixels.copy?.();
    for (let col = 0; col < width * 3; col += 1) buffer[54 + row * rowSize + col] = pixels[sourceRow * width * 3 + col];
  }
  writeFileSync(path, buffer);
};

const renderContactSheet = () => {
  const tileWidth = 180;
  const tileHeight = 196;
  const columns = 4;
  const rows = Math.ceil(data.levels.length / columns);
  const width = columns * tileWidth;
  const height = rows * tileHeight;
  const pixels = makeBitmap(width, height, [7, 21, 47]);

  data.levels.forEach((level, index) => {
    const originX = (index % columns) * tileWidth + 14;
    const originY = Math.floor(index / columns) * tileHeight + 18;
    const board = 148;
    const cell = board / Math.max(level.size.rows, level.size.cols);
    fillRect(pixels, width, height, originX, originY, board, board, [238, 244, 255]);
    for (let line = 0; line <= level.size.rows; line += 1) fillRect(pixels, width, height, originX, Math.round(originY + line * cell), board, 1, [199, 213, 240]);
    for (let line = 0; line <= level.size.cols; line += 1) fillRect(pixels, width, height, Math.round(originX + line * cell), originY, 1, board, [199, 213, 240]);
    fillRect(pixels, width, height, originX, originY + board + 10, Math.round(board * Math.min(1, level.metrics.density)), 8, [24, 217, 255]);
    fillRect(pixels, width, height, originX, originY + board + 22, Math.round(board * Math.min(1, level.metrics.initialValidMoves / Math.max(1, level.arrows.length))), 8, [255, 91, 159]);
    level.arrows.forEach((arrow, arrowIndex) => {
      const color = colorFor(arrowIndex).match(/\w\w/g).map((part) => Number.parseInt(part, 16));
      const points = arrow.path.map(({ row, col }) => ({
        x: Math.round(originX + col * cell + cell / 2),
        y: Math.round(originY + row * cell + cell / 2),
      }));
      for (let point = 1; point < points.length; point += 1) drawLine(pixels, width, height, points[point - 1], points[point], color);
      drawCircle(pixels, width, height, points[points.length - 1].x, points[points.length - 1].y, 5, color);
    });
  });

  const outputPath = join(process.cwd(), outputDir, 'contact-sheet.bmp');
  writeBmp(outputPath, width, height, pixels);
  return join(outputDir, 'contact-sheet.bmp').replaceAll('\\', '/');
};

const contactSheet = renderContactSheet();

console.log(JSON.stringify({ inputPath, outputDir, rendered: outputs, contactSheet }, null, 2));
