/** @type {import('next').NextConfig} */
const apiProxy = process.env.API_PROXY_URL ?? 'http://localhost:3001'
const isProdBuild = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  /**
   * Static export for production (served by the API on one origin). Omitted during
   * `next dev` so rewrites can proxy API calls to :3001 on the same origin.
   */
  ...(isProdBuild ? { output: 'export' } : {}),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  },
  async rewrites() {
    return [
      { source: '/health', destination: `${apiProxy}/health` },
      { source: '/legal', destination: `${apiProxy}/legal` },
      { source: '/auth/:path*', destination: `${apiProxy}/auth/:path*` },
      { source: '/api/:path*', destination: `${apiProxy}/api/:path*` },
    ]
  },
}

export default nextConfig
