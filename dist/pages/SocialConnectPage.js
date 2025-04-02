"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialConnectPage = void 0;
class SocialConnectPage {
    // Instance properties with types
    page;
    youtubeIcon;
    youtubeLoginButton;
    bakeryShopElement;
    baseUrl;
    constructor(page) {
        this.page = page;
        this.youtubeIcon = page.locator('.ant-card-body .platform-icon.platform-youtube');
        this.youtubeLoginButton = page.locator('app-google-and-youtube-login button.ant-btn');
        this.bakeryShopElement = page.getByText('@dina_bakery_shop');
        this.baseUrl = process.env.BASE_URL || 'https://demo.spikerz.com';
    }
    async goTo(credentials) {
        const { username, password } = credentials;
        await this.page.goto(`https://${username}:${password}@${this.baseUrl.replace('https://', '')}/social-connect/`);
    }
    async clickYoutubeIcon() {
        await this.youtubeIcon.waitFor();
        await this.youtubeIcon.click();
    }
    async clickLoginButton() {
        const popupPromise = this.page.waitForEvent('popup');
        await this.youtubeLoginButton.click();
        const popup = await popupPromise;
        return [popup];
    }
    async verifyBakeryShopVisible() {
        await this.bakeryShopElement.waitFor();
        return this.bakeryShopElement.isVisible();
    }
}
exports.SocialConnectPage = SocialConnectPage;
//# sourceMappingURL=SocialConnectPage.js.map