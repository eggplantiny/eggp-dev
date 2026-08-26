# 30months publishing

The public blog and the private authoring workspace stay separate. The authoring workspace may have any folder name; the handoff command always receives its approved `release/` directory explicitly.

## One-time blog setup

```bash
pnpm install --frozen-lockfile
pnpm guard:install
```

The pre-push hook rejects private authoring paths, known private-source signatures, and opaque archive/document bundles.

## Publish an approved part

From the private authoring workspace:

```bash
npm run verify
node scripts/release.mjs approve part-01
npm run release:stage
```

Approval is artifact-specific. Changing the manuscript, public schema, release manifest, release toolchain, or referenced media invalidates the approval and blocks staging.

From this public blog repository:

```bash
pnpm import:30months -- /absolute/path/to/authoring/release
pnpm verify
git diff -- public/30months
```

Only these files can cross the boundary:

- `release/content/part-01.json` through `part-30.json`, or `epilogue.json`
- flat, referenced JPEG, PNG, or WebP files under `release/m/`

The importer rejects extra directories and files, Markdown, symlinks, malformed public documents, missing media, orphaned media, and a source path that points back at the blog's public target. It atomically replaces `public/30months/` only after the complete source passes validation.

After review, commit and push the public JSON, media, React reader, and route changes through the normal blog deployment flow. Never copy `manuscript/`, `canon/`, `specs/`, drafts, the HTML mock's embedded `DATA`, or `.authoring-staging/` into this repository.

## Routes

- `/30months/` — published-part index
- `/30months/part/1/` through `/30months/part/30/`
- `/30months/part/epilogue/`

When no approved release has been imported, production exposes only the empty index. The development server supplies a clearly marked synthetic Part 1 fixture for visual and interaction testing; it is never emitted by a production build.
