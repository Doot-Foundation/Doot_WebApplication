/** @type {import('next').NextConfig} */
const isFastBuild = Boolean(process.env.FAST_BUILD);

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    instrumentationHook: true,
    esmExternals: true,
  },
  // Speed up local builds when FAST_BUILD=1
  eslint: {
    ignoreDuringBuilds: isFastBuild,
    dirs: ["pages", "utils", "lib"],
  },
  typescript: {
    ignoreBuildErrors: isFastBuild,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: "https://azure-bitter-tortoise-311.mypinata.cloud",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
