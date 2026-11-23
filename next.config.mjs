/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_OUTPUT === 'export';
const nextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: 'export', trailingSlash: true, images: { unoptimized: true } } : {}),
  // pg is only loaded on the server when DATABASE_URL is configured
  serverExternalPackages: ['pg'],
};
export default nextConfig;
