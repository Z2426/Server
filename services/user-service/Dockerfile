# Stage 1: Build dependencies (Development)
FROM node:16-slim AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy only package.json and package-lock.json to leverage Docker cache
COPY ./services/user-service/package*.json ./

# Install all dependencies (including dev dependencies like nodemon)
RUN npm i

# Stage 2: Production image
FROM node:16-slim AS production

# Set the working directory for production container
WORKDIR /usr/src/app

# Copy only production dependencies from build stage (excluding dev dependencies like nodemon)
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy the rest of the application code (excluding node_modules)
COPY ./services/user-service ./ 
COPY ./shared /usr/src/app/shared

# Set environment variable and expose the port
ENV PORT=3002
EXPOSE 3002

# Install only production dependencies (no dev dependencies like nodemon)
RUN npm i --only=production


# Run the application in production mode
CMD ["node", "app.js"]

# Stage 3: Development (optional)
FROM node:16-slim AS dev

# Set the working directory for development container
WORKDIR /usr/src/app

# Copy dependencies from production build stage
COPY --from=production /usr/src/app /usr/src/app

# Install development tools (like nodemon)
RUN npm install -g nodemon
RUN npm i nodemailer
# Expose the development port
EXPOSE 3002

# Run the application in development mode using Nodemon
CMD ["nodemon", "--legacy-watch", "app.js"]
