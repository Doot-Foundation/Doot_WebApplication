/** @type {import('next').NextConfig} */
const isFastBuild = Boolean(process.env.FAST_BUILD);

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    esmExternals: true,
  },
  // Speed up local builds when FAST_BUILD=1
  eslint: {
    ignoreDuringBuilds: isFastBuild,
    dirs: ['pages', 'utils', 'lib'],
  },
  typescript: {
    ignoreBuildErrors: isFastBuild,
  },
};

module.exports = nextConfig;
