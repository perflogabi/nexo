import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /** Imagem Docker enxuta (`Dockerfile` + `docker compose`). Vercel ignora. */
  output: 'standalone',
};

export default nextConfig;
