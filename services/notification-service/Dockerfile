# Stage 1: Build dependencies (Development)
FROM node:16-slim AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy only package.json and package-lock.json to leverage Docker cache
COPY ./services/notification-service/package*.json ./

# Install all dependencies (including dev dependencies for development)
RUN npm i

# Stage 2: Production image
FROM node:16-slim AS production

# Set the working directory for production container
WORKDIR /usr/src/app

# Copy only production dependencies from build stage (excluding dev dependencies)
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy the rest of the application code
COPY ./services/notification-service ./

# Copy the shared folder into the image
COPY ./shared /usr/src/app/shared

# Install only production dependencies (no dev dependencies like nodemon)
RUN npm ci --only=production

# Set environment variable and expose the port
ENV PORT=3004
EXPOSE 3004

# Run the application in production mode
CMD ["node", "app.js"]

# Stage 3: Development (optional)
FROM node:16-slim AS dev

# Set the working directory for development container
WORKDIR /usr/src/app

# Copy dependencies from production build stage (to avoid reinstalling)
COPY --from=production /usr/src/app /usr/src/app

# Install development tools (like nodemon)
RUN npm install -g nodemon

# Expose the development port
EXPOSE 3004

# Run the application in development mode using Nodemon
CMD ["nodemon", "--legacy-watch", "app.js"]
