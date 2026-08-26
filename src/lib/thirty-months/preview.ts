import type { ArchiveDocument } from "./types";

// Public-safe synthetic copy used only by Astro's development server for visual QA.
export const previewArchiveDocument: ArchiveDocument = {
  schemaVersion: 1,
  part: 1,
  book: "I",
  period: "개발 미리보기",
  range: { from: "0001", to: "0003" },
  items: [
    {
      kind: "record",
      id: "0001",
      type: "BR",
      source: "공개 화면 검수용 합성 기록",
      time: "Day 0 21:40",
      provenance: "수집 Day 1 · QA",
      preservation: "full",
      media: null,
      blocks: [
        {
          b: "speech",
          who: "진행자",
          text: "본문의 폭과 행간을 확인하겠습니다.",
        },
        {
          b: "speech",
          who: "기록자",
          text: "현재 화면은 승인 원고가 아닌 개발 환경용 합성 데이터입니다.",
        },
        {
          b: "speech",
          who: "진행자",
          text: "상단에는 회차와 현재 자료 번호가 고정되어 있습니다.",
        },
        {
          b: "speech",
          who: "기록자",
          text: "아래로 이동하면 현재 번호가 읽고 있는 기록에 맞춰 바뀝니다.",
        },
        {
          b: "speech",
          who: "진행자",
          text: "수집 경로는 처음에는 감춰져 있나요.",
        },
        {
          b: "speech",
          who: "기록자",
          text: "오른쪽 아래 버튼으로 필요할 때만 표시할 수 있습니다.",
        },
        { b: "cue", text: "(짧은 정적)" },
        {
          b: "speech",
          who: "진행자",
          text: "문장과 화자 사이의 리듬도 확인하겠습니다.",
        },
        {
          b: "speech",
          who: "기록자",
          text: "작은 화면에서는 화자 칸이 줄어들고 본문은 자연스럽게 감깁니다.",
        },
        { b: "speech", who: "진행자", text: "첫 번째 검수 기록을 마칩니다." },
      ],
    },
    {
      kind: "record",
      id: "0002",
      type: "WA",
      source: "화면 동작 확인 로그",
      time: "Day 0 23:06",
      provenance: "수집 Day 1 · QA",
      preservation: "full",
      media: null,
      blocks: [
        { b: "post", ts: "23:02", text: "고정 헤더 확인" },
        { b: "post", ts: "23:03", text: "현재 자료 번호 변경 확인" },
        { b: "post", ts: "23:04", text: "수집 경로 토글 확인" },
        { b: "silence", sec: 3, note: "화면 전환 대기" },
        { b: "post", ts: "23:08", text: "모바일 줄바꿈 확인" },
      ],
    },
    {
      kind: "record",
      id: "0003",
      type: "AN",
      source: "검수 완료 안내",
      time: "Day 1 09:00",
      provenance: "수집 Day 1 · QA",
      preservation: "full",
      media: null,
      blocks: [
        {
          b: "notice",
          text: "■ 개발 미리보기\n\n이 화면의 내용은 시각 검수만을 위한 합성 문장입니다.\n실제 발행 시 승인된 release JSON으로 교체됩니다.",
        },
        { b: "editorial", code: "UNKNOWN", basis: "개발 환경용 합성 기록" },
      ],
    },
  ],
};
