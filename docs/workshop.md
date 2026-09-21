# Personal workshop

Essays are the default home. The shared page navigation is always ordered
`Essays` (`/`), `Projects` (`/projects/`), `Fiction` (`/30months/`). These are real
links, not JavaScript-only tabs, with an accessible current-section indicator.
Keep the lowercase organization slogan, `a place where i make what i want to
make.`, as a quiet footer line rather than a hero.

- Home uses a compact, title-first essay list. Do not put project/fiction promotion
  ahead of the writing. Preserve `/#essays` as a working anchor.
- Curate actual projects in `src/pages/projects/index.astro`; do not mirror every GitHub
  repository (supporting repositories are not separate products).
- Conn links directly to its product website and `eggp-dev/conn` repository.
  `public/projects/conn-handoff.png` is the existing public Conn/Codex demo still
  from Conn's `media/demo/public/footage/handoff/poster.png`.
- Home is Korean with the original English slogan. Each essay retains both
  language links and its existing URL. The three navigation labels stay in English
  across the site, while the navigation's accessible label follows the page language.
- `/30months/` combines the spoiler-free introduction with the complete contents.
  Publication counts come from approved public JSON, not private authoring files.
- Readers return to `/30months/#contents`; `/30months/#notice` stays stable.
  Do not add an interstitial before an existing reader URL.
- Keep both GA4 and Vercel Analytics. GA's command queue must receive the
  `arguments` object, never a rest-parameter array.
- The default social image uses the real logo. The legacy `og-default.png` is a
  one-pixel placeholder, so do not use it for new metadata.

## Verify and release

Run `pnpm verify` to check the private-material boundary, release importer, lint,
production build, and workshop routes/metadata. `pnpm test:workshop` requires a
fresh build. Check that essays appear in the first viewport in both themes and at
desktop/mobile widths. Exercise Essays → Projects → Fiction, the Conn links, both
essay languages, and novel introduction → reader → contents.

After a requested production push, wait for Vercel success and verify the actual
`eggp.dev` pages and GA `page_view` requests. A successful build or deployment badge
alone is not production verification.
