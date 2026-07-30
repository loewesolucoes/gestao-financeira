// Ambient module declaration for raw `.sql` file imports.
//
// Build-time support: next.config.js adds a webpack rule
// ({ test: /\.sql$/, type: "asset/source" }) so importing a `.sql` file
// yields its raw text content, inlined at build time (works with
// `output: 'export'` — no runtime fetch needed).
declare module "*.sql" {
  const content: string;
  export default content;
}
