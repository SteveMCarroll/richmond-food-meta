// Compile data/** (YAML frontmatter + markdown body) into the site dataset.
// Usage: node scripts/compile.mjs   (run from the site/ directory)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(here, '..');
const repoRoot = path.resolve(siteDir, '..');
const dataDir = path.join(repoRoot, 'data');
const outFile = path.join(siteDir, 'content', 'restaurants.json');
const ccdFile = path.join(dataDir, 'ccd', 'catalog.yml');
const ccdOutFile = path.join(siteDir, 'content', 'ccd-dishes.json');

let problems = [];
const warn = (m) => problems.push(m);

// Split "---\nYAML\n---\nBODY" into { data, body }.
function parseFrontmatter(raw, file) {
  const text = raw.replace(/^\uFEFF/, '');
  if (!text.startsWith('---')) {
    warn(`${file}: missing frontmatter fence`);
    return { data: {}, body: text.trim() };
  }
  const end = text.indexOf('\n---', 3);
  if (end === -1) {
    warn(`${file}: unterminated frontmatter`);
    return { data: {}, body: '' };
  }
  const yamlBlock = text.slice(3, end).replace(/^\r?\n/, '');
  const body = text.slice(end + 4).replace(/^-*/, '').trim();
  let data = {};
  try {
    data = yaml.load(yamlBlock) || {};
  } catch (e) {
    warn(`${file}: YAML error — ${e.message}`);
  }
  return { data, body };
}

function readDir(sub) {
  const dir = path.join(dataDir, sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const file = path.join(dir, f);
      const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'), `${sub}/${f}`);
      const slug = f.replace(/\.md$/, '');
      if (data.id && data.id !== slug) warn(`${sub}/${f}: id "${data.id}" != filename "${slug}"`);
      if (!data.id) data.id = slug;
      if (body) data.notes = body;
      return data;
    });
}

function readYaml(file, label) {
  if (!fs.existsSync(file)) {
    warn(`${label} missing`);
    return {};
  }
  try {
    return yaml.load(fs.readFileSync(file, 'utf8')) || {};
  } catch (e) {
    warn(`${label}: YAML error — ${e.message}`);
    return {};
  }
}

// Drop empty placeholder values so the JSON stays lean and the site can test truthiness.
const isEmpty = (v) => {
  if (v == null || v === '') return true;
  if (v instanceof Date) return false;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.values(v).every(isEmpty);
  return false;
};
const normalize = (v) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object') return prune(v);
  return v;
};
function prune(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (isEmpty(v)) continue;
    out[k] = normalize(v);
  }
  return out;
}

const byOrder = (a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.id.localeCompare(b.id);

// --- meta ---
function build() {
  problems = [];
  let meta = {};
const siteFile = path.join(dataDir, 'site.md');
if (fs.existsSync(siteFile)) {
  meta = parseFrontmatter(fs.readFileSync(siteFile, 'utf8'), 'site.md').data;
} else {
  warn('site.md missing');
}

const hubs = readDir('hubs').sort(byOrder).map(prune);
const restaurants = readDir('venues').sort(byOrder).map(prune);
const ccd = prune(readYaml(ccdFile, 'ccd/catalog.yml'));

// --- validation ---
const hubIds = new Set(hubs.map((h) => h.id));
for (const r of restaurants) {
  if (r.hub && !hubIds.has(r.hub)) warn(`venue ${r.id}: hub "${r.hub}" not found`);
  for (const req of ['name', 'region', 'format', 'status', 'confidence', 'lastVerified']) {
    if (isEmpty(r[req])) warn(`venue ${r.id}: missing required "${req}"`);
  }
}
const allowedStatus = new Set(['hot', 'rising', 'staple', 'watch', 'fading', 'lead', 'new-lead']);
const allowedConfidence = new Set(['high', 'medium', 'low', 'lead']);
for (const r of restaurants) {
  if (!allowedStatus.has(r.status)) warn(`venue ${r.id}: invalid status "${r.status}"`);
  if (!allowedConfidence.has(r.confidence)) warn(`venue ${r.id}: invalid confidence "${r.confidence}"`);
  for (const [i, s] of (r.sources || []).entries()) {
    for (const req of ['label', 'url', 'date']) {
      if (isEmpty(s[req])) warn(`venue ${r.id}: source ${i + 1} missing "${req}"`);
    }
  }
}
for (const h of hubs) {
  for (const req of ['name', 'type', 'status']) {
    if (isEmpty(h[req])) warn(`hub ${h.id}: missing required "${req}"`);
  }
  if (!allowedStatus.has(h.status)) warn(`hub ${h.id}: invalid status "${h.status}"`);
  for (const [i, s] of (h.sources || []).entries()) {
    for (const req of ['label', 'url', 'date']) {
      if (isEmpty(s[req])) warn(`hub ${h.id}: source ${i + 1} missing "${req}"`);
    }
  }
}
const dupes = restaurants.map((r) => r.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dupes.length) warn(`duplicate venue ids: ${[...new Set(dupes)].join(', ')}`);

const venueIds = new Set(restaurants.map((r) => r.id));
const ccdDishes = ccd.dishes || [];
const allowedMatches = new Set(['exact', 'close', 'regional', 'gap', 'component']);
const allowedDishConfidence = new Set(['high', 'medium', 'low', 'not-applicable']);
const dishIds = new Set();
for (const [i, dish] of ccdDishes.entries()) {
  const label = `CCD dish ${i + 1}${dish.id ? ` (${dish.id})` : ''}`;
  for (const req of [
    'id',
    'region',
    'name',
    'province',
    'ccdSourceUrl',
    'match',
    'matchExplanation',
    'confidence',
    'lastVerified',
  ]) {
    if (isEmpty(dish[req])) warn(`${label}: missing required "${req}"`);
  }
  if (dishIds.has(dish.id)) warn(`${label}: duplicate id "${dish.id}"`);
  dishIds.add(dish.id);
  if (!allowedMatches.has(dish.match)) warn(`${label}: invalid match "${dish.match}"`);
  if (!allowedDishConfidence.has(dish.confidence)) {
    warn(`${label}: invalid confidence "${dish.confidence}"`);
  }
  for (const venueId of dish.venueIds || []) {
    if (!venueIds.has(venueId)) warn(`${label}: venue "${venueId}" not found`);
  }
  if (
    (dish.match === 'gap' || dish.match === 'component') &&
    ((dish.venueIds || []).length || (dish.leadNames || []).length)
  ) {
    warn(`${label}: ${dish.match} rows cannot contain venueIds or leadNames`);
  }
}
if (ccdDishes.length !== 99) warn(`CCD catalog: expected 99 dishes, found ${ccdDishes.length}`);
if (ccd.meta?.totalDishes !== ccdDishes.length) {
  warn(`CCD catalog: meta.totalDishes does not match the dish count`);
}

for (const rec of ccd.tomorrow?.recommendations || []) {
  if (rec.venueId && !venueIds.has(rec.venueId)) {
    warn(`CCD tomorrow recommendation ${rec.priority}: venue "${rec.venueId}" not found`);
  }
  for (const dishId of rec.dishIds || []) {
    if (!dishIds.has(dishId)) {
      warn(`CCD tomorrow recommendation ${rec.priority}: dish "${dishId}" not found`);
    }
  }
}

const dataset = { meta, hubs, restaurants };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(dataset, null, 2) + '\n', 'utf8');
fs.writeFileSync(ccdOutFile, JSON.stringify(ccd, null, 2) + '\n', 'utf8');

console.log(`Compiled ${hubs.length} hubs + ${restaurants.length} venues -> ${path.relative(repoRoot, outFile)}`);
console.log(`Compiled ${ccdDishes.length} CCD dishes -> ${path.relative(repoRoot, ccdOutFile)}`);
if (problems.length) {
  console.log(`\n${problems.length} warning(s):`);
  for (const p of problems) console.log('  - ' + p);
  process.exitCode = 1;
} else {
  console.log('No warnings.');
}
}

build();

// --watch: recompile whenever anything under data/ changes.
if (process.argv.includes('--watch')) {
  console.log('\nWatching data/ for changes... (Ctrl+C to stop)');
  let timer = null;
  const onChange = (_e, f) => {
    if (f && !/\.(md|ya?ml)$/.test(f)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const t = new Date().toLocaleTimeString();
      console.log(`\n[${t}] change detected — recompiling`);
      try { build(); } catch (e) { console.error('build failed:', e.message); }
    }, 200);
  };
  fs.watch(dataDir, { recursive: true }, onChange);
}
