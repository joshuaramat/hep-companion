# Developer Onboarding Guide

## Quick Start

1. **Prerequisites**
   - Docker Desktop
   - VSCode with Remote Containers extension
   - Git

2. **Clone and Setup**
   ```bash
   git clone https://github.com/your-org/hep-companion.git
   cd hep-companion
   ```

3. **Start Development Environment**
   ```bash
   # Start all services
   make dev

   # Start development tools
   make dev-tools

   # Start monitoring stack
   make monitoring
   ```

4. **Open in VSCode**
   - Open VSCode
   - Click "Open Folder in Container"
   - Select the project directory

## Development Workflow

### Common Tasks

```bash
# Run tests
make test
make test-watch
make test-integration

# Database operations
make db-backup
make db-restore file=backup.sql
make db-reset

# Debugging
make debug cmd="npm run dev"
make profile cmd="npm run dev"

# View logs
make logs
```

### Monitoring

- **Grafana**: http://localhost:3002
  - Username: admin
  - Password: admin
  - Pre-configured dashboards available

- **Prometheus**: http://localhost:9090
  - View metrics
  - Create alerts

- **Loki**: http://localhost:3100
  - View application logs
  - Search and filter logs

## Development Tools

### Debugging
- Node.js debugger on port 9229
- Performance profiling with Clinic.js
- Database management tools

### VSCode Extensions
- ESLint
- Prettier
- Docker
- Kubernetes
- Grafana
- Prometheus

## Best Practices

### Code Style
- Use ESLint and Prettier
- Follow TypeScript best practices
- Write unit tests for new features
- Document API changes

### Git Workflow
1. Create feature branch
2. Write tests
3. Implement feature
4. Run all tests
5. Create pull request

### Performance
- Use performance profiling tools
- Monitor memory usage
- Check database query performance
- Review API response times

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database status
make ps

# View database logs
make logs db
```

#### Application Issues
```bash
# Check application status
make ps

# View application logs
make logs app

# Debug application
make debug cmd="npm run dev"
```

#### Monitoring Issues
```bash
# Check monitoring stack
make ps

# View monitoring logs
make logs prometheus
make logs grafana
make logs loki
```

## Support

- Check the [Development Documentation](./)
- Review [CI/CD Guide](./ci-cd.md)