import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import type { ArchiveDocument, ArchivePart } from "./types";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public", "30months");
const CONTENT_ROOT = path.join(PUBLIC_ROOT, "content");
const MEDIA_ROOT = path.join(PUBLIC_ROOT, "m");
const EPISODE_FILE = /^(part-(0[1-9]|[12]\d|30)|epilogue)\.json$/;
const MEDIA_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i;
const ID = /^\d{4}$/;
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
const BLOCK_KEYS: Record<string, string[]> = {
  speech: ["b", "who", "text"],
  para: ["b", "text"],
  cue: ["b", "text"],
  silence: ["b", "sec", "note"],
  post: ["b", "ts", "text", "who", "reply"],
  notice: ["b", "text"],
  hand: ["b", "text"],
  ledger: ["b", "name", "rows", "note"],
  editorial: ["b", "code", "basis"],
  cut: ["b"],
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const assertExactKeys = (
  value: Record<string, unknown>,
  allowed: string[],
  at: string,
) => {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key))
      throw new Error(`${at}: unexpected property ${key}`);
  }
};

function assertPublicDocument(
  value: unknown,
  file: string,
): asserts value is ArchiveDocument {
  if (!isObject(value) || value.schemaVersion !== 1) {
    throw new Error(
      `${file}: expected a 30months public document with schemaVersion 1`,
    );
  }
  assertExactKeys(value, ROOT_KEYS, file);
  const part = value.part;
  if (
    !(
      part === "epilogue" ||
      (Number.isInteger(part) && Number(part) >= 1 && Number(part) <= 30)
    )
  ) {
    throw new Error(`${file}: invalid part`);
  }
  if (!["I", "II", "III", "IV", "EPILOGUE"].includes(String(value.book))) {
    throw new Error(`${file}: invalid book`);
  }
  if (typeof value.period !== "string" || !isObject(value.range)) {
    throw new Error(`${file}: invalid period or range`);
  }
  assertExactKeys(value.range, ["from", "to"], `${file}.range`);
  if (!ID.test(String(value.range.from)) || !ID.test(String(value.range.to))) {
    throw new Error(`${file}: range must contain four-digit accession IDs`);
  }
  if (!Array.isArray(value.items) || value.items.length === 0) {
    throw new Error(`${file}: items must be a non-empty array`);
  }
  for (const [index, item] of value.items.entries()) {
    if (!isObject(item))
      throw new Error(`${file}: items[${index}] must be an object`);
    if (item.kind === "collapse") {
      assertExactKeys(item, ["kind", "from", "to"], `${file}.items[${index}]`);
      if (!ID.test(String(item.from)) || !ID.test(String(item.to))) {
        throw new Error(`${file}: invalid collapse at items[${index}]`);
      }
      continue;
    }
    assertExactKeys(item, RECORD_KEYS, `${file}.items[${index}]`);
    if (
      item.kind !== "record" ||
      !ID.test(String(item.id)) ||
      typeof item.source !== "string" ||
      typeof item.time !== "string" ||
      !Array.isArray(item.blocks)
    ) {
      throw new Error(`${file}: invalid record at items[${index}]`);
    }
    for (const [blockIndex, block] of item.blocks.entries()) {
      if (
        !isObject(block) ||
        typeof block.b !== "string" ||
        !BLOCK_KEYS[block.b]
      ) {
        throw new Error(
          `${file}: invalid block at items[${index}].blocks[${blockIndex}]`,
        );
      }
      assertExactKeys(
        block,
        BLOCK_KEYS[block.b],
        `${file}.items[${index}].blocks[${blockIndex}]`,
      );
    }
    if (item.media !== null) {
      if (!isObject(item.media)) {
        throw new Error(`${file}: invalid media at items[${index}]`);
      }
      assertExactKeys(
        item.media,
        ["type", "src", "alt", "caption"],
        `${file}.items[${index}].media`,
      );
      if (
        !["image", "video"].includes(String(item.media.type)) ||
        !/^\/30months\/m\/[^/]+$/.test(String(item.media.src)) ||
        typeof item.media.alt !== "string"
      ) {
        throw new Error(`${file}: invalid media at items[${index}]`);
      }
    }
  }
}

const partOrder = (part: ArchivePart) => (part === "epilogue" ? 31 : part);

export async function loadArchiveDocuments(): Promise<ArchiveDocument[]> {
  let names: string[];
  try {
    names = await readdir(CONTENT_ROOT);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const unexpectedContent = names.filter(
    (name) => name !== ".gitkeep" && !EPISODE_FILE.test(name),
  );
  if (unexpectedContent.length > 0) {
    throw new Error(
      `public/30months/content contains unexpected files: ${unexpectedContent.join(", ")}`,
    );
  }

  const documents = await Promise.all(
    names
      .filter((name) => EPISODE_FILE.test(name))
      .map(async (name) => {
        const file = path.join(CONTENT_ROOT, name);
        const value: unknown = JSON.parse(await readFile(file, "utf8"));
        assertPublicDocument(value, name);
        const expected =
          name === "epilogue.json" ? "epilogue" : Number(name.slice(5, 7));
        if (value.part !== expected)
          throw new Error(`${name}: filename and document part do not match`);
        return value;
      }),
  );

  const sorted = documents.sort(
    (left, right) => partOrder(left.part) - partOrder(right.part),
  );
  const referencedMedia = new Set(
    sorted.flatMap((document) =>
      document.items.flatMap((item) =>
        item.kind === "record" && item.media
          ? [path.basename(item.media.src)]
          : [],
      ),
    ),
  );
  let mediaEntries: Dirent[];
  try {
    mediaEntries = await readdir(MEDIA_ROOT, { withFileTypes: true });
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === "ENOENT" &&
      referencedMedia.size === 0
    )
      return sorted;
    throw error;
  }
  const actualMedia = new Set<string>();
  for (const entry of mediaEntries) {
    if (entry.name === ".gitkeep") continue;
    if (
      !entry.isFile() ||
      entry.isSymbolicLink() ||
      !MEDIA_FILE.test(entry.name)
    ) {
      throw new Error(
        `public/30months/m contains an invalid entry: ${entry.name}`,
      );
    }
    if (!referencedMedia.has(entry.name)) {
      throw new Error(
        `public/30months/m contains unreferenced media: ${entry.name}`,
      );
    }
    actualMedia.add(entry.name);
  }
  for (const name of referencedMedia) {
    if (!actualMedia.has(name))
      throw new Error(`public/30months/m is missing referenced media: ${name}`);
  }
  return sorted;
}
