# Use the base Node.js image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package files from this service directory to the working directory
COPY ./services/notification-service/package*.json ./

# Install dependencies
# Clear npm cache and remove node_modules if it exists, then install dependencies
RUN npm install --force

# Install nodemon globally for development
RUN npm install -g nodemon

# Copy the shared folder (assuming the build context is set to the project root in docker-compose.yml)
COPY ./shared ./shared

# Copy the rest of the notification-service code
COPY ./services/notification-service .

# Set environment variable and expose the port
ENV PORT=3004
EXPOSE 3004

# Run the application in development mode using Nodemon
CMD ["nodemon", "--legacy-watch", "app.js"]
#CMD ["node", "app.js"]
