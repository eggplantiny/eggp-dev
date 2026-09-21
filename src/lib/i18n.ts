export type Locale = "ko" | "en";
export type Section = "essays" | "projects" | "fiction";

export const sectionPaths = {
  ko: { essays: "/", projects: "/projects/", fiction: "/30months/" },
  en: { essays: "/en/", projects: "/en/projects/", fiction: "/en/fiction/" },
} as const;

export const asLocale = (lang: string): Locale => (lang === "ko" ? "ko" : "en");
export const sectionAlternates = (section: Section) =>
  (["ko", "en"] as const).map((lang) => ({
    lang,
    href: sectionPaths[lang][section],
    default: lang === "ko",
  }));

export const copy = {
  ko: {
    essays: {
      metaTitle: "Essays — AI, 소프트웨어, 창작에 관한 글",
      description:
        "AI, 소프트웨어, 창작에 관한 eggplantiny의 에세이. 만들고 쓰며 남긴 생각을 한국어와 영어로 읽을 수 있습니다.",
      intro: "AI, 소프트웨어, 창작에 관해 쓰고 생각합니다.",
      empty: "아직 공개된 글이 없습니다.",
    },
    projects: {
      metaTitle: "Projects — 만들고 싶은 도구들",
      description:
        "eggplantiny가 만들고 공개하는 개인 프로젝트. AI 에이전트와 함께 쓰며 제어권을 유지하는 터미널 Conn을 만나보세요.",
      intro: "쓰고 싶은 도구를 만들고, 함께 쓸 수 있도록 공개합니다.",
      conn: "AI 에이전트와 함께 쓰는 터미널. 같은 화면에서 일하고, 제어권은 내 손에.",
      detail:
        "에이전트가 작업하는 동안 명령을 확인하고, 필요할 때 직접 이어서 작업할 수 있습니다.",
      cta: "Conn 알아보기",
      demo: "Conn 소개와 사용 데모 보기",
      image: "Codex CLI와 Conn이 같은 작업을 이어가는 실제 터미널 화면",
      caption: "Codex CLI + Conn · 실제 협업 화면",
      url: "https://conn.eggp.dev/ko/",
    },
    fiction: {
      title: "30개월",
      hook: ["이야기는 끝났다.", "기록은 남았다."],
      description:
        "어떤 재난 이후의 시간을, 남겨진 기록으로 따라가는 소설. 방송, 공고문, 게시판, 장부와 인터뷰 사이에서 독자가 이야기를 이어 붙입니다.",
      complete: "완결",
      ongoing: "연재",
      preview: "개발용 미리보기",
      language: "한국어",
      start: "처음부터 읽기",
      contentsLink: "목차 보기",
      contents: "목차",
      empty: "아직 공개된 기록이 없습니다.",
      previewNote:
        "개발 서버에서는 레이아웃 검수를 위한 합성 자료를 표시합니다.",
      making: "이 소설을 만든 과정이 궁금하다면",
      essay: "소설을 컴파일하다",
      notice: "일러두기",
      guideIntro: "이 보존본의 자료는 다음 원칙으로 배열한다.",
      rules: [
        "자료는 사건 시점 순으로 배열한다.",
        "같은 시점 안에서는 자료 유형, 원문 시각, 보존 번호 순으로 배열한다.",
        "인터뷰는 증언이 가리키는 시점에 배열한다. 여러 시점에 걸친 증언은 기록 시점에 배열한다.",
        "지연 수신 자료는 수집 시점에 배열한다. 기록 시점은 머리말에만 남긴다.",
      ],
      numbering:
        "보존 번호는 위 배열에 따라 부여한 일련번호다. 수집 순서, 중요도, 인물, 자료 유형과 무관하다.",
      pseudonyms:
        "웹·대화 자료의 작성자 표기는 수집 시 자료별 치환 가명으로 대체한 것이다. 자료가 다르면 같은 가명이라도 같은 사람을 뜻하지 않는다.",
      back: "← eggp. 작업실로",
    },
  },
  en: {
    essays: {
      metaTitle: "Essays — On AI, software, and making things",
      description:
        "Essays by eggplantiny on AI, software, and creative work. Thoughts from building and writing, available in English and Korean.",
      intro: "Thinking and writing about AI, software, and making things.",
      empty: "No essays published yet.",
    },
    projects: {
      metaTitle: "Projects — Tools I want to use",
      description:
        "Independent, open-source projects by eggplantiny. Meet Conn: a terminal you share with AI agents, while staying in control.",
      intro: "I build tools I want to use, and share them so others can too.",
      conn: "A terminal you share with AI agents. One workspace, with you in control.",
      detail:
        "See the commands as your agent works, and take over whenever you need to.",
      cta: "Explore Conn",
      demo: "Explore Conn and watch the demo",
      image:
        "A real terminal session where Codex CLI and Conn hand control back and forth",
      caption: "Codex CLI + Conn · A real shared session",
      url: "https://conn.eggp.dev/",
    },
    fiction: {
      title: "30 Months",
      hook: ["The story is over.", "The records remain."],
      description:
        "A novel pieced together from the records left after a disaster. Broadcasts, notices, forum posts, ledgers, and interviews leave the reader to connect the story.",
      complete: "Complete",
      ongoing: "In progress",
      preview: "Development preview",
      language: "Novel text in Korean",
      start: "Read in Korean",
      contentsLink: "Browse contents",
      contents: "Contents",
      empty: "No records published yet.",
      previewNote:
        "The development preview uses synthetic records to test the reading layout.",
      making: "How this novel was made",
      essay: "Compiling a Novel",
      notice: "Reading notes",
      guideIntro: "The records in this archive are arranged as follows.",
      rules: [
        "Records follow the time of the events they describe.",
        "Records at the same time are ordered by type, original timestamp, and archive number.",
        "Interviews are placed at the time described in the testimony. Those spanning several periods use their recording time.",
        "Delayed records are placed at the time they were collected. Their original timestamp appears only in the heading.",
      ],
      numbering:
        "Archive numbers follow this arrangement. They do not indicate collection order, importance, identity, or record type.",
      pseudonyms:
        "Names in web and conversation records were replaced with record-specific pseudonyms. The same pseudonym in different records does not necessarily refer to the same person.",
      back: "← Back to eggp.",
    },
  },
};
