# Stage 1: Build dependencies (build environment)
FROM node:16 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to take advantage of Docker cache
COPY ./services/post-service/package*.json ./

# Install dependencies using npm ci for faster, more reliable installs
RUN npm i
RUN npm install redis


# Install nodemon globally (for development environment)
RUN npm install -g nodemon

# Stage 2: Production image
FROM node:16-slim

# Set the working directory for production
WORKDIR /usr/src/app

# Install nodemon globally in the production image
RUN npm install -g nodemon

# Copy node_modules from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy the rest of the application code (excluding node_modules)
COPY ./services/post-service ./ 
COPY ./shared /usr/src/app/shared

# Set environment variable and expose the port
ENV PORT=3002
EXPOSE 3002

# Run the application in development mode using Nodemon (for development)
CMD ["nodemon", "--legacy-watch", "app.js"]

# If you're running in a production environment, use this instead of nodemon:
# # Lệnh chạy ứng dụng khi container được khởi động
#CMD ["node", "app.js"]
