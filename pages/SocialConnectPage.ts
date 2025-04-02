import { Locator, Page } from 'playwright';

export class SocialConnectPage {
  // Instance properties with types
  private readonly page: Page;
  private readonly youtubeIcon: Locator;
  private readonly youtubeLoginButton: Locator;
  private readonly bakeryShopElement: Locator;
  private readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.youtubeIcon = page.locator('.ant-card-body .platform-icon.platform-youtube');
    this.youtubeLoginButton = page.locator('app-google-and-youtube-login button.ant-btn');
    this.bakeryShopElement = page.getByText('@dina_bakery_shop');
    this.baseUrl = process.env.BASE_URL || 'https://demo.spikerz.com';
  }

  async goTo(credentials: { username: string; password: string }): Promise<void> {
    const { username, password } = credentials;
    await this.page.goto(`https://${username}:${password}@${this.baseUrl.replace('https://', '')}/social-connect/`);
  }
  
  async clickYoutubeIcon(): Promise<void> {
    await this.youtubeIcon.waitFor({ timeout: 4000 });
    await this.youtubeIcon.click();
  }
  
  async clickLoginButton(): Promise<[Page | null]> {
    await this.youtubeLoginButton.waitFor({ state: 'visible' }); // Ensure button is visible
  
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup', { timeout: 9000 }), // Wait for the popup
      this.youtubeLoginButton.click(), // Click the button
    ]).catch(() => [null]); // Catch errors if the popup doesn't appear
  
    if (!popup) {
      throw new Error("Popup did not appear in headless mode. Possible popup block.");
    }
  
    await popup.waitForLoadState('load', { timeout: 6000 }); // Ensure the popup loads before returning
    return [popup];
  }

  async verifyBakeryShopVisible(): Promise<boolean> {
    await this.bakeryShopElement.waitFor({timeout: 4000});
    return this.bakeryShopElement.isVisible();
  }
}