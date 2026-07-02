
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

## To view database
```
cd backend
npx prisma studio
```


# Docker Compose
## Run
```
docker copmose up -d
```
## Build
```
docker compose up --build -d
```
## Stop
```
docker compose down -v
```

