# Stage 1: Build the application (Build dependencies)
FROM node:16 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy only package.json and package-lock.json to take advantage of Docker cache
COPY ./services/auth-service/package*.json ./

# Install dependencies
RUN npm i

# Stage 2: Production image
FROM node:16-slim

# Set the working directory for production container
WORKDIR /usr/src/app

# Copy dependencies from build stage
COPY --from=build /usr/src/app /usr/src/app

# Copy shared folder into the image
COPY ./shared /usr/src/app/shared

# Copy the rest of the application files
COPY ./services/auth-service ./

# Set environment variable and expose the port
ENV PORT=3002
EXPOSE 3002

# Install only production dependencies
RUN npm install --production

# Install nodemon globally for development environment (optional, only for dev mode)
RUN npm install -g nodemon

# Command to run the application in development mode using nodemon
CMD ["nodemon", "--legacy-watch", "app.js"]
