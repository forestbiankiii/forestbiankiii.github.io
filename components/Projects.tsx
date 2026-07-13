"use client";

import { motion } from "framer-motion";
import { projects } from "@/data/projects";
import SpotlightCard from "@/components/SpotlightCard";

export default function Projects() {
  return (
    <section
      id="projects"
      data-model-scene="projects"
      className="scene-section scene-section--model-left"
    >
      <div className="scene-section__layout">
        <div className="scene-section__content">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="scene-section__header"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">
            Portfolio
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-text">
            Featured Projects
          </h2>
          <div className="mt-4 w-16 h-px bg-primary/40" />
        </motion.div>

        {/* Projects Grid */}
        <div className="scene-card-grid scene-card-grid--projects">
          {projects.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <SpotlightCard
                className="scene-card group h-full transition-all duration-500"
              >
                {/* Project number */}
                <span className="absolute top-6 right-6 text-xs text-primary/30">
                  {String(project.id).padStart(2, "0")}
                </span>

                {/* Title */}
                <h3 className="text-xl font-semibold text-text mb-3 group-hover:text-primary transition-colors duration-300">
                  {project.title}
                </h3>

                {/* Description */}
                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full border border-primary/20 text-primary/70 bg-primary/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex gap-4">
                  {project.link && (
                    <a
                      href={project.link}
                      className="text-sm text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                      Live Demo
                    </a>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      className="text-sm text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      Source
                    </a>
                  )}
                </div>
              </SpotlightCard>
            </motion.article>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
