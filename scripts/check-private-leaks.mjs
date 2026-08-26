import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const NULL_SHA = /^0+$/;
const PRIVATE_PATH = /^(?:\.authoring-staging|30months-authoring|canon|manuscript|drafts)(?:\/|$)|(?:^|\/)(?:30months_(?:command_continuity_annex|corridor_atlas|narrative_substrate|social_transition_substrate|storyboard|worldmodel|manuscript_format|web_publishing_guide)[^/]*\.md)$/i;
const OPAQUE_BUNDLE = /\.(?:7z|rar|zip|tar|tar\.gz|tgz|gz|bz2|xz|docx|odt)$/i;
const PRIVATE_SHA256 = new Set([
  'd29d0db5708e857222551e45e91bcc5185ceb5021a615e271e9ed44e75892092',
  'd60c11e2af6a7630f3090d60d91148678cb2dd52d5f2b379d7de06831ab9ca7b',
  '68ecea156295609425dbfc81c54ac78fd54505af6297929aa5c1c82befe628b8',
  'd3fbd8fb1889286d57a2797c464e277788c15fe472c367887740433de4fc6d20',
  'd0464a1e2fea23baa3f5695917d6b3f81e0eedbe702c33b45a96efaeb708ba03',
  'ae665aff06c396fe46029ba27c9b46c115efd53a3a4ab289103ed3ae49a6171e',
  'cc937613330bbf293e10652ccd3af2ef5a2d4aa47f40f777e7ed2e05774ed2e2',
  '0fdb350a14961a4298f55966a7684797a1c779a93e8b4e8b0ea2e64916e65f91',
]);
const ENCODED_SIGNATURE_PARTS = [
  ['44CKMzDqsJzsm5QgLyBUaGUgTGFzdCBEZXBlbmRlbmN544CLIOyEuOqzhOq0gCD', 'rqqjrjbggdjMuMA=='],
  ['44CKMzDqsJzsm5QgLyBUaGUgTGFzdCBEZXBlbmRlbmN544CLIOKAlCDshJzsgqwgc3Vi', 'c3RyYXRlIHYxLjE='],
  ['44CKMzDqsJzsm5QgLyBUaGUgTGFzdCBEZXBlbmRlbmN544CLIOKAlCDsgqztmowg7KCE7J20IHN1', 'YnN0cmF0ZSB2Mi4x'],
  ['44CKMzDqsJzsm5QgLyBUaGUgTGFzdCBEZXBlbmRlbmN544CLIOKAlCDtmozrnpEgQXRs', 'YXMgdjEuMA=='],
  ['44CKMzDqsJzsm5QgLyBUaGUgTGFzdCBEZXBlbmRlbmN544CLIOKAlCBDb21tYW5kIENvbnRp', 'bnVpdHkgQW5uZXg='],
  ['44CKMzDqsJzsm5QgLyBUaGUgTGFzdCBEZXBlbmRlbmN544CLIOKAlCDsm5Dqs6Ag7Y+s', '66e3IOq3nOqyqQ=='],
  ['44CKMzDqsJzsm5QgLyBUaGUgTGFzdCBEZXBlbmRlbmN544CLIOKAlCDsm7kg7Jew7J6sIOq1rO2YhCDqsIDs', 'nbTrk5zrnbzsnbg='],
  ['7ISc7IKsIOq1rOyhsCDsoJXrs7gg4oCUIDMwIFBhcnRzICsg', 'RXBpbG9ndWU='],
];
const ENCODED_SIGNATURES = ENCODED_SIGNATURE_PARTS.map((parts) => parts.join(''));
const PRIVATE_SIGNATURES = ENCODED_SIGNATURES.map((value) => Buffer.from(value, 'base64').toString('utf8'));

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(3);
};

const gitRaw = (args, options = {}) => {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    input: options.input,
    maxBuffer: 128 * 1024 * 1024,
  });
  if (options.allowNoMatch && result.status === 1) return Buffer.alloc(0);
  if (result.status !== 0) {
    fail(`Private-material guard could not run git ${args.join(' ')}:\n${result.stderr.toString('utf8').trim()}`);
  }
  return result.stdout;
};

const git = (args, options = {}) => gitRaw(args, options).toString('utf8');
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const normalize = (value) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, '');
const NORMALIZED_SIGNATURES = PRIVATE_SIGNATURES.map(normalize);

const blobCache = new Map();
const inspectBlob = (hash) => {
  if (blobCache.has(hash)) return blobCache.get(hash);
  const buffer = gitRaw(['cat-file', 'blob', hash]);
  const exactHash = PRIVATE_SHA256.has(sha256(buffer));
  const raw = buffer.toString('utf8');
  const normalized = normalize(raw);
  const signature = NORMALIZED_SIGNATURES.some((value) => normalized.includes(value));
  const encoded = ENCODED_SIGNATURES.some((value) => raw.includes(value));
  const result = { exactHash, signature, encoded };
  blobCache.set(hash, result);
  return result;
};

const parseTreeEntries = (buffer) =>
  buffer
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const tab = entry.indexOf('\t');
      const header = entry.slice(0, tab).split(/\s+/);
      const hasType = ['blob', 'tree', 'commit', 'tag'].includes(header[1]);
      return {
        mode: header[0],
        type: hasType ? header[1] : 'blob',
        hash: hasType ? header[2] : header[1],
        path: entry.slice(tab + 1),
      };
    });

const inspectEntries = (scope, entries) => {
  const violations = [];
  for (const entry of entries) {
    if (PRIVATE_PATH.test(entry.path)) violations.push(`forbidden path: ${entry.path}`);
    if (OPAQUE_BUNDLE.test(entry.path)) violations.push(`opaque archive/document bundle: ${entry.path}`);
    if (entry.type !== 'blob' && !/^100/.test(entry.mode)) continue;
    const finding = inspectBlob(entry.hash);
    if (finding.exactHash) violations.push(`exact private source hash: ${entry.path}`);
    if (finding.signature) violations.push(`private source signature: ${entry.path}`);
    if (finding.encoded) violations.push(`base64 private source signature: ${entry.path}`);
  }
  if (violations.length === 0) return;
  process.stderr.write(`\nBlocked private 30months material in ${scope}.\n`);
  for (const violation of [...new Set(violations)]) process.stderr.write(`  ${violation}\n`);
  process.stderr.write('Keep canon and future manuscripts in the external authoring workspace.\n');
  process.exit(3);
};

const indexEntries = () => parseTreeEntries(gitRaw(['ls-files', '-s', '-z']));
const commitEntries = (commit) => parseTreeEntries(gitRaw(['ls-tree', '-r', '-z', commit]));

const scanTagMessage = (object, ref) => {
  const buffer = gitRaw(['cat-file', '-p', object]);
  const raw = buffer.toString('utf8');
  const normalized = normalize(raw);
  if (
    NORMALIZED_SIGNATURES.some((signature) => normalized.includes(signature)) ||
    ENCODED_SIGNATURES.some((signature) => raw.includes(signature))
  ) {
    fail(`Blocked private 30months material in annotated tag ${ref}.`);
  }
};

const peelCommit = (object, ref) => {
  const type = git(['cat-file', '-t', object]).trim();
  if (type === 'tag') scanTagMessage(object, ref);
  const peeled = spawnSync('git', ['rev-parse', '--verify', `${object}^{commit}`], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  if (peeled.status !== 0) fail(`Ref ${ref} does not resolve to a commit; opaque blob/tree pushes are blocked.`);
  return peeled.stdout.trim();
};

const mode = process.argv[2];
if (mode === '--staged') {
  inspectEntries('the complete staged index', indexEntries());
  process.stdout.write('Private-material guard passed for the complete staged index.\n');
  process.exit(0);
}

if (mode === '--pre-push') {
  const remoteName = process.argv[3];
  if (!remoteName) fail('Private-material guard did not receive a remote name.');
  const updates = readFileSync(0, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const commits = new Set();

  for (const update of updates) {
    const [localRef, localSha, , remoteSha] = update.split(/\s+/);
    if (!localSha || NULL_SHA.test(localSha)) continue;
    const localCommit = peelCommit(localSha, localRef);
    let args;
    if (NULL_SHA.test(remoteSha)) {
      args = ['rev-list', localCommit, '--not', `--remotes=${remoteName}`];
    } else {
      const remoteCommit = peelCommit(remoteSha, 'remote ref');
      args = ['rev-list', `${remoteCommit}..${localCommit}`];
    }
    for (const commit of git(args).split(/\r?\n/).filter(Boolean)) commits.add(commit);
  }

  for (const commit of commits) inspectEntries(`commit ${commit}`, commitEntries(commit));
  process.stdout.write(`Private-material guard passed for ${commits.size} outgoing commit(s).\n`);
  process.exit(0);
}

fail('Usage: check-private-leaks.mjs --staged | --pre-push <remote> <url>');
