import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AcomodacaoPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.navigateToObject('Acomodacao__c');
  }

  async fillNome(nome: string) {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Nome de Acomodacao' }).fill(nome);
  }

  async createAcomodacao(nome: string) {
    await this.clickNew();
    await this.fillNome(nome);
    await this.save();
    await this.waitForRecordPage();
  }

  async openAcomodacao(nome: string) {
    await this.page.getByRole('link', { name: nome, exact: true }).first().click();
    await this.waitForRecordPage();
  }

  async deleteAcomodacao(nome: string) {
    await this.openAcomodacao(nome);
    await this.openActionsMenu();
    await this.clickActionMenuItem('Delete');
    await this.confirmDelete();
    await this.waitForListPage('Acomodacao__c');
  }

  getListItem(nome: string): Locator {
    return this.page.getByRole('link', { name: nome, exact: true }).first();
  }
}
