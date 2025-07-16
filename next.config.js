const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, } = require("next/constants");

module.exports = async (phase) => {
  const isDev = process.env.NODE_ENV === 'development';
  const basePath = isDev ? '' : '/gestao-financeira';
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    output: 'export',
    basePath: isDev ? undefined : basePath,
    assetPrefix: isDev ? undefined : `${basePath}/`,
    env: {
      BASE_PATH: basePath
    },
    reactStrictMode: false,
    images: { unoptimized: true },
    // experimental: { missingSuspenseWithCSRBailout: false, },
    webpack: (config, { isServer }) => {
      config.module.rules.push({
        test: /\.svg$/,
        use: ["@svgr/webpack"]
      });

      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
      }

      config.resolve.alias = {
        ...config.resolve.alias,
      }

      const defaultCopyConfig = { info: { minimized: true } }

      config.plugins.push(new CopyWebpackPlugin({
        patterns: [
          { ...defaultCopyConfig, from: path.join(__dirname, './node_modules/sql.js/dist/sql-wasm.wasm'), to: path.join(__dirname, './public/sql-wasm.wasm') },
          { ...defaultCopyConfig, from: path.join(__dirname, './node_modules/sql.js/dist/sql-wasm-debug.wasm'), to: path.join(__dirname, './public/sql-wasm-debug.wasm') },
          { ...defaultCopyConfig, from: path.join(__dirname, './node_modules/sql.js/dist/worker.sql-wasm.js'), to: path.join(__dirname, './public/worker.sql-wasm.js') },
          { ...defaultCopyConfig, from: path.join(__dirname, './node_modules/sql.js/dist/worker.sql-wasm-debug.js'), to: path.join(__dirname, './public/worker.sql-wasm-debug.js') },
        ]
      }))

      return config;
    }
  }

  // Your current or future configuration 

  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withSerwist = (await import("@serwist/next")).default({
      swSrc: 'src/app/service-worker/app-worker.ts', // where the service worker src is
      swDest: 'public/sw.js', // where the service worker code will end up
      reloadOnOnline: true,
    });

    return withSerwist(nextConfig);
  }

  return nextConfig;
};