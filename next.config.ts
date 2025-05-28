import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  basePath: isProd && isGitHubPages ? '/dsbdotcom' : '',
  assetPrefix: isProd && isGitHubPages ? '/dsbdotcom' : '',
};

export default nextConfig;
