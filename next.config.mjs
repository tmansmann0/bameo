/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'fluent-ffmpeg', 'ffmpeg-static']
  }
};

export default nextConfig;
