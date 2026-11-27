export const statuses = ["Backlog", "Ready", "Learning", "Implementation", "Evaluation", "Writing", "Done"];
export const artifacts = {
  issue: "GitHub issue", source: "Source code", article: "Technical article", demo: "Interactive demo"
};
const inProgress = new Set(["Learning", "Implementation", "Evaluation", "Writing"]);
const kinds = ["Live interactive demo", "Precomputed visualization", "Recorded simulation"];
const detailFields = ["problem", "motivation", "learningObjectives", "implementation", "environment",
  "reproduction", "methodology", "baselines", "metrics", "results", "failureCases", "limitations"];

function date(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
const text = value => typeof value === "string" && value.trim().length > 0;
const amount = value => Number.isFinite(value) && value >= 0;
const record = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const asset = value => text(value) && /^\/assets\/[a-z0-9_/-]+\.(?:avif|webp|png|jpe?g)$/i.test(value);
const localDemo = value => text(value) && /^\/demos\/[a-z0-9-]+\/$/.test(value);
function https(value) {
  if (!text(value) || /[\u0000-\u0020]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validate(entries) {
  if (!Array.isArray(entries)) throw new Error("Experiment data must be an array");
  const ids = new Set(), slugs = new Set();
  for (const item of entries) {
    const fail = message => { throw new Error((item?.id ?? "Experiment") + " · " + message); };
    if (!record(item) || !/^LAB-[0-9]{3,}$/.test(item.id ?? "") || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug ?? "")) fail("invalid ID or slug");
    if (ids.has(item.id) || slugs.has(item.slug)) fail("duplicate ID or slug");
    ids.add(item.id);
    slugs.add(item.slug);
    for (const key of ["title", "domain", "objective", "project", "evaluation"]) {
      if (!text(item[key])) fail("missing " + key);
    }
    if (!statuses.includes(item.status) || !date(item.planned)) fail("invalid status or planned date");
    if (!amount(item.estimatedHours) || !(item.actualHours === null || amount(item.actualHours))) fail("invalid hours");
    if (item.completed !== undefined && !date(item.completed)) fail("invalid completion date");
    if (item.status === "Done" && (!item.completed || item.actualHours === null)) fail("completed work needs date and actual hours");
    if (item.completed && item.status !== "Done") fail("completion date requires Done");
    if (!Array.isArray(item.technologies) || !item.technologies.every(text)) fail("invalid technologies");
    if (!record(item.links) || Object.entries(item.links).some(([key, value]) =>
      !Object.hasOwn(artifacts, key) || !(https(value) || key === "demo" && localDemo(value)))) fail("invalid artifact link");
    if (item.cover && (!record(item.cover) || !asset(item.cover.src) || !text(item.cover.alt) || (item.cover.caption !== undefined && !text(item.cover.caption)))) fail("invalid cover");
    if (item.visualization && (!record(item.visualization) || !kinds.includes(item.visualization.kind) ||
        !text(item.visualization.caption) || !(asset(item.visualization.src) || https(item.visualization.url) ||
          item.visualization.kind === kinds[0] && localDemo(item.visualization.url)))) fail("invalid visualization");
    if (item.references && (!Array.isArray(item.references) || item.references.some(link =>
      !record(link) || !text(link.label) || !https(link.url)))) fail("invalid references");
    if (item.tishtar && (!record(item.tishtar) || !text(item.tishtar.label) || !https(item.tishtar.url))) fail("invalid TISHTAR milestone");
    if (item.detail !== undefined && (!record(item.detail) || Object.entries(item.detail).some(([key, value]) =>
      !detailFields.includes(key) || !text(value)))) fail("invalid experiment detail");
  }
  return entries;
}

export function select(entries, { query = "", domain = "", status = "", sort = "date" } = {}) {
  const words = query.toLocaleLowerCase("en").trim().split(/\s+/).filter(Boolean);
  return entries.filter(item => {
    if ((domain && domain !== item.domain) || (status && status !== item.status)) return false;
    const haystack = [item.id, item.title, item.objective, item.project, item.domain, ...item.technologies].join(" ").toLocaleLowerCase("en");
    return words.every(word => haystack.includes(word));
  }).sort((a, b) => {
    const id = Number(a.id.slice(4)) - Number(b.id.slice(4));
    const order = a.planned.localeCompare(b.planned) || id;
    if (sort === "id") return id;
    return sort === "latest" ? -order : order;
  });
}

export function statistics(entries) {
  const groups = new Map();
  let completed = 0, active = 0, actualHours = 0, hourEntries = 0;
  const published = new Set();
  for (const item of entries) {
    const group = groups.get(item.domain) ?? { name: item.domain, total: 0, completed: 0, active: 0 };
    group.total++;
    if (item.status === "Done") { completed++; group.completed++; }
    if (inProgress.has(item.status)) { active++; group.active++; }
    if (typeof item.actualHours === "number") { actualHours += item.actualHours; hourEntries++; }
    if (item.links.article) published.add(item.links.article);
    groups.set(item.domain, group);
  }
  return {
    total: entries.length, completed, active, published: published.size,
    actualHours, hourEntries, domains: [...groups.values()].sort((a, b) => a.name.localeCompare(b.name))
  };
}
