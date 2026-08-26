import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CHECKER = fileURLToPath(new URL('./check-private-leaks.mjs', import.meta.url));
const ZERO = '0'.repeat(40);
const HEADER_PARTS = [
  '44CKMzDqsJzsm5QgLyBUaGUgTGFzdCBEZXBlbmRlbmN544CLIOyEuOqzhOq0gCD',
  'rqqjrjbggdjMuMA==',
];

const command = (cwd, executable, args, input) =>
  spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    input,
    maxBuffer: 16 * 1024 * 1024,
  });

const git = (cwd, ...args) => {
  const result = command(cwd, 'git', args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

const repository = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'private-guard-'));
  mkdirSync(path.join(root, 'scripts'));
  cpSync(CHECKER, path.join(root, 'scripts', 'check-private-leaks.mjs'));
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.email', 'guard@example.invalid');
  git(root, 'config', 'user.name', 'Guard Test');
  writeFileSync(path.join(root, 'README.md'), '# clean\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'baseline');
  return root;
};

const stagedGuard = (root) => command(root, process.execPath, ['scripts/check-private-leaks.mjs', '--staged']);
const prePushGuard = (root, input) =>
  command(root, process.execPath, ['scripts/check-private-leaks.mjs', '--pre-push', 'origin', 'unused'], input);

test('private guard passes a clean index', () => {
  const root = repository();
  try {
    const result = stagedGuard(root);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('private guard blocks forced staging paths and renamed private signatures', () => {
  const root = repository();
  try {
    const hidden = path.join(root, '.authoring-staging');
    mkdirSync(hidden);
    writeFileSync(path.join(hidden, 'renamed.txt'), 'renamed private material');
    git(root, 'add', '-f', '.authoring-staging/renamed.txt');
    assert.equal(stagedGuard(root).status, 3);

    git(root, 'reset', '--', '.authoring-staging/renamed.txt');
    const encoded = HEADER_PARTS.join('');
    writeFileSync(path.join(root, 'innocent-name.txt'), Buffer.from(encoded, 'base64'));
    git(root, 'add', 'innocent-name.txt');
    assert.equal(stagedGuard(root).status, 3);

    writeFileSync(path.join(root, 'innocent-name.txt'), encoded);
    git(root, 'add', 'innocent-name.txt');
    assert.equal(stagedGuard(root).status, 3);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('pre-push guard scans an add-then-delete outgoing history', () => {
  const root = repository();
  try {
    const hidden = path.join(root, '.authoring-staging');
    mkdirSync(hidden);
    const leak = path.join(hidden, 'leak.txt');
    writeFileSync(leak, 'temporary leak');
    git(root, 'add', '-f', '.authoring-staging/leak.txt');
    git(root, 'commit', '-m', 'add leak');
    unlinkSync(leak);
    git(root, 'add', '-u');
    git(root, 'commit', '-m', 'delete leak');
    const head = git(root, 'rev-parse', 'HEAD');
    const input = `refs/heads/main ${head} refs/heads/main ${ZERO}\n`;
    assert.equal(prePushGuard(root, input).status, 3);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('pre-push guard fails closed for a tag that points directly at a blob', () => {
  const root = repository();
  try {
    const blob = command(root, 'git', ['hash-object', '-w', '--stdin'], 'clean blob\n');
    assert.equal(blob.status, 0, blob.stderr);
    const input = `refs/tags/blob ${blob.stdout.trim()} refs/tags/blob ${ZERO}\n`;
    assert.equal(prePushGuard(root, input).status, 3);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
