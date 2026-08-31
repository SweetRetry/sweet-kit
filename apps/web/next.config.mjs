import path from "node:path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    useTypeScriptCli: true,
  },
  transpilePackages: ["@workspace/auth", "@workspace/request", "@workspace/ui"],
  turbopack: {
    root: path.join(import.meta.dirname, "../.."),
  },
}

export default nextConfig
