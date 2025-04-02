import { Locator, Page, expect } from '@playwright/test';

export class YoutubeLoginPage {
  private page: Page;
  private emailInput: Locator;
  private passwordInput: Locator;
  private nextButton: Locator;
  private continueButton: Locator;
  private selectAllCheckbox: Locator;
  private emailErrorMessage: Locator;
  private passwordErrorMessage: Locator;
  private cancelButton: Locator;
  private alreadyHasAccess: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.nextButton = page.locator('button:has-text("Next")');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.selectAllCheckbox = page.locator('text=Select all permissions');
    this.alreadyHasAccess = page.locator('text=Spikerz already has some access');
    this.emailErrorMessage = page.locator('text=Couldn\'t find your Google Account');
    this.passwordErrorMessage = page.locator('text=Wrong password');
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailInput.fill(email);
    await this.nextButton.click();
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.nextButton.click();
    await this.continueButton.click();

  }

  async handlePermissions(): Promise<void> {
    try {
      await this.continueButton.click();
      // Check if "Select all" checkbox exists and is not already checked
      const selectAllExists = await this.selectAllCheckbox.isVisible();
      if (selectAllExists) {
        // Click the "Select all" checkbox if it's not already checked
        await this.selectAllCheckbox.click();
      } else {
        //the email account already has access
        await this.alreadyHasAccess.isVisible()
        await this.continueButton.click();
      }
     
    } catch (error) {
      console.log('Permissions page not found or already handled, continuing...');
      // If the permissions page doesn't appear, just try to click continue
        await this.continueButton.click();
        console.log('Continue button not found, proceeding with the test');
    }
  }



  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickCancelButton(): Promise<void> {
    if (await this.cancelButton.isVisible()) {
      await this.cancelButton.click();
    } else {
      throw new Error('Cancel button not visible');
    }
  }

  async checkForEmailError(): Promise<boolean> {
    try {
      await this.emailErrorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async checkForPasswordError(): Promise<boolean> {
    try {
      await this.passwordErrorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async waitForNetworkError(): Promise<boolean> {
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
    } catch {
      return false;
    }
  }
}