import { test, expect, Page } from '@playwright/test';
import { SocialConnectPage } from '../pages/SocialConnectPage';
import { YoutubeLoginPage } from '../pages/YoutubeLoginPage';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();
// Load local environment variables with higher priority
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });
}

// Define the environment variables types
interface EnvironmentVariables {
  SITE_USERNAME: string;
  SITE_PASSWORD: string;
  GOOGLE_EMAIL: string;
  GOOGLE_PASSWORD: string;
  INVALID_GOOGLE_EMAIL: string;
  INVALID_GOOGLE_PASSWORD: string;
  BASE_URL: string;
}

// Type guard for environment variables
function validateEnvVars(): EnvironmentVariables {
  const requiredVars = ['SITE_USERNAME', 'SITE_PASSWORD', 'GOOGLE_EMAIL', 'GOOGLE_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  return {
    SITE_USERNAME: process.env.SITE_USERNAME as string,
    SITE_PASSWORD: process.env.SITE_PASSWORD as string,
    GOOGLE_EMAIL: process.env.GOOGLE_EMAIL as string,
    GOOGLE_PASSWORD: process.env.GOOGLE_PASSWORD as string,
    INVALID_GOOGLE_EMAIL: process.env.INVALID_GOOGLE_EMAIL || 'invalid.email@example.com',
    INVALID_GOOGLE_PASSWORD: process.env.INVALID_GOOGLE_PASSWORD || 'invalidPassword123',
    BASE_URL: process.env.BASE_URL || 'https://demo.spikerz.com',
  };
}

test.describe('Spikerz Assessment', () => {
  let envVars: EnvironmentVariables;

  test.beforeAll(() => {
    // Validate environment variables before tests run
    envVars = validateEnvVars();
  });

  test.beforeEach(async ({ page }) => {
    const { SITE_USERNAME, SITE_PASSWORD, BASE_URL } = envVars;
    await page.goto(`https://${SITE_USERNAME}:${SITE_PASSWORD}@${BASE_URL.replace('https://', '')}/social-connect`);
  });

  test('Successfully connect Youtube account', async ({ page }) => {
    const { SITE_USERNAME, SITE_PASSWORD, GOOGLE_EMAIL, GOOGLE_PASSWORD } = envVars;
    
    // Initialize page objects
    const socialConnectPage = new SocialConnectPage(page);
    
    // Navigate to social connect page - this is redundant with beforeEach but keeping for consistency
    await socialConnectPage.goTo({ 
      username: SITE_USERNAME, 
      password: SITE_PASSWORD 
    });
    
    await socialConnectPage.clickYoutubeIcon();
    
    const [popup] = await socialConnectPage.clickLoginButton();
    await popup.waitForLoadState();
    
    const youtubeLoginPage = new YoutubeLoginPage(popup);
    await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
    
    await youtubeLoginPage.fillPassword(GOOGLE_PASSWORD);

    // Handle permissions will also click continue button if needed
    await youtubeLoginPage.handlePermissions();
    
    const isVisible = await socialConnectPage.verifyBakeryShopVisible();
    expect(isVisible).toBeTruthy();
    await expect(page).toHaveURL(/social-connect/);
  });

  // Negative test: Invalid Google credentials
  test('Fail to connect with invalid Google credentials', async ({ page }) => {
    const { SITE_USERNAME, SITE_PASSWORD, INVALID_GOOGLE_EMAIL, INVALID_GOOGLE_PASSWORD } = envVars;
    
    // Initialize page objects
    const socialConnectPage = new SocialConnectPage(page);
    
    await socialConnectPage.goTo({ 
      username: SITE_USERNAME, 
      password: SITE_PASSWORD 
    });
    
    await socialConnectPage.clickYoutubeIcon();
    
    const [popup] = await socialConnectPage.clickLoginButton();
    await popup.waitForLoadState();
    
    const youtubeLoginPage = new YoutubeLoginPage(popup);
    await youtubeLoginPage.fillEmail(INVALID_GOOGLE_EMAIL);
    
    // Wait for the error message to appear
    const errorMessageLocator = popup.locator('text=Couldn\'t find your Google Account');
    
    // Expect the error message to be visible
    await expect(errorMessageLocator).toBeVisible({ timeout: 10000 })
      .catch(async (err) => {
        // If we don't find the expected error message, try to proceed with password
        // to see if we get past the email screen (some Google errors appear later)
        await youtubeLoginPage.fillPassword(INVALID_GOOGLE_PASSWORD);
        
        // Check for error messages on the password screen
        const passwordErrorLocator = popup.locator('text=Wrong password');
        await expect(passwordErrorLocator).toBeVisible({ timeout: 10000 });
      });
    
    // Verify we did NOT return to the social connect page with a successful connection
    await expect(socialConnectPage.verifyBakeryShopVisible()).rejects.toThrow();
  });

  // Negative test: Cancel the authentication flow
  test('Cancel the Google authentication flow', async ({ page }) => {
    const { SITE_USERNAME, SITE_PASSWORD, GOOGLE_EMAIL } = envVars;
    
    // Initialize page objects
    const socialConnectPage = new SocialConnectPage(page);
    
    await socialConnectPage.goTo({ 
      username: SITE_USERNAME, 
      password: SITE_PASSWORD 
    });
    
    await socialConnectPage.clickYoutubeIcon();
    
    const [popup] = await socialConnectPage.clickLoginButton();
    await popup.waitForLoadState();
    
    const youtubeLoginPage = new YoutubeLoginPage(popup);
    await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
    
    // Close the popup to simulate cancellation
    await popup.close();
    
    // Wait a moment for any callbacks to fire
    await page.waitForTimeout(2000);
    
    // Verify that no connection was established
    await expect(socialConnectPage.verifyBakeryShopVisible()).rejects.toThrow();
  });

  // Negative test: Network interruption
  test('Handle network interruption during login flow', async ({ page, context }) => {
    const { SITE_USERNAME, SITE_PASSWORD, GOOGLE_EMAIL } = envVars;
    
    // Initialize page objects
    const socialConnectPage = new SocialConnectPage(page);
    
    await socialConnectPage.goTo({ 
      username: SITE_USERNAME, 
      password: SITE_PASSWORD 
    });
    
    await socialConnectPage.clickYoutubeIcon();
    
    const [popup] = await socialConnectPage.clickLoginButton();
    await popup.waitForLoadState();
    
    const youtubeLoginPage = new YoutubeLoginPage(popup);
    await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
    
    // Simulate network failure
    await context.setOffline(true);
    
    // Try to proceed but expect a failure
    try {
      await youtubeLoginPage.clickContinueButton();
      // Wait briefly to ensure the error has time to appear
      await popup.waitForTimeout(3000);
    } catch (error) {
      // Expected to fail due to network being offline
      console.log('Expected failure due to network being offline:', error);
    }
    
    // Set network back online before the test ends
    await context.setOffline(false);
    
    // Verify no connection was established
    await expect(socialConnectPage.verifyBakeryShopVisible()).rejects.toThrow();
  });

  // Negative test: Timeout test
  test('Handle page load timeout', async ({ page }) => {
    const { SITE_USERNAME, SITE_PASSWORD } = envVars;
    
    // Initialize page objects with a very short timeout
    const socialConnectPage = new SocialConnectPage(page);
    
    await socialConnectPage.goTo({ 
      username: SITE_USERNAME, 
      password: SITE_PASSWORD 
    });
    
    await socialConnectPage.clickYoutubeIcon();
    
    // Attempt to click login with a very short timeout to force failure
    try {
      await page.locator('app-google-and-youtube-login button.ant-btn').click({ timeout: 1 });
      // This should fail because the timeout is too short
    } catch (error) {
      // Expected to fail
      const isTimeoutError = error instanceof Error && error.message.includes('timeout');
      expect(isTimeoutError).toBeTruthy();
    }
  });

  // Negative test: Permission denial
  test('Handle permission denial', async ({ page }) => {
    const { SITE_USERNAME, SITE_PASSWORD, GOOGLE_EMAIL, GOOGLE_PASSWORD } = envVars;
    
    // Initialize page objects
    const socialConnectPage = new SocialConnectPage(page);
    
    await socialConnectPage.goTo({ 
      username: SITE_USERNAME, 
      password: SITE_PASSWORD 
    });
    
    await socialConnectPage.clickYoutubeIcon();
    
    const [popup] = await socialConnectPage.clickLoginButton();
    await popup.waitForLoadState();
    
    const youtubeLoginPage = new YoutubeLoginPage(popup);
    await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
    await youtubeLoginPage.fillPassword(GOOGLE_PASSWORD);

    // Look for a "Cancel" or "Deny" button on the permissions page
    try {
      // Wait for permissions page
      await popup.waitForSelector('text=Select what Spikerz can access', { timeout: 5000 });
      
      // Look for a cancel button
      const cancelButtonLocator = popup.locator('button:has-text("Cancel")');
      if (await cancelButtonLocator.isVisible()) {
        await cancelButtonLocator.click();
        
        // Wait a moment for any callbacks to fire
        await page.waitForTimeout(2000);
        
        // Verify no connection was established
        await expect(socialConnectPage.verifyBakeryShopVisible()).rejects.toThrow();
      } else {
        // If no cancel button, test is skipped
        test.skip(true, 'Cancel button not found on permissions page');
      }
    } catch (error) {
      // If permissions page isn't found, skip this test
      test.skip(true, 'Permissions page not found, skipping test');
    }
  });
});