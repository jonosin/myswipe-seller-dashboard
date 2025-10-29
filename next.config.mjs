/** @type {import('next').NextConfig} */
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supaHost = '';
try { const u = new URL(SUPA); supaHost = u.hostname; } catch {}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      ...(supaHost ? [{ protocol: 'https', hostname: supaHost, pathname: '/storage/v1/object/public/**' }] : []),
      { protocol: 'http', hostname: 'localhost', port: '54321', pathname: '/storage/v1/object/public/**' },
    ]
  },
  experimental: {
    typedRoutes: true
  }
}

export default nextConfig
