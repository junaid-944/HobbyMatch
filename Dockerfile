# Use a stable Node LTS
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (use package-lock.json for reproducible builds)
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Create non-root user and switch
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the app port
EXPOSE 3000

# Default command
CMD ["node", "index.js"]
