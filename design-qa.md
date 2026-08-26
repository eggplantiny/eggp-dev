# 30months archive reader design QA

## Evidence

- Source visual truth: `/home/eggp/Downloads/part-01.html`
- User-provided source screenshot: `/tmp/codex-clipboard-33ff96a7-1547-4994-84d9-01fbcb076901.png` (4189 × 3050 px)
- Same-runtime source capture: `/tmp/30months-source-1265x712.jpg`
- Implementation: `http://localhost:4321/30months/part/1/`
- Implementation capture: `/tmp/30months-implementation-1265x712.jpg`
- Side-by-side comparison, source left and implementation right: `/tmp/30months-comparison-2530x712.jpg`
- Browser CSS viewport: 1280 × 720 CSS px
- Source and implementation capture: 1265 × 712 px each
- Device pixel ratio: 2.65625 for both source and implementation
- Density normalization: none; both comparison captures came from the same in-app browser runtime, viewport, and density
- State: desktop, light archival surface, page top, provenance hidden

## Findings

- No actionable P0, P1, or P2 visual differences remain.
- The development preview uses explicitly synthetic public-safe copy and accession IDs, so line wrapping differs where the words differ. This is an expected content constraint, not layout drift. The mock manuscript was not copied into the public repository.
- The `DEV PREVIEW` suffix is intentionally development-only and is absent when approved release JSON exists.

## Required fidelity surfaces

- Fonts and typography: `Gowun Batang`, `IBM Plex Sans KR`, and `IBM Plex Mono` match the source families. Display weight, body weight, size, line height, tracking, and antialiasing produce the same hierarchy and density in the equal-viewport comparison.
- Spacing and layout rhythm: fixed 2.6rem top bar, centered 35rem measure, 1.5rem gutters, part-header offset, record spacing, hairline rules, speaker column, and bottom-right control align with the source.
- Colors and visual tokens: paper, secondary paper, void, ink, metadata, rule, and hairline values are carried over directly from the source CSS. No gradients, radius, or elevation were introduced.
- Image quality and asset fidelity: the source comparison state contains no visible image or icon assets. The implementation does not create placeholders; approved image/video references render as native media elements. Release-media rendering remains a content-dependent test gap.
- Copy and content: persistent labels and navigation copy match the source vocabulary. Preview prose is deliberately synthetic; approved release JSON is the only production content source.

## Full-view comparison evidence

The equal-runtime composite at `/tmp/30months-comparison-2530x712.jpg` shows the same frame, column position and width, header proportions, metadata hierarchy, record header spacing, dialogue alignment, surface color, hairlines, scrollbar placement, and fixed provenance button. The only visible differences are the approved-content substitute, range values, and development label described above.

## Focused region comparison

A separate crop was not needed. The equal-size full-view captures preserve the top bar, part header, hairline, record header, speaker/body grid, and provenance control at readable scale, and the target contains no small icons or imagery requiring an additional detail crop.

## Comparison history

1. First implementation comparison found one P2 interaction-state issue: after scrolling to the end and returning directly to the top, the fixed current-accession label could retain the last observed record because no record intersected the narrow observer band.
2. Fix: added scroll-position synchronization using a 30% viewport reading line while retaining the intersection observer for normal reading flow.
3. Post-fix evidence: direct end scroll reports `0003`; direct return to the top reports `0001`. Provenance toggles from `false`/`수집 경로 보기` to `true`/`수집 경로 숨기기`. The part header link navigates to `/30months/` and back. A fresh browser tab reports no console errors.
4. Revised equal-viewport comparison is saved at `/tmp/30months-comparison-2530x712.jpg`; no visual fix was required after the state correction.

## Open questions

- None for the supplied desktop target.

## Implementation checklist

- [x] Match source typography, palette, measure, spacing, borders, and fixed controls.
- [x] Render all approved public block types and real media.
- [x] Verify provenance toggle, current-accession updates, and part-index navigation.
- [x] Keep preview copy development-only and production content release-only.
- [x] Recompare source and implementation after the P2 state fix.

## Follow-up polish

- No P3 visual polish is required for the supplied target.

final result: passed
