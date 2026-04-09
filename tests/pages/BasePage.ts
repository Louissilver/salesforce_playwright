import { Page, Locator } from '@playwright/test';
import { SalesforceValidationError } from '../utils/SalesforceFields';

/**
 * Base page object providing generic Salesforce Lightning operations.
 * All object-specific page classes should extend this class.
 */
export class BasePage {
  /** Toolbar "New" button — present on every list view. */
  readonly newButton: Locator;
  /** "Save" button inside record creation/edit modals. */
  readonly saveButton: Locator;
  /** "Delete" button inside the delete confirmation dialog. */
  readonly deleteButton: Locator;
  /** "Show more actions" button in the record header (kebab menu). */
  readonly actionsMenuButton: Locator;
  /**
   * SLDS modal container. Scoped to `.slds-modal` to exclude the always-present
   * auraError dialog that also carries `role="dialog"`.
   */
  readonly modal: Locator;
  /** The "We hit a snag." validation error summary panel that appears on failed saves. */
  readonly validationError: SalesforceValidationError;

  constructor(protected page: Page) {
    this.newButton = page.getByRole('button', { name: 'New' });
    this.saveButton = page.getByRole('button', { name: 'Save', exact: true });
    this.deleteButton = page.getByRole('button', { name: 'Delete', exact: true });
    this.actionsMenuButton = page.getByRole('button', { name: 'Show more actions' });
    this.modal = page.locator('.slds-modal');
    this.validationError = new SalesforceValidationError(page);
  }

  /**
   * Navigates to the list view of a Salesforce object and waits until the
   * page is fully rendered ("New" button visible).
   *
   * @param objectApiName - Salesforce API name of the object (e.g. `'Account'`, `'Acomodacao__c'`).
   */
  async navigateToObject(objectApiName: string) {
    await this.page.goto(`/lightning/o/${objectApiName}/list`);
    await this.newButton.waitFor({ state: 'visible' });
  }

  /**
   * Clicks the "New" button and waits for the creation modal to open.
   */
  async clickNew() {
    await this.newButton.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  /**
   * Clicks the "Save" button inside the active modal.
   */
  async save() {
    await this.saveButton.click();
  }

  /**
   * Confirms the delete action by clicking the "Delete" button in the
   * confirmation dialog.
   */
  async confirmDelete() {
    await this.deleteButton.click();
  }

  /**
   * Opens the record actions dropdown menu ("Show more actions" kebab button).
   */
  async openActionsMenu() {
    await this.actionsMenuButton.click();
  }

  /**
   * Clicks an item inside the currently open actions dropdown menu.
   *
   * @param label - Visible label of the menu item (e.g. `'Delete'`, `'Edit'`).
   */
  async clickActionMenuItem(label: string) {
    await this.page.getByRole('menuitem', { name: label }).click();
  }

  /**
   * Returns a locator for a record link in the list view.
   * Matches by exact visible name to avoid partial collisions.
   *
   * @param name - Exact record name as shown in the list.
   * @returns Locator scoped to the first matching link.
   */
  getListItem(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true }).first();
  }

  /**
   * Returns the name of the currently open record.
   *
   * Reads from the browser page title (`"RecordName | ObjectType | Salesforce"`),
   * which is Shadow DOM-independent and avoids LWC rendering issues.
   *
   * @returns The record name (first segment of the page title).
   */
  async getRecordTitle(): Promise<string> {
    await this.actionsMenuButton.waitFor({ state: 'visible', timeout: 30_000 });
    const title = await this.page.title();
    return title.split(' | ')[0];
  }

  /**
   * Waits until the browser has navigated to a record page and the record
   * header is fully rendered.
   */
  async waitForRecordPage() {
    await this.page.waitForURL('**/lightning/r/**', { timeout: 30_000 });
    await this.actionsMenuButton.waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Waits until the browser has navigated back to the list view of a given
   * object and the toolbar is ready.
   *
   * @param objectApiName - Salesforce API name of the object (e.g. `'Account'`).
   */
  async waitForListPage(objectApiName: string) {
    await this.page.waitForURL(`**/lightning/o/${objectApiName}/list**`, { timeout: 30_000 });
    await this.newButton.waitFor({ state: 'visible' });
  }
}
