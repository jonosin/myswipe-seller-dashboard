/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pgknuwtrsetkystpqqpl.supabase.co',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  },
  experimental: {
    typedRoutes: true
  }
}

export default nextConfig
