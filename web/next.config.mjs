import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Let the web app import the shared core (canonical, provable, mcp-client) from ../src.
  webpack: (config) => {
    config.resolve.alias["@core"] = path.resolve(__dirname, "../src");
    return config;
  },
};

export default nextConfig;
