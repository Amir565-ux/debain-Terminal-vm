const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// System info
function getSystemInfo() {
    return {
        hostname: os.hostname(),
        platform: 'Debian GNU/Linux',
        arch: os.arch(),
        kernel: '6.1.0-debian',
        uptime: os.uptime(),
        totalMem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
        freeMem: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
        cpus: os.cpus().length,
        operator: 'CodingBoyz'
    };
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    let shell = null;
    let buffer = '';

    // Spawn bash shell
    shell = spawn('/bin/bash', [], {
        env: { 
            ...process.env, 
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor'
        },
        cwd: '/root'
    });

    // Send initial boot sequence
    const bootSequence = `
\x1b[32m╔══════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[32m║                                                                  ║\x1b[0m
\x1b[32m║     \x1b[36m██████╗ ██████╗  █████╗ ███╗   ██╗██╗  ██╗███████╗██╗     ██╗   ██╗███████╗\x1b[32m    ║\x1b[0m
\x1b[32m║    \x1b[36m██╔════╝ ██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝██╔════╝██║     ██║   ██║██╔════╝\x1b[32m   ║\x1b[0m
\x1b[32m║    \x1b[36m██║  ███╗██████╔╝███████║██╔██╗ ██║█████╔╝ █████╗  ██║     ██║   ██║█████╗    \x1b[32m   ║\x1b[0m
\x1b[32m║    \x1b[36m██║   ██║██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██╔══╝    \x1b[32m   ║\x1b[0m
\x1b[32m║    \x1b[36m╚██████╔╝██║  ██║██║  ██║██║ ╚████║██║  ██╗███████╗███████╗╚██████╔╝███████╗  \x1b[32m  ║\x1b[0m
\x1b[32m║     \x1b[36m╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝  \x1b[32m  ║\x1b[0m
\x1b[32m║                                                                  ║\x1b[0m
\x1b[32m║          \x1b[33mDebian GNU/Linux Live Execution Matrix\x1b[32m                    ║\x1b[0m
\x1b[32m║          \x1b[33mSYSTEM OPERATOR: \x1b[31mCodingBoyz\x1b[33m\x1b[32m                             ║\x1b[0m
\x1b[32m║                                                                  ║\x1b[0m
\x1b[32m╚══════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[36m[SYSTEM]\x1b[0m Initializing kernel modules...
\x1b[36m[SYSTEM]\x1b[0m Loading network drivers...
\x1b[36m[SYSTEM]\x1b[0m Mounting filesystems...
\x1b[36m[SYSTEM]\x1b[0m Starting system services...
\x1b[36m[SYSTEM]\x1b[0m Establishing secure connection...
\x1b[32m[OK]\x1b[0m Terminal session established.
\x1b[32m[OK]\x1b[0m Workspace ready.

`;
    
    ws.send(bootSequence);

    // Handle data from shell
    shell.stdout.on('data', (data) => {
        ws.send(data.toString());
    });

    shell.stderr.on('data', (data) => {
        ws.send(data.toString());
    });

    shell.on('close', (code) => {
        ws.send(`\n\x1b[31m[SYSTEM]\x1b[0m Shell exited with code ${code}\n`);
        ws.send('\x1b[33m[SYSTEM]\x1b[0m Type "reboot" to restart the workspace.\n');
    });

    // Handle input from client
    ws.on('message', (message) => {
        const data = message.toString();
        
        // Handle special commands
        if (data === 'reboot') {
            shell.kill('SIGKILL');
            shell = spawn('/bin/bash', [], {
                env: { 
                    ...process.env, 
                    TERM: 'xterm-256color',
                    COLORTERM: 'truecolor'
                },
                cwd: '/root'
            });
            
            shell.stdout.on('data', (d) => ws.send(d.toString()));
            shell.stderr.on('data', (d) => ws.send(d.toString()));
            shell.on('close', (code) => {
                ws.send(`\n\x1b[31m[SYSTEM]\x1b[0m Shell exited with code ${code}\n`);
            });
            
            ws.send('\x1b[33m[SYSTEM]\x1b[0m Rebooting core workspace...\n');
            ws.send('\x1b[32m[OK]\x1b[0m Workspace restarted.\n');
            return;
        }
        
        if (shell && !shell.killed) {
            shell.stdin.write(data);
        }
    });

    // Handle disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        if (shell) {
            shell.kill('SIGKILL');
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// API endpoint for system info
app.get('/api/system', (req, res) => {
    res.json(getSystemInfo());
});

// API endpoint for kill process
app.post('/api/kill', (req, res) => {
    // This would kill the current process - for UI button
    res.json({ success: true, message: 'Kill signal sent' });
});

// API endpoint for reboot
app.post('/api/reboot', (req, res) => {
    res.json({ success: true, message: 'Reboot initiated' });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[32m[SERVER]\x1b[0m Debian Terminal Web UI running on port ${PORT}`);
    console.log(`\x1b[32m[SERVER]\x1b[0m Access at: http://localhost:${PORT}`);
});