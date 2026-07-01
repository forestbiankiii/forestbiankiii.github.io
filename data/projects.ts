export interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  link?: string;
  github?: string;
  image?: string;
}

export const projects: Project[] = [
  {
    id: 1,
    title: "Quantum Dashboard",
    description:
      "A real-time data visualization dashboard with interactive charts and quantum-inspired animations. Built with modern web technologies.",
    tags: ["React", "TypeScript", "D3.js"],
    link: "#",
    github: "#",
  },
  {
    id: 2,
    title: "Neural Network Playground",
    description:
      "An interactive tool for visualizing and experimenting with neural network architectures. Train models in the browser.",
    tags: ["Python", "TensorFlow.js", "WebGL"],
    link: "#",
    github: "#",
  },
  {
    id: 3,
    title: "Particle Physics Simulator",
    description:
      "A WebGL-based particle physics simulation engine with real-time collision detection and quantum field visualization.",
    tags: ["Three.js", "WebGL", "Physics"],
    link: "#",
    github: "#",
  },
  {
    id: 4,
    title: "Crypto Protocol",
    description:
      "A decentralized communication protocol implementing post-quantum cryptographic algorithms for secure messaging.",
    tags: ["Rust", "WebAssembly", "Cryptography"],
    link: "#",
    github: "#",
  },
];
