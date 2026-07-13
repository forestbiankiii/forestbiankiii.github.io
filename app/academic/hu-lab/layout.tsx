import type { Metadata } from "next";
import { withBasePath } from "@/components/sitePath";
import "./hu-lab.css";

const title = "胡津铭课题组 | Jinming Hu Research Group";
const description =
  "上海理工大学胡津铭课题组主页：激光与材料相互作用、可重构光学神经网络、光学与光电子器件，以及在上海理工大学署名发表的完整论文目录。";
const socialImage = withBasePath("/hu-lab-og.png");

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://forestbiankiii.github.io",
  ),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "胡津铭课题组 — Jinming Hu Research Group",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
};

export default function HuLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
