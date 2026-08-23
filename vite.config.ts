import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';
import https from 'https';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'iptv-cors-proxy',
      configureServer(server) {
        server.middlewares.use('/api/proxy', (req, res) => {
          const parsedUrl = new URL(req.url || '', 'http://localhost:5173');
          const targetUrl = parsedUrl.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }

          try {
            const isHttps = targetUrl.startsWith('https:');
            const client = isHttps ? https : http;

            const reqHeaders: Record<string, string | string[] | undefined> = {
              ...req.headers,
              host: new URL(targetUrl).host,
              'user-agent': 'IPTVSmartersPro/3.1.5.1 (Windows NT 10.0; Win64; x64)',
              'accept': '*/*',
            };
            delete reqHeaders['origin'];
            delete reqHeaders['referer'];

            const handleStreamResponse = (sourceRes: http.IncomingMessage, effectiveUrl: string) => {
              const contentType = (sourceRes.headers['content-type'] || '').toLowerCase();
              const isM3u8 = contentType.includes('mpegurl') || effectiveUrl.includes('.m3u8');

              if (isM3u8) {
                let body = '';
                sourceRes.on('data', (chunk) => {
                  body += chunk.toString('utf-8');
                });
                sourceRes.on('end', () => {
                  try {
                    const lines = body.split('\n');
                    const rewrittenLines = lines.map((line) => {
                      const trimmed = line.trim();
                      if (!trimmed || trimmed.startsWith('#')) return line;
                      try {
                        const absUrl = new URL(trimmed, effectiveUrl).toString();
                        return `/api/proxy?url=${encodeURIComponent(absUrl)}`;
                      } catch {
                        return line;
                      }
                    });
                    const rewrittenBody = rewrittenLines.join('\n');
                    const headers = {
                      ...sourceRes.headers,
                      'content-type': 'application/vnd.apple.mpegurl',
                      'content-length': Buffer.byteLength(rewrittenBody),
                      'access-control-allow-origin': '*',
                    };
                    res.writeHead(sourceRes.statusCode || 200, headers);
                    res.end(rewrittenBody);
                  } catch (e: any) {
                    res.writeHead(sourceRes.statusCode || 200, {
                      ...sourceRes.headers,
                      'access-control-allow-origin': '*',
                    });
                    res.end(body);
                  }
                });
              } else {
                const headers = { ...sourceRes.headers, 'access-control-allow-origin': '*' };
                res.writeHead(sourceRes.statusCode || 200, headers);
                sourceRes.pipe(res);
              }
            };

            const clientReq = client.request(
              targetUrl,
              {
                method: req.method || 'GET',
                headers: reqHeaders,
                rejectUnauthorized: false,
                timeout: 30000,
              },
              (clientRes) => {
                // Follow 301/302/307 redirects
                if (
                  (clientRes.statusCode === 301 || clientRes.statusCode === 302 || clientRes.statusCode === 307) &&
                  clientRes.headers.location
                ) {
                  const redirectUrl = new URL(clientRes.headers.location, targetUrl).toString();
                  const redirectClient = redirectUrl.startsWith('https:') ? https : http;
                  reqHeaders.host = new URL(redirectUrl).host;

                  redirectClient.request(
                    redirectUrl,
                    {
                      method: req.method || 'GET',
                      headers: reqHeaders,
                      rejectUnauthorized: false,
                      timeout: 30000,
                    },
                    (redRes) => {
                      handleStreamResponse(redRes, redirectUrl);
                    }
                  ).on('error', (err) => {
                    if (!res.headersSent) {
                      res.statusCode = 502;
                      res.end(err.message);
                    }
                  }).end();
                  return;
                }

                handleStreamResponse(clientRes, targetUrl);
              }
            );

            clientReq.on('error', (err) => {
              if (!res.headersSent) {
                res.statusCode = 502;
                res.end(err.message);
              }
            });

            clientReq.on('timeout', () => {
              clientReq.destroy();
              if (!res.headersSent) {
                res.statusCode = 504;
                res.end('Request timed out');
              }
            });

            if (req.method === 'POST' || req.method === 'PUT') {
              req.pipe(clientReq);
            } else {
              clientReq.end();
            }
          } catch (err: any) {
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end(err.message);
            }
          }
        });
      },
    },
  ],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
