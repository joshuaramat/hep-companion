#!/bin/sh

# Database management script
case "$1" in
  "backup")
    pg_dump -h db -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
    ;;
  "restore")
    if [ -z "$2" ]; then
      echo "Usage: db.sh restore <backup_file>"
      exit 1
    fi
    psql -h db -U postgres -d postgres < "$2"
    ;;
  "migrate")
    npm run docker:db:migrate
    ;;
  "seed")
    npm run docker:db:seed
    ;;
  "reset")
    npm run docker:db:reset
    ;;
  *)
    echo "Usage: db.sh {backup|restore|migrate|seed|reset}"
    exit 1
    ;;
esac 