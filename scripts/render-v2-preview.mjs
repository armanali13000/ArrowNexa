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

console.log(JSON.stringify({ inputPath, outputDir, rendered: outputs }, null, 2));
