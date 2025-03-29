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
    await this.youtubeIcon.waitFor();
    await this.youtubeIcon.click();
  }

  async clickLoginButton(): Promise<[Page]> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.youtubeLoginButton.click();
    const popup = await popupPromise;
    return [popup];
  }
  
  async verifyBakeryShopVisible(): Promise<boolean> {
    await this.bakeryShopElement.waitFor();
    return this.bakeryShopElement.isVisible();
  }
}