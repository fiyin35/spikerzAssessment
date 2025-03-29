# Spikerz Automation

This project provides a containerized Playwright automation test for connecting a YouTube account to the Spikerz platform. The automation is exposed via an HTTP API.

## Features

- TypeScript implementation with strict type checking
- Dockerized environment with all dependencies
- HTTP API to trigger automation runs
- Page Object Model design pattern
- Environment variable configuration

## Prerequisites

- Docker
- Node.js 18+ (for local development)
- A valid Google/YouTube account
- Access to the Spikerz platform

## Environment Variables

Create a `.env.local` file with the following variables:

```
SITE_USERNAME=your_site_username
SITE_PASSWORD=your_site_password
GOOGLE_EMAIL=your_google_email
GOOGLE_PASSWORD=your_google_password
BASE_URL=https://demo.spikerz.com
```

## Building and Running the Docker Container

### Build the Docker image

```bash
docker build -t spikerz-automation-ts .
```

### Run the container

```bash
docker run -p 3000:3000 --env-file .env spikerz-automation-ts
```

This will start the API server on port 3000.

## API Usage

### Check API Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Service is running"
}
```

### Run Automation

```bash
curl -X POST http://localhost:3000/run-automation \
  -H "Content-Type: application/json" \
  -d '{"headless": true, "timeout": 60000}'
```

#### Parameters:

- `headless` (optional, default: true): Whether to run browsers in headless mode
- `timeout` (optional, default: 30000): Test timeout in milliseconds

#### Response:

```json
{
  "status": "success",
  "message": "Automation completed successfully",
  "output": "Test output..."
}
```

## Local Development

### Install dependencies

```bash
npm install
```

### Run TypeScript build

```bash
npm run build
```

### Start the development server

```bash
npm run dev
```

### Run tests directly

```bash
npm test
```

## Troubleshooting

- If the automation fails, check the API response for detailed error messages
- Verify that your environment variables are correctly set
- Ensure your Google account doesn't have 2FA enabled, or use an app password