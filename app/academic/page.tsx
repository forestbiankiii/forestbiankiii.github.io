"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import GlassButton from "@/components/GlassButton";
import { markIntroSeen } from "@/components/introVisit";
import { withBasePath } from "@/components/sitePath";

const Lanyard = dynamic(() => import("@/components/Lanyard"), {
  ssr: false,
});

type Lang = "en" | "zh";

type Dict = {
  nav: { back: string };
  badge: { label: string };
  updated: string;
  header: {
    major: string;
    school: string;
    university: string;
    education: string;
  };
  overview: {
    eyebrow: string;
    title: string;
    body: string;
  };
  lanyard: { open: string; close: string };
  profileLabels: {
    name: string;
    education: string;
    university: string;
    school: string;
    major: string;
    educationEmail: string;
    personalEmail: string;
  };
  sections: {
    interests: { title: string; body: string };
    publications: { title: string; body: string };
    materials: { title: string; body: string };
  };
  lists: {
    publications: string[];
    materials: string[];
  };
  research: {
    intro: string;
    groups: { label: string; caption: string; items: string[] }[];
  };
  awards: {
    eyebrow: string;
    title: string;
    items: {
      award: string;
      competition: string;
      project: string;
      role: string;
      school: string;
      date: string;
      team: string;
      advisor: string;
      linkLabel: string;
    }[];
  };
  experience: {
    eyebrow: string;
    title: string;
    entries: {
      institution: string;
      school: string;
      major: string;
      degree: string;
      period: string;
      current: boolean;
    }[];
  };
  contact: { eyebrow: string; title: string };
  langButton: { toZh: string; toEn: string };
};

const DICT: Record<Lang, Dict> = {
  en: {
    nav: { back: "Back to Portfolio" },
    badge: { label: "Academic Profile" },
    updated: "Last updated: 2026",
    header: {
      major: "Materials Science and Engineering",
      school: "School of Intelligent Science and Technology",
      university: "University of Shanghai for Science and Technology",
      education: "Undergraduate · since Sep. 2023",
    },
    overview: {
      eyebrow: "Overview",
      title: "Nanophotonics, optical computing, and quantum materials.",
      body:
        "I am an undergraduate in Materials Science and Engineering at the University of Shanghai for Science and Technology, working on light–matter interaction at the nanoscale. This page collects my research interests, prior work, publications, and academic materials.",
    },
    lanyard: {
      open: "Open card",
      close: "Close card",
    },
    profileLabels: {
      name: "Name",
      education: "Education",
      university: "University",
      school: "School",
      major: "Major",
      educationEmail: "Education Email",
      personalEmail: "Personal Email",
    },
    sections: {
      interests: {
        title: "Research Interests",
        body:
          "My research centers on nanophotonics and the light–matter interactions that enable next-generation optical devices — from femtosecond laser fabrication to intelligent metasurfaces.",
      },
      publications: {
        title: "Publications",
        body:
          "Formal publications, preprints, technical reports, and project manuscripts will be listed here with venue information, coauthors, links, and citation metadata.",
      },
      materials: {
        title: "Academic Materials",
        body:
          "This section can host a curriculum vitae, research statement, teaching materials, datasets, slides, and reproducibility resources.",
      },
    },
    lists: {
      publications: ["Publication list pending update"],
      materials: [
        "Curriculum vitae pending",
        "Research statement pending",
        "Project resources pending",
      ],
    },
    research: {
      intro:
        "My work spans nanophotonics, optical computing, and quantum materials. The following maps my current focus, prior experience, and the broader topics I am actively exploring.",
      groups: [
        {
          label: "Current Focus",
          caption: "Primary research directions I am pursuing now.",
          items: [
            "Femtosecond laser processing",
            "Diffractive neural networks",
            "Metasurfaces",
          ],
        },
        {
          label: "Prior Work",
          caption: "Topics I have worked on previously.",
          items: ["Non-Hermitian optics", "Photonic crystals"],
        },
        {
          label: "Broader Interests",
          caption: "Related areas I am broadly interested in.",
          items: [
            "Integrated optics",
            "Other directions in nanophotonics",
            "Quantum materials",
            "Moiré crystals",
          ],
        },
      ],
    },
    experience: {
      eyebrow: "Education & Experience",
      title: "Academic journey and professional affiliations.",
      entries: [
        {
          institution: "University of Shanghai for Science and Technology",
          school: "School of Intelligent Science and Technology",
          major: "Materials Science and Engineering",
          degree: "Undergraduate",
          period: "Sep. 2023 – Present",
          current: true,
        },
      ],
    },
    awards: {
      eyebrow: "Honors & Awards",
      title: "Selected awards and recognitions.",
      items: [
        {
          award: "Grand Prize (特等奖)",
          competition:
            '15th "Challenge Cup" Shanghai College Student Entrepreneurship Plan Competition',
          project:
            "Guangrui Tech — high-dimensional optical neural network chips for ultra-high-throughput optical computing",
          role: "Team member",
          school: "School of Intelligent Science and Technology, USST",
          date: "June 2026 · Shanghai",
          team: "Team: Sun Yinpin, Sun Weijun, Wang Maolin, et al.",
          advisor: "Advisor: Prof. Yu Haoyi",
          linkLabel: "USST coverage",
        },
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Academic correspondence",
    },
    langButton: { toZh: "中文", toEn: "EN" },
  },
  zh: {
    nav: { back: "返回作品集" },
    badge: { label: "学术主页" },
    updated: "最近更新:2026",
    header: {
      major: "材料科学与工程",
      school: "智能科技学院",
      university: "上海理工大学",
      education: "本科生 · 2023年9月至今",
    },
    overview: {
      eyebrow: "简介",
      title: "纳米光子学、光学计算与量子材料。",
      body:
        "我是上海理工大学材料科学与工程专业的本科生,从事纳米尺度下光与物质相互作用的研究。本页面汇集我的研究兴趣、过往工作、发表论文及学术资料。",
    },
    lanyard: {
      open: "打开卡片",
      close: "关闭卡片",
    },
    profileLabels: {
      name: "姓名",
      education: "学历",
      university: "就读院校",
      school: "所在学院",
      major: "专业",
      educationEmail: "教育邮箱",
      personalEmail: "个人邮箱",
    },
    sections: {
      interests: {
        title: "研究兴趣",
        body:
          "我的研究聚焦于纳米光子学,以及支撑下一代光器件的光与物质相互作用 —— 从飞秒激光加工到智能超表面。",
      },
      publications: {
        title: "发表论文",
        body:
          "正式发表的论文、预印本、技术报告及项目手稿将在此列出,包含发表场所、合作者、链接与引用信息。",
      },
      materials: {
        title: "学术资料",
        body:
          "本版块可存放个人简历、研究陈述、教学材料、数据集、讲义及复现资源。",
      },
    },
    lists: {
      publications: ["论文列表待更新"],
      materials: ["个人简历待更新", "研究陈述待更新", "项目资源待更新"],
    },
    research: {
      intro:
        "我的研究横跨纳米光子学、光学计算与量子材料。下方按当前方向、过往经历以及正在广泛探索的领域进行分类。",
      groups: [
        {
          label: "当前方向",
          caption: "目前正在从事的主要研究方向。",
          items: ["飞秒激光加工", "衍射神经网络", "超表面"],
        },
        {
          label: "过往经历",
          caption: "此前曾开展研究的工作。",
          items: ["非厄米光学", "光子晶体"],
        },
        {
          label: "广泛兴趣",
          caption: "感兴趣的相关领域。",
          items: [
            "集成光学",
            "纳米光子学的其他方向",
            "量子材料",
            "摩尔晶体",
          ],
        },
      ],
    },
    experience: {
      eyebrow: "学习与工作经历",
      title: "学术历程与职业隶属。",
      entries: [
        {
          institution: "上海理工大学",
          school: "智能科技学院",
          major: "材料科学与工程",
          degree: "本科",
          period: "2023年9月 – 至今",
          current: true,
        },
      ],
    },
    awards: {
      eyebrow: "荣誉与奖项",
      title: "获奖经历与荣誉。",
      items: [
        {
          award: "特等奖",
          competition: "第十五届“挑战杯”上海市大学生创业计划竞赛",
          project: "光睿科技——面向超高数据通量光计算的高维度光学神经网络芯片",
          role: "团队成员",
          school: "上海理工大学 智能科技学院",
          date: "2026年6月 · 上海",
          team: "团队成员:孙一品、孙渭钧、汪懋林等",
          advisor: "指导教师:蔚浩义",
          linkLabel: "上理工报道",
        },
      ],
    },
    contact: {
      eyebrow: "联系方式",
      title: "学术联系",
    },
    langButton: { toZh: "中文", toEn: "EN" },
  },
};

export default function AcademicPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [lanyardOpen, setLanyardOpen] = useState(false);
  const [lanyardReady, setLanyardReady] = useState(false);
  const [lanyardInstance, setLanyardInstance] = useState(0);
  const t = DICT[lang];

  useEffect(() => {
    markIntroSeen();
  }, []);

  useEffect(() => {
    if (!lanyardOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanyardOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lanyardOpen]);

  const profileItems: [string, string][] = [
    [t.profileLabels.name, "Wang Maolin"],
    [
      t.profileLabels.education,
      lang === "zh"
        ? "本科生 · 2023年9月入学至今"
        : "Undergraduate, since Sep. 2023",
    ],
    [
      t.profileLabels.university,
      lang === "zh"
        ? "上海理工大学"
        : "University of Shanghai for Science and Technology (USST)",
    ],
    [
      t.profileLabels.school,
      lang === "zh"
        ? "智能科技学院"
        : "School of Intelligent Science and Technology",
    ],
    [
      t.profileLabels.major,
      lang === "zh"
        ? "材料科学与工程"
        : "Materials Science and Engineering",
    ],
    [t.profileLabels.educationEmail, "2335060723@st.usst.edu.cn"],
    ["Personal Email", "forestbiankiii@gmail.com"],
  ];

  const sections = [
    {
      title: t.sections.publications.title,
      body: t.sections.publications.body,
      list: t.lists.publications,
    },
    {
      title: t.sections.materials.title,
      body: t.sections.materials.body,
      list: t.lists.materials,
    },
  ];

  return (
    <main className="min-h-screen overflow-x-clip bg-white text-neutral-950">
      <style>{`
        .ruby-name ruby { ruby-position: over; }
        .ruby-name rt {
          font-size: 0.25em;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: #6b7280;
          text-transform: lowercase;
        }
        .academic-lanyard-hanger {
          position: fixed;
          inset: 0;
          z-index: 40;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-18rem);
          transform-origin: top center;
        }
        .academic-lanyard-hanger * {
          pointer-events: none !important;
        }
        .academic-lanyard-drop {
          pointer-events: auto;
          animation: academic-lanyard-drop 760ms cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
        }
        .academic-lanyard-drop * {
          pointer-events: auto !important;
        }
        @keyframes academic-lanyard-drop {
          0% {
            opacity: 0;
            transform: translateY(-18rem);
          }
          72% {
            opacity: 1;
            transform: translateY(0.9rem) scale(1);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .academic-lanyard-drop {
            animation-duration: 1ms;
          }
        }
      `}</style>
      {/* Top bar: card trigger + language switch */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 border-b border-neutral-200/70 bg-white/60 backdrop-blur-md">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
          <Link
            href="/"
            onClick={markIntroSeen}
            className="pointer-events-auto justify-self-start text-xl font-semibold tracking-[0.08em] text-neutral-800 transition-colors hover:text-neutral-950"
          >
            Bian<span className="text-neutral-400">Kiii</span>
          </Link>
          <div className="academic-lanyard-trigger pointer-events-auto relative justify-self-center">
            <button
              type="button"
              onClick={() => {
                if (!lanyardOpen)
                  setLanyardInstance((instance) => instance + 1);
                setLanyardOpen(!lanyardOpen);
              }}
              aria-controls="academic-lanyard-hanger"
              aria-expanded={lanyardOpen}
              className="rounded border border-neutral-950 bg-neutral-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-lime-300 transition-colors hover:bg-neutral-800"
            >
              {lanyardOpen ? t.lanyard.close : t.lanyard.open}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="pointer-events-auto justify-self-end rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:border-neutral-500 hover:text-neutral-950"
          >
            {lang === "en" ? t.langButton.toZh : t.langButton.toEn}
          </button>
        </div>
      </div>

      <div
        id="academic-lanyard-hanger"
        aria-hidden={!lanyardOpen}
        className={`academic-lanyard-hanger ${
          lanyardOpen && lanyardReady ? "academic-lanyard-drop" : ""
        }`}
      >
        <Lanyard
          key={lanyardInstance}
          position={[0, 0, 20]}
          gravity={[0, -40, 0]}
          onReady={() => setLanyardReady(true)}
        />
      </div>

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-14 pt-24 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath("/profile.jpg")}
              alt="Portrait of Wang Maolin"
              className="h-48 w-48 shrink-0 rounded-full border border-neutral-200 object-cover shadow-sm md:h-60 md:w-60"
            />
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 md:text-6xl">
                {lang === "zh" ? (
                  <span className="ruby-name">
                    汪
                    <ruby>
                      懋<rt>mào</rt>
                    </ruby>
                    林
                  </span>
                ) : (
                  "Wang Maolin"
                )}
              </h1>
              <p className="mt-3 text-sm leading-7 text-neutral-600 md:text-base">
                <span className="font-medium text-neutral-800">
                  {t.header.major}
                </span>
                <br />
                {t.header.school}
                <br />
                {t.header.university}
                <br />
                <span className="text-neutral-500">{t.header.education}</span>
              </p>
            </div>
          </div>
          <div className="border-l border-neutral-300 pl-6 text-sm leading-6 text-neutral-600">
            <p className="font-semibold uppercase tracking-[0.2em] text-neutral-950">
              {t.badge.label}
            </p>
            <p className="mt-2">{t.updated}</p>
          </div>
        </div>
      </header>

      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
              {t.overview.eyebrow}
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 md:text-3xl">
              {t.overview.title}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-700">
              {t.overview.body}
            </p>
          </div>

          <dl className="divide-y divide-neutral-200 border-y border-neutral-200">
            {profileItems.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[8rem_1fr] gap-4 py-4 text-sm"
              >
                <dt className="font-semibold text-neutral-950">{label}</dt>
                <dd className="text-neutral-700">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Education & Experience */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {t.experience.eyebrow}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 md:text-3xl">
            {t.experience.title}
          </h2>

          <div className="mt-8 space-y-0">
            {t.experience.entries.map((entry, i) => (
              <div
                key={i}
                className="relative grid gap-x-6 gap-y-1 border-l-2 border-neutral-200 pl-8 pb-10 pt-1 text-sm last:pb-0"
              >
                {/* Timeline dot */}
                <div
                  className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-neutral-950 ${
                    entry.current ? "bg-neutral-950" : "bg-white"
                  }`}
                />
                <p className="font-semibold text-neutral-950">{entry.institution}</p>
                <p className="text-neutral-600">
                  {entry.school} · {entry.major}
                </p>
                <p className="text-neutral-500">
                  {entry.degree}
                  {entry.current && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                      {lang === "zh" ? "在读" : "Current"}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-neutral-500">{entry.period}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research interests */}
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {t.sections.interests.title}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 md:text-3xl">
            {t.sections.interests.body}
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-700">
            {t.research.intro}
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {t.research.groups.map((group) => (
              <article
                key={group.label}
                className="border border-neutral-200 bg-white p-6"
              >
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950">
                  {group.label}
                </h3>
                <p className="mt-2 text-xs leading-6 text-neutral-500">
                  {group.caption}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-800"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Honors & awards */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {t.awards.eyebrow}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 md:text-3xl">
            {t.awards.title}
          </h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath("/awards-challenge-cup.jpg")}
              alt={t.awards.items[0].competition}
              className="h-full max-h-80 w-full rounded border border-neutral-200 object-cover"
            />
            <div className="border border-neutral-200 bg-white p-6">
              {t.awards.items.map((item) => (
                <div key={item.competition} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-block rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                      {item.award}
                    </span>
                    <span className="text-xs text-neutral-500">{item.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold leading-7 text-neutral-950">
                    {item.competition}
                  </h3>
                  <p className="text-sm leading-7 text-neutral-700">
                    {item.project}
                  </p>
                  <dl className="mt-2 grid grid-cols-[5rem_1fr] gap-x-4 gap-y-2 text-sm">
                    <dt className="text-neutral-500">
                      {lang === "zh" ? "团队" : "Team"}
                    </dt>
                    <dd className="text-neutral-800">
                      {item.team}
                      <br />
                      <span className="text-neutral-600">{item.advisor}</span>
                    </dd>
                    <dt className="text-neutral-500">
                      {lang === "zh" ? "单位" : "Affiliation"}
                    </dt>
                    <dd className="text-neutral-700">{item.school}</dd>
                  </dl>
                  <a
                    href="https://www.usst.edu.cn/_t2/2026/0608/c34a69003/page.psp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-medium text-neutral-950 underline underline-offset-4 transition-colors hover:text-neutral-600"
                  >
                    {item.linkLabel}
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Publications + Materials */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="border border-neutral-200 bg-white p-6"
          >
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              {section.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-700">
              {section.body}
            </p>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-neutral-800">
              {section.list.map((item) => (
                <li key={item} className="border-t border-neutral-200 pt-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
              {t.contact.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
              {t.contact.title}
            </h2>
          </div>
          <div className="flex flex-col gap-3 text-sm md:items-end">
            <GlassButton
              href="mailto:2335060723@st.usst.edu.cn"
              className="px-5 py-3 text-neutral-950 transition-colors hover:text-neutral-600"
            >
              2335060723@st.usst.edu.cn
            </GlassButton>
            <a
              href="mailto:forestbiankiii@gmail.com"
              className="text-neutral-600 underline underline-offset-4 transition-colors hover:text-neutral-950"
            >
              forestbiankiii@gmail.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
