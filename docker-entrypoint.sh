#!/bin/sh
# Apply migrations, seed once if the database is empty, then start the server.
set -e

mkdir -p /app/data
cd /app/apps/api

echo "Applying migrations…"
npx prisma migrate deploy

COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.employee.count().then(c=>{console.log(c);return p.\$disconnect()}).catch(()=>{console.log(0)})")
if [ "$COUNT" = "0" ]; then
  echo "Empty database — seeding 10,000 employees…"
  npm run db:seed
else
  echo "Database already has $COUNT employees — skipping seed."
fi

echo "Starting server on port ${PORT}…"
exec node dist/index.js
