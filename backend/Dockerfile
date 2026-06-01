FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Run migrations
RUN npx prisma migrate deploy || true

# Expose port
EXPOSE 3000

# Start dev server with hot reload
CMD ["npm", "run", "dev"]
