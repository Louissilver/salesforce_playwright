import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { TextField, PicklistField, NumberField } from '../utils/SalesforceFields';

/**
 * Page object for the Salesforce Acomodacao__c custom object.
 * Covers CRUD operations on the Acomodacao list and record pages.
 */
export class AcomodacaoPage extends BasePage {
  /** "Nome de Acomodacao" text field inside the New/Edit modal. */
  readonly roomNameField: TextField;
  /** Room number text field inside the New/Edit modal. */
  readonly roomNumberField: TextField;
  /** Floor number field inside the New/Edit modal. */
  readonly floorField: NumberField;
  /** Bed type picklist inside the New/Edit modal. */
  readonly bedTypeField: PicklistField;

  constructor(page: Page) {
    super(page);
    this.roomNameField = new TextField(page, 'Nome de Acomodacao');
    this.roomNumberField = new TextField(page, 'numerodoquarto');
    this.floorField = new NumberField(page, 'Andar');
    this.bedTypeField = new PicklistField(page, 'Tipodecama');
  }

  /**
   * Navigates to the Acomodacao__c list view.
   */
  async navigate() {
    await this.navigateToObject('Acomodacao__c');
  }

  /**
   * Fills the "Nome de Acomodacao" field in the open modal.
   *
   * @param name - Value to enter in the room name field.
   */
  async fillRoomName(name: string) {
    await this.roomNameField.fill(name);
  }

  /**
   * Fills the room number field in the open modal.
   *
   * @param number - Room number value (e.g. `'101'`).
   */
  async fillRoomNumber(number: string) {
    await this.roomNumberField.fill(number);
  }

  /**
   * Fills the floor number field in the open modal.
   *
   * @param floor - Floor number value (e.g. `'1'`).
   */
  async fillFloor(floor: string | number) {
    await this.floorField.fill(floor);
  }

  /**
   * Selects a bed type option from the dropdown in the open modal.
   *
   * @param bedType - Visible option label to select (e.g. `'Casal'`, `'Solteiro'`).
   */
  async fillBedType(bedType: string) {
    await this.bedTypeField.select(bedType);
  }

  /**
   * Creates a new Acomodacao__c record end-to-end:
   * opens the modal, fills all required fields with default values (room 101,
   * floor 1, bed type Casal), saves, and waits for the record page.
   *
   * @param name - Name for the new Acomodacao record.
   */
  async createAcomodacao(name: string) {
    await this.clickNew();
    await this.fillRoomName(name);
    await this.fillRoomNumber('101');
    await this.fillFloor('1');
    await this.fillBedType('Casal');
    await this.save();
    await this.waitForRecordPage();
  }

  /**
   * Opens an Acomodacao record from the list view by its name.
   *
   * @param name - Exact record name as shown in the list.
   */
  async openAcomodacao(name: string) {
    await this.getListItem(name).click();
    await this.waitForRecordPage();
  }

  /**
   * Deletes an Acomodacao record end-to-end:
   * opens the record, triggers delete via the actions menu, confirms,
   * and waits for the list view to reload.
   *
   * @param name - Exact record name to delete.
   */
  async deleteAcomodacao(name: string) {
    await this.openAcomodacao(name);
    await this.openActionsMenu();
    await this.clickActionMenuItem('Delete');
    await this.confirmDelete();
    await this.waitForListPage('Acomodacao__c');
  }
}
