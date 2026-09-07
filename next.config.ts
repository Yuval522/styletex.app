import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow attaching quote PDFs up to 10MB via Server Actions.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
