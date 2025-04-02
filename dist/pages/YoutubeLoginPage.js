"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeLoginPage = void 0;
class YoutubeLoginPage {
    page;
    emailInput;
    passwordInput;
    nextButton;
    continueButton;
    selectAllCheckbox;
    emailErrorMessage;
    passwordErrorMessage;
    cancelButton;
    alreadyHasAccess;
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('input[type="email"]');
        this.passwordInput = page.locator('input[type="password"]');
        //this.passwordInput = page.locator('getByRole("textbox", { name: "Enter your password" })')
        this.nextButton = page.locator('button:has-text("Next")');
        this.continueButton = page.locator('button:has-text("Continue")');
        this.selectAllCheckbox = page.locator('text=Select all permissions');
        this.alreadyHasAccess = page.locator('text=Spikerz already has some access');
        this.emailErrorMessage = page.locator('text=Couldn\'t find your Google Account');
        this.passwordErrorMessage = page.locator('text=Wrong password');
        this.cancelButton = page.locator('button:has-text("Cancel")');
    }
    async fillEmail(email) {
        await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
        await this.emailInput.fill(email);
        await this.nextButton.click();
    }
    async fillPassword(password) {
        //await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
        await this.passwordInput.fill(password);
        await this.nextButton.click();
        await this.continueButton.click();
    }
    async handlePermissions() {
        try {
            // Wait for a short time to see if the permissions page appears
            //await this.page.waitForSelector('text=Select what Spikerz can access', { timeout: 10000 });
            await this.continueButton.click();
            // Check if "Select all" checkbox exists and is not already checked
            const selectAllExists = await this.selectAllCheckbox.isVisible();
            //await this.selectAllCheckbox.click();
            if (selectAllExists) {
                // Click the "Select all" checkbox if it's not already checked
                await this.selectAllCheckbox.click();
            }
            else {
                //the email account already has access
                await this.alreadyHasAccess.isVisible();
                await this.continueButton.click();
            }
        }
        catch (error) {
            console.log('Permissions page not found or already handled, continuing...');
            // If the permissions page doesn't appear, just try to click continue
            //await this.page.keyboard.press('End');
            await this.continueButton.click();
            console.log('Continue button not found, proceeding with the test');
        }
    }
    async clickContinueButton() {
        await this.continueButton.click();
    }
    async clickCancelButton() {
        if (await this.cancelButton.isVisible()) {
            await this.cancelButton.click();
        }
        else {
            throw new Error('Cancel button not visible');
        }
    }
    async checkForEmailError() {
        try {
            await this.emailErrorMessage.waitFor({ state: 'visible', timeout: 5000 });
            return true;
        }
        catch {
            return false;
        }
    }
    async checkForPasswordError() {
        try {
            await this.passwordErrorMessage.waitFor({ state: 'visible', timeout: 5000 });
            return true;
        }
        catch {
            return false;
        }
    }
    async waitForNetworkError() {
        try {
            // Looking for common network error messages
            const networkErrorLocators = [
                this.page.locator('text=No internet'),
                this.page.locator('text=Check your connection'),
                this.page.locator('text=network error'),
                this.page.locator('text=connection lost')
            ];
            for (const locator of networkErrorLocators) {
                if (await locator.isVisible({ timeout: 500 })) {
                    return true;
                }
            }
            return false;
        }
        catch {
            return false;
        }
    }
}
exports.YoutubeLoginPage = YoutubeLoginPage;
//# sourceMappingURL=YoutubeLoginPage.js.map