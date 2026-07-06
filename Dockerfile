# ============================================
# CodingBoyz Debian Terminal
# Suga App - Importable
# ============================================

FROM debian:latest

LABEL maintainer="CodingBoyz"
LABEL description="Web-based Debian Terminal with Pterodactyl UI"
LABEL version="1.0.0"

# Prevent interactive prompts during install
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js 20.x and dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    gnupg \
    sudo \
    git \
    vim \
    nano \
    net-tools \
    iputils-ping \
    htop \
    neofetch \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Verify Node.js installation
RUN node --version && npm --version

# Create application directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code
COPY server.js ./
COPY public ./public

# Create non-root user for security (but allow sudo)
RUN useradd -m -s /bin/bash terminal && \
    echo "terminal ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/terminal && \
    chmod 0440 /etc/sudoers.d/terminal

# Expose the web terminal port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV TERM=xterm-256color

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Start the web terminal server
CMD ["node", "server.js"]