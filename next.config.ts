import type { NextConfig } from "next";

const nextConfig: NextConfig = () => {
  return ({
    reactStrictMode: false,
    env: {
      SERVER_URL: process.env.SERVER_URL,
    },
  });
};

export default nextConfig;
