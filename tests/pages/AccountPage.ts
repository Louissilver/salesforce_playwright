import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.navigateToObject('Account');
  }

  async fillName(name: string) {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Account Name' }).fill(name);
  }

  async createAccount(name: string) {
    await this.clickNew();
    await this.fillName(name);
    await this.save();
    await this.waitForRecordPage();
  }

  async openAccount(name: string) {
    await this.page.getByRole('link', { name, exact: true }).first().click();
    await this.waitForRecordPage();
  }

  async deleteAccount(name: string) {
    await this.openAccount(name);
    await this.openActionsMenu();
    await this.clickActionMenuItem('Delete');
    await this.confirmDelete();
    await this.waitForListPage('Account');
  }

  getListItem(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true }).first();
  }
}
