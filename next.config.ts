import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress XLSX binary module warning (xlsx package uses Node.js builtins)
  serverExternalPackages: ["xlsx"],
};

export default nextConfig;
