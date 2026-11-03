import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Un package-lock.json existe plus haut dans l'arborescence : on fixe la racine du projet.
  outputFileTracingRoot: import.meta.dirname,
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
