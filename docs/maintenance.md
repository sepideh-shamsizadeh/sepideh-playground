# Playground maintenance and rollout

## Experiment metadata

Update the matching GitHub issue and Project 13 first, then review the local snapshot in `data/experiments.json`. The initial snapshot uses lab issues 1–16 and the lab roadmap. Project 13 contained all 16 issues with no Status assigned, so each was initialized as Backlog. Planned dates and technology suggestions may change.

1. Add one entry with a unique `LAB-NNN` ID, a stable lowercase slug, domain, status, ISO planned date, objective, mini-project, evaluation plan, technologies, and estimated hours.
2. Keep `actualHours: null` until work is logged. Record actual hours even while a lab is active. A Done lab requires its completion date and actual hours.
3. Add verified links in `links.issue`, `links.source`, `links.article`, and `links.demo` when available. Omit missing artifacts. Add references as label and HTTPS URL pairs. An optional `tishtar` label and URL can connect a validated result to a milestone.
4. Use `detail` for substantive problem, motivation, learning objectives, implementation, environment, reproduction, methodology, baselines, metrics, results, failure cases, or limitations text. Missing sections are omitted. Keep the full implementation and reproduction materials in the lab repository.
5. Add a genuine cover image under `src/assets/` with alternative text. A `visualization` can be a **Live interactive demo**, **Precomputed visualization**, or **Recorded simulation**. Include a caption and a real image or HTTPS link. Build validation rejects links to missing local assets.
6. Run lint, unit tests and a local preview. Verify the new detail route and any links.

For a small browser demo, place a self-contained static entry and modules under `src/demos/<slug>/`, with an `index.html`, keyboard controls, and a text explanation. Add the demo path to the experiment metadata only after testing it. Keep heavy work in a Web Worker or present precomputed figures or recorded simulation. A ROS 2 or PyTorch environment belongs in the experiment repository. Review the site CSP before introducing any embeds or external network access.

## Publish a completed experiment

1. Commit the implementation, reproduction steps, metrics and limitations in the lab repository. Update the related issue and Project 13 status.
2. Update the matching Playground row with actual hours, completion date and verified source URL. Put eligible figures under `src/assets/`, with alt text and a caption. Use `visualization` to identify the kind of result.
3. Publish the technical article on the professional site's existing blog. Set `links.article` to its verified URL and add a comparison or results link back to the experiment from the article.
4. Run lint, tests and the static build. Open a Playground PR, review its preview, then publish only after approval.

LAB-001 is ready to begin as a plan. Its issue, objective, mini-project, evaluation criteria and upstream DINOv3 reference are available from the detail page. Keep results and actual hours empty until there is evidence from the experiment.

## Dashboard rules

Total is the number of validated rows. Completed means Done. In progress means Learning, Implementation, Evaluation, or Writing. Ready is queued. Published articles count distinct article URLs. Engineering hours sum numeric actual hours only and show “No hours logged” when no rows have logged time. Domain progress counts completed rows over all rows in that domain.

The site has no runtime GitHub API or credentials. A maintainer can use an authenticated local GitHub CLI to inspect Project 13 before making a reviewed snapshot update. Issue open or closed state cannot substitute for the project Status field. A scheduled sync is premature at this size. If added later, validate and review the generated snapshot in CI and expose its last successful sync date.

## Blog and related sites

Publish the article through the existing Jekyll workflow on the professional site. Include motivation, theory, implementation, measured results, limitations, robotics relevance, and references as appropriate. Use the existing math, syntax highlighting, diagrams and figures. Link to the relevant Playground detail page from the article and set the deployed article URL in `links.article`. Keep DRILL, TISHTAR and MiniDL as external applications or repositories.

## Repository and Vercel

1. Confirm that `sepideh-shamsizadeh/sepideh-playground` is still absent, then create that repository in the intended account. Publish the reviewed local history and select its default branch. Use feature branches and PRs for subsequent changes.
2. Import the repository into a **separate** Vercel Hobby project. Select Other, Node 22 or 24, repository root, build command `npm run build`, and output directory `dist`. The committed configuration provides these settings. No install dependencies, secrets, backend, or custom environment variables are required.
3. Review the deployment at its Vercel preview URL. Use an explicit Preview environment for a CLI upload, and verify the deployment is labeled Preview before sharing it. Keep preview indexing blocked. If the provider requires a separate first-production step, defer it to cutover approval.
4. After explicit approval, assign `playground.sepideh.io` to the Playground project and use the exact DNS record displayed in the project domain settings. The parent currently uses Vercel DNS. A wildcard DNS response is not proof that Playground has been attached, and HTTPS did not validate for the proposed hostname during discovery. Confirm domain ownership, authoritative DNS, automatic TLS, and HTTP-to-HTTPS redirect after attachment. Leave the apex and unrelated DNS records intact.
5. Verify homepage, lab, all 16 detail pages, navigation, filters and search, themes, and mobile layout on the real domain. After approval, replace the professional site's Playground dropdown with a link to the new platform. Preserve `/drill/`, `/drill/communication/`, `/drill/transfer/`, `/tishtar/` and every existing article URL. Keep the old blog permalink when adding the `/blog/` alias.
6. If a legacy Playground landing path is found on another deployment, keep it working until the cutover is verified. Then add a path-specific redirect or a migration page. The current public professional site returned 404 at `/playground/`, so there is no deployed Playground page to remove or redirect in this change.

Expected added hosting cost is $0 within the Hobby plan’s personal, non-commercial usage and quotas. No new domain purchase, databases or paid APIs are needed. If quotas are reached, leave the existing sites available and pause preview or production updates until usage resets.

## Rollback

Keep the previously verified Vercel deployment available. If a release fails, promote the last working deployment or revert the change and rebuild. If cutover links fail, revert the professional-site navigation change and preserve the existing apex routes. If necessary, remove only the Playground subdomain assignment after approval. The independent site has no DRILL data and no cross-origin authentication. Its only persistent browser setting is a local theme preference.
