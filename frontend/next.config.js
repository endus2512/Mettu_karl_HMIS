/** @type {import('next').NextConfig} */
const isGithubActions = !!process.env.GITHUB_ACTIONS;

const nextConfig = {
  output: isGithubActions ? 'export' : 'standalone',
  basePath: isGithubActions ? '/Mettu_karl_HMIS' : '',
  reactStrictMode: false,
  swcMinify: true,
  images: {
    unoptimized: isGithubActions,
    domains: ['localhost'],
  },
  ...(isGithubActions
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
            },
          ];
        },
        async headers() {
          return [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-XSS-Protection', value: '1; mode=block' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
          ];
        },
      }),
};

module.exports = nextConfig;
