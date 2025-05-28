import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const isCustomDomain = process.env.GITHUB_PAGES_CUSTOM_DOMAIN === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // Only use basePath for GitHub Pages without custom domain
  basePath: isProd && isGitHubPages && !isCustomDomain ? '/dsbdotcom' : '',
  assetPrefix: isProd && isGitHubPages && !isCustomDomain ? '/dsbdotcom/' : '',
};

export default nextConfig;
