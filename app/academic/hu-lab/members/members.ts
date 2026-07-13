export type HuLabMember = {
  name: string;
  photo: string | null;
  research: string;
  contact: string;
  bio: string;
};

export type HuLabMemberGroup = {
  label: string;
  english: string;
  members: HuLabMember[];
};

const member = (name: string, photo: string | null = null): HuLabMember => ({
  name,
  photo,
  research: "",
  contact: "",
  bio: "",
});

export const HU_LAB_MEMBER_GROUPS: HuLabMemberGroup[] = [
  {
    label: "硕士研究生 · 研二",
    english: "MASTER'S · YEAR 2",
    members: [member("胡润杰"), member("丁正伟")],
  },
  {
    label: "本科生 · 大四",
    english: "UNDERGRADUATE · SENIOR",
    members: [
      member("汪懋林", "/profile.jpg"),
      member("林晗曦"),
      member("胡海菁"),
      member("李伟"),
    ],
  },
  {
    label: "本科生 · 大三",
    english: "UNDERGRADUATE · JUNIOR",
    members: [member("章楠")],
  },
  {
    label: "本科生 · 大二",
    english: "UNDERGRADUATE · SOPHOMORE",
    members: [member("胡亦琛"), member("徐业翔"), member("郑霖睿")],
  },
];
