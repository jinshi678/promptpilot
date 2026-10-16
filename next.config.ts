import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 独立输出：构建产物 .next/standalone 自带裁剪后的 node_modules，用于 Docker 部署
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
