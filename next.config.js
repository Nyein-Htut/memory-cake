// AFTER
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disables the client-side Router Cache for dynamically-rendered
    // routes (like /orders, /notifications) so navigating back to them
    // always re-fetches fresh data instead of reusing a stale snapshot
    // from up to 30s ago. Static routes are unaffected.
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
