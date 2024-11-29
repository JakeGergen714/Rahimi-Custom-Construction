// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['rahimi-images.s3.us-east-2.amazonaws.com'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude certain modules from server-side bundling
      config.externals.push({
        '@sparticuz/chrome-aws-lambda': 'commonjs @sparticuz/chrome-aws-lambda',
        'aws-sdk': 'commonjs aws-sdk',
      });
    }
    return config;
  },
};

export default nextConfig;
