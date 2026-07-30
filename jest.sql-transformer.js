// Minimal Jest transformer for raw `.sql` file imports, mirroring the
// webpack `asset/source` rule in next.config.js (raw text content). Needed
// because `require.context`/webpack loaders aren't available under Jest's
// SWC-based transform pipeline.
module.exports = {
  process(sourceText) {
    return { code: `module.exports = ${JSON.stringify(sourceText)};` };
  },
};
