/**
 * CodingBoyz Debian Terminal - Server
 * Pterodactyl-style Web Terminal Interface
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, perMessageDeflate: false });
const PORT = process.env.PORT || 8080;

// Store active sessions
const sessions = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Root endpoint - serves the terminal UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: System information
app.get('/api/system', (req, res) => {
    res.json({
        hostname: os.hostname(),
        platform: 'Debian GNU/Linux 12 (Bookworm)',
        arch: os.arch(),
        kernel: '6.1.0-21-amd64',
        uptime: formatUptime(os.uptime()),
        totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        usedMemory: ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        cpuCount: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || 'Unknown',
        loadAverage: os.loadavg().map(l => l.toFixed(2)),
        operator: 'CodingBoyz',
        timestamp: new Date().toISOString()
    });
});

// API: Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', uptime: os.uptime(), sessions: sessions.size });
});

// Format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
}

// Boot sequence message
function getBootSequence() {
    return `
\x1b[1m\x1b[32m
 ██████╗ ██████╗  █████╗ ███╗   ██╗██╗  ██╗███████╗██╗     ██╗   ██╗███████╗
██╔════╝ ██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝██╔════╝██║     ██║   ██║██╔════╝
██║  ███╗██████╔╝███████║██╔██╗ ██║█████╔╝ █████╗  ██║     ██║   ██║█████╗  
██║   ██║██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██╔══╝  
╚██████╔╝██║  ██║██║  ██║██║ ╚████║██║  ██╗███████╗███████╗╚██████╔╝███████╗
 ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝\x1b[0m

\x1b[36m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[36m║\x1b[0m                                                                          \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m    \x1b[33m▸ Debian GNU/Linux 12 (Bookworm) - Live Execution Matrix\x1b[0m              \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m    \x1b[33m▸ SYSTEM OPERATOR: \x1b[31m\x1b[1mCodingBoyz\x1b[0m\x1b[33m\x1b[0m                                     \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m    \x1b[33m▸ Session ID: \x1b[37m${generateSessionId()}\x1b[0m\x1b[33m\x1b[0m                                  \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m                                                                          \x1b[36m║\x1b[0m
\x1b[36m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[90m[${new Date().toISOString()}]\x1b[0m \x1b[36m[BOOT]\x1b[0m Initializing kernel modules...
\x1b[90m[${new Date().toISOString()}]\x1b[0m \x1b[36m[BOOT]\x1b[0m Loading network drivers...
\x1b[90m[${new Date().toISOString()}]\x1b[0m \x1b[36m[BOOT]\x1b[0m Mounting virtual filesystems...
\x1b[90m[${new Date().toISOString()}]\x1b[0m \x1b[36m[BOOT]\x1b[0m Starting system services...
\x1b[90m[${new Date().toISOString()}]\x1b[0m \x1b[36m[BOOT]\x1b[0m Configuring network interfaces...
\x1b[90m[${new Date().toISOString()}]\x1b[0m \x1b[32m[ OK ]\x1b[0m Terminal session established.
\x1b[90m[${new Date().toISOString()}]\x1b[0m \x1b[32m[ OK ]\x1b[0m Workspace ready. Type 'help' for commands.

`;
}

// Generate random session ID
function generateSessionId() {
    return 'CB-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Create a new shell session
function createShell(ws) {
    const sessionId = generateSessionId();
    
    const shell = spawn('/bin/bash', ['--norc', '--noprofile'], {
        env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
            HOME: '/root',
            PS1: '\\[\\e[1;32m\\]root@codingboyz\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]# '
        },
        cwd: '/root',
        stdio: 'pipe',
        detached: false
    });

    // Initialize bash with custom prompt
    shell.stdin.write(`
export PS1='\\[\\e[1;32m\\]root@codingboyz\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]# '
export HISTFILE=/dev/null
export HISTSIZE=0
clear 2>/dev/null || true
`);

    const session = {
        id: sessionId,
        shell: shell,
        ws: ws,
        created: new Date()
    };

    sessions.set(ws, session);
    return session;
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[CONNECT] New client from ${clientIp}`);
    
    // Send boot sequence
    ws.send(getBootSequence());

    // Create shell
    const session = createShell(ws);

    // Handle shell output
    session.shell.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString('utf-8'));
        }
    });

    session.shell.stderr.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString('utf-8'));
        }
    });

    // Handle shell exit
    session.shell.on('exit', (code, signal) => {
        console.log(`[EXIT] Shell exited with code ${code}, signal ${signal}`);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(`\n\x1b[33m[SYSTEM]\x1b[0m Shell process exited (code: ${code})\n`);
            ws.send(`\x1b[33m[SYSTEM]\x1b[0m Type 'reboot' to restart the workspace.\n`);
        }
    });

    // Handle messages from client
    ws.on('message', (message) => {
        const data = message.toString('utf-8');
        
        // Handle special commands
        if (data === '__reboot__') {
            rebootSession(ws, session);
            return;
        }
        
        // Send to shell
        if (session.shell && !session.shell.killed) {
            session.shell.stdin.write(data);
        }
    });

    // Handle disconnect
    ws.on('close', () => {
        console.log(`[DISCONNECT] Client disconnected, session ${session.id}`);
        cleanupSession(ws, session);
    });

    ws.on('error', (error) => {
        console.error(`[ERROR] WebSocket error: ${error.message}`);
        cleanupSession(ws, session);
    });
});

// Reboot session
function rebootSession(ws, oldSession) {
    // Kill old shell
    if (oldSession.shell && !oldSession.shell.killed) {
        oldSession.shell.kill('SIGKILL');
    }
    
    ws.send('\x1b[33m[SYSTEM]\x1b[0m Rebooting core workspace...\n');
    
    setTimeout(() => {
        ws.send('\x1b[32m[ OK ]\x1b[0m Workspace restarted.\n\n');
        
        // Create new shell
        const newSession = createShell(ws);
        
        newSession.shell.stdout.on('data', (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data.toString('utf-8'));
            }
        });
        
        newSession.shell.stderr.on('data', (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data.toString('utf-8'));
            }
        });
        
        newSession.shell.on('exit', (code, signal) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(`\n\x1b[33m[SYSTEM]\x1b[0m Shell process exited (code: ${code})\n`);
            }
        });

        // Update session in map
        sessions.set(ws, newSession);
    }, 500);
}

// Cleanup session
function cleanupSession(ws, session) {
    if (session.shell && !session.shell.killed) {
        try {
            session.shell.kill('SIGKILL');
        } catch (e) {
            // Ignore kill errors
        }
    }
    sessions.delete(ws);
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   \x1b[32mCodingBoyz Debian Terminal\x1b[0m                        ║
║   \x1b[36mServer running on http://0.0.0.0:${PORT}\x1b[0m           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] SIGTERM received, cleaning up...');
    sessions.forEach((session, ws) => {
        cleanupSession(ws, session);
    });
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log('[SHUTDOWN] SIGINT received, cleaning up...');
    sessions.forEach((session, ws) => {
        cleanupSession(ws, session);
    });
    server.close(() => process.exit(0));
});