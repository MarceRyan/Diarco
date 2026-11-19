import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @huella/shared se publica como código TypeScript fuente; Next lo compila.
  transpilePackages: ["@huella/shared"],
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
