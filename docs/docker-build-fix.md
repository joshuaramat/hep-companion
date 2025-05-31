# Docker Build Fix Guide

## Issue: GitHub Actions Docker Build Failing on ARM64

### Problem Summary
The Docker build is failing during `npm ci` on ARM64 architecture, taking too long and getting canceled.

### Immediate Fixes

#### 1. **Optimize Dockerfile for Faster Builds**

Update your `Dockerfile` to use caching more effectively:

```dockerfile
# Use specific Node version
FROM node:20-alpine AS builder

# Install dependencies in a separate layer
WORKDIR /app
COPY package*.json ./

# Use npm ci with additional flags for faster installs
RUN npm ci --only=production --prefer-offline --no-audit --no-fund

# Copy source code after dependencies
COPY . .

# Build the application
RUN npm run build
```

#### 2. **Update GitHub Actions Workflow**

Add timeout and caching to `.github/workflows/docker.yml`:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      NODE_VERSION=18.x
    # Add timeout
    timeout-minutes: 30
    # Use registry cache
    cache-from: |
      type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
    cache-to: |
      type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max
```

#### 3. **Fix Deprecated Dependencies**

Update `package.json` to use newer versions:

```json
{
  "devDependencies": {
    // Update these deprecated packages
    "@eslint/object-schema": "^2.1.4",  // replaces @humanwhocodes/object-schema
    "@eslint/config-array": "^0.18.0",  // replaces @humanwhocodes/config-array
    "rimraf": "^5.0.10"  // update from 3.0.2
  }
}
```

Run:
```bash
npm update
npm audit fix
```

#### 4. **Multi-Stage Build Optimization**

Create a more efficient multi-stage Dockerfile:

```dockerfile
# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### 5. **Platform-Specific Builds**

Consider building for multiple platforms in parallel:

```yaml
strategy:
  matrix:
    platform: [linux/amd64, linux/arm64]
    
- name: Build and push by platform
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: ${{ matrix.platform }}
    push: true
    tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ matrix.platform }}-latest
```

### Long-term Solutions

1. **Use Docker Build Cache Mount**:
```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production
```

2. **Consider using pnpm or yarn** for faster installs:
```dockerfile
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
```

3. **Monitor Build Times** - Add build time reporting:
```yaml
- name: Report build time
  if: always()
  run: echo "Build took ${{ steps.build.outputs.duration }} seconds"
```

### Verification

After implementing fixes:
1. Test locally: `docker build --platform linux/arm64 .`
2. Check build time improvements
3. Verify all deprecation warnings are resolved
4. Monitor GitHub Actions for successful builds 