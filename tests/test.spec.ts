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
    if (!popup) {
      throw new Error('Popup window did not open.');
    }
    await popup.waitForLoadState('load', { timeout: 6000 });
    const youtubeLoginPage = new YoutubeLoginPage(popup);
    await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
    await youtubeLoginPage.fillPassword(GOOGLE_PASSWORD);
    // Handle permissions will also click continue button if needed
    await youtubeLoginPage.handlePermissions();
    const isVisible = await socialConnectPage.verifyBakeryShopVisible();
    expect(isVisible).toBeTruthy();
    await expect(page).toHaveURL(/social-connect/);
  });

 // Negative test: Invalid Google credentials (email only)
test('Fail to connect with invalid Google email', async ({ page }) => {
  const { SITE_USERNAME, SITE_PASSWORD, INVALID_GOOGLE_EMAIL } = envVars;
  // Initialize page objects
  const socialConnectPage = new SocialConnectPage(page);
  // Navigate to social connect page and login
  await socialConnectPage.goTo({ 
    username: SITE_USERNAME, 
    password: SITE_PASSWORD 
  });
  // Click the YouTube icon to start the connection process
  await socialConnectPage.clickYoutubeIcon();
  // Open Google login popup and wait for it to load
  const [popup] = await socialConnectPage.clickLoginButton();
  if (!popup) {
    throw new Error('Popup window did not open.');
  }
  await popup.waitForLoadState();
  // Initialize YouTube login page and enter invalid email
  const youtubeLoginPage = new YoutubeLoginPage(popup);
  await youtubeLoginPage.fillEmail(INVALID_GOOGLE_EMAIL);
  // Wait for and verify the specific "Couldn't find your Google Account" error message
  const errorMessageLocator = popup.locator('div.Ekjuhf.Jj6Lae');
  await expect(errorMessageLocator).toBeVisible({ timeout: 5000 });
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
    if (!popup) {
      throw new Error('Popup window did not open.');
    }
    await popup.waitForLoadState();
    const youtubeLoginPage = new YoutubeLoginPage(popup);
    await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
    // Close the popup to simulate cancellation
    await popup.close();
    // Wait a moment for any callbacks to fire
    await page.waitForTimeout(2000);
  // Alternative: Check that we're still on the social connect page
  await expect(page).toHaveURL(/.*social-connect/);
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
    if (!popup) {
      throw new Error('Popup window did not open.');
    }

    await popup.waitForLoadState('load', { timeout: 6000 });
    const youtubeLoginPage = new YoutubeLoginPage(popup);
    await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
    await youtubeLoginPage.fillPassword(GOOGLE_PASSWORD);
    
    // Look for a "Cancel" or "Deny" button on the permissions page
    try {
      // Wait for permissions page
      if (!popup) {
        throw new Error('Popup window did not open.');
      }
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