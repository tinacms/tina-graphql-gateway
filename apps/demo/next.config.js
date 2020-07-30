const path = require("path");

module.exports = {
  webpack: (config) => {
    /**
     * Enable these when you want to work with Tina locally
     */
    config.resolve.alias["@tinacms"] = path.resolve(
      "../../../tinacms/packages/@tinacms"
    );
    config.resolve.alias["tinacms"] = path.resolve(
      "../../../tinacms/packages/tinacms"
    );
    config.resolve.alias["react-dom"] = require.resolve("react-dom");
    config.resolve.alias["react"] = require.resolve("react");

    return config;
  },
};
