import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academic Homepage | Wang Maolin",
  description: "Academic profile page for Wang Maolin.",
};

export default function AcademicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
