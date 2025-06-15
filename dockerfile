# Use an appropriate base image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Copy application dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy local code to the container image
COPY . .

# Expose port (e.g., 8080)
EXPOSE 8080

# Command to run the application
CMD [ "npm", "start" ]

