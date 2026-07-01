FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci
# previously npm install --loglevel verbose

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Run migrations - moved to docker-compose.yml

# Expose port
EXPOSE 3000

# Start dev server with hot reload
# CMD ["npm", "run", "dev"]
# - moved to docker-compose.yml
