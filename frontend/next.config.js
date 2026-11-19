/** @type {import('next').NextConfig} */
const isGithubActions = !!process.env.GITHUB_ACTIONS;
const isDockerBuild = process.env.DOCKER_BUILD === 'true';
const isStaticExport = isGithubActions && !isDockerBuild;

const nextConfig = {
  ...(isDockerBuild
    ? {
        output: 'standalone',
      }
    : isStaticExport
      ? {
          output: 'export',
          basePath: '/Mettu_karl_HMIS',
        }
      : {}),
  reactStrictMode: false,
  swcMinify: true,
  images: {
    unoptimized: isStaticExport,
    domains: ['localhost'],
  },
  ...(isStaticExport
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/:path*`,
            },
          ];
        },
        async headers() {
          return [
            {
              source: '/:path*',
              headers: [
                { key: 'Cache-Control', value: 'no-cache, no-store, max-age=0, must-revalidate' },
                { key: 'Pragma', value: 'no-cache' },
                { key: 'Expires', value: '0' },
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-XSS-Protection', value: '1; mode=block' },
                { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                {
                  key: 'Content-Security-Policy',
                  value:
                    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: http://localhost:8000 http://127.0.0.1:8000 ws: wss:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
                },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
              ],
            },
          ];
        },
      }),
};

module.exports = nextConfig;
