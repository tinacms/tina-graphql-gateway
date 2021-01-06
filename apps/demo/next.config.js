const path = require("path");

require("dotenv").config();

module.exports = {
  env: {
    SITE_CLIENT_ID: process.env.SITE_CLIENT_ID,
    DEPLOYED_URL: process.env.DEPLOYED_URL,
    GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG,
    GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    /**
     * Enable these when you want to work with Tina locally
     */
    // config.resolve.alias["@tinacms"] = path.resolve(
    //   "../../../tinacms/packages/@tinacms"
    // );
    // config.resolve.alias["tinacms"] = path.resolve(
    //   "../../../tinacms/packages/tinacms"
    // );
    config.resolve.alias["react-dom"] = require.resolve("react-dom");
    config.resolve.alias["react"] = require.resolve("react");

    return config;
  },
};
