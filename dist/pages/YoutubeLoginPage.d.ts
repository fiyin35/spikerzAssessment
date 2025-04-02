import { Page } from '@playwright/test';
export declare class YoutubeLoginPage {
    private page;
    private emailInput;
    private passwordInput;
    private nextButton;
    private continueButton;
    private selectAllCheckbox;
    private emailErrorMessage;
    private passwordErrorMessage;
    private cancelButton;
    private alreadyHasAccess;
    constructor(page: Page);
    fillEmail(email: string): Promise<void>;
    fillPassword(password: string): Promise<void>;
    handlePermissions(): Promise<void>;
    clickContinueButton(): Promise<void>;
    clickCancelButton(): Promise<void>;
    checkForEmailError(): Promise<boolean>;
    checkForPasswordError(): Promise<boolean>;
    waitForNetworkError(): Promise<boolean>;
}
