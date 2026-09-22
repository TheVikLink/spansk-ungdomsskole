import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function startStaticAppServer({ transform = (file, bytes) => bytes } = {}) {
  let offline = false;
  const root = path.resolve('.');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
  const server = http.createServer(async (req, res) => {
    if (offline) { req.socket.destroy(); return; }
    try {
      const url = new URL(req.url, 'http://localhost');
      const relative = decodeURIComponent(url.pathname).replace(/^\/classroom\//, '') || 'index.html';
      const filename = relative.endsWith('/') ? relative + 'index.html' : relative;
      const absolute = path.resolve(root, filename);
      if (!absolute.startsWith(root + path.sep)) throw new Error('outside root');
      const bytes = Buffer.from(await transform(filename, await readFile(absolute)));
      const headers = { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      if (range) {
        const start = Number(range[1]), end = Math.min(Number(range[2] || bytes.length - 1), bytes.length - 1);
        res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${bytes.length}`, 'Content-Length': end - start + 1 });
        res.end(bytes.subarray(start, end + 1));
      } else { res.writeHead(200, { ...headers, 'Content-Length': bytes.length }); res.end(bytes); }
    } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}/classroom/`, setOffline: value => { offline = value; }, close: () => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }) };
}
