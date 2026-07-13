"use client";

import { motion } from "framer-motion";
import GlassButton from "@/components/GlassButton";
import SpotlightCard from "@/components/SpotlightCard";
import { withBasePath } from "@/components/sitePath";

export default function Hero() {
  return (
    <section
      id="home"
      data-model-scene="home"
      className="scene-section scene-section--model-right"
    >
      <div className="scene-section__layout">
        <div className="scene-section__content">
          <SpotlightCard className="scene-card scene-card--hero">
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-5 text-sm uppercase tracking-[0.3em] text-primary"
            >
              Welcome to my quantum space
            </motion.p>

            {/* Name */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-5 text-4xl font-bold tracking-tight md:text-6xl xl:text-7xl"
            >
              <span className="text-text">Forest</span>{" "}
              <span className="text-name-secondary">BianKiii</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-9 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg"
            >
              Creative Developer & Digital Explorer.
              <br />
              Building the future, one quantum leap at a time.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col items-start gap-4 sm:flex-row"
            >
              <GlassButton
                href="#projects"
                className="px-8 py-3 text-sm uppercase tracking-wider text-primary"
              >
                View My Work
              </GlassButton>
              <GlassButton
                href={withBasePath("/academic")}
                className="px-8 py-3 text-sm uppercase tracking-wider text-primary"
              >
                Academic Homepage
              </GlassButton>
              <GlassButton
                href={withBasePath("/academic/hu-lab")}
                className="px-8 py-3 text-sm uppercase tracking-wider text-primary"
              >
                Hu Lab 课题组
              </GlassButton>
            </motion.div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
