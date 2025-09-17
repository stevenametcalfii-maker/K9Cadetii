/**
 * @type {import('next').NextConfig}
 *
 * This configuration tells Next.js to output a static export suitable
 * for hosting on platforms that serve static files (such as SiteGround)
 * and disables image optimization.  The `trailingSlash` option ensures
 * that all routes end in a slash, which helps avoid redirects on some hosts.
 */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
