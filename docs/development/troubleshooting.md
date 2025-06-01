# Troubleshooting Guide

This document provides solutions to common development issues when working with the HEP Companion application.

## Environment Issues

### Missing Environment Variables
```bash
# Check which environment variables are missing
npm run check:env

# Copy example environment file
cp .env.example .env.local
```

### Database Connection Issues
```bash
# Verify Supabase connection
npm run db:check

# Reset database if needed
npm run db:reset
```

## Build Issues

### Type Errors
```bash
# Run type checking
npm run lint:ts

# Fix common type issues
npm run lint:ts:fix
```

### Module Resolution
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Testing Issues

### Playwright Setup
```bash
# Install Playwright browsers
npx playwright install

# Run tests in headed mode for debugging
npm run test:integration -- --headed
```

### Unit Test Failures
```bash
# Run tests in watch mode
npm run test:unit -- --watch

# Update snapshots if needed
npm run test:unit -- --updateSnapshot
```

## Development Server Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Start on different port
PORT=3001 npm run dev
```

### Hot Reload Not Working
```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev
```

## Docker Issues

### Container Won't Start
```bash
# Check Docker logs
docker-compose logs app

# Rebuild containers
docker-compose build --no-cache
```

### Database Connection in Docker
```bash
# Check network connectivity
docker-compose exec app ping db

# Verify environment variables
docker-compose exec app env | grep SUPABASE
```

## Getting Help

If you encounter issues not covered here:

1. Check the console/logs for specific error messages
2. Search existing GitHub issues
3. Review relevant documentation in `/docs`
4. Create a new issue with detailed reproduction steps

## Common Error Messages

### "Environment validation failed"
- Check `.env.local` file exists
- Verify all required variables are set
- Ensure URLs are properly formatted

### "Supabase client error"
- Verify Supabase URL and keys
- Check network connectivity
- Confirm RLS policies are correctly configured

### "OpenAI API error"
- Verify API key is valid
- Check API quota and billing
- Ensure proper error handling in requests 