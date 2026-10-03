/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  /**
   * Metadados sempre no <head> (não streamados).
   * Evita falha de SEO/Lighthouse quando o UA é Chrome Mobile (sem Chrome-Lighthouse).
   * Custo: generateMetadata completa antes do HTML — ok em páginas já force-dynamic.
   */
  htmlLimitedBots: /.*/,
};

module.exports = nextConfig;
