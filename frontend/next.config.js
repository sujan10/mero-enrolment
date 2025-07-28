/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure client-side packages work properly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Ensure stagewise and other client-side packages are properly handled
  transpilePackages: ['@stagewise/toolbar'],
}

module.exports = nextConfig 