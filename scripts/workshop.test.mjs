import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

// Exercise the production HTML, not just source templates. Run after pnpm build.
const output = path.resolve("dist/client");
const readPage = (route) =>
  readFile(path.join(output, route, "index.html"), "utf8");
const home = await readPage("");
const novel = await readPage("30months");
const contentFiles = (await readdir("public/30months/content")).filter((file) =>
  /^(part-\d{2}|epilogue)\.json$/.test(file),
);
const published = await Promise.all(
  contentFiles.map(async (file) =>
    JSON.parse(
      await readFile(path.join("public/30months/content", file), "utf8"),
    ),
  ),
);

test("workshop exposes projects, fiction, and both essay languages in server HTML", () => {
  assert.match(home, /a place where i make/);
  for (const href of [
    "https://conn.eggp.dev/ko/",
    "https://github.com/eggp-dev/conn",
    "https://github.com/eggp-dev",
    "/30months/",
    "#projects",
    "#essays",
    "/essays/ko/compiling-a-novel/",
    "/essays/en/compiling-a-novel/",
  ]) {
    assert.ok(
      home.includes(`href="${href}"`),
      `missing workshop destination: ${href}`,
    );
  }
  assert.equal((home.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(home, /<html[^>]+lang="ko"/);
  assert.match(home, /id="main-content"/);
});

test("novel introduction and contents describe exactly the published release", () => {
  assert.equal((novel.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(novel, /<h1>30개월<\/h1>/);
  assert.match(novel, /id="contents"/);
  assert.match(novel, /id="notice"/);
  assert.match(novel, /처음부터 읽기/);
  const schemaText = novel.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
  )?.[1];
  const schema = JSON.parse(schemaText);
  assert.equal(schema["@type"], "CreativeWorkSeries");
  assert.equal(schema.hasPart.length, published.length);
  for (const document of published) {
    const route = `/30months/part/${document.part}/`;
    assert.ok(novel.includes(`href="${route}"`), `missing part: ${route}`);
    assert.ok(
      schema.hasPart.some((part) => part.url === `https://eggp.dev${route}`),
    );
  }
  const complete =
    published.length === 31 &&
    published.some((document) => document.part === "epilogue");
  assert.equal(novel.includes("완결"), complete);
  assert.equal(home.includes("완결"), complete);
});

test("every published reader retains its URL and returns directly to the contents", async () => {
  for (const document of published) {
    const html = await readPage(`30months/part/${document.part}`);
    assert.ok(html.includes('href="/30months/#contents"'));
    assert.ok(html.includes('href="/30months/#notice"'));
    assert.ok(
      html
        .replace(/<!--[\s\S]*?-->/g, "")
        .includes(`자료 ${document.range.from} – ${document.range.to}`),
    );
  }
});

test("GA Arguments queue, Vercel analytics, canonical URLs, and indexability survive", async () => {
  const routes = [
    "",
    "30months",
    ...published.map((document) => `30months/part/${document.part}`),
    "essays/ko/compiling-a-novel",
    "essays/en/compiling-a-novel",
    "essays/ko/superintelligence-in-my-hands",
    "essays/en/superintelligence-in-my-hands",
  ];
  for (const route of routes) {
    const html = await readPage(route);
    assert.match(html, /dataLayer\.push\(arguments\)/, `GA queue: ${route}`);
    assert.ok(!html.includes("function gtag(...args)"));
    assert.match(html, /G-3H720QHEJS/);
    assert.match(html, /_vercel\/insights\/script\.js/);
    assert.ok(
      html.includes(
        `rel="canonical" href="https://eggp.dev/${route ? `${route}/` : ""}"`,
      ),
    );
    assert.ok(!html.includes("noindex"));
  }
});

test("landing links, fragments, and preview image resolve in the built site", async () => {
  for (const [route, html] of [
    ["/", home],
    ["/30months/", novel],
  ]) {
    for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const url = new URL(match[1], `https://eggp.dev${route}`);
      if (url.origin !== "https://eggp.dev") continue;
      const target = await readPage(url.pathname);
      if (url.hash)
        assert.ok(
          target.includes(`id="${url.hash.slice(1)}"`),
          `broken fragment ${url.href}`,
        );
    }
  }
  assert.ok(
    (await stat(path.join(output, "projects/conn-handoff.png"))).size > 1000,
  );
  // Guard against silently reintroducing the old one-pixel social placeholder.
  for (const html of [home, novel]) assert.ok(!html.includes("og-default.png"));
  const icon = await readFile(path.join(output, "icon.png"));
  assert.ok(icon.readUInt32BE(16) >= 200 && icon.readUInt32BE(20) >= 200);
});
