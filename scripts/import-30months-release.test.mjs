import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { RETAINED_MEDIA, assertRetainedMedia } from "../src/lib/thirty-months/retained-media.mjs";

const SCRIPT = fileURLToPath(
  new URL("./import-30months-release.mjs", import.meta.url),
);
const LOADER = new URL("../src/lib/thirty-months/content.ts", import.meta.url).href;
const RETAINED_ROOT = fileURLToPath(new URL("../public/30months/m/", import.meta.url));
const DOCUMENT = {
  schemaVersion: 1,
  part: 1,
  book: "I",
  period: "synthetic test period",
  range: { from: "0001", to: "0001" },
  items: [
    {
      kind: "record",
      id: "0001",
      type: "PV",
      source: "synthetic public fixture",
      time: "Day 0 00:00",
      preservation: "full",
      media: null,
      blocks: [{ b: "para", text: "Synthetic public sentence." }],
    },
  ],
};

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "blog-30months-import-"));
  const blog = path.join(root, "renamed-public-blog");
  const release = path.join(root, "renamed-approved-export");
  await mkdir(path.join(blog, "public"), { recursive: true });
  await mkdir(path.join(release, "content"), { recursive: true });
  await mkdir(path.join(release, "m"), { recursive: true });
  await writeFile(
    path.join(release, "content", "part-01.json"),
    `${JSON.stringify(DOCUMENT)}\n`,
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, blog, release };
}

function run(blog, release) {
  return spawnSync(process.execPath, [SCRIPT, release], {
    cwd: blog,
    encoding: "utf8",
    timeout: 10_000,
  });
}

function load(blog) {
  return spawnSync(process.execPath, [
    "--experimental-strip-types", "--input-type=module", "-e",
    `const { loadArchiveDocuments } = await import(${JSON.stringify(LOADER)}); await loadArchiveDocuments();`,
  ], { cwd: blog, encoding: "utf8", timeout: 10_000 });
}

async function existingMedia(blog, name, bytes) {
  const directory = path.join(blog, "public", "30months", "m");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  return directory;
}

test("imports a validated approved release independent of folder names", async (t) => {
  const { blog, release } = await fixture(t);
  const result = run(blog, release);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const copied = JSON.parse(
    await readFile(
      path.join(blog, "public", "30months", "content", "part-01.json"),
    ),
  );
  assert.deepEqual(copied, DOCUMENT);
  assert.match(result.stdout, /Imported 1 approved episode/);
});

test("rejects unexpected files before replacing an existing public release", async (t) => {
  const { blog, release } = await fixture(t);
  const existing = path.join(blog, "public", "30months", "content");
  await mkdir(existing, { recursive: true });
  await writeFile(path.join(existing, "marker.txt"), "keep me\n");
  await writeFile(
    path.join(release, "private-notes.md"),
    "must not cross the boundary\n",
  );

  const result = run(blog, release);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must contain only content\/ and m\//);
  assert.equal(
    await readFile(path.join(existing, "marker.txt"), "utf8"),
    "keep me\n",
  );
});

test("rejects symlinked release artifacts", async (t) => {
  const { root, blog, release } = await fixture(t);
  const outside = path.join(root, "outside.json");
  const target = path.join(release, "content", "part-01.json");
  await writeFile(outside, `${JSON.stringify(DOCUMENT)}\n`);
  await rm(target);
  await symlink(outside, target);

  const result = run(blog, release);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /only regular files are allowed/);
});

test("rejects documents whose public media is missing", async (t) => {
  const { blog, release } = await fixture(t);
  const withMedia = structuredClone(DOCUMENT);
  withMedia.items[0].media = [
    {
      type: "image",
      src: "/30months/m/0001.webp",
      alt: "Synthetic test image",
    },
  ];
  await writeFile(
    path.join(release, "content", "part-01.json"),
    `${JSON.stringify(withMedia)}\n`,
  );

  const result = run(blog, release);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /referenced media is missing/);
});

test("rejects unexpected metadata hidden inside a public block", async (t) => {
  const { blog, release } = await fixture(t);
  const withPrivateMetadata = structuredClone(DOCUMENT);
  withPrivateMetadata.items[0].blocks[0].privateDraftNote =
    "must not cross the boundary";
  await writeFile(
    path.join(release, "content", "part-01.json"),
    `${JSON.stringify(withPrivateMetadata)}\n`,
  );

  const result = run(blog, release);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unexpected property privateDraftNote/);
});

test("retains only the nine byte-pinned published images across repeated imports and builds", async (t) => {
  const { blog, release } = await fixture(t);
  assert.equal(Object.keys(RETAINED_MEDIA).length, 9);
  for (const name of Object.keys(RETAINED_MEDIA)) {
    const bytes = await readFile(path.join(RETAINED_ROOT, name));
    assertRetainedMedia(name, bytes);
    await existingMedia(blog, name, bytes);
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = run(blog, release);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /preserved 9 hash-pinned published media/);
    for (const name of Object.keys(RETAINED_MEDIA)) {
      assertRetainedMedia(name, await readFile(path.join(blog, "public", "30months", "m", name)));
    }
    const loaded = load(blog);
    assert.equal(loaded.status, 0, `${loaded.stdout}\n${loaded.stderr}`);
  }
});

test("rejects a changed retained image before replacing the existing release", async (t) => {
  const { blog, release } = await fixture(t);
  const first = run(blog, release);
  assert.equal(first.status, 0, first.stderr);
  const file = path.join(blog, "public", "30months", "content", "part-01.json");
  const before = await readFile(file);
  const changed = await readFile(path.join(RETAINED_ROOT, "0401.jpg"));
  changed[changed.length - 3] ^= 1;
  await existingMedia(blog, "0401.jpg", changed);

  const imported = run(blog, release);
  assert.notEqual(imported.status, 0);
  assert.match(imported.stderr, /retained media SHA-256 mismatch/);
  assert.deepEqual(await readFile(file), before);
  const loaded = load(blog);
  assert.notEqual(loaded.status, 0);
  assert.match(loaded.stderr, /retained media SHA-256 mismatch/);
});

test("rejects unlisted unreferenced images in both the release and public loader", async (t) => {
  const { blog, release } = await fixture(t);
  const first = run(blog, release);
  assert.equal(first.status, 0, first.stderr);
  const bytes = await readFile(path.join(RETAINED_ROOT, "0401.jpg"));
  await existingMedia(blog, "9999.jpg", bytes);
  const loaded = load(blog);
  assert.notEqual(loaded.status, 0);
  assert.match(loaded.stderr, /unreferenced media: 9999.jpg/);
  await writeFile(path.join(release, "m", "9999.jpg"), bytes);
  const imported = run(blog, release);
  assert.notEqual(imported.status, 0);
  assert.match(imported.stderr, /unreferenced media is not allowed/);
});

test("rejects symlinked retained media instead of following or copying it", async (t) => {
  const { root, blog, release } = await fixture(t);
  const first = run(blog, release);
  assert.equal(first.status, 0, first.stderr);
  const outside = path.join(root, "outside.jpg");
  await writeFile(outside, await readFile(path.join(RETAINED_ROOT, "0401.jpg")));
  await symlink(outside, path.join(blog, "public", "30months", "m", "0401.jpg"));
  const imported = run(blog, release);
  assert.notEqual(imported.status, 0);
  assert.match(imported.stderr, /only regular files are allowed/);
  const loaded = load(blog);
  assert.notEqual(loaded.status, 0);
  assert.match(loaded.stderr, /invalid entry: 0401.jpg/);
});

test("does not allow a retained filename to bypass the release media-reference boundary", async (t) => {
  const { blog, release } = await fixture(t);
  await writeFile(path.join(release, "m", "0401.jpg"), await readFile(path.join(RETAINED_ROOT, "0401.jpg")));
  const result = run(blog, release);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unreferenced media is not allowed/);
});
