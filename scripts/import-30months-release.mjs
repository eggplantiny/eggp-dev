#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";

const CONTENT_FILE = /^(part-(0[1-9]|[12]\d|30)|epilogue)\.json$/;
const MEDIA_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i;
const ID = /^\d{4}$/;
const TYPES = new Set(["BR", "AN", "WA", "FR", "KR", "PV", "LG", "DX", "IV"]);
const BLOCKS = new Set([
  "speech",
  "para",
  "cue",
  "silence",
  "post",
  "notice",
  "hand",
  "ledger",
  "editorial",
  "cut",
]);
const EDITORIAL_CODES = new Set([
  "REFERENCED-MISSING",
  "ARCHIVE ABSENCE",
  "SEQUENCE GAP",
  "KNOWN DESTROYED",
  "UNKNOWN",
]);
const BLOCK_KEYS = {
  speech: { allowed: ["b", "who", "text"], required: ["b", "who", "text"] },
  para: { allowed: ["b", "text"], required: ["b", "text"] },
  cue: { allowed: ["b", "text"], required: ["b", "text"] },
  silence: { allowed: ["b", "sec", "note"], required: ["b", "sec"] },
  post: { allowed: ["b", "ts", "text", "who", "reply", "re"], required: ["b", "ts", "text"] },
  notice: { allowed: ["b", "text"], required: ["b", "text"] },
  hand: { allowed: ["b", "text"], required: ["b", "text"] },
  ledger: {
    allowed: ["b", "name", "rows", "note"],
    required: ["b", "name", "rows"],
  },
  editorial: {
    allowed: ["b", "code", "basis"],
    required: ["b", "code", "basis"],
  },
  cut: { allowed: ["b"], required: ["b"] },
};
const ROOT_KEYS = ["schemaVersion", "part", "book", "period", "range", "items"];
const RECORD_KEYS = [
  "kind",
  "id",
  "type",
  "source",
  "time",
  "provenance",
  "attribution",
  "preservation",
  "damage",
  "media",
  "blocks",
  "personas",
];
const COLLAPSE_KEYS = ["kind", "from", "to"];
const BLOG_ROOT = process.cwd();
const PUBLIC_PARENT = path.resolve(BLOG_ROOT, "public");
const TARGET_ROOT = path.join(PUBLIC_PARENT, "30months");
const STAGING_PARENT = path.resolve(BLOG_ROOT, ".authoring-staging");

const fail = (message) => {
  throw new Error(message);
};

const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value) =>
  typeof value === "string" && value.trim().length > 0;
const exactKeys = (value, allowed, at) => {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${at}: unexpected property ${key}`);
  }
};
const requireKeys = (value, required, at) => {
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key))
      fail(`${at}: missing property ${key}`);
  }
};

function assertRegularFile(file, label) {
  const stats = lstatSync(file);
  if (stats.isSymbolicLink() || !stats.isFile())
    fail(`${label}: only regular files are allowed`);
}

function listDirectory(directory, label) {
  const stats = lstatSync(directory);
  if (stats.isSymbolicLink() || !stats.isDirectory())
    fail(`${label}: expected a real directory`);
  return readdirSync(directory, { withFileTypes: true });
}

function validateBlock(block, at) {
  if (!object(block) || !BLOCKS.has(block.b)) fail(`${at}: invalid block`);
  const spec = BLOCK_KEYS[block.b];
  exactKeys(block, spec.allowed, at);
  requireKeys(block, spec.required, at);
  if (
    block.b === "speech" &&
    (!nonempty(block.who) || typeof block.text !== "string")
  ) {
    fail(`${at}: invalid speech block`);
  }
  if (
    ["para", "cue", "notice", "hand"].includes(block.b) &&
    typeof block.text !== "string"
  ) {
    fail(`${at}: invalid text block`);
  }
  if (
    block.b === "silence" &&
    (!Number.isInteger(block.sec) || block.sec < 1)
  ) {
    fail(`${at}: invalid silence block`);
  }
  if (
    block.b === "silence" &&
    "note" in block &&
    typeof block.note !== "string"
  ) {
    fail(`${at}: invalid silence note`);
  }
  if (
    block.b === "post" &&
    (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(block.ts) ||
      typeof block.text !== "string")
  ) {
    fail(`${at}: invalid post block`);
  }
  if (
    block.b === "ledger" &&
    (!nonempty(block.name) || typeof block.rows !== "string")
  ) {
    fail(`${at}: invalid ledger block`);
  }
  if (
    block.b === "ledger" &&
    "note" in block &&
    typeof block.note !== "string"
  ) {
    fail(`${at}: invalid ledger note`);
  }
  if (
    block.b === "editorial" &&
    (!EDITORIAL_CODES.has(block.code) || !nonempty(block.basis))
  ) {
    fail(`${at}: invalid editorial block`);
  }
}

function validateDocument(document, name, referencedMedia) {
  if (!object(document)) fail(`${name}: expected a JSON object`);
  exactKeys(document, ROOT_KEYS, name);
  requireKeys(document, ROOT_KEYS, name);
  if (document.schemaVersion !== 1) fail(`${name}: schemaVersion must be 1`);
  const expectedPart =
    name === "epilogue.json" ? "epilogue" : Number(name.slice(5, 7));
  if (document.part !== expectedPart)
    fail(`${name}: filename and part do not match`);
  if (
    !["I", "II", "III", "IV", "EPILOGUE"].includes(document.book) ||
    !nonempty(document.period)
  ) {
    fail(`${name}: invalid book or period`);
  }
  if (
    !object(document.range) ||
    !ID.test(document.range.from) ||
    !ID.test(document.range.to)
  ) {
    fail(`${name}: invalid accession range`);
  }
  exactKeys(document.range, ["from", "to"], `${name}.range`);
  requireKeys(document.range, ["from", "to"], `${name}.range`);
  const expectedBook =
    expectedPart === "epilogue"
      ? "EPILOGUE"
      : expectedPart <= 12
        ? "I"
        : expectedPart <= 19
          ? "II"
          : expectedPart <= 26
            ? "III"
            : "IV";
  if (document.book !== expectedBook) fail(`${name}: book does not match part`);
  if (!Array.isArray(document.items) || document.items.length === 0)
    fail(`${name}: items must not be empty`);

  let previous = -1;
  for (const [index, item] of document.items.entries()) {
    const at = `${name}.items[${index}]`;
    if (!object(item)) fail(`${at}: expected object`);
    if (item.kind === "collapse") {
      exactKeys(item, COLLAPSE_KEYS, at);
      requireKeys(item, COLLAPSE_KEYS, at);
      if (
        !ID.test(item.from) ||
        !ID.test(item.to) ||
        Number(item.from) >= Number(item.to)
      ) {
        fail(`${at}: invalid collapse range`);
      }
      if (Number(item.from) <= previous)
        fail(`${at}: accession order overlaps or descends`);
      previous = Number(item.to);
      continue;
    }

    exactKeys(item, RECORD_KEYS, at);
    requireKeys(
      item,
      [
        "kind",
        "id",
        "type",
        "source",
        "time",
        "preservation",
        "media",
        "blocks",
      ],
      at,
    );
    if (
      item.kind !== "record" ||
      !ID.test(item.id) ||
      !TYPES.has(item.type) ||
      !nonempty(item.source) ||
      !nonempty(item.time) ||
      !["full", "partial", "lost"].includes(item.preservation) ||
      !Array.isArray(item.blocks)
    ) {
      fail(`${at}: invalid record`);
    }
    if (Number(item.id) <= previous)
      fail(`${at}: accession order overlaps or descends`);
    previous = Number(item.id);
    item.blocks.forEach((block, blockIndex) =>
      validateBlock(block, `${at}.blocks[${blockIndex}]`),
    );

    if (
      "provenance" in item &&
      (!nonempty(item.provenance) || !item.provenance.startsWith("수집 "))
    ) {
      fail(`${at}.provenance: expected a value beginning with '수집 '`);
    }
    if ("attribution" in item) {
      if (
        !object(item.attribution) ||
        Object.keys(item.attribution).length === 0
      ) {
        fail(`${at}.attribution: expected a non-empty object`);
      }
      const attributionKeys = [
        "recorder",
        "subject",
        "interviewer",
        "purpose",
        "testimonyTime",
      ];
      exactKeys(item.attribution, attributionKeys, `${at}.attribution`);
      for (const [key, value] of Object.entries(item.attribution)) {
        if (!nonempty(value))
          fail(`${at}.attribution.${key}: expected non-empty text`);
      }
    }

    const cuts = item.blocks.filter((block) => block.b === "cut").length;
    if (item.preservation === "partial") {
      if (!object(item.damage))
        fail(`${at}.damage: partial record requires damage`);
      exactKeys(item.damage, ["duration", "recovered"], `${at}.damage`);
      requireKeys(item.damage, ["duration", "recovered"], `${at}.damage`);
      if (!nonempty(item.damage.duration) || !nonempty(item.damage.recovered)) {
        fail(`${at}.damage: duration and recovered must be non-empty`);
      }
      if (
        cuts !== 1 ||
        item.blocks.at(-1)?.b !== "cut" ||
        item.blocks.length < 2
      ) {
        fail(`${at}.blocks: partial record requires one terminal cut`);
      }
    } else if (item.preservation === "lost") {
      if ("damage" in item) {
        exactKeys(item.damage, ["duration"], `${at}.damage`);
        requireKeys(item.damage, ["duration"], `${at}.damage`);
        if (!nonempty(item.damage.duration))
          fail(`${at}.damage: duration must be non-empty`);
      }
      if (cuts !== 0)
        fail(`${at}.blocks: only partial records may contain cut`);
    } else {
      if ("damage" in item)
        fail(`${at}.damage: only partial records may have damage`);
      if (cuts !== 0)
        fail(`${at}.blocks: only partial records may contain cut`);
    }
    if (item.preservation === "lost" && item.blocks.length !== 0) {
      fail(`${at}.blocks: lost record must have no blocks`);
    }

    if (item.media !== null) {
      if (!Array.isArray(item.media) || item.media.length === 0) {
        fail(`${at}.media: expected null or a non-empty array`);
      }
      item.media.forEach((entry, mediaIndex) => {
        const mediaAt = `${at}.media[${mediaIndex}]`;
        if (
          !object(entry) ||
          entry.type !== "image" ||
          !/^\/30months\/m\/[^/]+$/.test(entry.src) ||
          !nonempty(entry.alt)
        ) {
          fail(`${mediaAt}: only approved public image references are accepted`);
        }
        exactKeys(entry, ["type", "src", "alt", "caption"], mediaAt);
        requireKeys(entry, ["type", "src", "alt"], mediaAt);
        if ("caption" in entry && !nonempty(entry.caption)) {
          fail(`${mediaAt}.caption: expected non-empty text`);
        }
        referencedMedia.add(path.basename(entry.src));
      });
    }
  }

  const first = document.items[0];
  const last = document.items.at(-1);
  const actualFrom = first.kind === "record" ? first.id : first.from;
  const actualTo = last.kind === "record" ? last.id : last.to;
  if (document.range.from !== actualFrom || document.range.to !== actualTo) {
    fail(`${name}: range must match first and last accession`);
  }
}

function validateSource(sourceRoot) {
  const rootEntries = listDirectory(sourceRoot, "release root");
  const names = rootEntries.map((entry) => entry.name).sort();
  if (names.join(",") !== "content,m")
    fail("release root must contain only content/ and m/");
  for (const entry of rootEntries) {
    if (!entry.isDirectory() || entry.isSymbolicLink())
      fail(`release root/${entry.name}: expected a real directory`);
  }

  const contentRoot = path.join(sourceRoot, "content");
  const mediaRoot = path.join(sourceRoot, "m");
  const contentEntries = listDirectory(contentRoot, "release/content");
  if (contentEntries.length === 0)
    fail("release/content must contain at least one approved JSON document");
  const mediaEntries = listDirectory(mediaRoot, "release/m");
  const referencedMedia = new Set();

  for (const entry of contentEntries) {
    if (!CONTENT_FILE.test(entry.name))
      fail(`release/content/${entry.name}: unexpected file`);
    const file = path.join(contentRoot, entry.name);
    assertRegularFile(file, `release/content/${entry.name}`);
    let document;
    try {
      document = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      fail(`release/content/${entry.name}: invalid JSON (${error.message})`);
    }
    validateDocument(document, entry.name, referencedMedia);
  }

  const actualMedia = new Set();
  for (const entry of mediaEntries) {
    if (!MEDIA_FILE.test(entry.name))
      fail(`release/m/${entry.name}: unexpected file`);
    const file = path.join(mediaRoot, entry.name);
    assertRegularFile(file, `release/m/${entry.name}`);
    if (lstatSync(file).size > 25 * 1024 * 1024)
      fail(`release/m/${entry.name}: file exceeds 25 MiB`);
    actualMedia.add(entry.name);
  }
  for (const name of referencedMedia) {
    if (!actualMedia.has(name))
      fail(`release/m/${name}: referenced media is missing`);
  }
  for (const name of actualMedia) {
    if (!referencedMedia.has(name))
      fail(`release/m/${name}: unreferenced media is not allowed`);
  }

  return { contentEntries, mediaEntries, contentRoot, mediaRoot };
}

function importRelease(sourceArg) {
  if (!sourceArg || sourceArg.startsWith("-")) {
    fail("Usage: pnpm import:30months -- /absolute/path/to/release");
  }
  const requested = path.resolve(BLOG_ROOT, sourceArg);
  if (!existsSync(requested))
    fail(`release directory does not exist: ${requested}`);
  const sourceRoot = realpathSync(requested);
  if (
    sourceRoot === TARGET_ROOT ||
    sourceRoot.startsWith(`${TARGET_ROOT}${path.sep}`)
  ) {
    fail("release source cannot be the public target");
  }
  const validated = validateSource(sourceRoot);

  mkdirSync(STAGING_PARENT, { recursive: true });
  mkdirSync(PUBLIC_PARENT, { recursive: true });
  const stageRoot = mkdtempSync(path.join(STAGING_PARENT, "30months-import-"));
  const backupRoot = path.join(
    STAGING_PARENT,
    `30months-backup-${process.pid}-${Date.now()}`,
  );
  let oldMoved = false;
  let newMoved = false;

  try {
    mkdirSync(path.join(stageRoot, "content"));
    mkdirSync(path.join(stageRoot, "m"));
    for (const entry of validated.contentEntries) {
      copyFileSync(
        path.join(validated.contentRoot, entry.name),
        path.join(stageRoot, "content", entry.name),
      );
    }
    for (const entry of validated.mediaEntries) {
      copyFileSync(
        path.join(validated.mediaRoot, entry.name),
        path.join(stageRoot, "m", entry.name),
      );
    }

    if (existsSync(TARGET_ROOT)) {
      renameSync(TARGET_ROOT, backupRoot);
      oldMoved = true;
    }
    renameSync(stageRoot, TARGET_ROOT);
    newMoved = true;
  } catch (error) {
    if (!newMoved && oldMoved && !existsSync(TARGET_ROOT))
      renameSync(backupRoot, TARGET_ROOT);
    throw error;
  } finally {
    if (!newMoved && existsSync(stageRoot))
      rmSync(stageRoot, { recursive: true, force: true });
    if (newMoved && oldMoved && existsSync(backupRoot))
      rmSync(backupRoot, { recursive: true, force: true });
  }

  process.stdout.write(
    `Imported ${validated.contentEntries.length} approved episode(s) and ${validated.mediaEntries.length} media file(s) into public/30months.\n`,
  );
}

try {
  importRelease(process.argv[2]);
} catch (error) {
  process.stderr.write(`30months import blocked: ${error.message}\n`);
  process.exit(3);
}
