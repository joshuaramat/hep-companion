# Development stage
FROM node:20-alpine AS development

# Install dependencies for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

EXPOSE 3000

# Development command
CMD ["npm", "run", "dev"]

# Test stage
FROM node:20-alpine AS test

# Install dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set environment variables for Playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Test command (can be overridden)
CMD ["npm", "run", "test:all"]

# Dependencies stage (for production)
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Production command
CMD ["node", "server.js"] 