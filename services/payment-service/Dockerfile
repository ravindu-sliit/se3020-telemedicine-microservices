# Use a lightweight Node.js base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy only the package.json and package-lock.json first
# This is a caching trick! It speeds up future builds if dependencies haven't changed.
COPY package*.json ./

# Install dependencies strictly based on package-lock.json
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the payment service port
EXPOSE 5006

# The command to start the microservice
CMD ["npm", "start"]