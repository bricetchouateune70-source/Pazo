FROM node:20-alpine

WORKDIR /app

# Install dependencies for argon2 (needs build tools)
RUN apk add --no-cache python3 make g++

# Copy root package files for workspaces
COPY package.json ./
COPY package-lock.json* ./
COPY tsconfig.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy backend package
COPY Backend ./Backend

# Install all dependencies
RUN npm install

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Generate Prisma client
WORKDIR /app/Backend
RUN npx prisma generate

# Copy entrypoint script
COPY Backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 5000

# Start command - use tsx directly for TypeScript
ENTRYPOINT ["/docker-entrypoint.sh"]
