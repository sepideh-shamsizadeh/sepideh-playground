import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { artifacts, select, statistics, statuses, validate } from "./assets/model.mjs";

const experiments = validate(JSON.parse(readFileSync("data/experiments.json", "utf8")));
const stats = statistics(experiments);
const repo = "https://github.com/sepideh-shamsizadeh/applied-ai-robotics-lab";
const project = "https://github.com/users/sepideh-shamsizadeh/projects/13";
const roadmap = repo + "/blob/main/ROADMAP.md";
const origin = "https://playground.sepideh.io";
const prod = process.env.VERCEL_ENV === "production";
const e = value => String(value).replace(/[&<>"']/g, ch =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const fullDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const time = value => `<time datetime="${e(value)}">${fullDate.format(new Date(value))}</time>`;
const nav = [["/", "Home"], ["/lab/", "Lab"], ["/about/", "About"]];
const external = [
  ["https://sepideh.io/", "Professional site"], ["https://sepideh.io/year-archive/", "Technical blog"],
  ["https://github.com/sepideh-shamsizadeh", "GitHub"], ["https://sepideh.io/tishtar/", "TISHTAR"],
  ["https://sepideh.io/drill/", "DRILL"], ["https://github.com/sepideh-shamsizadeh/deep-learning", "MiniDL"]
];
const stages = [
  ["Research", "1 h"], ["Theory", "1.5 h"], ["Implementation", "1.5 h"],
  ["Mini-project", "2 h"], ["Evaluation", "1 h"], ["Publication", "1 h"]
];
const description = "An independent engineering laboratory exploring modern AI, computer vision, robotic perception, autonomous navigation, and efficient model deployment through hands-on implementations and reproducible experiments.";
const link = (href, label, className = "") => `<a href="${e(href)}"${className ? ` class="${className}"` : ""}>${e(label)}</a>`;
const badge = item => `<span class="status" data-status="${e(item.status)}">${e(item.status)}</span>`;
const pathFor = item => `/lab/${item.slug}/`;
const meta = (label, value) => `<div><dt>${e(label)}</dt><dd>${value}</dd></div>`;
const linksFor = (item, include = Object.keys(artifacts)) => include
  .filter(key => item.links[key]).map(key => link(item.links[key], artifacts[key])).join("");
const paragraph = (title, value) => value ? `<h3>${e(title)}</h3><p>${e(value)}</p>` : "";
const tags = item => item.technologies.length
  ? `<ul class="tags" aria-label="Planned or used technologies">${item.technologies.map(value => `<li>${e(value)}</li>`).join("")}</ul>` : "";
const image = (src, alt) => `<img src="${e(src)}" alt="${e(alt)}" loading="lazy" decoding="async">`;

function layout(title, descriptionText, path, active, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark light">
  ${prod ? "" : '<meta name="robots" content="noindex, nofollow">'}
  <meta name="description" content="${e(descriptionText)}">
  <link rel="canonical" href="${origin + path}">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:url" content="${origin + path}">
  <meta property="og:description" content="${e(descriptionText)}">
  <title>${e(title)} · Sepideh Playground</title>
  <link rel="stylesheet" href="/assets/site.css">
  <script type="module" src="/assets/app.mjs"></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="wrap header">
      <a class="brand" href="/"><span class="mark" aria-hidden="true"></span>Sepideh<span class="brand-divider" aria-hidden="true">/</span> Playground</a>
      <nav aria-label="Main navigation">${nav.map(([href, label]) => `<a href="${href}"${active === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
      <button type="button" class="theme-toggle" data-theme-toggle hidden>Theme</button>
    </div>
  </header>
  <main id="main" class="wrap">${content}</main>
  <footer class="site-footer"><div class="wrap">
    <span>Sepideh Shamsizadeh</span>
    <nav aria-label="Related sites">${external.map(([href, label]) => link(href, label)).join("")}</nav>
  </div></footer>
</body></html>`;
}

function dashboard() {
  const counters = [
    ["Total experiments", stats.total], ["Completed", stats.completed], ["In progress", stats.active],
    ["Published articles", stats.published], ["Engineering hours", new Intl.NumberFormat("en").format(stats.actualHours)]
  ];
  return `<section class="section" aria-labelledby="progress-heading">
    <div class="section-heading"><h2 id="progress-heading">Lab progress</h2>${link(project, "GitHub Project 13")}</div>
    <dl class="metrics">${counters.map(([label, value]) =>
      `<div><dt>${e(label)}</dt><dd>${e(value)}${label === "Engineering hours" && !stats.hourEntries ? '<span>No hours logged</span>' : ""}</dd></div>`).join("")}</dl>
    <details class="panel domain-progress"><summary>Progress by domain</summary>
      <ul>${stats.domains.map(group => `<li><span>${e(group.name)}</span>
        <progress max="${group.total}" value="${group.completed}" aria-label="${e(group.name)} completion"></progress>
        <span>${group.completed}/${group.total} done${group.active ? ` · ${group.active} active` : ""}</span></li>`).join("")}</ul>
    </details>
  </section>`;
}

function method() {
  return `<section class="section" aria-labelledby="method-heading"><div class="section-heading">
    <div><h2 id="method-heading">The eight-hour workflow</h2><p>Two lab sessions per week, with one concept per session.</p></div>
  </div>
  <ol class="workflow">${stages.map(([stage, hours]) => `<li><span>${e(hours)}</span><strong>${e(stage)}</strong></li>`).join("")}</ol>
  </section>`;
}

function cards() {
  return select(experiments).map(item => `<article class="experiment panel" data-id="${item.id}" data-title="${e(item.title)}"
    data-domain="${e(item.domain)}" data-status="${e(item.status)}" data-planned="${item.planned}"
    data-project="${e(item.project)}" data-objective="${e(item.objective)}" data-technologies="${e(JSON.stringify(item.technologies))}">
    ${item.cover ? image(item.cover.src, item.cover.alt) : ""}
    <div class="card-top"><span class="mono accent">${item.id}</span>${badge(item)}</div>
    <h3>${link(pathFor(item), item.title, "card-title")}</h3>
    <p class="domain">${e(item.domain)}</p><p>${e(item.project)}</p>
    ${tags(item)}
    <p class="card-date">${item.completed ? "Completed " + time(item.completed) : "Planned " + time(item.planned)}</p>
    <div class="actions">${link(pathFor(item), "Experiment details")}${linksFor(item)}</div>
  </article>`).join("");
}

function schedule() {
  const groups = Object.groupBy(select(experiments), item => item.planned.slice(0, 7));
  return `<section class="section" id="roadmap" aria-labelledby="roadmap-heading">
    <div class="section-heading"><div><h2 id="roadmap-heading">Roadmap</h2><p>Planned dates are provisional.</p></div>${link(roadmap, "GitHub roadmap")}</div>
    <div class="months">${Object.entries(groups).map(([month, items]) => `<div class="panel month">
      <h3>${monthLabel.format(new Date(month + "-01"))}</h3><ol>${items.map(item => `<li>
        ${time(item.planned)}${link(pathFor(item), `${item.id} · ${item.title}`)}</li>`).join("")}</ol>
    </div>`).join("")}</div>
  </section>`;
}

function itemPage(item) {
  const d = item.detail ?? {};
  const resources = [...(item.references ?? []), ...(item.tishtar ? [item.tishtar] : [])];
  const visualization = item.visualization;
  return `<div class="breadcrumbs">${link("/lab/", "Lab")} <span aria-hidden="true">/</span> ${e(item.id)}</div>
    <header class="hero detail-hero">
      <div class="card-top"><span class="mono accent">${e(item.domain)}</span>${badge(item)}</div>
      <h1>${e(item.title)}</h1><p>${e(item.project)}</p>
      <dl class="facts">${meta("Lab ID", e(item.id))}${meta("Planned date", time(item.planned))}
        ${item.completed ? meta("Completion date", time(item.completed)) : ""}
        ${meta("Estimated hours", e(item.estimatedHours))}${meta("Actual hours", item.actualHours === null ? "Not logged" : e(item.actualHours))}
      </dl>
    </header>
    <div class="detail-grid">
      <section class="panel panel-pad"><h2>Overview</h2>
        ${paragraph("Problem", d.problem)}${paragraph("Motivation", d.motivation)}
        ${paragraph("Research objective", item.objective)}${paragraph("Learning objectives", d.learningObjectives)}
      </section>
      <section class="panel panel-pad"><h2>Implementation</h2>
        ${paragraph("Mini-project", item.project)}${tags(item)}
        ${paragraph("Approach", d.implementation)}${paragraph("Environment", d.environment)}${paragraph("Reproduction", d.reproduction)}
      </section>
      <section class="panel panel-pad"><h2>Experiments and evaluation</h2>
        ${paragraph("Evaluation plan", item.evaluation)}${paragraph("Methodology", d.methodology)}
        ${paragraph("Baselines", d.baselines)}${paragraph("Metrics", d.metrics)}${paragraph("Results", d.results)}
        ${paragraph("Failure cases", d.failureCases)}${paragraph("Limitations", d.limitations)}
        ${visualization ? `<figure><figcaption>${e(visualization.kind)} · ${e(visualization.caption)}</figcaption>
          ${visualization.src ? image(visualization.src, visualization.caption) : ""}
          ${visualization.url ? link(visualization.url, "Open visualization") : ""}</figure>` : ""}
        ${item.cover && !visualization ? image(item.cover.src, item.cover.alt) : ""}
      </section>
      ${resources.length || Object.keys(item.links).length ? `<section class="panel panel-pad"><h2>Resources</h2>
        <div class="actions">${linksFor(item)}${resources.map(({ url, label }) => link(url, label)).join("")}</div></section>` : ""}
    </div>`;
}

const pages = [
  ["/", "Engineering Playground", description, "/", `<header class="hero home-hero">
    <div class="hero-grid">
      <div><p class="eyebrow">Sepideh Shamsizadeh</p><h1>Engineering<br>Playground</h1>
      <p class="tagline">Learn. Build. Experiment. Evaluate. Share.</p>
      <p>A workspace for experiments in applied AI, robotic perception, and autonomous systems.</p>
      <div class="actions">${link("/lab/", "Explore the Lab", "button primary")}${link("/lab/#roadmap", "View roadmap", "button")}</div></div>
      <div class="hero-aside panel"><h2>Lab roadmap</h2><ol>
        ${select(experiments).slice(0, 4).map(item => `<li><span class="mono">${item.id}</span>${link(pathFor(item), item.title)}${time(item.planned)}</li>`).join("")}
      </ol></div>
    </div></header>
    <section class="section" aria-labelledby="lab-entry"><article class="panel panel-pad feature">
      <div><h2 id="lab-entry">Applied AI &amp; Robotics Lab</h2><p>${e(description)}</p></div>
      <div class="actions">${link("/lab/", "Explore Lab", "button primary")}${link(repo, "GitHub repository", "button")}${link(roadmap, "Learning roadmap", "button")}</div>
    </article></section>`],
  ["/lab/", "Applied AI & Robotics Lab", description, "/lab/", `<header class="hero">
    <p class="eyebrow">Engineering Playground</p><h1>Applied AI &amp;<br>Robotics Lab</h1>
    <p>Study one technical concept at a time, implement it, and report what the experiment actually shows.</p>
    <div class="actions">${link("#experiments", "Browse experiments", "button primary")}${link("#roadmap", "Roadmap", "button")}${link(repo, "GitHub repository", "button")}</div>
  </header>
  ${dashboard()}${method()}
  <section class="section" id="experiments" aria-labelledby="experiments-heading">
    <div class="section-heading"><h2 id="experiments-heading">Experiments</h2><p id="filter-status" role="status">${experiments.length} experiments</p></div>
    <form id="filters" class="filters panel" hidden>
      <div><label for="filter-query">Search experiments</label><input id="filter-query" type="search" name="query" maxlength="120" placeholder="Topic, Lab ID, or technology"></div>
      <div><label for="filter-domain">Domain</label><select id="filter-domain" name="domain"><option value="">All domains</option>
        ${stats.domains.map(group => `<option>${e(group.name)}</option>`).join("")}</select></div>
      <div><label for="filter-workflow">Status</label><select id="filter-workflow" name="status"><option value="">All statuses</option>${statuses.map(value => `<option>${e(value)}</option>`).join("")}</select></div>
      <div><label for="filter-sort">Sort</label><select id="filter-sort" name="sort"><option value="date">Planned date</option><option value="latest">Latest planned</option><option value="id">Lab ID</option></select></div>
      <button type="reset">Clear filters</button>
    </form>
    <p id="filter-empty" class="panel panel-pad" hidden>No experiments match these filters.</p>
    <div id="experiment-cards" class="cards">${cards()}</div>
  </section>${schedule()}`],
  ["/about/", "About Playground", description, "/about/", `<header class="hero">
    <h1>About Playground</h1><p>Playground presents experiments, their evaluation, and links to reproducible work.</p>
  </header><div class="detail-grid">
    <section class="panel panel-pad"><h2>Where work lives</h2>
      <p>Implementations and experiment notes live in the lab repository. Engineering status lives in GitHub Project 13. Technical articles stay on the professional site.</p>
      <div class="actions">${link(repo, "Lab repository")}${link(project, "GitHub Project 13")}${link(external[1][0], "Technical blog")}</div></section>
    <section class="panel panel-pad"><h2>Related engineering projects</h2>
      <p>TISHTAR develops a physical autonomous robot. Lab work can use ROS 2 Jazzy, Gazebo, and reference robots independently of hardware readiness. MiniDL explores deep learning implementations from scratch. DRILL runs on the professional site.</p>
      <div class="actions">${link(external[3][0], "TISHTAR")}${link(external[4][0], "DRILL")}${link(external[5][0], "MiniDL source")}</div></section>
  </div>`],
  ...experiments.map(item => [pathFor(item), item.title, item.project, "/lab/", itemPage(item)])
];

const output = "dist";
for (const item of experiments) {
  for (const src of [item.cover?.src, item.visualization?.src, item.links.demo, item.visualization?.url]) {
    if (src?.startsWith("/") && !existsSync("src" + (src.endsWith("/") ? src + "index.html" : src))) {
      throw new Error(`${item.id} references a missing local asset or demo`);
    }
  }
}
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
cpSync("src/assets", output + "/assets", { recursive: true });
if (existsSync("src/demos")) cpSync("src/demos", output + "/demos", { recursive: true });
for (const [path, title, summary, active, content] of pages) {
  const directory = join(output, path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "index.html"), layout(title, summary, path, active, content));
}
writeFileSync(output + "/404.html", layout("Page not found", "This Playground page does not exist.", "/404.html", "", `
  <header class="hero"><h1>Page not found</h1><p>${link("/lab/", "Browse the lab")}</p></header>`));
writeFileSync(output + "/robots.txt", prod ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n");
writeFileSync(output + "/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([path]) => `  <url><loc>${origin + path}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`Built ${pages.length} pages in ${output} (${prod ? "production" : "preview"}).`);
