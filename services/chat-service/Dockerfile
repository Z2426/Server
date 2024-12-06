# Stage 1: Build dependencies
FROM node:16 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to take advantage of Docker cache
COPY ./services/chat-service/package*.json ./

# Install dependencies using npm ci for faster, more reliable installs (only if you have package-lock.json)
RUN npm i

# Stage 2: Production image
FROM node:16-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy node_modules from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy the rest of the application code (excluding node_modules)
COPY ./services/chat-service ./
COPY ./shared /usr/src/app/shared

# Set environment variable and expose the port
ENV PORT=3007
EXPOSE 3007

# Run the application in production mode
CMD ["npm", "start"]
