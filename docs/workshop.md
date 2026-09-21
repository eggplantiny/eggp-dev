# Personal workshop

Essays are the default home. The shared page navigation is always ordered
`Essays`, `Projects`, `Fiction`. These are real
links, not JavaScript-only tabs, with an accessible current-section indicator.
Keep the lowercase organization slogan, `a place where i make what i want to
make.`, as a quiet footer line rather than a hero.

- Home uses a compact, title-first essay list. Do not put project/fiction promotion
  ahead of the writing. Preserve `/#essays` as a working anchor.
- Curate actual projects in `src/components/ProjectsPage.astro`; do not mirror every GitHub
  repository (supporting repositories are not separate products).
- Conn links directly to its product website and `eggp-dev/conn` repository.
  `public/projects/conn-handoff.png` is the existing public Conn/Codex demo still
  from Conn's `media/demo/public/footage/handoff/poster.png`.
- Korean URLs remain `/`, `/projects/`, `/30months/`; the English counterparts are
  `/en/`, `/en/projects/`, `/en/fiction/`. `src/lib/i18n.ts` owns their mapping and
  translated copy. Shared page components render actual localized HTML.
- The header's KO/EN switch always targets the same section or essay. Each essay
  retains both existing language URLs. Navigation, logo, and essay backlinks retain
  the current locale. Do not infer a different locale and redirect a shared URL.
- Keep reciprocal hreflang, localized metadata, and self-canonical URLs on every
  language pair. Navigation category names and the organization slogan stay English.
- English Fiction translates the introduction, contents, and reading notes only.
  Clearly say that the novel text is Korean; do not invent English reader routes.
- `/30months/` combines the spoiler-free introduction with the complete contents.
  Publication counts come from approved public JSON, not private authoring files.
- Readers return to `/30months/#contents`; `/30months/#notice` stays stable.
  Do not add an interstitial before an existing reader URL.
- Keep both GA4 and Vercel Analytics. GA's command queue must receive the
  `arguments` object, never a rest-parameter array.
- The default social image uses the real logo. The legacy `og-default.png` is a
  one-pixel placeholder, so do not use it for new metadata.

## Motion

`src/styles/transitions.css` opts both layouts into native cross-document view
transitions. The active language pill moves between KO and EN; content fades and
slides gently while navigation stays anchored. Real document navigation preserves
history, script initialization, and one GA configuration per page. No client-side
router or intercepted clicks are needed. Reduced-motion users get immediate page
changes. Unsupported browsers retain normal working links.

Reference: [Astro view transitions](https://docs.astro.build/en/guides/view-transitions/)
and [native cross-document transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document).

## Verify and release

Run `pnpm verify` to check the private-material boundary, release importer, lint,
production build, and workshop routes/metadata. `pnpm test:workshop` requires a
fresh build. Check that essays appear in the first viewport in both themes and at
desktop/mobile widths. Exercise Essays → Projects → Fiction, the Conn links, both
essay languages, and novel introduction → reader → contents.
Switch KO → EN → KO on every section and an essay, test back/forward, dark theme,
and reduced motion. Confirm actual animation events in the browser, not only CSS.

After a requested production push, wait for Vercel success and verify the actual
`eggp.dev` pages and GA `page_view` requests. A successful build or deployment badge
alone is not production verification.
