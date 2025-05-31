# Docker Secrets Directory

This directory contains sensitive configuration files for Docker services. 

## Usage

1. Copy example files to create actual secret files:
   ```bash
   cp postgres_password.txt.example postgres_password.txt
   ```

2. Edit the files with your actual secret values

3. Never commit the actual secret files (they are gitignored)

## Required Files

For production deployment, you need:

- `postgres_password.txt` - PostgreSQL database password

## Security Notes

- All non-example files in this directory are gitignored
- Use strong, randomly generated passwords
- Consider using a secrets management service in production
- Regularly rotate secrets
- Never share or commit actual secret values 