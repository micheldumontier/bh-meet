// Downloads one portrait per slide from the BH26 self-introduction deck.
//
// Slide N in the deck corresponds to person id "pN" in data.js, so no name
// matching is needed. On each slide the portrait is taken to be the largest
// image whose aspect ratio is roughly portrait-to-square; screenshots, logos
// and banners are usually wider and get skipped. Put exceptions in
// photos/overrides.json as { "p20": "<objectId of the right image>" } or
// { "p20": false } to skip a slide entirely.
//
// Writes photos/pN.<ext> and photos.json (the manifest the app reads).

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const KEY = process.env.GOOGLE_API_KEY;
const DECK = process.env.DECK_ID;
if (!KEY || !DECK) {
  console.error('GOOGLE_API_KEY and DECK_ID must be set.');
  process.exit(1);
}

const MIN_AREA = 40000;      // EMU-squared-ish guard against icons and bullets
const MIN_RATIO = 0.45;      // width / height — below this it is a tall banner
const MAX_RATIO = 1.9;       // above this it is a screenshot or a wide banner

const overridesPath = 'photos/overrides.json';
const overrides = existsSync(overridesPath)
  ? JSON.parse(await readFile(overridesPath, 'utf8'))
  : {};

const api = `https://slides.googleapis.com/v1/presentations/${DECK}?key=${KEY}`;
const res = await fetch(api);
if (!res.ok) {
  console.error(`Slides API ${res.status}: ${await res.text()}`);
  console.error('A 403 usually means the deck is not viewable by anyone with the link.');
  process.exit(1);
}
const deck = await res.json();

// Flatten a page element tree (groups can nest) into image candidates.
function images(elements, inherited = {}) {
  const out = [];
  for (const el of elements || []) {
    const size = el.size || inherited.size;
    const scale = el.transform || {};
    const w = size?.width?.magnitude * (scale.scaleX ?? 1);
    const h = size?.height?.magnitude * (scale.scaleY ?? 1);
    if (el.image?.contentUrl && w && h) {
      out.push({ id: el.objectId, url: el.image.contentUrl, w, h });
    }
    if (el.elementGroup) out.push(...images(el.elementGroup.children, { size }));
  }
  return out;
}

await mkdir('photos', { recursive: true });

const manifest = {};
const report = [];

for (let i = 0; i < deck.slides.length; i++) {
  const slideNo = i + 1;                 // slide 1 is the title slide
  const id = `p${slideNo}`;
  if (overrides[id] === false) { report.push(`${id}: skipped by override`); continue; }

  const candidates = images(deck.slides[i].pageElements);
  if (!candidates.length) { report.push(`${id}: no images on slide`); continue; }

  let pick;
  if (typeof overrides[id] === 'string') {
    pick = candidates.find(c => c.id === overrides[id]);
    if (!pick) { report.push(`${id}: override objectId not found`); continue; }
  } else {
    pick = candidates
      .filter(c => c.w * c.h > MIN_AREA)
      .filter(c => c.w / c.h >= MIN_RATIO && c.w / c.h <= MAX_RATIO)
      .sort((a, b) => b.w * b.h - a.w * a.h)[0];
  }
  if (!pick) { report.push(`${id}: no image looked like a portrait`); continue; }

  const img = await fetch(pick.url);
  if (!img.ok) { report.push(`${id}: download failed (${img.status})`); continue; }
  const type = img.headers.get('content-type') || '';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const file = path.join('photos', `${id}.${ext}`);
  await writeFile(file, Buffer.from(await img.arrayBuffer()));
  manifest[id] = file;
  report.push(`${id}: ${file} (${Math.round(pick.w)}x${Math.round(pick.h)})`);
}

await writeFile('photos.json', JSON.stringify(manifest, null, 2) + '\n');

console.log(report.join('\n'));
console.log(`\n${Object.keys(manifest).length} of ${deck.slides.length} slides yielded a portrait.`);
