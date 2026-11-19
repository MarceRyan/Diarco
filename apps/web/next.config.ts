import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @diarco/shared se publica como código TypeScript fuente; Next lo compila.
  transpilePackages: ["@diarco/shared"],
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
