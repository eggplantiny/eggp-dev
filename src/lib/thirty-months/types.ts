export type ArchivePart = number | "epilogue";
export type ArchiveBook = "I" | "II" | "III" | "IV" | "EPILOGUE";
export type RecordType =
  | "BR"
  | "AN"
  | "WA"
  | "FR"
  | "KR"
  | "PV"
  | "LG"
  | "DX"
  | "IV";

export type ArchiveBlock =
  | { b: "speech"; who: string; text: string }
  | { b: "para"; text: string }
  | { b: "cue"; text: string }
  | { b: "silence"; sec: number; note?: string }
  | { b: "post"; ts: string; text: string; who?: string; reply?: boolean; re?: string }
  | { b: "notice"; text: string }
  | { b: "hand"; text: string }
  | { b: "ledger"; name: string; rows: string; note?: string }
  | { b: "editorial"; code: string; basis: string }
  | { b: "cut" };

export interface ArchiveMedia {
  type: "image" | "video";
  src: string;
  alt: string;
  caption?: string;
}

export interface ArchiveRecord {
  kind: "record";
  id: string;
  type: RecordType;
  source: string;
  time: string;
  provenance?: string;
  attribution?: Partial<
    Record<
      "recorder" | "subject" | "interviewer" | "purpose" | "testimonyTime",
      string
    >
  >;
  preservation: "full" | "partial" | "lost";
  damage?: { duration: string; recovered: string };
  personas?: Record<string, string>;
  media: ArchiveMedia | null;
  blocks: ArchiveBlock[];
}

export interface ArchiveCollapse {
  kind: "collapse";
  from: string;
  to: string;
}

export interface ArchiveDocument {
  schemaVersion: 1;
  part: ArchivePart;
  book: ArchiveBook;
  period: string;
  range: { from: string; to: string };
  items: Array<ArchiveRecord | ArchiveCollapse>;
}

export const partLabel = (part: ArchivePart) =>
  part === "epilogue" ? "EPILOGUE" : `PART ${part}`;

export const partSlug = (part: ArchivePart) => String(part);
