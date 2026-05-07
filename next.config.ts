import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/generative-ai'],
  experimental: {
    // API 요청 본문 크기 제한 (10MB)
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
