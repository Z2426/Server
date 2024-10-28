# Use the base Node.js image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package files from this service directory to the working directory
COPY ./services/post-service/package*.json ./

# Install dependencies
# Clear npm cache and remove node_modules if it exists, then install dependencies
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install

RUN npm install -g nodemon


# Copy the shared folder (assuming the build context is set to the project root in docker-compose.yml)
COPY ./shared /usr/src/app/shared


# Copy the rest of the user-service code
COPY ./services/user-service .
# Set environment variable and expose the port
ENV PORT=3002
EXPOSE 3002

# Run the application in development mode using Nodemon
#CMD ["npm", "run", "dev"]
#CMD ["npm","start"]
CMD ["nodemon", "--legacy-watch", "app.js"]
