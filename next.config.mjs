/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_OUTPUT === 'export';
// Sub-path when hosted as a GitHub Pages project site, e.g. /nvda-research-terminal
const basePath = process.env.NEXT_BASE_PATH || '';
const nextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: 'export', trailingSlash: true, images: { unoptimized: true } } : {}),
  ...(basePath ? { basePath } : {}),
  // pg is only loaded on the server when DATABASE_URL is configured
  serverExternalPackages: ['pg'],
};
export default nextConfig;
