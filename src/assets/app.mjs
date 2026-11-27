import { select } from "./model.mjs";

const themeButton = document.querySelector("[data-theme-toggle]");
function loadTheme() {
  try { return localStorage.getItem("playground-theme"); } catch { return null; }
}
function themeLabel() {
  const dark = document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  themeButton.textContent = dark ? "Light mode" : "Dark mode";
  return dark;
}
const initial = loadTheme();
if (initial === "light" || initial === "dark") document.documentElement.dataset.theme = initial;
if (themeButton) {
  themeLabel();
  themeButton.hidden = false;
  themeButton.addEventListener("click", () => {
    const next = themeLabel() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("playground-theme", next); } catch {}
    themeLabel();
  });
}

const filters = document.querySelector("#filters");
if (filters) {
  const cards = document.querySelector("#experiment-cards");
  const status = document.querySelector("#filter-status");
  const empty = document.querySelector("#filter-empty");
  const data = new Map(Array.from(cards.children, card => [
    card.dataset.id,
    { id: card.dataset.id, title: card.dataset.title, objective: card.dataset.objective, project: card.dataset.project,
      domain: card.dataset.domain, status: card.dataset.status, planned: card.dataset.planned,
      technologies: JSON.parse(card.dataset.technologies), card }
  ]));
  const controls = ["query", "domain", "status", "sort"];
  function update() {
    const options = Object.fromEntries(new FormData(filters));
    const shown = select([...data.values()], options);
    const visible = new Set(shown.map(item => item.id));
    for (const [id, item] of data) item.card.hidden = !visible.has(id);
    for (const item of shown) cards.append(item.card);
    empty.hidden = shown.length > 0;
    status.textContent = `${shown.length} of ${data.size} experiments`;
    const url = new URL(location.href);
    for (const key of controls) {
      if (options[key] && (key !== "sort" || options[key] !== "date")) url.searchParams.set(key, options[key]);
      else url.searchParams.delete(key);
    }
    if (url.href !== location.href) history.replaceState(null, "", url.href);
  }
  for (const [key, value] of new URLSearchParams(location.search)) {
    if (!controls.includes(key)) continue;
    const field = filters.elements[key];
    if (field.tagName === "SELECT" && !Array.from(field.options).some(option => option.value === value)) continue;
    field.value = value.slice(0, 120);
  }
  filters.addEventListener("input", update);
  filters.addEventListener("submit", event => { event.preventDefault(); update(); });
  filters.addEventListener("reset", event => {
    event.preventDefault();
    for (const key of controls) {
      const field = filters.elements[key];
      if (field.tagName === "SELECT") field.selectedIndex = 0;
      else field.value = "";
    }
    update();
  });
  filters.hidden = false;
  update();
}
