import React, { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  ArchiveBlock,
  ArchiveDocument,
  ArchiveRecord,
} from "../../lib/thirty-months/types";
import { partLabel } from "../../lib/thirty-months/types";

interface Props {
  document: ArchiveDocument;
  indexHref: string;
  previousHref?: string;
  nextHref?: string;
  preview?: boolean;
}

const attributionLabels = {
  recorder: "기록자",
  subject: "대상",
  interviewer: "면담자",
  purpose: "목적",
};

// R-3/R-4에 의해 배치 기준이 되는 두 번째 시계. 헤더에 상시 노출한다 —
// 배열 원칙이 공표되어 있어야 보존 번호와 시점의 어긋남이 읽힌다.
function placementClock(record: ArchiveRecord): string | null {
  const testimony = record.attribution?.testimonyTime;
  if (testimony) return `증언대상 ${testimony}`;
  if (record.type === "DX" && record.provenance) {
    const collected = record.provenance.split("·")[0]?.trim();
    if (collected) return collected;
  }
  return null;
}

const silenceHeight = (seconds: number) =>
  Math.min(Math.max(1.6 + seconds * 0.6, 1.6), 22);

function ArchiveBlockView({
  block,
  personas,
}: {
  block: ArchiveBlock;
  personas?: Record<string, string>;
}) {
  switch (block.b) {
    case "speech":
      return (
        <div className="archive-speech">
          <div className="archive-speaker">{block.who}</div>
          <div>{block.text}</div>
        </div>
      );
    case "para":
      return <p className="archive-paragraph">{block.text}</p>;
    case "cue":
      return <div className="archive-cue">{block.text}</div>;
    case "silence":
      return (
        <div
          className="archive-silence"
          style={{ minHeight: `${silenceHeight(block.sec)}rem` }}
        >
          <div className="archive-silence-label">
            {block.sec}초{block.note ? ` · ${block.note}` : ""}
          </div>
        </div>
      );
    case "post": {
      const author = block.who ? (personas?.[block.who] ?? block.who) : null;
      return (
        <div className={block.reply ? "archive-post archive-post-reply" : "archive-post"}>
          <div className="archive-post-head">
            {author && <span className="archive-post-author">{author}</span>}
            <span className="archive-post-time">{block.ts}</span>
          </div>
          <div className="archive-post-text">{block.text}</div>
        </div>
      );
    }
    case "notice": {
      const lines = block.text.split("\n");
      const hasTitle = lines[0]?.startsWith("■");
      const title = hasTitle ? lines[0].replace(/^■\s*/, "") : null;
      const body = (hasTitle ? lines.slice(1) : lines).join("\n").trim();
      return (
        <div className="archive-notice">
          {title && <div className="archive-notice-title">{title}</div>}
          <div className="archive-notice-body">{body}</div>
        </div>
      );
    }
    case "hand":
      return <div className="archive-hand">{block.text}</div>;
    case "ledger": {
      // Source rows align columns with runs of spaces; fonts must not be
      // trusted to preserve that. Split on 2+ spaces into an invisible table.
      const rows = block.rows
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean)
        .map((row) => row.split(/\s{2,}/).map((cell) => cell.trim()));
      const columnCount = Math.max(1, ...rows.map((cells) => cells.length));
      return (
        <div className="archive-ledger">
          <div className="archive-ledger-name">{block.name}</div>
          <table className="archive-ledger-table">
            <tbody>
              {rows.map((cells, rowIndex) => (
                <tr key={rowIndex}>
                  {cells.map((cell, cellIndex) => {
                    const last = cellIndex === cells.length - 1;
                    return (
                      <td
                        key={cellIndex}
                        colSpan={last ? columnCount - cells.length + 1 : 1}
                        className={last && cells.length > 1 ? "archive-ledger-value" : "archive-ledger-key"}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {block.note && (
            <div className="archive-ledger-note">· {block.note}</div>
          )}
        </div>
      );
    }
    case "editorial":
      return (
        <div className="archive-editorial">
          [{block.code}] {block.basis}
        </div>
      );
    case "cut":
      return <div className="archive-void" aria-label="이후 구간 없음" />;
  }
}

function RecordMedia({ record }: { record: ArchiveRecord }) {
  if (!record.media) return null;
  const media = record.media;
  return (
    <figure className="archive-media">
      {media.type === "image" ? (
        <img src={media.src} alt={media.alt} loading="lazy" />
      ) : (
        <video controls preload="metadata" aria-label={media.alt}>
          <source src={media.src} />
        </video>
      )}
      {media.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  );
}

function RecordProvenance({
  record,
  visible,
}: {
  record: ArchiveRecord;
  visible: boolean;
}) {
  const attribution = record.attribution
    ? Object.entries(record.attribution)
        .filter(([key]) => key in attributionLabels)
        .map(
          ([key, value]) =>
            `${attributionLabels[key as keyof typeof attributionLabels]} ${value}`,
        )
    : [];
  const lines = [record.provenance, ...attribution].filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <div className="archive-provenance" aria-hidden={!visible}>
      {lines.map((line) => (
        <div key={line}>[{line}]</div>
      ))}
    </div>
  );
}

export default function ArchiveReader({
  document,
  indexHref,
  previousHref,
  nextHref,
  preview = false,
}: Props) {
  const label = partLabel(document.part);
  const firstRecord = document.items.find((item) => item.kind === "record");
  const [currentId, setCurrentId] = useState(
    firstRecord?.id ?? document.range.from,
  );
  const showProvenance = false;
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    const records = root.querySelectorAll<HTMLElement>("[data-accession]");
    let scrollFrame = 0;
    const syncCurrentFromScroll = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        let current = records.item(0);
        const readingLine = window.innerHeight * 0.3;
        for (const record of records) {
          if (record.getBoundingClientRect().top <= readingLine)
            current = record;
          else break;
        }
        setCurrentId(current?.dataset.accession ?? document.range.from);
      });
    };
    const accessionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setCurrentId((entry.target as HTMLElement).dataset.accession ?? "");
        }
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    records.forEach((record) => accessionObserver.observe(record));
    window.addEventListener("scroll", syncCurrentFromScroll, { passive: true });
    syncCurrentFromScroll();

    const silences = root.querySelectorAll<HTMLElement>(".archive-silence");
    const silenceObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }
      },
      { threshold: 0.1 },
    );
    silences.forEach((silence) => silenceObserver.observe(silence));

    return () => {
      accessionObserver.disconnect();
      silenceObserver.disconnect();
      window.removeEventListener("scroll", syncCurrentFromScroll);
      cancelAnimationFrame(scrollFrame);
    };
  }, [document]);

  const renderRecordBody = (record: ArchiveRecord): ReactNode => {
    if (record.preservation === "lost") {
      return (
        <div className="archive-lost">
          content unavailable / metadata preserved
        </div>
      );
    }
    // Consecutive posts group into threads: a top-level post plus the reply
    // posts that follow it, the way board and chat clients render exchanges.
    const segments: ReactNode[] = [];
    let thread: ReactNode[] = [];
    const flushThread = (key: string) => {
      if (thread.length === 0) return;
      segments.push(
        <div className="archive-thread" key={key}>
          {thread}
        </div>,
      );
      thread = [];
    };
    record.blocks.forEach((block, index) => {
      const key = `${record.id}-${index}`;
      if (block.b === "post") {
        if (!block.reply) flushThread(`${key}-t`);
        thread.push(
          <ArchiveBlockView block={block} personas={record.personas} key={key} />,
        );
        return;
      }
      flushThread(`${key}-t`);
      segments.push(
        <ArchiveBlockView block={block} personas={record.personas} key={key} />,
      );
    });
    flushThread(`${record.id}-tail`);
    return (
      <div className={`archive-record-body archive-type-${record.type}`}>
        {segments}
      </div>
    );
  };

  return (
    <div
      ref={scope}
      className={
        showProvenance ? "archive-reader has-provenance" : "archive-reader"
      }
    >
      <header className="archive-topbar">
        <a href={indexHref}>{label}</a>
        <b aria-live="polite">{currentId}</b>
      </header>

      <main className="archive-main">
        <header className="archive-parthead">
          <div className="archive-series">30개월 / THE LAST DEPENDENCY</div>
          <h1>{label}</h1>
          <div className="archive-range">
            자료 {document.range.from} – {document.range.to}
            {preview && (
              <span className="archive-preview-label"> · DEV PREVIEW</span>
            )}
          </div>
          <hr />
        </header>

        <div className="archive-items">
          {document.items.map((item) => {
            if (item.kind === "collapse") {
              return (
                <div
                  className="archive-collapse"
                  key={`${item.from}-${item.to}`}
                >
                  <div className="archive-collapse-range">
                    {item.from} – {item.to}
                  </div>
                  <div className="archive-collapse-caption">
                    content unavailable / metadata preserved
                  </div>
                </div>
              );
            }

            return (
              <section
                className="archive-record"
                id={`record-${item.id}`}
                data-accession={item.id}
                key={item.id}
              >
                <header className="archive-record-head">
                  <h2>{item.id}</h2>
                  <div className="archive-source">{item.source}</div>
                  <div className="archive-time">{item.time}</div>
                  {placementClock(item) && (
                    <div className="archive-time-anchor">
                      {placementClock(item)}
                    </div>
                  )}
                  {item.damage && (
                    <div className="archive-damage">
                      {item.damage.duration}
                      <br />
                      파일 손상 · 복구 가능 {item.damage.recovered}
                    </div>
                  )}
                  <RecordProvenance record={item} visible={showProvenance} />
                </header>
                <div
                  className={
                    item.source.includes("대화방")
                      ? "archive-body archive-body-chat"
                      : "archive-body"
                  }
                >
                  {renderRecordBody(item)}
                </div>
                <RecordMedia record={item} />
              </section>
            );
          })}
        </div>

        <footer className="archive-footer">
          <div>
            <span className="archive-end">{label} 끝</span>
            {previousHref ? (
              <a href={previousHref}>← 이전 회차</a>
            ) : (
              <span>← 이전 회차</span>
            )}
          </div>
          <a className="archive-index-link" href={indexHref}>
            목록
          </a>
          {nextHref ? (
            <a href={nextHref}>다음 회차 →</a>
          ) : (
            <span>다음 회차 →</span>
          )}
        </footer>
      </main>

      <a className="archive-notice-link" href="/30months/#notice">
        일러두기
      </a>
    </div>
  );
}
