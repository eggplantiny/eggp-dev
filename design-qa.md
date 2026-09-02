# 30months archive reader design QA

## Base reader evidence

- Source visual truth: `/home/eggp/Downloads/part-01.html`
- User-provided source screenshot: `/tmp/codex-clipboard-33ff96a7-1547-4994-84d9-01fbcb076901.png` (4189 × 3050 px)
- Same-runtime source capture: `/tmp/30months-source-1265x712.jpg`
- Implementation: `http://localhost:4321/30months/part/1/`
- Implementation capture: `/tmp/30months-implementation-1265x712.jpg`
- Side-by-side comparison: `/tmp/30months-comparison-2530x712.jpg`
- Browser CSS viewport: 1280 × 720 CSS px
- State: desktop, light archival surface, page top, provenance hidden

### Base reader findings

- No actionable P0, P1, or P2 visual differences remain.
- The development preview uses explicitly synthetic public-safe copy and accession IDs, so line wrapping differs where the words differ. This is an expected content constraint, not layout drift.
- The `DEV PREVIEW` suffix is intentionally development-only and is absent when approved release JSON exists.
- Typography uses `Gowun Batang`, `IBM Plex Sans KR`, and `IBM Plex Mono`; palette, fixed 35rem measure, hairlines, record spacing, and fixed controls match the source.
- The equal-runtime composite shows the same frame, column position and width, header proportions, metadata hierarchy, record spacing, dialogue alignment, surface color, hairlines, scrollbar placement, and fixed provenance button.
- Interaction regression: scroll-position synchronization keeps the current-accession label correct after direct end/top jumps; provenance and part-index navigation were verified.

## Addendum — 게시판 기록

## Scope

- Route: `http://127.0.0.1:4321/30months/part/6/`
- Target: record `0092`, including its nested reply hierarchy
- Source visual truth: `/home/eggp/.codex/generated_images/01a05d13-f876-75a1-8d56-7c4655181171/exec-36f7bbcd-6073-4596-b98a-808348cdb202.png`
- Source structure reference: Reddit-style connected comment hierarchy, without Reddit branding or interaction controls
- Product override after the visual source: author and timestamp must remain adjacent above the body at every viewport width

## Captures and comparison

- Desktop implementation: `/tmp/product-design-audit-30months/10-desktop-adjacent-meta.jpg`
- Mobile implementation: `/tmp/product-design-audit-30months/09-mobile-adjacent-meta.png`
- Same-input desktop comparison: `/tmp/product-design-audit-30months/11-full-comparison-final.png`
- Source viewport: 1537 × 1023
- Implementation viewport: 1537 × 1023; browser content capture is 1522 × 1013 after scrollbar/chrome exclusion
- Comparison normalization: both sides scaled to 768 × 512 and joined horizontally
- State: record 0092 aligned near the top, no hover/focus/transient UI

## Fidelity review

### Typography

- Reused the site's existing IBM Plex Mono and IBM Plex Sans KR families.
- Author and timestamp form one compact metadata line; the post body uses the archive's sans-serif reading face.
- Timestamp remains visually subordinate without becoming illegible.

### Spacing and hierarchy

- Removed cards, avatars, reply labels, reaction controls, and service-like decoration.
- Preserved a flat archive surface with thin parent-child connectors and increasing indentation.
- Author and timestamp are adjacent on all breakpoints; body copy starts on the next row.
- Root discussions are separated by whitespace rather than a container or an internal rule.
- The content's actual four-level reply chain is preserved even where the source mock simplified it.

### Color and assets

- Reused the existing archive paper, ink, metadata, and rule tokens.
- No new image/icon assets are required for this record type.
- Connector lines are structural rules, not decorative illustrations.

### Responsive behavior

- 1537px desktop: no horizontal overflow; metadata and body keep the same structure as mobile.
- 390px viewport / 375px content width: no horizontal overflow; deepest tested branch remains readable.
- Corpus scan found a maximum reply depth of four, which remains within the mobile text column.

### Interaction and accessibility

- Primary task is uninterrupted reading and scrolling; no false interactive affordances were added.
- DOM order follows the semantic parent-child tree and source chronology.
- Browser console: no errors or warnings during desktop and mobile checks.

## Comparison history

1. Card/avatar prototype rejected: it looked like a generic community product and weakened the archival voice.
2. Flat three-column prototype: hierarchy improved, but desktop metadata read like a table and changed structure at the mobile breakpoint.
3. Final: Reddit-like connective logic retained; author/time moved into one adjacent metadata row at every resolution; body moved below it.

## Verification

- `pnpm verify`: passed
- Private-content guard tests: 4 passed
- 30months import tests: 5 passed
- ESLint: passed
- Astro production build: passed for all 30 parts and epilogue
- `git diff --check`: passed

## Addendum — 녹취 대사 레일

### Comparison target

- Route: `http://127.0.0.1:4321/30months/part/6/`
- Target: record `0093`, with short household speaker labels, scene cues, and silences
- Source visual truth: `/tmp/product-design-audit-30months/12-dialogue-gutter-current.jpg`
- Product direction: widen the spoken-text measure while preserving transcript rhythm; move long descriptive speaker labels above their speech
- Implementation: `/tmp/product-design-audit-30months/17-dialogue-gutter-aligned.jpg`
- Long-label regression capture: `/tmp/product-design-audit-30months/14-long-speaker-v1.jpg`
- CSS viewport: 1637 × 1148; browser content capture: 1622 × 1138
- State: record `0093` top aligned to 670.6px in both source and implementation
- Density normalization: both same-state captures came from the same in-app browser runtime; full comparison was downsampled equally

### Comparison evidence

- Full-view, same-state comparison: `/tmp/product-design-audit-30months/18-dialogue-before-after-aligned.png`
- Focused transcript comparison: `/tmp/product-design-audit-30months/19-dialogue-focused-before-after.png`
- A focused comparison was required because speaker rails, cue alignment, and line measure are too small to judge reliably in the full-page view.

### Findings and iteration history

1. Earlier P2: the fixed 8.25rem speaker rail and 0.9rem gap consumed 146.4px of a 656px record. Spoken text received 509.6px while cues and silences used the full width, making speech appear disproportionately narrow.
2. Fix: short-speaker rail reduced to 4.75rem with a 0.7rem gap. Spoken text now receives 568.8px, a 59.2px increase.
3. Fix: cues and silences now share the spoken-text axis instead of beginning at the record edge.
4. Fix: speaker labels longer than five non-space characters become a compact overline above the speech, so descriptive roles do not widen or wrap inside the rail.
5. Post-fix evidence: record `0093` has a coherent transcript axis; record `0029` preserves full long labels and body width without clipping or horizontal overflow.
6. Browser console: no errors or warnings on both checked routes.

### Required fidelity surfaces

- Typography: existing serif dialogue, sans speaker labels, and mono metadata are retained. Long role labels use the existing mono metadata treatment rather than a new visual language.
- Spacing and rhythm: the spoken measure is wider, speaker labels remain consistently right-aligned, and cues/silences now participate in one transcript column.
- Colors and tokens: only existing ink, metadata, and rule tokens are used.
- Image quality and assets: no image or icon assets occur in this component.
- Copy and content: speech, cues, silence duration, and speaker names are unchanged and untruncated.

### Residual verification scope

- Desktop short- and long-speaker states were browser-captured and inspected.
- The existing mobile breakpoint continues to stack speaker and speech in one column and explicitly removes transcript offsets; no new mobile visual language was introduced.

## Result

### Addendum — 스레드 내부 구분선

- Source visual truth: `/tmp/product-design-audit-30months/20-thread-border-current.jpg`
- Implementation screenshot: `/tmp/product-design-audit-30months/21-thread-border-removed.jpg`
- CSS viewport: 1637 × 1148; both browser captures: 1622 × 1138
- State: record `0092` top aligned to 109.9px in both captures
- Density normalization: same in-app browser runtime and capture settings; both sides downsampled equally for the full comparison
- Full comparison: `/tmp/product-design-audit-30months/22-thread-border-before-after.png`
- Focused comparison: `/tmp/product-design-audit-30months/23-thread-border-focused-before-after.png`
- Earlier P2: record sections and thread divs both used horizontal rules, so the same separator language carried two meanings.
- Fix: removed `.archive-thread` borders. Separate root conversations now use 0.45rem whitespace while reply connectors remain as relationship markers.
- Post-fix evidence: only record-section boundaries remain; nested reply hierarchy remains unambiguous; no horizontal overflow or console warnings.
- Typography, colors, copy, and imagery are unchanged. No new assets were introduced.

### Addendum — 게시판 시간 간격

- Target: Part 6 record `0096`, where one reply chain ends at 22:18 and a new root discussion begins at 22:47.
- Earlier capture: `/tmp/product-design-audit-30months/25-record-0096-spacing-focused.png`
- Desktop implementation: `/tmp/product-design-audit-30months/26-record-0096-gap-desktop.png`
- Mobile implementation: `/tmp/product-design-audit-30months/27-record-0096-gap-mobile.png`
- Fix: reduced routine post and reply padding so one exchange reads as a compact conversational unit.
- Fix: WA records now derive elapsed time from timestamps and insert a real-text `+N분` marker only before a new root discussion when the gap is at least 20 minutes.
- Record `0096` therefore exposes the meaningful 29-minute pause as `+29분`; shorter reply delays remain available in the adjacent timestamps without extra labels.
- Corpus scan: six markers across all 30 parts; small timestamp reversals are ignored instead of being misread as near-24-hour gaps, while genuine midnight crossings remain supported.
- The marker uses existing mono metadata tokens and no border, card, icon, or decorative archive artifact.
- Desktop and 393 × 852 CSS viewport checks show no clipping or horizontal overflow. The marker remains DOM text with an explanatory accessibility label.
- `pnpm verify` and `git diff --check`: passed after implementation.

### Addendum — 소실 표식과 기록 경계

- Target: Part 8 record `0134`, where the recovered transcript ends immediately before an `이후 구간 소실` note and the next accession boundary.
- Earlier capture: `/tmp/product-design-audit-30months/28-record-0134-loss-current.png`
- Desktop implementation: `/tmp/product-design-audit-30months/29-record-0134-loss-after.png`
- Mobile implementation: `/tmp/product-design-audit-30months/30-record-0134-loss-mobile.png`
- Fix: removed the internal top rule from `.archive-void`; the next accession keeps the sole full-width boundary rule.
- Fix: transcript loss notes now align to the spoken-text axis on desktop and return to the record edge in the stacked mobile layout.
- The loss note remains real text with `role="note"`; no symbol, icon, or decorative replacement was introduced.
- `pnpm verify` and `git diff --check`: passed after implementation.

final result: passed
