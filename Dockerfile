FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json tsconfig.json package-lock.json* ./ 

# Install dependencies
RUN npm ci
RUN npm install playwright
RUN npx playwright install-deps
RUN npm install --save-dev @types/express

# Install Playwright browsers
RUN npx playwright install chrome

# Copy project files
COPY . .

# Build TypeScript
RUN npx tsc

# Expose the API port
EXPOSE 3000

# Define environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Command to run the API server
CMD ["node", "dist/src/server.js"]