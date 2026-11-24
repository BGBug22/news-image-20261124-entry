// THE WORLD TODAY — Tuesday, 24 November 2026.
// A one-page newspaper front page drawn from scratch in pure Node 22
// (standard library only, no network, no randomness): 34 verified stories
// from 24 November 2026 across six continents, a world map with story dots,
// and the date printed twice. Deterministic: two runs write identical bytes.
//
// The news was researched on 24 November 2026 from BBC, Reuters, The
// Guardian, Times of India, CBS, Forbes and AFP reports of that day.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER: number[] = [247, 242, 231];
const INK: number[] = [22, 22, 22];
const RED: number[] = [178, 34, 34];
const BLUE: number[] = [38, 78, 158];
const GRAY: number[] = [112, 106, 96];
const LIGHT: number[] = [198, 188, 168];
const SEA: number[] = [150, 170, 190];
const GOLD: number[] = [176, 132, 40];
const WHITE: number[] = [255, 255, 255];

// ------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows of 5 cells ('#' = ink). Uppercase, digits and the
// punctuation the headlines use. Drawn at any integer scale.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "(": ["...#.", "..#..", "..#..", "..#..", "..#..", "..#..", "...#."],
  ")": [".#...", "..#..", "..#..", "..#..", "..#..", "..#..", ".#..."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", "#.##.", "#..##"],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "+": [".....", "..#..", "..#..", ".###.", "..#..", "..#..", "....."],
  "=": [".....", ".....", ".###.", ".....", ".###.", ".....", "....."],
  "*": [".....", ".#.#.", ".###.", "#####", ".###.", ".#.#.", "....."],
  "#": [".#.#.", ".#.#.", "#####", ".#.#.", "#####", ".#.#.", ".#.#."],
  "@": [".###.", "#...#", "#.###", "#.#.#", "#.###", "#....", ".###."],
  "·": [".....", ".....", ".....", ".##..", ".##..", ".....", "....."],
};

// ------------------------------------------------------------ pixel canvas
const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = PAPER[0];
  px[i * 3 + 1] = PAPER[1];
  px[i * 3 + 2] = PAPER[2];
}

function setPixel(x: number, y: number, c: number[]): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const o = (y * W + x) * 3;
  px[o] = c[0];
  px[o + 1] = c[1];
  px[o + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: number[]): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, c);
  }
}

function hline(x: number, y: number, w: number, c: number[], t = 1): void {
  fillRect(x, y, w, t, c);
}

function vline(x: number, y: number, h: number, c: number[], t = 1): void {
  fillRect(x, y, t, h, c);
}

function outline(x: number, y: number, w: number, h: number, c: number[], t = 1): void {
  hline(x, y, w, c, t);
  hline(x, y + h - t, w, c, t);
  vline(x, y, h, c, t);
  vline(x + w - t, y, h, c, t);
}

// Scanline polygon fill (even-odd), integer coords.
function fillPoly(pts: number[][], c: number[]): void {
  let minY = 1e9;
  let maxY = -1e9;
  for (const p of pts) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const x = a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
        xs.push(x);
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = Math.max(0, Math.ceil(xs[k]));
      const x1 = Math.min(W - 1, Math.floor(xs[k + 1]));
      for (let x = x0; x <= x1; x++) setPixel(x, y, c);
    }
  }
}

// ------------------------------------------------------------------- text
function drawChar(ch: string, x: number, y: number, s: number, c: number[]): void {
  const g = FONT[ch] ?? FONT[" "];
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "#") fillRect(x + col * s, y + r * s, s, s, c);
    }
  }
}

function textWidth(s: string, sc: number): number {
  if (s.length === 0) return 0;
  return s.length * 6 * sc - sc;
}

function drawText(s: string, x: number, y: number, sc: number, c: number[]): void {
  let cx = x;
  for (const ch of s) {
    drawChar(ch, cx, y, sc, c);
    cx += 6 * sc;
  }
}

function drawTextCentered(s: string, cx: number, y: number, sc: number, c: number[]): void {
  drawText(s, cx - Math.floor(textWidth(s, sc) / 2), y, sc, c);
}

// Greedy word wrap; returns lines that fit maxW at scale sc.
function wrap(s: string, maxW: number, sc: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, sc) <= maxW) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ------------------------------------------------------------------ stories
// 34 verified stories of Tuesday 24 November 2026: the lead plus 33 more,
// six continents. Headlines are capped so each wraps to at most two lines.
interface Story {
  tag: string;
  head: string;
}

const LEAD: Story = {
  tag: "LEAD STORY - TECHNOLOGY - UNITED STATES",
  head: "HUANG RETURNS TO NVIDIA",
};
const LEAD_SUB1 = "BOARD REINSTATES CHIEF AFTER PROBE";
const LEAD_SUB2 = "TRUMP SAYS: 'I MADE THE DEAL' - BBC";

const STORIES: Story[] = [
  { tag: "EUROPE - WAR", head: "UKRAINIAN DRONES HIT RUSSIAN WARSHIP OFF LIBYA" },
  { tag: "N. AMERICA - TECH", head: "CROWDSTRIKE BUYS ZSCALER IN $44BN DEAL" },
  { tag: "ASIA - ENVIRONMENT", head: "LAHORE TOPS WORLD POLLUTION RANKING" },
  { tag: "AFRICA - NIGERIA", head: "NIGERIA BOAT TRAGEDY: 29 BODIES FOUND" },
  { tag: "EUROPE - UK", head: "12,000 EVACUATED FROM MANCHESTER ARENA" },
  { tag: "ASIA - PAKISTAN", head: "QUAKE OF 4.0 HITS PAKISTAN BORDER" },
  { tag: "OCEANIA - CLIMATE", head: "COP31 FLOP: AUSTRALIA BLAMED, ISLANDS DESPAIR" },
  { tag: "N. AMERICA - TRAVEL", head: "O'HARE GROUND STOP IN THANKSGIVING RUSH" },
  { tag: "ASIA - INDIA", head: "INDIA MARKETS SHUT FOR GURU NANAK DAY" },
  { tag: "MIDEAST - GAZA", head: "OXFAM: GAZA NOW A 'TOXIC WASTELAND'" },
  { tag: "EUROPE - UK", head: "BURNHAM STRIKES UK-EU DEAL, SNUBS EX-PMS" },
  { tag: "ASIA - CHINA", head: "CHINA DEATH SENTENCE FOR LEAKING SECRETS" },
  { tag: "AFRICA - ZIMBABWE", head: "ZIMBABWE PREACHER HELD ON ASSAULT CLAIMS" },
  { tag: "N. AMERICA - POLITICS", head: "TRUMP ATTACKS NEWSOM ON 548 COMMUTED SENTENCES" },
  { tag: "ASIA - KOREA", head: "KIM RECEIVES INDIA'S NEW ENVOY" },
  { tag: "OCEANIA - TECH", head: "CONNECTED CARS CAN TRACK ABUSE VICTIMS" },
  { tag: "EUROPE - HEALTH", head: "NHS LAUNCHES BIGGEST AI CANCER TRIAL" },
  { tag: "ASIA - DIPLOMACY", head: "PAKISTAN TO INVITE INDIA TO SCO MEETING" },
  { tag: "AFRICA - DIPLOMACY", head: "KENYA AND DR CONGO RESTORE FULL TIES" },
  { tag: "N. AMERICA - COURTS", head: "APPEALS COURT OPENS PATH TO ERASE HUSH-MONEY CASE" },
  { tag: "ASIA - THAILAND", head: "THAI PROTESTERS MARCH ON OIL REFINERY" },
  { tag: "S. AMERICA - BUSINESS", head: "MINING NETWORK EXPANDS INTO PERU, BRAZIL" },
  { tag: "EUROPE - BUSINESS", head: "CAPITA SHARES PLUNGE 70% AS BOSS QUITS" },
  { tag: "ASIA - THAILAND", head: "THAI MP 'ICE' FREED ON BAIL IN APPEAL" },
  { tag: "AFRICA - SPORT", head: "COURT TO RULE ON SENEGAL AFCON APPEAL" },
  { tag: "N. AMERICA - POLITICS", head: "DEMOCRATS SET 12 PRESIDENTIAL DEBATES" },
  { tag: "ASIA - AFGHANISTAN", head: "TALIBAN ERASE WOMEN'S NAMES IN BALKH" },
  { tag: "AFRICA - TANZANIA", head: "FIRE RIPS THROUGH ZANZIBAR HOTELS" },
  { tag: "EUROPE - SECURITY", head: "MOSSAD FOILED ISIS PLOT ON SWIFT SHOWS" },
  { tag: "SCIENCE - SKY", head: "SUPERMOON MEETS THE PLEIADES TONIGHT" },
  { tag: "EUROPE - ROYALS", head: "KING CHARLES REACHES OUT TO MEGHAN" },
  { tag: "N. AMERICA - TECH", head: "US TO BLACKLIST AI FIRM MEGASPEED" },
  { tag: "EUROPE - NETHERLANDS", head: "DUTCH ACTIVIST DIES BY EUTHANASIA AT 28" },
];

// --------------------------------------------------------------- world map
// Stylised continents in a 976 x 94 box starting at (24, 228).
const MAP_X = 24;
const MAP_Y = 228;
const CONTINENTS: number[][][] = [
  // North America
  [[55, 18], [120, 8], [200, 12], [255, 30], [235, 55], [205, 48], [195, 80], [165, 92], [150, 68], [110, 55], [70, 45], [45, 30]],
  // Greenland
  [[295, 8], [330, 4], [345, 18], [320, 30], [295, 22]],
  // South America
  [[255, 60], [305, 56], [335, 78], [320, 92], [295, 92], [275, 78], [255, 70]],
  // Europe
  [[470, 8], [520, 4], [555, 15], [545, 35], [510, 42], [480, 32], [465, 18]],
  // Africa
  [[470, 48], [540, 42], [575, 60], [565, 88], [530, 94], [495, 88], [472, 72], [462, 58]],
  // Asia
  [[560, 8], [680, 2], [800, 8], [920, 18], [950, 35], [900, 55], [840, 62], [780, 55], [720, 62], [660, 48], [600, 40], [565, 25]],
  // South-East Asian islands
  [[820, 68], [850, 66], [845, 78], [818, 76]],
  [[860, 70], [878, 68], [874, 78], [858, 78]],
  // Australia
  [[800, 80], [870, 76], [895, 86], [860, 94], [815, 90]],
  // Japan
  [[928, 26], [944, 24], [940, 42], [926, 40]],
];

// [map-x, map-y, number, label] — dots mark where the news happened.
const DOTS: [number, number, string][] = [
  [95, 45, "1"], // Silicon Valley — Nvidia
  [540, 52, "2"], // Libya — warship hit
  [478, 18, "3"], // Manchester — arena evacuated
  [585, 48, "4"], // Gaza — toxic wasteland
  [700, 45, "5"], // Lahore — pollution
  [500, 82, "6"], // Nigeria — boat tragedy
  [575, 30, "7"], // Antalya — COP31 talks
  [270, 82, "8"], // Peru — mining network
];
const MAP_LEGEND =
  "ON THE MAP: 1 SILICON VALLEY  2 LIBYA  3 MANCHESTER  4 GAZA  5 LAHORE  6 NIGERIA  7 ANTALYA  8 PERU";

// ------------------------------------------------------------------ layout
// Masthead
drawTextCentered("THE WORLD TODAY", 512, 10, 6, INK);
drawText("34 STORIES", 24, 60, 2, RED);
drawTextCentered("TUESDAY, 24 NOVEMBER 2026", 512, 60, 2, INK);
drawText("6 CONTINENTS", 1000 - textWidth("6 CONTINENTS", 2), 60, 2, RED);
hline(24, 82, 976, INK, 3);
hline(24, 88, 976, INK, 1);

// Lead story
drawText(LEAD.tag, 24, 100, 1, RED);
drawText(LEAD.head, 24, 114, 4, INK);
drawText(LEAD_SUB1, 24, 150, 2, INK);
drawText(LEAD_SUB2, 24, 170, 2, INK);
// Chip illustration on the right
outline(700, 100, 300, 96, INK, 2);
fillRect(752, 112, 64, 64, BLUE);
for (let i = 0; i < 4; i++) {
  fillRect(760 + i * 15, 104, 6, 8, INK);
  fillRect(760 + i * 15, 176, 6, 8, INK);
  fillRect(744, 120 + i * 15, 8, 6, INK);
  fillRect(816, 120 + i * 15, 8, 6, INK);
}
drawTextCentered("NVDA", 784, 132, 2, WHITE);
drawTextCentered("SHARES JUMP 31% IN A DAY", 850, 186, 1, RED);
hline(24, 206, 976, INK, 2);

// Map band
drawText("THE WORLD IN ONE DAY", 24, 214, 1, RED);
drawText("EACH DOT MARKS A STORY", 1000 - textWidth("EACH DOT MARKS A STORY", 1), 214, 1, GRAY);
for (const poly of CONTINENTS) {
  fillPoly(
    poly.map((p) => [MAP_X + p[0], MAP_Y + p[1]]),
    SEA,
  );
}
for (const [mx, my, num] of DOTS) {
  const cx = MAP_X + mx;
  const cy = MAP_Y + my;
  fillRect(cx - 5, cy - 5, 11, 11, RED);
  drawText(num, cx + 8, cy - 4, 1, RED);
}
drawTextCentered(MAP_LEGEND, 512, 330, 1, GRAY);

// Section header + story grid: 3 columns x 11 rows
hline(24, 344, 976, INK, 2);
drawTextCentered("AROUND THE WORLD - 33 MORE STORIES", 512, 352, 2, INK);
hline(24, 372, 976, INK, 1);

const GRID_Y = 380;
const ROW_H = 56;
const COL_W = 314;
const COL_GAP = 16;
for (let i = 0; i < STORIES.length; i++) {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 24 + col * (COL_W + COL_GAP);
  const y = GRID_Y + row * ROW_H;
  const st = STORIES[i];
  drawText(st.tag, x, y, 1, RED);
  const lines = wrap(st.head, COL_W, 2);
  for (let li = 0; li < lines.length; li++) {
    drawText(lines[li], x, y + 12 + li * 15, 2, INK);
  }
  if (row < 10) hline(x, y + ROW_H - 6, COL_W, LIGHT, 1);
  if (col < 2) vline(x + COL_W + 8, y, ROW_H - 10, LIGHT, 1);
}

// Footer
hline(24, 994, 976, INK, 1);
drawTextCentered(
  "SOURCES: BBC - REUTERS - THE GUARDIAN - TIMES OF INDIA - CBS - FORBES - AFP",
  512,
  1002,
  1,
  GRAY,
);

// ---------------------------------------------------------------- PNG write
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crcBuf = Buffer.concat([Buffer.from(type, "ascii"), data]);
  out.writeUInt32BE(crc32(crcBuf), 8 + data.length);
  return out;
}

const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
}
const idat = deflateSync(raw, { level: 9 });

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type: RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), png);
