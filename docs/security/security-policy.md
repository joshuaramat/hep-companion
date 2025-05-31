# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | yes |
| < 1.0   | no |

## Reporting a Vulnerability

We take the security of HEP Companion seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Please report security vulnerabilities by emailing:
- Primary: security@hep-companion.com
- Secondary: joshuaramat@github.com

### What to Include

Please include the following details:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the issue
- Location of affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution Target**: Within 30 days for critical issues

## Security Best Practices

### For Users
1. Keep your instance updated to the latest version
2. Use strong, unique passwords
3. Enable two-factor authentication when available
4. Regularly review access logs
5. Report suspicious activity immediately

### For Developers
1. Follow OWASP guidelines
2. Never commit secrets or credentials
3. Use environment variables for sensitive data
4. Implement proper input validation
5. Keep dependencies updated

## Security Features

HEP Companion implements several security measures:
- Row-Level Security (RLS) in the database
- Automated security scanning in CI/CD
- Container vulnerability scanning
- Comprehensive audit logging
- Encrypted data transmission (HTTPS)
- Input validation and sanitization
- Role-based access control

## Disclosure Policy

When we receive a security report, we will:
1. Confirm receipt of your vulnerability report
2. Assess the issue and determine its impact
3. Work on fixes for all supported versions
4. Keep you informed about our progress
5. Credit you for the discovery (unless you prefer to remain anonymous)

## Security Updates

Security updates will be released as:
- **Critical**: Immediate patch release
- **High**: Within 7 days
- **Medium**: Within 30 days
- **Low**: Next regular release

Subscribe to security updates:
- Watch this repository's releases
- Follow our security advisory page
- Join our security mailing list (coming soon)

## Contact

For any security-related questions, contact:
- Email: [Coming Soon]
- PGP Key: [Coming Soon]

Thank you for helping keep HEP Companion and our users safe! 