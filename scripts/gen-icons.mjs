/**
 * Gera ícones PNG para o PWA sem dependências externas.
 * Usa apenas módulos built-in do Node.js (zlib, fs).
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// ─── CRC32 ───────────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ─── PNG builder ─────────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(d.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])), 0);
  return Buffer.concat([len, t, d, crcBuf]);
}

function buildPNG(pixels, size) {
  // Raw scanlines: filter byte (0) + RGB per row
  const raw = Buffer.allocUnsafe(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 3;
      const dst = y * (1 + size * 3) + 1 + x * 3;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Icon renderer ───────────────────────────────────────────────────────────
// Palette (sRGB from oklch design tokens)
const BG     = [28, 23, 21];   // --bg  oklch(12% 0.016 38)
const ACCENT = [210, 100, 38]; // --accent oklch(65% 0.19 38)
const TEXT   = [238, 232, 228];// --text  oklch(93% 0.008 38)

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 3);
  const s = size;

  function setPixel(x, y, color) {
    if (x < 0 || x >= s || y < 0 || y >= s) return;
    const i = (y * s + x) * 3;
    pixels[i]     = color[0];
    pixels[i + 1] = color[1];
    pixels[i + 2] = color[2];
  }

  // Anti-aliased rounded rect fill
  const radius = s * 0.22;
  const pad    = s * 0.0;

  function inRoundedRect(px, py) {
    const x0 = pad, y0 = pad, x1 = s - 1 - pad, y1 = s - 1 - pad;
    const r = radius;
    // distance to nearest corner arc center
    const cx = px < x0 + r ? x0 + r : (px > x1 - r ? x1 - r : px);
    const cy = py < y0 + r ? y0 + r : (py > y1 - r ? y1 - r : py);
    const dx = px - cx, dy = py - cy;
    return Math.sqrt(dx * dx + dy * dy) <= r &&
      px >= x0 && px <= x1 && py >= y0 && py <= y1;
  }

  // Fill background
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = BG[0]; pixels[i+1] = BG[1]; pixels[i+2] = BG[2];
  }

  // Draw rounded rect background with 1px AA border
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      // Super-sample 4x for AA
      let inside = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (inRoundedRect(x + dx * 0.5, y + dy * 0.5)) inside++;
        }
      }
      if (inside > 0) {
        const t = inside / 4;
        const col = mix(BG, BG, 1 - t); // same as BG, we'll paint on top
        setPixel(x, y, col);
      }
    }
  }

  // ── Draw the letter "F" using rectangles ──────────────────────────────────
  // Scale everything relative to icon size
  const unit = s / 24; // grid unit

  function fillRect(x1, y1, x2, y2, color) {
    for (let y = Math.round(y1); y < Math.round(y2); y++) {
      for (let x = Math.round(x1); x < Math.round(x2); x++) {
        setPixel(x, y, color);
      }
    }
  }

  // Center "F" in icon
  const fLeft   = unit * 6.5;
  const fTop    = unit * 5.5;
  const fRight  = unit * 17.5;
  const fBottom = unit * 18.5;
  const stroke  = unit * 3.2;
  const midTop  = fTop + (fBottom - fTop) * 0.42;
  const midBot  = midTop + stroke * 0.8;
  const midRight = fLeft + (fRight - fLeft) * 0.7;

  // Vertical bar
  fillRect(fLeft, fTop, fLeft + stroke, fBottom, ACCENT);
  // Top horizontal bar
  fillRect(fLeft, fTop, fRight, fTop + stroke, ACCENT);
  // Middle horizontal bar
  fillRect(fLeft, midTop, midRight, midBot, ACCENT);

  return pixels;
}

// ─── Generate ────────────────────────────────────────────────────────────────
mkdirSync('public', { recursive: true });

for (const size of [192, 512]) {
  const pixels = renderIcon(size);
  const png = buildPNG(pixels, size);
  const path = `public/pwa-${size}x${size}.png`;
  writeFileSync(path, png);
  console.log(`✓ ${path} (${png.length} bytes)`);
}
