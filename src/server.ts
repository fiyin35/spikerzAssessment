import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import morgan from 'morgan';
import bodyParser from 'body-parser';

const execAsync = promisify(exec);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Add middleware
app.use(morgan('combined')); // Logging
app.use(bodyParser.json()); // Parse JSON bodies

// Define validation schema for automation params
const AutomationParamsSchema = z.object({
  headless: z.boolean().optional().default(true),
  timeout: z.number().optional().default(30000)
});

type AutomationParams = z.infer<typeof AutomationParamsSchema>;

// Define routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

app.post('/run-automation', async (req, res) => {
  try {
    // Validate request body
    const params = AutomationParamsSchema.parse(req.body);
    
    // Build command with parameters
    const headlessFlag = params.headless ? '--headed=false' : '--headed=true';
    const timeoutFlag = `--timeout=${params.timeout}`;
    
    console.log(`Starting automation with params: ${JSON.stringify(params)}`);
    
    // Run the Playwright test
    const { stdout, stderr } = await execAsync(
      `npx playwright test --reporter=list ${headlessFlag} ${timeoutFlag}`
    );
    
    // Check for errors in stderr
    if (stderr) {
      console.error('Automation error:', stderr);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Automation failed', 
        error: stderr 
      });
    }
    
    // Return success response with test output
    res.status(200).json({ 
      status: 'success', 
      message: 'Automation completed successfully', 
      output: stdout 
    });
    
  } catch (error) {
    console.error('Server error:', error);
    
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid parameters', 
        details: error.errors 
      });
    }
    
    // Handle general errors
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error', 
      error: String(error) 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});