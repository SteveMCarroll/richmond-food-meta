const $ = (selector) => document.querySelector(selector);

const MATCH_LABELS = {
  exact: "Exact match",
  close: "Close analogue",
  regional: "Regional specialist",
  gap: "Research gap",
  component: "Technique / component",
};

const CONFIDENCE_LABELS = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  "not-applicable": "Not applicable",
};

const state = {
  q: "",
  region: "",
  match: "",
  confidence: "",
  restaurant: "",
};

let CCD = { meta: {}, tomorrow: {}, dishes: [] };
let VENUES = [];
let VENUE_BY_ID = {};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function venueName(id) {
  return VENUE_BY_ID[id]?.name || id;
}

function restaurantKeys(dish) {
  return [
    ...(dish.venueIds || []).map((id) => `venue:${id}`),
    ...(dish.leadNames || []).map((name) => `lead:${name}`),
  ];
}

function renderPriorities() {
  const wrap = $("#ccd-priorities");
  $("#tomorrow-intro").textContent = CCD.tomorrow?.intro || "";
  wrap.replaceChildren();

  for (const rec of CCD.tomorrow?.recommendations || []) {
    const venue = rec.venueId ? VENUE_BY_ID[rec.venueId] : null;
    const card = el("article", "ccd-priority");
    const number = el("span", "ccd-priority-number", String(rec.priority));
    card.appendChild(number);

    const heading = el(
      "h3",
      null,
      rec.venueId ? venueName(rec.venueId) : rec.leadName
    );
    card.appendChild(heading);
    card.appendChild(el("p", "ccd-priority-order", rec.headline));
    card.appendChild(el("p", "note", rec.detail));

    const facts = el("div", "ccd-priority-facts");
    const hours = rec.hours || (venue?.hours?.fri ? `Friday ${venue.hours.fri}` : "");
    const address = rec.address || venue?.address;
    if (hours) facts.appendChild(el("span", null, hours));
    if (address) facts.appendChild(el("span", null, address));
    if (facts.children.length) card.appendChild(facts);

    if (rec.caution) card.appendChild(el("p", "ccd-caution", rec.caution));

    const links = el("div", "ccd-priority-links");
    if (rec.venueId) {
      const venueLink = el("a", null, "View venue details →");
      venueLink.href = `index.html#r-${rec.venueId}`;
      links.appendChild(venueLink);
    } else {
      links.appendChild(el("span", "ccd-lead-label", "Dish-specific lead · not yet a core venue"));
    }
    for (const dishId of rec.dishIds || []) {
      const dish = CCD.dishes.find((item) => item.id === dishId);
      if (!dish) continue;
      const dishLink = el("a", "ccd-dish-jump", dish.name);
      dishLink.href = `#dish-${dish.id}`;
      links.appendChild(dishLink);
    }
    card.appendChild(links);
    wrap.appendChild(card);
  }
}

function buildFilters() {
  const filterWrap = $("#ccd-filters");
  filterWrap.replaceChildren();

  const restaurants = new Map();
  for (const dish of CCD.dishes) {
    for (const id of dish.venueIds || []) {
      restaurants.set(`venue:${id}`, venueName(id));
    }
    for (const name of dish.leadNames || []) {
      restaurants.set(`lead:${name}`, `${name} · lead`);
    }
  }

  const definitions = [
    {
      key: "region",
      label: "Catalog region",
      options: unique(CCD.dishes.map((dish) => dish.region)).map((value) => [value, value]),
    },
    {
      key: "match",
      label: "Match type",
      options: Object.entries(MATCH_LABELS).map(([value, label]) => [value, label]),
    },
    {
      key: "confidence",
      label: "Confidence",
      options: Object.entries(CONFIDENCE_LABELS).map(([value, label]) => [value, label]),
    },
    {
      key: "restaurant",
      label: "Restaurant",
      options: [...restaurants.entries()].sort((a, b) => a[1].localeCompare(b[1])),
    },
  ];

  for (const definition of definitions) {
    const group = el("div", "filter-group");
    const id = `ccd-filter-${definition.key}`;
    const label = el("label", null, definition.label);
    label.htmlFor = id;
    group.appendChild(label);

    const select = document.createElement("select");
    select.id = id;
    select.appendChild(new Option("All", ""));
    for (const [value, optionLabel] of definition.options) {
      select.appendChild(new Option(optionLabel, value));
    }
    select.addEventListener("change", () => {
      state[definition.key] = select.value;
      renderDishes();
    });
    group.appendChild(select);
    filterWrap.appendChild(group);
  }
}

function matches(dish) {
  if (state.region && dish.region !== state.region) return false;
  if (state.match && dish.match !== state.match) return false;
  if (state.confidence && dish.confidence !== state.confidence) return false;
  if (state.restaurant && !restaurantKeys(dish).includes(state.restaurant)) return false;

  if (state.q) {
    const haystack = [
      dish.name,
      dish.nameZh,
      dish.region,
      dish.province,
      dish.dishType,
      dish.matchExplanation,
      dish.recommendedMenuItem,
      ...(dish.venueIds || []).map(venueName),
      ...(dish.leadNames || []),
    ]
      .join(" ")
      .toLocaleLowerCase();
    if (!haystack.includes(state.q.toLocaleLowerCase())) return false;
  }
  return true;
}

function matchBadge(dish) {
  const badge = el("span", `ccd-match ccd-match-${dish.match}`, MATCH_LABELS[dish.match]);
  badge.title = `Research classification: ${dish.matchLabel || dish.match}`;
  return badge;
}

function renderDish(dish) {
  const card = el("article", `ccd-dish ccd-dish-${dish.match}`);
  card.id = `dish-${dish.id}`;

  const head = el("div", "ccd-dish-head");
  const title = el("div");
  title.appendChild(el("h3", null, dish.name));
  if (dish.nameZh) {
    title.appendChild(el("p", "ccd-dish-zh", dish.nameZh));
  }
  head.appendChild(title);

  const badges = el("div", "badges");
  badges.appendChild(matchBadge(dish));
  badges.appendChild(
    el(
      "span",
      `ccd-confidence ccd-confidence-${dish.confidence}`,
      CONFIDENCE_LABELS[dish.confidence] || dish.confidence
    )
  );
  head.appendChild(badges);
  card.appendChild(head);

  const meta = el("div", "meta-row");
  if (dish.province) meta.appendChild(el("span", "chip", dish.province));
  if (dish.dishType) meta.appendChild(el("span", "chip", dish.dishType));
  card.appendChild(meta);

  if (dish.match === "gap") {
    card.appendChild(
      el("p", "ccd-nonrecommendation", "Research gap · no restaurant recommendation")
    );
  } else if (dish.match === "component") {
    card.appendChild(
      el("p", "ccd-nonrecommendation", "Technique or component · not a restaurant target")
    );
  } else {
    const destinations = el("div", "ccd-destinations");
    for (const id of dish.venueIds || []) {
      const link = el("a", "ccd-venue-link", venueName(id));
      link.href = `index.html#r-${id}`;
      destinations.appendChild(link);
    }
    for (const name of dish.leadNames || []) {
      const lead = el("span", "ccd-lead");
      lead.appendChild(el("b", null, name));
      lead.appendChild(el("small", null, "Dish-specific lead · not in the core venue guide"));
      destinations.appendChild(lead);
    }
    if (destinations.children.length) card.appendChild(destinations);
  }

  card.appendChild(el("p", "ccd-explanation", dish.matchExplanation));
  if (dish.caution) card.appendChild(el("p", "ccd-caution", dish.caution));

  const details = el("details", "ccd-provenance");
  details.appendChild(el("summary", null, "Sources & verification"));
  const sourceList = el("div", "ccd-source-list");

  const ccdLink = el("a", null, `Original CCD source · ${dish.ccdSourceLabel}`);
  ccdLink.href = dish.ccdSourceUrl;
  ccdLink.target = "_blank";
  ccdLink.rel = "noopener";
  sourceList.appendChild(ccdLink);

  for (const [index, url] of (dish.sourceUrls || []).entries()) {
    const link = el("a", null, `Local dish/menu source ${index + 1}`);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    sourceList.appendChild(link);
  }

  sourceList.appendChild(
    el(
      "span",
      "muted",
      `Match wording: ${dish.matchLabel} · confidence: ${dish.confidenceNote} · verified ${dish.lastVerified}`
    )
  );
  details.appendChild(sourceList);
  card.appendChild(details);
  return card;
}

function renderStats() {
  const stats = $("#ccd-stats");
  stats.replaceChildren();
  const counts = {
    dishes: CCD.dishes.length,
    regions: unique(CCD.dishes.map((dish) => dish.region)).length,
    exact: CCD.dishes.filter((dish) => dish.match === "exact").length,
    gaps: CCD.dishes.filter((dish) => dish.match === "gap").length,
  };
  for (const [label, value] of Object.entries(counts)) {
    const item = el("div", "ccd-stat");
    item.appendChild(el("b", null, String(value)));
    item.appendChild(el("span", null, label));
    stats.appendChild(item);
  }
}

function renderDishes() {
  const visible = CCD.dishes.filter(matches);
  const wrap = $("#ccd-regions");
  wrap.replaceChildren();

  const regionOrder = unique(CCD.dishes.map((dish) => dish.region));
  for (const region of regionOrder) {
    const dishes = visible.filter((dish) => dish.region === region);
    if (!dishes.length) continue;

    const section = el("section", "ccd-region");
    const heading = el("div", "ccd-region-head");
    heading.appendChild(el("h2", null, region));
    heading.appendChild(el("span", "ccd-region-count", `${dishes.length} dishes`));
    section.appendChild(heading);

    const grid = el("div", "ccd-dish-grid");
    for (const dish of dishes) grid.appendChild(renderDish(dish));
    section.appendChild(grid);
    wrap.appendChild(section);
  }

  $("#ccd-count").textContent = `${visible.length} of ${CCD.dishes.length} dishes`;
  $("#ccd-empty").hidden = visible.length > 0;
}

function clearFilters() {
  Object.keys(state).forEach((key) => {
    state[key] = "";
  });
  $("#ccd-search").value = "";
  document.querySelectorAll("#ccd-filters select").forEach((select) => {
    select.value = "";
  });
  renderDishes();
}

function focusHash() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  const target = id && document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("flash");
  setTimeout(() => target.classList.remove("flash"), 1600);
}

async function main() {
  try {
    const [restaurantResponse, ccdResponse] = await Promise.all([
      fetch("content/restaurants.json", { cache: "no-store" }),
      fetch("content/ccd-dishes.json", { cache: "no-store" }),
    ]);
    if (!restaurantResponse.ok || !ccdResponse.ok) {
      throw new Error(`HTTP ${restaurantResponse.status}/${ccdResponse.status}`);
    }
    const restaurantData = await restaurantResponse.json();
    CCD = await ccdResponse.json();
    VENUES = restaurantData.restaurants || [];
    VENUE_BY_ID = Object.fromEntries(VENUES.map((venue) => [venue.id, venue]));
  } catch (error) {
    document.querySelector("main").innerHTML =
      `<div class="notice"><strong>Dish data not loaded.</strong><br>` +
      `<span class="muted">${String(error.message)}</span></div>`;
    return;
  }

  renderPriorities();
  renderStats();
  buildFilters();
  renderDishes();

  let timer;
  $("#ccd-search").addEventListener("input", (event) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = event.target.value.trim();
      renderDishes();
    }, 120);
  });
  $("#ccd-clear").addEventListener("click", clearFilters);

  setTimeout(focusHash, 60);
  window.addEventListener("hashchange", focusHash);
}

main();
