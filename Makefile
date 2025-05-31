.PHONY: dev build test clean logs ps debug profile db-backup db-restore db-reset

# Development
dev:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker up -d

dev-tools:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker --profile dev-tools up -d

monitoring:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker --profile monitoring up -d

# Build
build:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker build

build-tools:
	docker-compose -f docker/docker-compose.dev.yml build tools

# Testing
test:
	docker-compose -f docker/docker-compose.test.yml run --rm jest npm run test

test-watch:
	docker-compose -f docker/docker-compose.test.yml run --rm jest npm run test:watch

test-integration:
	docker-compose -f docker/docker-compose.test.yml run --rm playwright npm run test:integration

# Database
db-backup:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker exec tools db.sh backup

db-restore:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker exec tools db.sh restore $(file)

db-reset:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker exec tools db.sh reset

# Debugging
debug:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker exec tools debug.sh $(cmd)

profile:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker exec tools profile.sh $(cmd)

# Monitoring
logs:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker logs -f

ps:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker ps

# Cleanup
clean:
	docker-compose -f docker/docker-compose.yml --env-file .env.docker down -v --remove-orphans

clean-all: clean
	docker system prune -f 