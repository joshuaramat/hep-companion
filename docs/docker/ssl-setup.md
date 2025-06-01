# SSL Certificates Setup

This guide covers SSL certificate configuration for HTTPS in Docker environments.

## Development - Self-Signed Certificates

For local development, you can generate self-signed certificates:

```bash
# Generate a self-signed certificate (valid for 365 days)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Production - Real Certificates

For production, you should use certificates from a trusted Certificate Authority (CA):

1. **Let's Encrypt** (free):
   ```bash
   # Install certbot
   sudo apt-get install certbot
   
   # Generate certificates
   sudo certbot certonly --standalone -d yourdomain.com
   ```

2. **Commercial CA**: Purchase from providers like DigiCert, Comodo, etc.

## Required Files

The nginx configuration expects:
- `server.crt` - The SSL certificate
- `server.key` - The private key

Place these files in the `docker/nginx/ssl/` directory.

## Security Notes

- Never commit real certificates to version control
- Keep private keys secure with proper file permissions (600)
- Use strong key sizes (minimum 2048-bit RSA)
- Regularly renew certificates before expiration
- Consider implementing HSTS in production

## Certificate Renewal

For Let's Encrypt:
```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal (cron)
0 0 * * * /usr/bin/certbot renew --quiet
```

## Docker Integration

The SSL certificates are automatically mounted into the nginx container via Docker Compose:

```yaml
volumes:
  - ./nginx/ssl:/etc/nginx/ssl:ro
```

## Related Documentation

- [Environment Setup](./environment-setup.md) - Docker environment configuration
- [Secrets Management](./secrets-management.md) - Managing sensitive configuration
- [Security Documentation](../security/) - Security policies and best practices 