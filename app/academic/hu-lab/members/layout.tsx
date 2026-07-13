import type { Metadata } from "next";
import { withBasePath } from "@/components/sitePath";

const title = "课题组成员 | 胡津铭课题组";
const description =
  "上海理工大学胡津铭课题组成员名录，包括硕士研究生与本科生。";
const socialImage = withBasePath("/hu-lab-og.png");

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
};

export default function HuLabMembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
