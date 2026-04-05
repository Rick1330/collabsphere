/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Repo-wide lint runs from the root flat config; avoid duplicate Next lint passes during build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
