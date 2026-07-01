
# Prisma
## before compose run
>Used for prisma generating migrations
```
cd backend
npx prisma generate
npx prisma migrate dev --name name
```

## when reseting migrations
```
cd backend
npx prisma migrate reset
npx prisma migrate dev --name init
```

