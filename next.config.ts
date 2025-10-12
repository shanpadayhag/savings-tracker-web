import type { NextConfig } from "next";

const nextConfig: NextConfig = () => {
  return ({
    env: {
      SERVER_URL: process.env.SERVER_URL,
    },
  });
};

export default nextConfig;
