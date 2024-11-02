import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.alias["@"] = path.resolve(__dirname, "src");
        return config;
    },
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'venda-imoveis.caixa.gov.br',
            port: '',
            pathname: '/fotos/**',
          },
        ],
      },
};

export default nextConfig;
