import { fileURLToPath } from "node:url";

const outputFileTracingRoot = fileURLToPath(new URL("../../", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Trace from the monorepo root so prebuilt Vercel deploys include hoisted runtime files.
  outputFileTracingRoot,
  reactStrictMode: true,
  eslint: {
    // Repo-wide lint runs from the root flat config; avoid duplicate Next lint passes during build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
