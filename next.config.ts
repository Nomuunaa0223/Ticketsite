import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100]
  },
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
