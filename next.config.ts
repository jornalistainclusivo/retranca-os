import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true, // Necessário para 'output: export' no Tauri
  },
  output: 'export', // <-- Alteração principal para o Tauri Desktop
  transpilePackages: ['motion'],
  turbopack: {}, // Silences Turbopack webpack mismatch error in Next.js 16
  webpack: (config, {dev}) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
