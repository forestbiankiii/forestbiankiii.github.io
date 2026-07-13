export type HuLabPublicationTopic =
  | "Optical AI"
  | "Laser Patterning"
  | "Photodetection & Materials";

export type HuLabPublication = {
  year: number;
  title: string;
  authors: string;
  venue: string;
  doi: string;
  topic: HuLabPublicationTopic;
  featured: boolean;
};

export const HU_LAB_PUBLICATION_CUTOFF = "2026-07-13";

export const HU_LAB_PUBLICATIONS = [
  {
    year: 2026,
    title:
      "Femtosecond Laser Patterning of Perovskite Quantum Dots for Multifunctional Diffractive Deep Neural Networks",
    authors:
      "Shengting Zhu, Jinming Hu, Haifeng Wu, Yuehua Chen, Yinan Zhang",
    venue: "Laser & Photonics Reviews",
    doi: "10.1002/lpor.71473",
    topic: "Optical AI",
    featured: true,
  },
  {
    year: 2026,
    title:
      "On-Chip Integrated Ultra-Compact Microscale Optical Logic Operations Based on Diffractive Neural Networks",
    authors:
      "Jiping Duan, Jinming Hu, Shengting Zhu, Bo Chen, Min Gu, Yinan Zhang",
    venue: "ACS Photonics, 13(2), 534–541",
    doi: "10.1021/acsphotonics.5c02472",
    topic: "Optical AI",
    featured: true,
  },
  {
    year: 2025,
    title:
      "Femtosecond Laser-Induced Refractive Index Modulation of 2D Perovskites for Phase-Modulated Holographic Neural Networks",
    authors:
      "Ying Lv, Yi Wei, Shengting Zhu, Jinming Hu, Min Gu, Yinan Zhang",
    venue: "ACS Photonics, 12(7), 3618–3625",
    doi: "10.1021/acsphotonics.5c00478",
    topic: "Optical AI",
    featured: true,
  },
  {
    year: 2025,
    title: "Plasmon-enhanced Ag/Sb2Te3 quantum dots fluorescence",
    authors:
      "Zhiyong Yu, Zhenhua Wu, Boyuan Cai, Khay Wai See, Mengjun Li, Jinming Hu, Yinan Zhang, Min Gu, Zengji Yue",
    venue: "Applied Physics Letters, 126(17)",
    doi: "10.1063/5.0256795",
    topic: "Photodetection & Materials",
    featured: false,
  },
  {
    year: 2024,
    title:
      "Ultrathin, Wavelength-Multiplexed and Integrated Holograms and Optical Neural Networks Based on 2D Perovskite Nanofilms",
    authors:
      "Jinming Hu, Shengting Zhu, Ying Lv, Ronghui Guo, Min Gu, Yinan Zhang",
    venue: "Laser & Photonics Reviews, 19(5), 2401458",
    doi: "10.1002/lpor.202401458",
    topic: "Optical AI",
    featured: true,
  },
  {
    year: 2024,
    title:
      "Femtosecond laser direct nanolithography of perovskite hydration for temporally programmable holograms",
    authors: "Yinan Zhang, Shengting Zhu, Jinming Hu, Min Gu",
    venue: "Nature Communications, 15, 6661",
    doi: "10.1038/s41467-024-51148-5",
    topic: "Laser Patterning",
    featured: true,
  },
  {
    year: 2024,
    title:
      "Full-Color and High-Resolution Femtosecond Laser Patterning of Perovskite Quantum Dots in Polyacrylonitrile Matrix",
    authors:
      "Jinming Hu, Ronghui Guo, Shengting Zhu, Rui Yang, Min Gu, Yinan Zhang",
    venue: "Advanced Functional Materials, 34(51), 2407116",
    doi: "10.1002/adfm.202407116",
    topic: "Laser Patterning",
    featured: true,
  },
  {
    year: 2024,
    title:
      "All-photonic artificial synapses based on photochromic perovskites for noncontact neuromorphic visual perception",
    authors:
      "Xing Zhou, Fangzhen Hu, Qing Hou, Jinming Hu, Yimeng Wang, Xi Chen",
    venue: "Communications Materials, 5, 116",
    doi: "10.1038/s43246-024-00553-w",
    topic: "Optical AI",
    featured: true,
  },
  {
    year: 2024,
    title:
      "Reversible Thermochromic Perovskite-Based Dynamic Optical Encryption and Holographic Inference",
    authors: "Jinming Hu, Shengting Zhu, Min Gu, Yinan Zhang",
    venue: "ACS Photonics, 11(5), 2007–2015",
    doi: "10.1021/acsphotonics.4c00137",
    topic: "Optical AI",
    featured: true,
  },
  {
    year: 2024,
    title:
      "One-step Cu-assisted chemical etching at room temperature of inverted pyramid array for high-performance crystalline silicon solar cells",
    authors:
      "Zhiyong Yu, Runze Li, Khay Wai See, Yinan Zhang, Jinming Hu, Peng Ping, Zengji Yue, Shuwang Duo, Boyuan Cai",
    venue: "Optical Materials, 148, 114847",
    doi: "10.1016/j.optmat.2024.114847",
    topic: "Photodetection & Materials",
    featured: false,
  },
  {
    year: 2024,
    title:
      "Self-driven broadband photodetectors on flexible silicon nanowires substrate by forming a heterojunction with reduced graphene oxide",
    authors:
      "Haiyuan Xin, Shengyi Yang, Ying Wang, Muhammad Sulaman, Zhenheng Zhang, Zhen-Hua Ge, Jinming Hu, Shilu Wang, Bingsuo Zou, Libin Tang",
    venue: "Journal of Materials Chemistry C, 12, 2054–2063",
    doi: "10.1039/d3tc04427k",
    topic: "Photodetection & Materials",
    featured: false,
  },
  {
    year: 2024,
    title:
      "Mechanisms and applications of third-order nonlinear optics in 2D lead halide perovskites",
    authors: "Yuan Nie, Jinming Hu, Yinan Zhang, Min Gu, Qiming Zhang",
    venue: "Journal of Nonlinear Optical Physics & Materials, 33(2), 2340014",
    doi: "10.1142/S0218863523400143",
    topic: "Photodetection & Materials",
    featured: false,
  },
  {
    year: 2023,
    title:
      "To improve device performance of self-driven heterojunction photodetectors by inserting a thin layer of silver nanoparticles into the electron-transporting layer",
    authors:
      "Feiyang Sun, Shengyi Yang, Zhenheng Zhang, Muhammad Sulaman, Zhen-Hua Ge, Jinming Hu, Chunyang Li, Ying Wu, Xiaoxuan Liu, Bingsuo Zou",
    venue: "Materials Chemistry and Physics, 307, 128096",
    doi: "10.1016/j.matchemphys.2023.128096",
    topic: "Photodetection & Materials",
    featured: false,
  },
  {
    year: 2023,
    title:
      "High-stability lead-free tin(II)-perovskites by A-site cation engineering and surface-passivating engineering for high-performance hybrid bulk-heterojunction photodetectors",
    authors:
      "Zhenheng Zhang, Shengyi Yang, Muhammad Sulaman, Zhen-Hua Ge, Jinming Hu, Hui Peng, Libin Tang, Bingsuo Zou, Yurong Jiang",
    venue: "Journal of Alloys and Compounds, 953, 170867",
    doi: "10.1016/j.jallcom.2023.170867",
    topic: "Photodetection & Materials",
    featured: false,
  },
  {
    year: 2022,
    title:
      "One-pot synthesis of novel ligand-free tin(II)-based hybrid metal halide perovskite quantum dots with high anti-water stability for solution-processed UVC photodetectors",
    authors:
      "Zhenheng Zhang, Shengyi Yang, Jinming Hu, Hui Peng, Hailong Li, Peiyun Tang, Yurong Jiang, Libin Tang, Bingsuo Zou",
    venue: "Nanoscale, 14(11), 4170–4180",
    doi: "10.1039/d1nr07893c",
    topic: "Photodetection & Materials",
    featured: false,
  },
] as const satisfies readonly HuLabPublication[];
