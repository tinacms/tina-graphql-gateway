const path = require("path");

module.exports = {
  typescript: {
    // Get rid of this.... obviously
    ignoreDevErrors: true,
    ignoreBuildErrors: true,
  },
  webpack: (config, options) => {
    // This was awkard with the tinacms webpack helpers package
    // just doing this for now works fine
    config.resolve.alias["@tinacms"] = path.resolve(
      "../../../tinacms/packages/@tinacms"
    );
    config.resolve.alias["tinacms"] = path.resolve(
      "../../../tinacms/packages/tinacms"
    );
    // Using yarn pnp - we rely on Yarn to set this properly, the file ends up looking like
    // <My-Root-Path>/code/scratch/sc/.yarn/$$virtual/react-dom-virtual-e706100de8/0/cache/react-dom-npm-16.13.1-b0abd8a83a-2.zip/node_modules/react-dom/index.js
    config.resolve.alias["react-dom"] = require.resolve("react-dom");
    config.resolve.alias["react"] = require.resolve("react");

    return config;
  },
};
