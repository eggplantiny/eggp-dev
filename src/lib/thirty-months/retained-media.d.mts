export const RETAINED_MEDIA: Readonly<Record<string, string>>;
export function isRetainedMedia(name: string): boolean;
export function assertRetainedMedia(name: string, bytes: Buffer): void;
