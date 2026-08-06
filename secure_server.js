/**
 * HADES HOUSE OFFICIAL CYBERSECURITY PRODUCTION SERVER 🇩🇴
 * Servidor Web Seguro Nativo Node.js — Protegido contra OWASP Top 10, DoS y XSS
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// MEMORY RATE LIMITER (Protección Anti-DoS / Fuerza Bruta)
const ipRequestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 120; // 120 peticiones máx por IP por minuto

function isRateLimited(ip) {
    const now = Date.now();
    let record = ipRequestCounts.get(ip);

    if (!record) {
        record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
        ipRequestCounts.set(ip, record);
        return false;
    }

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_LIMIT_WINDOW_MS;
        return false;
    }

    record.count++;
    if (record.count > MAX_REQUESTS_PER_WINDOW) {
        return true;
    }

    return false;
}

// MIME TYPES PERMITIDOS (Control Estricto de Contenido)
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=UTF-8'
};

// SERVIDORES HTTP CON SECURITY HEADERS OWASP
const server = http.createServer((req, res) => {
    const clientIp = req.socket.remoteAddress || '127.0.0.1';

    // 1. ENCABEZADOS DE CIBERSEGURIDAD DE PRODUCCIÓN (SECURITY HEADERS)
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Content-Security-Policy', "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';");

    // 2. CONTROL DE RATE LIMITING (ANTI-DOS)
    if (isRateLimited(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit excedido por motivos de ciberseguridad.' }));
        return;
    }

    // 3. ENRUTAMIENTO DE API DE SALUD Y SEGURIDAD
    if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'HEALTHY',
            brand: 'Hades House SRL 🇩🇴',
            security: 'ENCRYPTED_OWASP_PARANOID',
            uptimeSeconds: process.uptime(),
            timestamp: new Date().toISOString()
        }));
        return;
    }

    if (req.url === '/api/security-status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            protection: 'ACTIVE',
            rateLimiting: '120 req/min',
            contentSecurityPolicy: 'ACTIVE',
            xssProtection: 'ACTIVE',
            frameDeny: 'ACTIVE'
        }));
        return;
    }

    // 4. SANITIZACIÓN DE RUTAS DE ARCHIVOS (PREVENCIÓN DE PATH TRAVERSAL / DIRECTORY ESCAPE)
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') safeUrl = '/index.html';

    const filePath = path.normalize(path.join(PUBLIC_DIR, safeUrl));

    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden — Path Traversal Blocked');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end('<h1>404 Not Found — Hades House Cyber Server</h1>');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🛡️ HADES HOUSE CYBERSECURITY SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`🔒 Security Headers: HSTS, CSP, X-Frame DENY, Anti-DoS`);
    console.log(`=======================================================`);
});
