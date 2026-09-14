// Generate a share page per person and per group, plus a sitemap.
//
// The app is a single page, so every ?person= link carries the same Open Graph
// tags and unfurls identically in Slack -- one generic card for ninety people.
// These little pages fix that: each has its own title, description and portrait,
// so pasting a link into a channel shows who it actually is. They double as the
// only crawlable surface the site has, since the app renders its content in
// JavaScript.
//
// Each page carries the real content in the body (for crawlers and for anyone
// with JavaScript off) and redirects a browser into the app. Unfurl bots read
// the head and do not run scripts, so they see the card and stop there.
//
//   node scripts/build-pages.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const BASE = 'https://micheldumontier.github.io/bh-meet/';
const SITE = 'BH26 Collaboration Index';

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(readFileSync('data.js', 'utf8'), sandbox);
vm.runInContext(readFileSync('projects.js', 'utf8'), sandbox);
const people = sandbox.window.BH_PEOPLE;
const projects = sandbox.window.BH_PROJECTS;
const photos = JSON.parse(readFileSync('photos.json', 'utf8'));

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Unfurl previews get a couple of lines, so trim on a word and say so.
const clip = (s, n) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return t.slice(0, t.lastIndexOf(' ', n)) + '…';
};

function page({ path, title, description, image, appUrl, body }) {
  const url = BASE + path;
  const img = image
    ? `\n<meta property="og:image" content="${esc(image)}">`
      + `\n<meta property="og:image:width" content="480">`
      + `\n<meta property="og:image:height" content="480">`
      + `\n<meta property="og:image:alt" content="${esc(title)}">`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(SITE)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(BASE + appUrl)}">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<meta property="og:site_name" content="${esc(SITE)}">
<meta property="og:type" content="profile">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">${img}
<meta name="twitter:card" content="summary">
<style>
  body { margin: 0; padding: 2rem 1.5rem; font: 16px/1.5 Georgia, "Times New Roman", serif;
         color: #201e1d; background: #f3f2f2; }
  main { max-width: 34rem; margin: 0 auto; }
  img { width: 120px; height: 120px; object-fit: cover; display: block; margin-bottom: 1rem; }
  h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
  .sub { color: #0088b0; font-size: .8rem; letter-spacing: .06em; text-transform: uppercase; }
  p { margin: 1rem 0; }
  a { color: #0088b0; }
</style>
<script>
  // Humans go straight to the app; unfurl bots and crawlers never run this.
  location.replace(${JSON.stringify('../' + appUrl)});
</script>
</head>
<body>
<main>
${body}
<p><a href="../${esc(appUrl)}">Open the BH26 Collaboration Index</a></p>
</main>
</body>
</html>
`;
}

for (const dir of ['p', 'g']) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

const urls = [BASE];

for (const p of people) {
  const image = photos[p.id] ? BASE + photos[p.id] : null;
  const where = [p.a, p.c].filter(Boolean).join(' · ');
  const body = (image ? `<img src="../${esc(photos[p.id])}" alt="">\n` : '')
    + `<h1>${esc(p.n)}</h1>\n<div class="sub">${esc(where)}</div>\n`
    + `<p>${esc(p.i)}</p>\n`
    + (p.t.length ? `<p><strong>Topics:</strong> ${esc(p.t.join(', '))}</p>\n` : '')
    + (p.co.length ? `<p><strong>Codes in:</strong> ${esc(p.co.join(', '))}</p>\n` : '');
  writeFileSync(`p/${p.id}.html`, page({
    path: `p/${p.id}.html`,
    title: p.n,
    description: `${where}. ${clip(p.i, 180)}`,
    image,
    appUrl: `?person=${encodeURIComponent(p.id)}`,
    body,
  }));
  urls.push(`${BASE}p/${p.id}.html`);
}

for (const pr of projects) {
  const names = pr.team.map((id) => people.find((x) => x.id === id))
    .filter(Boolean).map((x) => x.n);
  const body = `<h1>${esc(pr.n)}</h1>\n<div class="sub">${esc(pr.sec)}`
    + (pr.ch ? ` · #${esc(pr.ch)}` : '') + `</div>\n`
    + `<p>${esc(pr.d)}</p>\n`
    + (pr.aims?.length
      ? `<ul>${pr.aims.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>\n` : '')
    + (names.length ? `<p><strong>Team:</strong> ${esc(names.join(', '))}</p>\n` : '');
  const size = pr.team.length + pr.interested.length;
  writeFileSync(`g/${pr.id}.html`, page({
    path: `g/${pr.id}.html`,
    title: pr.n,
    description: `${pr.sec} · ${size} ${size === 1 ? 'person' : 'people'}. ${clip(pr.d, 170)}`,
    image: null,
    appUrl: '?group=' + encodeURIComponent(pr.id),
    body,
  }));
  urls.push(`${BASE}g/${pr.id}.html`);
}

writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => ` <url><loc>${esc(u)}</loc></url>`).join('\n')
  + '\n</urlset>\n');

writeFileSync('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);

console.log(`p/  ${readdirSync('p').length} person pages`);
console.log(`g/  ${readdirSync('g').length} group pages`);
console.log(`sitemap.xml  ${urls.length} urls`);
