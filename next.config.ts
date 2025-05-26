import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), "encoding"];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'arbitrum.foundation',
      },
      {
        protocol: 'https',
        hostname: 'optimism.io',
      },
    ],
  },
};

export default nextConfig;
