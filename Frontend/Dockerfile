# Use the official Node.js runtime as a parent image
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the source code
COPY . .

# Build the Angular application
RUN npm run build --configuration=production

# Use nginx as the web server
FROM nginx:alpine

# Copy the built Angular app to nginx
COPY --from=builder /app/dist/eco-track-dashboard /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
