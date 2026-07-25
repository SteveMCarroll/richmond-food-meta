/* Seattle Eastside Chinese food meta — shared static renderer.
   Routes by <body data-page>: "home" (restaurants) or "meta" (hubs + stall tree).
   Both read content/restaurants.json. */

const $ = (s) => document.querySelector(s);

function el(tag, className, html) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (html != null) n.innerHTML = html;
  return n;
}

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

const STATUS_LABEL = {
  hot: "Hot",
  rising: "Rising",
  staple: "Staple",
  watch: "Watch",
  fading: "Fading",
  lead: "Lead",
  "new-lead": "New lead",
};

const CONF_LABEL = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  lead: "Unverified lead",
};

let DATA = { meta: {}, hubs: [], restaurants: [] };
let HUB_BY_ID = {};
const filterState = { region: "", format: "", hub: "", price: "", status: "", q: "" };

function statusBadge(status) {
  if (!status) return "";
  return `<span class="badge status-badge status-${esc(status)}">${esc(
    STATUS_LABEL[status] || status
  )}</span>`;
}

function stallsInHub(hubId) {
  return DATA.restaurants.filter((r) => r.hub === hubId);
}

/* ---- Shared: header meta ---- */
function fillHeader() {
  const m = DATA.meta || {};
  document.title = m.title || "Seattle Eastside food meta";
  const t = $("#title");
  if (t) t.textContent = m.title || "The Chinese food meta";
  const sub = $("#subtitle");
  if (sub) sub.textContent = m.subtitle || "";
  const intro = $("#intro");
  if (intro && !intro.textContent.trim()) intro.textContent = m.intro || "";
  const up = $("#updated");
  if (up) up.textContent = m.updated || "";
}

/* ---- Restaurant card ---- */
function card(x) {
  const c = el("div", "card");
  c.id = "r-" + x.id;

  const top = el("div", "card-top");
  top.appendChild(
    el(
      "h3",
      null,
      esc(x.name) + (x.nameZh ? ` <span class="zh">${esc(x.nameZh)}</span>` : "")
    )
  );
  top.innerHTML += statusBadge(x.status);
  c.appendChild(top);

  const hub = HUB_BY_ID[x.hub];
  const meta = el("div", "meta-row");
  meta.innerHTML =
    (x.region ? `<span class="chip">${esc(x.region)}</span>` : "") +
    (x.format ? `<span class="chip">${esc(x.format)}</span>` : "") +
    (hub
      ? `<a class="chip chip-hub" href="meta.html#hub-${esc(hub.id)}">↳ ${esc(
          hub.name
        )}</a>`
      : x.area
      ? `<span class="chip">${esc(x.area)}</span>`
      : "") +
    (x.price ? `<span class="chip price">${esc(x.price)}</span>` : "");
  c.appendChild(meta);

  if (x.bestDaypart)
    c.appendChild(el("div", "daypart-line", `<b>Best:</b> ${esc(x.bestDaypart)}`));

  if (x.goodToKnow) c.appendChild(el("p", "note", esc(x.goodToKnow)));

  const info = venueInfo(x);
  if (info) c.appendChild(info);

  if ((x.dishes || []).length) {
    const dishes = el("div", "dishes");
    x.dishes.forEach((d) =>
      dishes.appendChild(
        el("span", "dish", esc(d.name + (d.nameZh ? ` ${d.nameZh}` : "")))
      )
    );
    c.appendChild(dishes);
  }

  if ((x.cautions || []).length) {
    const ul = el("ul", "cautions");
    x.cautions.forEach((t) => ul.appendChild(el("li", null, esc(t))));
    c.appendChild(ul);
  }

  const foot = el("div", "card-foot");
  const conf = x.confidence || "low";
  foot.appendChild(
    el(
      "span",
      `confidence conf-${esc(conf)}`,
      `<span class="dot"></span><span>${esc(CONF_LABEL[conf] || conf)}</span>`
    )
  );
  if (x.lastVerified)
    foot.appendChild(el("span", "verified", "verified " + esc(x.lastVerified)));
  c.appendChild(foot);

  if ((x.sources || []).length) {
    const src = el("div", "sources");
    x.sources.forEach((s) => {
      if (!s.url) return;
      const a = el("a", null, esc(s.label || "source") + " ↗");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      src.appendChild(a);
    });
    if (src.children.length) c.appendChild(src);
  }

  return c;
}

/* Contact + hours block — renders only fields the research agent has filled. */
const DAYS = [
  ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"],
  ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"],
];
function venueInfo(x) {
  const wrap = el("div", "venue-info");

  const contact = el("div", "contact");
  if (x.address) {
    const q = encodeURIComponent(x.address);
    const a = el("a", "info-item", `<span class="ico">📍</span>${esc(x.address)}`);
    a.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
    a.target = "_blank";
    a.rel = "noopener";
    contact.appendChild(a);
  }
  if (x.phone) {
    const a = el("a", "info-item", `<span class="ico">☎</span>${esc(x.phone)}`);
    a.href = "tel:" + x.phone.replace(/[^+\d]/g, "");
    contact.appendChild(a);
  }
  if (x.website) {
    const a = el("a", "info-item", `<span class="ico">🌐</span>Website`);
    a.href = x.website;
    a.target = "_blank";
    a.rel = "noopener";
    contact.appendChild(a);
  }
  if (x.reservationUrl) {
    const a = el("a", "info-item", `<span class="ico">📅</span>Reserve`);
    a.href = x.reservationUrl;
    a.target = "_blank";
    a.rel = "noopener";
    contact.appendChild(a);
  }
  if (contact.children.length) wrap.appendChild(contact);

  const hours = x.hours || {};
  const openDays = DAYS.filter(([k]) => hours[k]);
  if (openDays.length) {
    const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
    const det = el("details", "hours");
    const todayText = hours[today] ? `Today · ${esc(hours[today])}` : "Hours";
    det.appendChild(el("summary", null, `<span class="ico">🕒</span>${todayText}`));
    const grid = el("div", "hours-grid");
    openDays.forEach(([k, label]) => {
      const row = el("div", "hours-row" + (k === today ? " is-today" : ""));
      row.innerHTML = `<span class="hd">${label}</span><span>${esc(hours[k])}</span>`;
      grid.appendChild(row);
    });
    det.appendChild(grid);
    if (x.kitchenCutoff)
      det.appendChild(el("div", "cutoff", `Last order: ${esc(x.kitchenCutoff)}`));
    wrap.appendChild(det);
  }

  return wrap.children.length ? wrap : null;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function buildFilters() {
  const r = DATA.restaurants;
  const defs = [
    { key: "region", label: "Region", options: uniqueSorted(r.map((x) => x.region)) },
    { key: "format", label: "Format", options: uniqueSorted(r.map((x) => x.format)) },
    {
      key: "hub",
      label: "Hub",
      options: uniqueSorted(r.map((x) => x.hub)),
      display: (id) => (HUB_BY_ID[id] ? HUB_BY_ID[id].name : id),
    },
    { key: "price", label: "Price", options: uniqueSorted(r.map((x) => x.price)) },
    {
      key: "status",
      label: "Status",
      options: uniqueSorted(r.map((x) => x.status)),
      display: (s) => STATUS_LABEL[s] || s,
    },
  ];

  const box = $("#filters");
  box.innerHTML = "";
  defs.forEach((def) => {
    const group = el("div", "filter-group");
    group.appendChild(el("label", null, esc(def.label)));
    const sel = el("select");
    sel.appendChild(new Option("All", ""));
    def.options.forEach((opt) =>
      sel.appendChild(new Option(def.display ? def.display(opt) : opt, opt))
    );
    sel.addEventListener("change", () => {
      filterState[def.key] = sel.value;
      renderRestaurants();
    });
    group.appendChild(sel);
    box.appendChild(group);
  });
}

function matches(x) {
  if (filterState.region && x.region !== filterState.region) return false;
  if (filterState.format && x.format !== filterState.format) return false;
  if (filterState.hub && x.hub !== filterState.hub) return false;
  if (filterState.price && x.price !== filterState.price) return false;
  if (filterState.status && x.status !== filterState.status) return false;
  if (filterState.q) {
    const hay = [
      x.name,
      x.nameZh,
      x.region,
      x.format,
      x.area,
      x.goodToKnow,
      (x.dishes || []).map((d) => d.name + " " + (d.nameZh || "")).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(filterState.q.toLowerCase())) return false;
  }
  return true;
}

function renderRestaurants() {
  const list = DATA.restaurants.filter(matches);
  const wrap = $("#restaurants");
  wrap.innerHTML = "";
  list.forEach((x) => wrap.appendChild(card(x)));
  $("#empty").hidden = list.length > 0;
  $("#count").textContent = `${list.length} of ${DATA.restaurants.length} places`;
}

function initHome() {
  const banner = $("#meta-banner-count");
  if (banner) {
    const stallCount = DATA.restaurants.filter((r) => r.hub).length;
    banner.textContent = `${DATA.hubs.length} clusters · ${stallCount} venues →`;
  }

  buildFilters();
  const search = $("#search");
  let t;
  search.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      filterState.q = search.value.trim();
      renderRestaurants();
    }, 120);
  });
  renderRestaurants();
}

/* ---- META page: hubs with contained-stall tree ---- */
function hubBlock(h) {
  const block = el("div", "hub");
  block.id = "hub-" + h.id;

  const head = el("div", "hub-head");
  head.innerHTML =
    `<h2>${esc(h.name)}${
      h.nameZh ? ` <span class="zh">${esc(h.nameZh)}</span>` : ""
    }</h2>` + statusBadge(h.status);
  block.appendChild(head);

  const tags = el("div", "meta-row");
  tags.innerHTML =
    (h.type ? `<span class="chip chip-type">${esc(h.type)}</span>` : "") +
    (h.area ? `<span class="chip">${esc(h.area)}</span>` : "");
  block.appendChild(tags);

  if (h.summary) block.appendChild(el("p", "note", esc(h.summary)));

  const dp = h.dayparts || {};
  const keys = Object.keys(dp).filter((k) => dp[k]);
  if (keys.length) {
    const box = el("div", "dayparts");
    keys.forEach((k) =>
      box.appendChild(
        el("div", "daypart", `<b>${esc(k)}</b><span>${esc(dp[k])}</span>`)
      )
    );
    block.appendChild(box);
  }

  const stalls = stallsInHub(h.id);
  const tree = el("div", "stall-tree");
  if (stalls.length) {
    tree.appendChild(
      el("p", "stall-tree-label", `Venues worth knowing (${stalls.length})`)
    );
    stalls.forEach((s) => {
      const row = el("a", "stall-row");
      row.href = "index.html#r-" + s.id;
      row.innerHTML =
        `<span class="stall-name">${esc(s.name)}${
          s.nameZh ? ` <span class="zh">${esc(s.nameZh)}</span>` : ""
        }</span>` +
        `<span class="stall-meta">${esc(s.region || "")}${
          s.price ? " · " + esc(s.price) : ""
        }</span>` +
        statusBadge(s.status);
      tree.appendChild(row);
    });
  } else {
    tree.appendChild(
      el("p", "stall-tree-label muted", "Venue-level entries pending research.")
    );
  }
  block.appendChild(tree);

  if ((h.sources || []).length) {
    const src = el("div", "sources");
    h.sources.forEach((s) => {
      if (!s.url) return;
      const a = el("a", null, esc(s.label || "source") + " ↗");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      src.appendChild(a);
    });
    if (src.children.length) block.appendChild(src);
  }

  return block;
}

function initMeta() {
  const wrap = $("#hubs");
  wrap.innerHTML = "";
  DATA.hubs.forEach((h) => wrap.appendChild(hubBlock(h)));
  focusHash();
}

/* ---- Cross-page anchor highlight ---- */
function focusHash() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (!id) return;
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("flash");
    setTimeout(() => target.classList.remove("flash"), 1600);
  }
}

/* ---- Boot ---- */
function showNotice(msg) {
  document.querySelector("main").innerHTML = `<div class="notice">${msg}</div>`;
}

async function main() {
  try {
    const res = await fetch("content/restaurants.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    DATA = await res.json();
  } catch (err) {
    showNotice(
      `<strong>Data not loaded.</strong> Expected <code>content/restaurants.json</code>.<br><span class="muted">${esc(
        err.message
      )}</span>`
    );
    return;
  }

  DATA.hubs = DATA.hubs || [];
  DATA.restaurants = DATA.restaurants || [];
  HUB_BY_ID = Object.fromEntries(DATA.hubs.map((h) => [h.id, h]));

  fillHeader();

  const page = document.body.dataset.page;
  if (page === "meta") initMeta();
  else initHome();

  if (page !== "meta") setTimeout(focusHash, 60);
  window.addEventListener("hashchange", focusHash);
}

main();
