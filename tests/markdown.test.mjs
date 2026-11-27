import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderArticle, sections } from "../src/markdown.mjs";

test("DINOv3 renders article sections with equations, highlighted code and a table", () => {
  const article = renderArticle(readFileSync("content/lab/dinov3.md", "utf8"));
  assert.deepEqual(Object.keys(article), Object.keys(sections).filter(name => name !== "Resources"));
  assert.match(article.Implementation, /<math[^>]*display="block"/);
  assert.match(article.Implementation, /hljs-keyword/);
  assert.match(article["Experiments and Evaluation"], /<table>/);
});

test("article authoring escapes HTML, captions and unsafe links and validates local media", () => {
  const article = renderArticle('## Overview\n\n<script>untrusted()</script>\n\n[unsafe](javascript:alert(1))\n\n![Diagram](/assets/covers/lab.webp "A <caption>")');
  assert.doesNotMatch(article.Overview, /<script|href="javascript:/);
  assert.match(article.Overview, /<figcaption>A &lt;caption&gt;<\/figcaption>/);
  assert.throws(() => renderArticle("## Overview\n\n[demo:missing]"), /Unknown Markdown demo/);
  assert.throws(() => renderArticle("## Overview\n\n![Missing](/assets/missing.webp)"), /Missing or invalid/);
});
