# Use a lightweight Node.js base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy only the package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app source
COPY . .

# Expose notification service port
EXPOSE 5007

# Start the service
CMD ["npm", "start"]
