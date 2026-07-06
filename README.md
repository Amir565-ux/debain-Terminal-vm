# 🖥️ CodingBoyz Debian Terminal

A modern, web-based Debian terminal featuring a clean **Pterodactyl-inspired interface** with real-time terminal access, WebSocket communication, and one-click deployment support for **Suga**.

---

## ✨ Features

- 🐧 Full Debian Bash terminal in your browser
- 🎨 Pterodactyl-style dark interface
- ⚡ Real-time WebSocket terminal connection
- 🔄 Automatic reconnection on disconnect
- 📊 Live system resource monitoring
- ⌨️ Kill running process (Ctrl + C)
- ♻️ Reboot Workspace button
- 📱 Responsive design for desktop and mobile
- 🚀 Suga App compatible
- 🏷️ CodingBoyz branding

---

## 🚀 Deploy on Suga

1. Fork or push this repository to GitHub.
2. Connect your GitHub account to **Suga**.
3. Import this repository.
4. Suga will automatically detect `.suga/config.json`.
5. Deploy the application.

The application runs on **port 8080**.

---

## 🛠️ Manual Deployment

### Clone the repository

```bash
git clone https://github.com/your-username/repository.git
cd repository
```

### Build and start

```bash
docker-compose up -d --build
```

### Access

```
http://localhost:8080
```

---

## 📦 Requirements

- Docker
- Docker Compose
- Linux Server or VPS

---

## 📁 Project Structure

```
.
├── .suga/
│   └── config.json
├── docker-compose.yml
├── Dockerfile
├── server.js
├── package.json
└── README.md
```

---

## 🔒 License

This project is licensed under the **MIT License**.

---

## ❤️ Credits

Developed and maintained by **CodingBoyz**.

If you find this project useful, consider giving it a ⭐ on GitHub.
