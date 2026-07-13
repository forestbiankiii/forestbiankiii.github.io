"use client";

import { motion } from "framer-motion";
import GlassButton from "@/components/GlassButton";
import SpotlightCard from "@/components/SpotlightCard";

const emailAddresses = [
  "forestbiankiii@gmail.com",
  "2335060723@st.usst.edu.cn",
];

const socialLinks = [
  {
    name: "TikTok",
    url: "https://v.douyin.com/2l1Qo0M6UKQ/",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 4v10.5a4.5 4.5 0 1 1-3-4.24" />
        <path d="M14 4c.7 2.5 2.5 4 5 4" />
      </svg>
    ),
  },
  {
    name: "Bilibili",
    url: "https://space.bilibili.com/384707552",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m8 3 3 3m5-3-3 3" />
        <rect x="3" y="6" width="18" height="15" rx="3" />
        <path d="m10 11 5 3-5 3z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    url: "https://github.com/forestbiankiii",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "Xiaohongshu",
    url: "https://www.xiaohongshu.com/user/profile/64afc4c9000000002b0081bf?xsec_token=YB4YdZ3C0TY3TTD6_WTtD2NPn0PsWbsLDOG25AGHEInf4=&xsec_source=app_share&xhsshare=WeixinSession&appuid=64afc4c9000000002b0081bf&apptime=1783950288&share_id=e3a23e829b984b409df7331cc27ccad2",
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </svg>
    ),
  },
];

export default function Contact() {
  return (
    <section
      id="contact"
      data-model-scene="contact"
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
            Get in Touch
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Let&apos;s Connect
          </h2>
          <p className="max-w-lg leading-relaxed text-text-secondary">
            Interested in collaboration or just want to say hello? Feel free to
            reach out through any of the channels below.
          </p>
          <div className="mt-6 h-px w-16 bg-primary/40" />
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="scene-card-grid scene-card-grid--contact"
        >
          {socialLinks.map((link, index) => (
            <motion.a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="block h-full"
            >
              <SpotlightCard
                className="scene-card scene-card--contact group h-full transition-all duration-300"
              >
                <span className="text-primary/60 group-hover:text-primary transition-colors duration-300">
                  {link.icon}
                </span>
                <span className="text-xs text-text-secondary group-hover:text-primary tracking-wide transition-colors duration-300">
                  {link.name}
                </span>
              </SpotlightCard>
            </motion.a>
          ))}
        </motion.div>

        {/* Email Addresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col items-start gap-3"
        >
          {emailAddresses.map((address) => (
            <GlassButton
              key={address}
              href={`mailto:${address}`}
              className="px-6 py-3 text-sm tracking-wide text-primary"
            >
              {address}
            </GlassButton>
          ))}
        </motion.div>
        </div>
      </div>
    </section>
  );
}
