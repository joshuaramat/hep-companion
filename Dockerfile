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
FROM mcr.microsoft.com/playwright:v1.44.0-focal AS test

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Playwright browsers are pre-installed in the Microsoft image
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