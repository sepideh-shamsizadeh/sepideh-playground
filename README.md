# Sepideh Playground

**Learn. Build. Experiment. Evaluate. Share.**

An independent engineering site for applied AI, robotic perception, and autonomous systems. The Applied AI & Robotics Lab publishes experiment plans and links to reproducible work. The [lab repository](https://github.com/sepideh-shamsizadeh/applied-ai-robotics-lab) owns implementations. [GitHub Project 13](https://github.com/users/sepideh-shamsizadeh/projects/13) owns workflow status. Technical articles remain on the [professional site's blog](https://sepideh.io/year-archive/).

## Run locally

Use Node.js 22 or later. The site has no package dependencies.

```sh
npm run dev
npm run lint
npm test
npm run build
```

Open `http://127.0.0.1:4178/`. The dev server rebuilds at startup. Run the build again to see content changes while it is running. Set `PORT` to use another local port.

| Path | Purpose |
| --- | --- |
| `data/experiments.json` | Reviewed metadata snapshot |
| `src/build.mjs` | Static home, lab, roadmap, detail pages, and SEO generation |
| `src/assets/` | Styles, shared validation and statistics, search, filters and theme |
| `src/serve.mjs` | Local static preview |
| `tests/` | Validation, build, statistics, filtering and browser checks |
| `vercel.json` | Vercel output, path handling and security headers |
| `docs/maintenance.md` | Content, deployment, and rollback procedures |

The local and preview builds are marked `noindex`. Production uses `VERCEL_ENV=production`, which Vercel supplies automatically. The custom domain is planned for `playground.sepideh.io`.

For browser verification, start the dev server, install Playwright outside the project or make it available in your environment, and run `node tests/browser.cjs`. Set `PLAYWRIGHT_PATH` for an external installation, `CHROME_PATH` to use system Chrome, and `PLAYGROUND_SCREENSHOTS` to save review screenshots.

See the [maintenance guide](docs/maintenance.md) for experiment entries, blog links, previews, domain setup, and rollback.
