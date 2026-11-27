import { spawnSync } from "node:child_process";
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const build = spawnSync(process.execPath, ["src/build.mjs"], { stdio: "inherit" });
if (build.status !== 0) process.exit(build.status || 1);
const root = resolve("dist");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".xml": "application/xml", ".txt": "text/plain", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".avif": "image/avif" };
const headers = JSON.parse(await (await import("node:fs/promises")).readFile("vercel.json", "utf8")).headers[0].headers;
const port = Number(process.env.PORT ?? 4178);
createServer((request, response) => {
  let file, status = 200;
  try {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    file = resolve(root, "." + path);
    if (file !== root && !file.startsWith(root + sep)) throw new Error();
    if (statSync(file).isDirectory()) file = join(file, "index.html");
    if (!statSync(file).isFile()) throw new Error();
  } catch {
    status = 404;
    file = join(root, "404.html");
  }
  response.writeHead(status, { ...Object.fromEntries(headers.map(item => [item.key, item.value])),
    "Content-Type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`Playground preview at http://127.0.0.1:${port}/`));
