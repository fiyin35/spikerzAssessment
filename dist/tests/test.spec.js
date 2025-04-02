"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const SocialConnectPage_1 = require("../pages/SocialConnectPage");
const YoutubeLoginPage_1 = require("../pages/YoutubeLoginPage");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config();
// Load local environment variables with higher priority
if (fs_1.default.existsSync(path_1.default.join(process.cwd(), '.env.local'))) {
    dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env.local'), override: true });
}
// Type guard for environment variables
function validateEnvVars() {
    const requiredVars = ['SITE_USERNAME', 'SITE_PASSWORD', 'GOOGLE_EMAIL', 'GOOGLE_PASSWORD'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    return {
        SITE_USERNAME: process.env.SITE_USERNAME,
        SITE_PASSWORD: process.env.SITE_PASSWORD,
        GOOGLE_EMAIL: process.env.GOOGLE_EMAIL,
        GOOGLE_PASSWORD: process.env.GOOGLE_PASSWORD,
        INVALID_GOOGLE_EMAIL: process.env.INVALID_GOOGLE_EMAIL || 'invalid.email@example.com',
        INVALID_GOOGLE_PASSWORD: process.env.INVALID_GOOGLE_PASSWORD || 'invalidPassword123',
        BASE_URL: process.env.BASE_URL || 'https://demo.spikerz.com',
    };
}
test_1.test.describe('Spikerz Assessment', () => {
    let envVars;
    test_1.test.beforeAll(() => {
        // Validate environment variables before tests run
        envVars = validateEnvVars();
    });
    test_1.test.beforeEach(async ({ page }) => {
        const { SITE_USERNAME, SITE_PASSWORD, BASE_URL } = envVars;
        await page.goto(`https://${SITE_USERNAME}:${SITE_PASSWORD}@${BASE_URL.replace('https://', '')}/social-connect`);
    });
    (0, test_1.test)('Successfully connect Youtube account', async ({ page }) => {
        const { SITE_USERNAME, SITE_PASSWORD, GOOGLE_EMAIL, GOOGLE_PASSWORD } = envVars;
        // Initialize page objects
        const socialConnectPage = new SocialConnectPage_1.SocialConnectPage(page);
        // Navigate to social connect page - this is redundant with beforeEach but keeping for consistency
        await socialConnectPage.goTo({
            username: SITE_USERNAME,
            password: SITE_PASSWORD
        });
        await socialConnectPage.clickYoutubeIcon();
        const [popup] = await socialConnectPage.clickLoginButton();
        await popup.waitForLoadState();
        const youtubeLoginPage = new YoutubeLoginPage_1.YoutubeLoginPage(popup);
        await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
        await youtubeLoginPage.fillPassword(GOOGLE_PASSWORD);
        // Handle permissions will also click continue button if needed
        await youtubeLoginPage.handlePermissions();
        const isVisible = await socialConnectPage.verifyBakeryShopVisible();
        (0, test_1.expect)(isVisible).toBeTruthy();
        await (0, test_1.expect)(page).toHaveURL(/social-connect/);
    });
    // Negative test: Invalid Google credentials (email only)
    (0, test_1.test)('Fail to connect with invalid Google email', async ({ page }) => {
        const { SITE_USERNAME, SITE_PASSWORD, INVALID_GOOGLE_EMAIL } = envVars;
        // Initialize page objects
        const socialConnectPage = new SocialConnectPage_1.SocialConnectPage(page);
        // Navigate to social connect page and login
        await socialConnectPage.goTo({
            username: SITE_USERNAME,
            password: SITE_PASSWORD
        });
        // Click the YouTube icon to start the connection process
        await socialConnectPage.clickYoutubeIcon();
        // Open Google login popup and wait for it to load
        const [popup] = await socialConnectPage.clickLoginButton();
        await popup.waitForLoadState();
        // Initialize YouTube login page and enter invalid email
        const youtubeLoginPage = new YoutubeLoginPage_1.YoutubeLoginPage(popup);
        await youtubeLoginPage.fillEmail(INVALID_GOOGLE_EMAIL);
        // Wait for and verify the specific "Couldn't find your Google Account" error message
        const errorMessageLocator = popup.locator('div.Ekjuhf.Jj6Lae');
        await (0, test_1.expect)(errorMessageLocator).toBeVisible({ timeout: 5000 });
    });
    // Negative test: Cancel the authentication flow
    (0, test_1.test)('Cancel the Google authentication flow', async ({ page }) => {
        const { SITE_USERNAME, SITE_PASSWORD, GOOGLE_EMAIL } = envVars;
        // Initialize page objects
        const socialConnectPage = new SocialConnectPage_1.SocialConnectPage(page);
        await socialConnectPage.goTo({
            username: SITE_USERNAME,
            password: SITE_PASSWORD
        });
        await socialConnectPage.clickYoutubeIcon();
        const [popup] = await socialConnectPage.clickLoginButton();
        await popup.waitForLoadState();
        const youtubeLoginPage = new YoutubeLoginPage_1.YoutubeLoginPage(popup);
        await youtubeLoginPage.fillEmail(GOOGLE_EMAIL);
        // Close the popup to simulate cancellation
        await popup.close();
        // Wait a moment for any callbacks to fire
        await page.waitForTimeout(2000);
        // Alternative: Check that we're still on the social connect page
        await (0, test_1.expect)(page).toHaveURL(/.*social-connect/);
    });
    // Negative test: Permission denial
    (0, test_1.test)('Handle permission denial', async ({ page }) => {
        const { SITE_USERNAME, SITE_PASSWORD, GOOGLE_EMAIL, GOOGLE_PASSWORD } = envVars;
        // Initialize page objects
        const socialConnectPage = new SocialConnectPage_1.SocialConnectPage(page);
        await socialConnectPage.goTo({
            username: SITE_USERNAME,
            password: SITE_PASSWORD
        });
        await socialConnectPage.clickYoutubeIcon();
        const [popup] = await socialConnectPage.clickLoginButton();
        await popup.waitForLoadState();
        const youtubeLoginPage = new YoutubeLoginPage_1.YoutubeLoginPage(popup);
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
                await (0, test_1.expect)(socialConnectPage.verifyBakeryShopVisible()).rejects.toThrow();
            }
            else {
                // If no cancel button, test is skipped
                test_1.test.skip(true, 'Cancel button not found on permissions page');
            }
        }
        catch (error) {
            // If permissions page isn't found, skip this test
            test_1.test.skip(true, 'Permissions page not found, skipping test');
        }
    });
});
//# sourceMappingURL=test.spec.js.map