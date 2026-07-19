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

// Drop empty placeholder values so the JSON stays lean and the site can test truthiness.
const isEmpty = (v) => {
  if (v == null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.values(v).every(isEmpty);
  return false;
};
function prune(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (isEmpty(v)) continue;
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? prune(v) : v;
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

// --- validation ---
const hubIds = new Set(hubs.map((h) => h.id));
for (const r of restaurants) {
  if (r.hub && !hubIds.has(r.hub)) warn(`venue ${r.id}: hub "${r.hub}" not found`);
  for (const req of ['name', 'region', 'format', 'status', 'confidence']) {
    if (isEmpty(r[req])) warn(`venue ${r.id}: missing required "${req}"`);
  }
}
const dupes = restaurants.map((r) => r.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dupes.length) warn(`duplicate venue ids: ${[...new Set(dupes)].join(', ')}`);

const dataset = { meta, hubs, restaurants };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(dataset, null, 2) + '\n', 'utf8');

console.log(`Compiled ${hubs.length} hubs + ${restaurants.length} venues -> ${path.relative(repoRoot, outFile)}`);
if (problems.length) {
  console.log(`\n${problems.length} warning(s):`);
  for (const p of problems) console.log('  - ' + p);
  process.exitCode = 0; // warnings don't fail the build
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
    if (f && !f.endsWith('.md')) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const t = new Date().toLocaleTimeString();
      console.log(`\n[${t}] change detected — recompiling`);
      try { build(); } catch (e) { console.error('build failed:', e.message); }
    }, 200);
  };
  fs.watch(dataDir, { recursive: true }, onChange);
}

