// Jest can't run the webpack raw-loader used for `*.md` imports (see next.config.js), so
// moduleNameMapper (jest.config.ts) redirects any `.md` import to this plain-string stub.
module.exports = "MOCKED_MARKDOWN_CONTENT";
