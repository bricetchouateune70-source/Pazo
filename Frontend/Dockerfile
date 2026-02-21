FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspaces
COPY package.json ./
COPY package-lock.json* ./
COPY tsconfig.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy frontend package
COPY Frontend ./Frontend

# Install all dependencies
RUN npm install

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build frontend with correct API URL (build-time variable)
WORKDIR /app/Frontend
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Expose port
EXPOSE 5001

# Start command
CMD ["npm", "run", "start", "--", "-p", "5001"]
