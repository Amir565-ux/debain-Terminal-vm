FROM debian:latest

# Install Node.js and dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    nodejs \
    npm \
    sudo \
    git \
    vim \
    nano \
    net-tools \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy application files
COPY server.js ./
COPY public ./public

# Expose port 8080
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["node", "server.js"]