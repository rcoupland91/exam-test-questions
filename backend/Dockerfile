FROM node:20-alpine

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src/ ./src/

# Create data directory
RUN mkdir -p /data

EXPOSE 3001

CMD ["node", "src/server.js"]
