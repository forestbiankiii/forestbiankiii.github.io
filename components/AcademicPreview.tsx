"use client";

import { motion } from "framer-motion";
import GlassButton from "@/components/GlassButton";
import SpotlightCard from "@/components/SpotlightCard";
import { withBasePath } from "@/components/sitePath";

const academicHighlights = [
  {
    label: "Research",
    title: "Nanophotonics and optical computing",
    body: "Current interests include femtosecond laser processing, diffractive neural networks, metasurfaces, and light–matter interaction at the nanoscale.",
  },
  {
    label: "Profile",
    title: "Materials Science and Engineering",
    body: "Undergraduate at the University of Shanghai for Science and Technology, School of Intelligent Science and Technology.",
  },
];

export default function AcademicPreview() {
  return (
    <section id="academic" className="relative z-10 py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-primary">
            Academic
          </p>
          <h2 className="text-3xl font-bold text-text md:text-4xl">
            Research profile and academic materials.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
            A compact overview of my academic direction. Open the full academic
            homepage for publications, research interests, materials, and contact
            information.
          </p>
          <div className="mt-4 h-px w-16 bg-primary/40" />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {academicHighlights.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <SpotlightCard
                className="group h-full rounded-[28px] p-6 transition-all duration-500"
              >
                <p className="mb-4 text-xs uppercase tracking-[0.25em] text-primary/70">
                  {item.label}
                </p>
                <h3 className="mb-3 text-xl font-semibold text-text transition-colors duration-300 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {item.body}
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10"
        >
          <GlassButton
            href={withBasePath("/academic")}
            className="px-8 py-3 text-sm uppercase tracking-wider text-primary"
          >
            Open Academic Homepage
          </GlassButton>
        </motion.div>
      </div>
    </section>
  );
}
