const nextConfig = {
  // Only use static export for production builds (when NEXT_PUBLIC_IS_STATIC is set)
  ...(process.env.NEXT_PUBLIC_IS_STATIC === "true" && { output: "export" }),
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    // Add a rule to handle .glsl files
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "raw-loader", // or "asset/source" in newer Webpack versions
        },
        {
          loader: "glslify-loader",
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
