import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  basePath: process.env.GITHUB_PAGES ? '/dsbdotcom' : '',
  assetPrefix: process.env.GITHUB_PAGES ? '/dsbdotcom/' : '',
};

export default nextConfig;
