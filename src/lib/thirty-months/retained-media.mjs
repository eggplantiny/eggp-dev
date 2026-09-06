import { createHash } from "node:crypto";

// Previously published URLs retained after their manuscript attachments retired.
// These are the exact sanitized binaries in c6fffcc, not a general orphan rule.
export const RETAINED_MEDIA = Object.freeze({
  "0401.jpg": "963d4ed430de32834d8378f487d179e01882521196ba0ad60e664a09605423f7",
  "0430.jpg": "5825bf9d0f7a5f3fbc2aaa76730a3756ed9bc07ef0c43177a345188702bc3eed",
  "0438.jpg": "fd6d6d6c77ec96e1d27869ffdb2c679a3858e3b6175184a01adf143818059029",
  "0448.jpg": "8aa33080b7fb8bf44067514d9ae0776b32fcd50efe8df96788d0250cb3999e64",
  "0458.jpg": "6f4ab805ffca2c5af99e9f429c6ecc189a84b8e154cdeb374d64b37f2cb19be0",
  "0466.jpg": "f4176b2663bb19e9e9f3da1b16bd973b97987ee5d9110365df8703e5d193ef87",
  "0477.jpg": "aa6bfa67706949318f84b5ed45250e0b7e06d8c62a91dc81f84cd1b8aeb0abed",
  "0483.jpg": "4c81811454ef5a2e589de6e74528787adcd660284b54b5557050a4b4307339c1",
  "0499-2.jpg": "0b8d1b210948d5e80226e60fa09b56260cb61d18aa72b0fe747e926336587759",
});

export function isRetainedMedia(name) {
  return Object.hasOwn(RETAINED_MEDIA, name);
}

export function assertRetainedMedia(name, bytes) {
  if (!isRetainedMedia(name))
    throw new Error(`${name}: not an approved retained media file`);
  if (createHash("sha256").update(bytes).digest("hex") !== RETAINED_MEDIA[name])
    throw new Error(`${name}: retained media SHA-256 mismatch`);

  // Hash pinning prevents new payloads; also assert the audited JPEG envelope
  // has no EXIF/XMP, IPTC, or comment segments (the release sanitization rule).
  if (
    bytes.length < 4 || bytes.length > 25 * 1024 * 1024 ||
    bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
    bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9
  ) throw new Error(`${name}: invalid retained JPEG`);
  let cursor = 2;
  while (cursor + 3 < bytes.length) {
    if (bytes[cursor] !== 0xff)
      throw new Error(`${name}: invalid retained JPEG segment`);
    while (bytes[cursor] === 0xff) cursor += 1;
    const marker = bytes[cursor++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    const length = bytes.readUInt16BE(cursor);
    if (length < 2 || cursor + length > bytes.length)
      throw new Error(`${name}: invalid retained JPEG segment length`);
    if ([0xe1, 0xed, 0xfe].includes(marker))
      throw new Error(`${name}: retained JPEG contains embedded metadata`);
    cursor += length;
  }
}
