import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigateToObject(objectApiName: string) {
    await this.page.goto(`/lightning/o/${objectApiName}/list`);
    // Aguarda o botão "New" ficar visível: indica que os componentes LWC renderizaram
    await this.page.getByRole('button', { name: 'New' }).waitFor({ state: 'visible' });
  }

  async clickNew() {
    await this.page.getByRole('button', { name: 'New' }).click();
    // Aguarda o modal de criação de registro abrir (.slds-modal exclui o auraError dialog)
    await this.page.locator('.slds-modal').waitFor({ state: 'visible' });
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: 'Delete', exact: true }).click();
  }

  async openActionsMenu() {
    await this.page.getByRole('button', { name: 'Show more actions' }).click();
  }

  async clickActionMenuItem(label: string) {
    await this.page.getByRole('menuitem', { name: label }).click();
  }

  async getRecordTitle(): Promise<string> {
    // Salesforce sets page title as "RecordName | ObjectType | Salesforce"
    // This is Shadow DOM independent and reliable
    await this.page.getByRole('button', { name: 'Show more actions' }).waitFor({ state: 'visible', timeout: 30_000 });
    const title = await this.page.title();
    return title.split(' | ')[0];
  }

  async waitForRecordPage() {
    await this.page.waitForURL('**/lightning/r/**', { timeout: 30_000 });
    // "Show more actions" is always in the record header and proven to work (used by openActionsMenu)
    await this.page.getByRole('button', { name: 'Show more actions' }).waitFor({ state: 'visible', timeout: 30_000 });
  }

  async waitForListPage(objectApiName: string) {
    await this.page.waitForURL(`**/lightning/o/${objectApiName}/list**`, { timeout: 30_000 });
    await this.page.getByRole('button', { name: 'New' }).waitFor({ state: 'visible' });
  }
}
