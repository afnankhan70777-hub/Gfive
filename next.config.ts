import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist8',
  basePath: '/Gfive',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
