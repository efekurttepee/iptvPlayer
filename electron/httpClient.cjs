const http = require('http');
const https = require('https');
const dns = require('dns');
const { URL } = require('url');

// Configure uncensored global DNS servers (Cloudflare / Google) to bypass ISP DNS blocks
try {
  dns.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1', '8.8.4.4']);
} catch (e) {
  console.warn('DNS server setting warning:', e);
}

/**
 * Native Node.js HTTP/HTTPS client that bypasses Chromium CORS, SSL checks,
 * follows redirects, and injects IPTV Smarters User-Agent.
 */
function nativeRequest(targetUrl, options = {}, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error('Çok fazla yönlendirme (Redirect loop).'));
    }

    let parsedUrl;
    try {
      let cleaned = targetUrl.trim();
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = 'http://' + cleaned;
      }
      parsedUrl = new URL(cleaned);
    } catch (err) {
      return reject(new Error(`Geçersiz sunucu adresi URL'si: ${targetUrl}`));
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        ...(options.headers || {}),
      },
      timeout: 20000,
      rejectUnauthorized: false, // Allow self-signed or expired SSL certs common in IPTV servers
    };

    const req = client.request(requestOptions, (res) => {
      // Handle redirects (301, 302, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, targetUrl).toString();
        }
        res.resume(); // discard rest of response
        return resolve(nativeRequest(redirectUrl, options, redirectCount + 1));
      }

      let rawData = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers,
          data: rawData,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Sunucu yanıt vermedi (Zaman aşımı / Timeout). Lütfen sunucu portunu ve adresini kontrol edin.'));
    });

    req.on('error', (err) => {
      const code = err.code || '';
      if (code === 'ENOTFOUND') {
        reject(new Error(`Sunucu adresi bulunamadı (${parsedUrl.hostname}). Lütfen adresi doğru yazdığınızdan emin olun (Örn: .xyz:80, .com:8080 vb.).`));
      } else if (code === 'ECONNREFUSED') {
        reject(new Error(`Sunucu bağlantıyı reddetti (${parsedUrl.hostname}:${requestOptions.port}). Port numarasını kontrol edin.`));
      } else if (code === 'ETIMEDOUT' || code === 'EHOSTUNREACH') {
        reject(new Error(`Sunucuya ulaşılamadı. Sunucu kapalı olabilir veya internet bağlantınızı kontrol edin.`));
      } else {
        reject(new Error(`Bağlantı hatası: ${err.message}`));
      }
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

module.exports = { nativeRequest };
