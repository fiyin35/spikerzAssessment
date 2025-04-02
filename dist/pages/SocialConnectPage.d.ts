import { Page } from 'playwright';
export declare class SocialConnectPage {
    private readonly page;
    private readonly youtubeIcon;
    private readonly youtubeLoginButton;
    private readonly bakeryShopElement;
    private readonly baseUrl;
    constructor(page: Page);
    goTo(credentials: {
        username: string;
        password: string;
    }): Promise<void>;
    clickYoutubeIcon(): Promise<void>;
    clickLoginButton(): Promise<[Page]>;
    verifyBakeryShopVisible(): Promise<boolean>;
}
