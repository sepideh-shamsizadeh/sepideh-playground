import { existsSync } from "node:fs";
import MarkdownIt from "markdown-it";
import katex from "katex";
import hljs from "highlight.js";

const md = new MarkdownIt({
  html: false,
  highlight(text, language) {
    return language && hljs.getLanguage(language)
      ? hljs.highlight(text, { language, ignoreIllegals: true }).value
      : "";
  }
});
const escape = md.utils.escapeHtml;
const renderFence = md.renderer.rules.fence;
md.renderer.rules.fence = (...args) => renderFence(...args).replace("<pre>", '<pre tabindex="0" role="region" aria-label="Code example">');

function renderMath(source, displayMode) {
  return katex.renderToString(source, { output: "mathml", displayMode, trust: false, maxExpand: 100 });
}

md.inline.ruler.before("escape", "lab_math", (state, silent) => {
  if (state.src[state.pos] !== "$" || /[\s$]/.test(state.src[state.pos + 1] ?? " ")) return false;
  for (let end = state.pos + 1; end < state.posMax; end++) {
    if (state.src[end] === "\\") { end++; continue; }
    if (state.src[end] === "\n") return false;
    if (state.src[end] !== "$") continue;
    if (end === state.pos + 1 || /\s/.test(state.src[end - 1]) || /\d/.test(state.src[end + 1] ?? "")) return false;
    if (!silent) state.push("lab_math", "math", 0).content = state.src.slice(state.pos + 1, end);
    state.pos = end + 1;
    return true;
  }
  return false;
});
md.renderer.rules.lab_math = (tokens, index) => renderMath(tokens[index].content, false);

md.block.ruler.before("fence", "lab_equation", (state, start, end, silent) => {
  const line = index => state.src.slice(state.bMarks[index] + state.tShift[index], state.eMarks[index]).trim();
  if (line(start) !== "$$") return false;
  let close = start + 1;
  while (close < end && line(close) !== "$$") close++;
  if (close === end) return false;
  if (silent) return true;
  state.push("lab_equation", "math", 0).content = Array.from({ length: close - start - 1 }, (_, i) => line(start + 1 + i)).join("\n");
  state.line = close + 1;
  return true;
});
md.renderer.rules.lab_equation = (tokens, index) =>
  `<div class="article-equation">${renderMath(tokens[index].content, true)}</div>\n`;

const localAsset = path => /^\/assets\/[a-z0-9_/-]+\.(?:avif|webp|png|jpg|jpeg|gif)$/i.test(path);
const renderImage = md.renderer.rules.image;
md.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index];
  const src = token.attrGet("src");
  if (!localAsset(src) || !existsSync("src" + src)) throw new Error("Missing or invalid Markdown figure: " + src);
  token.attrSet("loading", "lazy");
  token.attrSet("decoding", "async");
  return renderImage(tokens, index, options, env, self);
};

md.core.ruler.after("inline", "article_figures", state => {
  const tokens = state.tokens;
  for (let index = 0; index < tokens.length - 2; index++) {
    const [open, inline, close] = tokens.slice(index, index + 3);
    const image = inline.children?.[0];
    if (open.type !== "paragraph_open" || close.type !== "paragraph_close" ||
        inline.children?.length !== 1 || image.type !== "image") continue;
    const caption = image.attrGet("title");
    if (!caption) continue;
    open.tag = close.tag = "figure";
    open.attrSet("class", "technical-article__figure");
    const token = new state.Token("figure_caption", "", 0);
    token.content = caption;
    inline.children.push(token);
  }
});
md.renderer.rules.figure_caption = (tokens, i) => `<figcaption>${escape(tokens[i].content)}</figcaption>`;
md.renderer.rules.table_open = () => '<div class="technical-article__table" tabindex="0" role="region" aria-label="Scrollable table"><table>\n';
md.renderer.rules.table_close = () => "</table></div>\n";

md.block.ruler.before("fence", "lab_demo", (state, line, _end, silent) => {
  const source = state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]).trim();
  const match = source.match(/^\[demo:([a-z0-9-]+)\]$/);
  if (!match) return false;
  if (silent) return true;
  if (!existsSync(`src/demos/${match[1]}/index.html`)) throw new Error("Unknown Markdown demo: " + match[1]);
  state.push("lab_demo", "", 0).content = match[1];
  state.line = line + 1;
  return true;
});
md.renderer.rules.lab_demo = (tokens, index) =>
  `<aside class="article-component"><a href="/demos/${tokens[index].content}/">Open interactive demonstration</a></aside>\n`;

const headings = ["Overview", "Implementation", "Experiments and Evaluation", "Robotics Applications", "Resources"];
export const sections = Object.fromEntries(headings.map(label => [label, label.toLowerCase().replaceAll(" ", "-")]));

export function renderArticle(source) {
  const env = {};
  const tokens = md.parse(source, env);
  const output = {};
  let section;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === "heading_open" && token.tag === "h2") {
      section = tokens[index + 1].content;
      if (!Object.hasOwn(sections, section) || Object.hasOwn(output, section)) throw new Error("Unknown or duplicate article section: " + section);
      output[section] = [];
      index += 2;
    } else {
      if (!section || token.type === "heading_open" && token.tag === "h1") throw new Error("Use supported level-two sections and level-three subheadings in article Markdown");
      output[section].push(token);
    }
  }
  return Object.fromEntries(Object.entries(output).map(([heading, children]) =>
    [heading, md.renderer.render(children, md.options, env)]));
}
