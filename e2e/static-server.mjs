// Minimal static file server that serves the production static export (`out/`) mounted
// under the same basePath used in production (`/gestao-financeira`, see next.config.js),
// so the e2e smoke suite exercises the app exactly as GitHub Pages serves it. `serve`'s
// CLI can't mount a directory under a URL prefix, so this uses `serve-handler` (the
// library `serve` itself is built on) directly with simple prefix-stripping.
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from 'serve-handler';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'out');
const basePath = '/gestao-financeira';
const port = process.env.PORT ? Number(process.env.PORT) : 4173;

const server = http.createServer((request, response) => {
  if (request.url === basePath) {
    request.url = '/';
  } else if (request.url.startsWith(`${basePath}/`)) {
    request.url = request.url.slice(basePath.length);
  } else if (request.url !== '/') {
    // Anything outside the basePath prefix doesn't exist in this deployment shape.
    response.statusCode = 404;
    response.end('Not found');
    return;
  }

  return handler(request, response, { public: outDir });
});

server.listen(port, () => {
  console.log(`Serving ${outDir} at http://127.0.0.1:${port}${basePath}/`);
});
