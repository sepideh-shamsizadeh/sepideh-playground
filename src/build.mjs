import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { artifacts, select, statistics, statuses, validate } from "./assets/model.mjs";
import { renderArticle, sections } from "./markdown.mjs";

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
const personalSite = "https://sepideh.io/";
const technicalBlog = personalSite + "blog/";
const nav = [["/", "Home"], ["/lab/", "Applied AI & Robotics Lab"], [technicalBlog, "Blog"], [personalSite, "Personal Website"]];
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
const pathFor = item => `/lab/${item.slug}/`;
const linksFor = item => Object.keys(artifacts).filter(key => item.links[key])
  .map(key => [item.links[key], artifacts[key]]);
const labCover = {
  src: "/assets/covers/lab.webp", alt: "Conceptual diagram from perception to robot planning",
  caption: "Conceptual illustration", generated: true
};
const coverFor = item => {
  const src = `/assets/covers/${item.slug}.webp`;
  return item.cover ?? (existsSync("src" + src)
    ? { ...labCover, src, alt: `Conceptual diagram of ${item.title}` } : labCover);
};
const image = (src, alt, eager = false, cover = false) => `<img src="${e(src)}" alt="${e(alt)}" ${cover ? 'width="1200" height="675" ' : ""}loading="${eager ? "eager" : "lazy"}" decoding="async">`;
const figure = (cover, eager = true) => `<figure class="technical-article__figure lead-figure">
  ${image(cover.src, cover.alt, eager, cover.generated)}
  ${cover.caption ? `<figcaption>${e(cover.caption)}</figcaption>` : ""}</figure>`;
const intro = (title, summary, label = "") => `<header class="ph">
  ${label ? `<p class="eyebrow">${e(label)}</p>` : ""}
  <h1 class="ph__title">${e(title)}</h1><p class="ph__lead">${e(summary)}</p></header>`;

function layout(title, descriptionText, path, active, content) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
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
  <link rel="icon" href="/assets/icon.png" type="image/png">
  <script src="/assets/theme.js"></script>
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="stylesheet" href="/assets/navigation.css">
  <script src="/assets/navigation.js" defer></script>
  <link rel="stylesheet" href="/assets/technical-article.css">
  <script type="module" src="/assets/app.mjs"></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/"><img class="brand__mark" src="/assets/brand.svg" alt=""><span class="brand__name">Sepideh Shamsizadeh</span></a>
      <button class="nav-toggle" type="button" data-nav-toggle aria-controls="primary-nav" aria-expanded="false" aria-label="Menu" hidden>
        <svg class="nav-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg class="nav-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>
      <nav id="primary-nav" class="site-nav" aria-label="Main navigation">${nav.map(([href, label]) => `<a href="${href}"${active === href ? ' aria-current="' + (href === path ? "page" : "location") + '"' : ""}>${e(label)}</a>`).join("")}</nav>
      <button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch theme" hidden>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </div>
  </header>
  <main id="main" class="wrap${active === "/lab/" && path !== "/lab/" ? " wrap--read technical-article" : ""}">${content}</main>
  <footer class="site-footer"><div class="site-footer__inner">
    <span>© ${new Date().getUTCFullYear()} Sepideh Shamsizadeh · Zurich, Switzerland</span>
    <nav aria-label="Related sites">${external.map(([href, label]) => link(href, label)).join("")}</nav>
  </div></footer>
</body></html>`;
}

function dashboard() {
  const counters = [
    ["Total experiments", stats.total], ["Completed", stats.completed], ["In progress", stats.active],
    ["Published articles", stats.published], ["Engineering hours", new Intl.NumberFormat("en").format(stats.actualHours)]
  ];
  return `<section class="editorial-section" aria-labelledby="progress-heading">
    <h2 id="progress-heading">Lab progress</h2>
    <details class="lab-progress"><summary>Progress and hours</summary>
    <dl class="metrics">${counters.map(([label, value]) =>
      `<div><dt>${e(label)}</dt><dd>${e(value)}${label === "Engineering hours" && !stats.hourEntries ? '<span>No hours logged</span>' : ""}</dd></div>`).join("")}</dl>
    <details class="domain-progress"><summary>Progress by domain</summary>
      <ul>${stats.domains.map(group => `<li><span>${e(group.name)}</span>
        <progress max="${group.total}" value="${group.completed}" aria-label="${e(group.name)} completion"></progress>
        <span>${group.completed}/${group.total} done${group.active ? ` · ${group.active} active` : ""}</span></li>`).join("")}</ul>
    </details>
    <p>${link(project, "GitHub Project 13")}</p>
    </details>
  </section>`;
}

function method() {
  return `<section class="editorial-section" aria-labelledby="method-heading">
    <h2 id="method-heading">Research and engineering method</h2>
    <p>Two eight-hour lab sessions per week, with one concept per session. Each plan moves from literature and theory to a practical implementation, then evaluation and publication.</p>
    <details><summary>See the eight-hour workflow</summary>
      <ol class="workflow">${stages.map(([stage, hours]) => `<li>${e(stage)}<span class="hours">${e(hours)}</span></li>`).join("")}</ol>
    </details>
  </section>`;
}

function editorialCard({ path, title, category, summary, cover, attributes = "", extras = "", action = "Explore project", eager = false }) {
  return `<article class="post-card${attributes ? " experiment" : ""}" ${attributes}>
    <a class="post-card__media" href="${e(path)}" aria-label="${e(title)}">${image(cover.src, "", eager, cover.generated)}</a>
    <div class="post-card__body">
      <p class="post-card__meta">${e(category)}</p>
      <h3>${link(path, title)}</h3><p>${e(summary)}</p>
      ${link(path, action, "post-card__more")}${extras}
    </div></article>`;
}

function cards() {
  return select(experiments).map(item => editorialCard({
    path: pathFor(item), title: item.title, category: item.domain, summary: item.project, cover: coverFor(item),
    action: "Experiment details",
    attributes: `data-id="${item.id}" data-title="${e(item.title)}"
      data-domain="${e(item.domain)}" data-status="${e(item.status)}" data-planned="${item.planned}"
      data-project="${e(item.project)}" data-objective="${e(item.objective)}" data-technologies="${e(JSON.stringify(item.technologies))}"`
  })).join("");
}

function schedule() {
  const groups = Object.groupBy(select(experiments), item => item.planned.slice(0, 7));
  return `<section class="editorial-section" id="roadmap" aria-labelledby="roadmap-heading">
    <div class="collection-heading"><h2 id="roadmap-heading">Roadmap</h2>${link(roadmap, "GitHub roadmap")}</div>
    <p>Planned dates are provisional.</p>
    <div class="months">${Object.entries(groups).map(([month, items]) => `<div class="month">
      <h3>${monthLabel.format(new Date(month + "-01"))}</h3><ol>${items.map(item => `<li>
        ${time(item.planned)}${link(pathFor(item), `${item.id} · ${item.title}`)}</li>`).join("")}</ol>
    </div>`).join("")}</div>
  </section>`;
}

function itemPage(item) {
  const source = `content/lab/${item.slug}.md`;
  const authored = existsSync(source) ? renderArticle(readFileSync(source, "utf8")) : {};
  const related = experiments.filter(other => other.id !== item.id && other.domain === item.domain).slice(0, 2);
  const resources = [...linksFor(item), ...(item.references ?? []).map(entry => [entry.url, entry.label]),
    ...related.map(other => [pathFor(other), other.title])];
  const visualization = item.visualization;
  const detail = item.detail ?? {};
  const paragraph = (heading, value) => value ? `<h3>${heading}</h3><p>${e(value)}</p>` : "";
  const evaluation = [
    ["Methodology", detail.methodology], ["Baselines", detail.baselines], ["Metrics", detail.metrics],
    ["Results", detail.results], ["Failure cases", detail.failureCases], ["Limitations", detail.limitations]
  ].map(([heading, value]) => paragraph(heading, value)).join("");
  const statsText = `<p class="article-stats">Estimated effort ${item.estimatedHours} h · Actual hours ${item.actualHours === null ? "Not logged" : item.actualHours}</p>`;
  const content = {
    Overview: authored.Overview ?? (paragraph("Problem", detail.problem) + paragraph("Motivation", detail.motivation) +
      paragraph("Research objective", item.objective) + paragraph("Learning objectives", detail.learningObjectives) +
      paragraph("Practical project", item.project)),
    Implementation: (authored.Implementation ?? (paragraph("Approach", detail.implementation) +
      paragraph("Environment", detail.environment) + paragraph("Reproduction", detail.reproduction))) + (item.technologies.length
      ? `<h3>Technologies</h3><p>${e(item.technologies.join(", "))}</p>` : ""),
    "Experiments and Evaluation": `<h3>Evaluation plan</h3><p>${e(item.evaluation)}</p>` +
      (authored["Experiments and Evaluation"] ?? evaluation) + (visualization ? `<figure class="technical-article__figure">
      ${visualization.src ? image(visualization.src, visualization.caption) : ""}
      <figcaption>${e(visualization.kind)} · ${e(visualization.caption)} ${visualization.url ? link(visualization.url, "Open visualization") : ""}</figcaption></figure>` : "") + statsText,
    "Robotics Applications": (authored["Robotics Applications"] ?? "") + (item.tishtar ? `<p>${link(item.tishtar.url, item.tishtar.label)}</p>` : ""),
    Resources: (authored.Resources ?? "") + (resources.length ? `<ul>${resources.map(([url, label]) => `<li>${link(url, label)}</li>`).join("")}</ul>` : "")
  };
  const entries = Object.entries(content).filter(([, body]) => body);
  return `<article aria-labelledby="article-title"><header class="technical-article__header">
    ${link("/lab/#experiments", "Applied AI & Robotics Lab", "technical-article__back")}
    <h1 id="article-title">${e(item.title)}</h1>
    <p class="technical-article__description">${e(item.project)}</p>
    <p class="technical-article__meta">${e(item.id)} · ${e(item.domain)} · ${e(item.status)} · ${item.completed ? "Completed " + time(item.completed) : "Planned " + time(item.planned)}</p>
  </header>
  ${figure(coverFor(item))}
  <nav class="technical-article__toc" aria-label="On this page"><details><summary>On this page</summary>
    <ol>${entries.map(([name]) => `<li>${link("#" + sections[name], name)}</li>`).join("")}</ol>
  </details></nav>
  <div class="prose technical-article__body">${entries.map(([name, body]) =>
    `<section aria-labelledby="${sections[name]}"><h2 id="${sections[name]}">${e(name)}</h2>${body}</section>`).join("")}</div></article>`;
}

const featured = select(experiments).slice(0, 3);
const pages = [
  ["/", "Engineering Playground", description, "/", `${intro("Engineering Playground", "Learn. Build. Experiment. Evaluate. Share.")}
    <section aria-labelledby="projects-heading">
      <h2 id="projects-heading">Projects and experiments</h2>
      <div class="post-grid">
        ${editorialCard({ path: "/lab/", title: "Applied AI & Robotics Lab", category: "Engineering laboratory",
          summary: description, cover: labCover, action: "Explore the Lab", eager: true,
          extras: `<p>${link(repo, "GitHub repository")} · ${link(roadmap, "Learning roadmap")}</p>` })}
        ${featured.map((item, index) => editorialCard({ path: pathFor(item), title: item.title,
          category: item.domain, summary: item.project, cover: coverFor(item), action: "Explore experiment", eager: index === 0 })).join("")}
      </div>
    </section>`],
  ["/lab/", "Applied AI & Robotics Lab", description, "/lab/", `<div class="lab-intro">
    ${intro("Applied AI & Robotics Lab", "Experiments in applied AI, robotic perception and autonomous systems.", "Playground")}
    ${figure(labCover)}
    <p>${e(description)}</p>
    <p class="lab-links">${link("#experiments", "Browse experiments")} · ${link("#roadmap", "Roadmap")} · ${link(repo, "GitHub repository")}</p>
    ${method()}
  </div>
  <section class="editorial-section" id="experiments" aria-labelledby="experiments-heading">
    <div class="collection-heading"><h2 id="experiments-heading">Experiments</h2><p id="filter-status" role="status">${experiments.length} experiments</p></div>
    <form id="filters" class="filters" hidden>
      <div><label for="filter-query">Search experiments</label><input id="filter-query" type="search" name="query" maxlength="120" placeholder="Topic, Lab ID, or technology"></div>
      <div><label for="filter-domain">Domain</label><select id="filter-domain" name="domain"><option value="">All domains</option>
        ${stats.domains.map(group => `<option>${e(group.name)}</option>`).join("")}</select></div>
      <div><label for="filter-workflow">Status</label><select id="filter-workflow" name="status"><option value="">All statuses</option>${statuses.map(value => `<option>${e(value)}</option>`).join("")}</select></div>
      <div><label for="filter-sort">Sort</label><select id="filter-sort" name="sort"><option value="date">Planned date</option><option value="latest">Latest planned</option><option value="id">Lab ID</option></select></div>
      <button class="button" type="reset">Clear filters</button>
    </form>
    <p id="filter-empty" hidden>No experiments match these filters.</p>
    <div id="experiment-cards" class="post-grid">${cards()}</div>
  </section>
  ${dashboard()}${schedule()}`],
  ["/about/", "About Playground", description, "/about/", `${intro("About Playground", "Playground presents experiments, their evaluation, and links to reproducible work.")}
  <div class="prose">
    <h2>Where work lives</h2>
    <p>Implementations and experiment notes live in the lab repository. Engineering status lives in GitHub Project 13. Technical articles stay on the professional site.</p>
    <p>${link(repo, "Lab repository")} · ${link(project, "GitHub Project 13")} · ${link(external[1][0], "Technical blog")}</p>
    <h2>Related engineering projects</h2>
    <p>TISHTAR develops a physical autonomous robot. Lab work can use ROS 2 Jazzy, Gazebo, and reference robots independently of hardware readiness. MiniDL explores deep learning implementations from scratch. DRILL runs on the professional site.</p>
    <p>${link(external[3][0], "TISHTAR")} · ${link(external[4][0], "DRILL")} · ${link(external[5][0], "MiniDL source")}</p>
  </div>`],
  ...experiments.map(item => [pathFor(item), item.title, item.project, "/lab/", itemPage(item)])
];

const output = "dist";
for (const item of experiments) {
  for (const src of [coverFor(item).src, item.visualization?.src, item.links.demo, item.visualization?.url]) {
    if (src?.startsWith("/") && !existsSync("src" + (src.endsWith("/") ? src + "index.html" : src))) {
      throw new Error(`${item.id} references a missing local asset or demo`);
    }
  }
}
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
cpSync("src/assets", output + "/assets", { recursive: true });
mkdirSync(output + "/assets/fonts");
for (const font of ["inter", "space-grotesk", "jetbrains-mono"]) {
  const packagePath = `node_modules/@fontsource-variable/${font}`;
  cpSync(`${packagePath}/files/${font}-latin-wght-normal.woff2`, `${output}/assets/fonts/${font}.woff2`);
  cpSync(packagePath + "/LICENSE", `${output}/assets/fonts/${font}-LICENSE.txt`);
}
if (existsSync("src/demos")) cpSync("src/demos", output + "/demos", { recursive: true });
for (const [path, title, summary, active, content] of pages) {
  const directory = join(output, path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "index.html"), layout(title, summary, path, active, content));
}
writeFileSync(output + "/404.html", layout("Page not found", "This Playground page does not exist.", "/404.html", "", `
  ${intro("Page not found", "This Playground page does not exist.")}<p>${link("/lab/", "Browse the lab")}</p>`));
writeFileSync(output + "/robots.txt", prod ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n");
writeFileSync(output + "/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([path]) => `  <url><loc>${origin + path}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`Built ${pages.length} pages in ${output} (${prod ? "production" : "preview"}).`);
