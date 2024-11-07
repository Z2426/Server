# Use the base Node.js image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY ./services/websocket-service/package*.json ./

# Clear npm cache and remove node_modules if it exists, then install dependencies
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install

# Install nodemon globally
RUN npm install -g nodemon
RUN npm install redis


# Copy the shared folder (assuming the build context is set to the project root in docker-compose.yml)
COPY ./shared /usr/src/app/shared

# Copy the rest of the post-service code
COPY ./services/websocket-service .

# Set environment variable and expose the port
ENV PORT=3005
EXPOSE 3005

# Run the application in development mode using Nodemon
CMD ["nodemon", "--legacy-watch", "app.js"]
