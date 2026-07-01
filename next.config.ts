import type { NextConfig } from "next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const githubPagesBasePath =
  repositoryName !== "" && !repositoryName.endsWith(".github.io")
    ? `/${repositoryName}`
    : "";
const basePath = configuredBasePath || githubPagesBasePath;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
