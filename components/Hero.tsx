"use client";

import { motion } from "framer-motion";
import GlassButton from "@/components/GlassButton";
import { withBasePath } from "@/components/sitePath";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-primary text-sm tracking-[0.3em] uppercase mb-6"
        >
          Welcome to my quantum space
        </motion.p>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="text-text">Forest</span>{" "}
          <span className="text-name-secondary">BianKiii</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
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
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
        </motion.div>
      </div>

    </section>
  );
}
