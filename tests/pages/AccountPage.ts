import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { TextField, PicklistField, AddressPicklistField, LookupField, NumberField, DateField } from '../utils/SalesforceFields';

/**
 * Page object for the Salesforce Account standard object.
 * Covers CRUD operations and exposes all modal fields for the Account list
 * and record pages.
 */
export class AccountPage extends BasePage {
  // ── Account Information ────────────────────────────────────────────────────

  /** "Account Name" required text field inside the New/Edit modal. */
  readonly accountNameField: TextField;
  /** "Rating" picklist field inside the New/Edit modal. Options: Hot, Warm, Cold. */
  readonly ratingField: PicklistField;
  /** "Phone" text field inside the New/Edit modal. */
  readonly phoneField: TextField;
  /** "Parent Account" lookup field inside the New/Edit modal. */
  readonly parentAccountField: LookupField;
  /** "Fax" text field inside the New/Edit modal. */
  readonly faxField: TextField;
  /** "Account Number" text field inside the New/Edit modal. */
  readonly accountNumberField: TextField;
  /** "Website" text field inside the New/Edit modal. */
  readonly websiteField: TextField;
  /** "Account Site" text field inside the New/Edit modal. */
  readonly accountSiteField: TextField;
  /** "Ticker Symbol" text field inside the New/Edit modal. */
  readonly tickerSymbolField: TextField;
  /** "Type" picklist field inside the New/Edit modal. Options: Prospect, Customer - Direct, Customer - Channel, Channel Partner / Reseller, Installation Partner, Technology Partner, Other. */
  readonly typeField: PicklistField;
  /** "Ownership" picklist field inside the New/Edit modal. Options: Public, Private, Subsidiary, Other. */
  readonly ownershipField: PicklistField;
  /** "Industry" picklist field inside the New/Edit modal. Options: Agriculture, Banking, Consulting, Education, Technology, and more. */
  readonly industryField: PicklistField;
  /** "Employees" number (spinbutton) field inside the New/Edit modal. */
  readonly employeesField: NumberField;
  /** "Annual Revenue" number (spinbutton) field inside the New/Edit modal. */
  readonly annualRevenueField: NumberField;
  /** "SIC Code" text field inside the New/Edit modal. */
  readonly sicCodeField: TextField;

  // ── Billing Address ────────────────────────────────────────────────────────

  /** "Billing Country" geo-picklist field inside the New/Edit modal. */
  readonly billingCountryField: AddressPicklistField;
  /** "Billing Street" text field inside the New/Edit modal. */
  readonly billingStreetField: TextField;
  /** "Billing City" text field inside the New/Edit modal. */
  readonly billingCityField: TextField;
  /**
   * "Billing State/Province" geo-picklist field inside the New/Edit modal.
   * Options are populated after selecting a Billing Country.
   */
  readonly billingStateField: AddressPicklistField;
  /** "Billing Zip/Postal Code" text field inside the New/Edit modal. */
  readonly billingZipField: TextField;

  // ── Shipping Address ───────────────────────────────────────────────────────

  /** "Shipping Country" geo-picklist field inside the New/Edit modal. */
  readonly shippingCountryField: AddressPicklistField;
  /** "Shipping Street" text field inside the New/Edit modal. */
  readonly shippingStreetField: TextField;
  /** "Shipping City" text field inside the New/Edit modal. */
  readonly shippingCityField: TextField;
  /**
   * "Shipping State/Province" geo-picklist field inside the New/Edit modal.
   * Options are populated after selecting a Shipping Country.
   */
  readonly shippingStateField: AddressPicklistField;
  /** "Shipping Zip/Postal Code" text field inside the New/Edit modal. */
  readonly shippingZipField: TextField;

  // ── Additional Information ─────────────────────────────────────────────────

  /** "Customer Priority" picklist field inside the New/Edit modal. Options: High, Low, Medium. */
  readonly customerPriorityField: PicklistField;
  /** "SLA" picklist field inside the New/Edit modal. Options: Gold, Silver, Platinum, Bronze. */
  readonly slaField: PicklistField;
  /** "SLA Expiration Date" date field inside the New/Edit modal. Format: DD/MM/YYYY. */
  readonly slaExpirationDateField: DateField;
  /** "SLA Serial Number" text field inside the New/Edit modal. */
  readonly slaSerialNumberField: TextField;
  /** "Number of Locations" number (spinbutton) field inside the New/Edit modal. */
  readonly numberOfLocationsField: NumberField;
  /** "Upsell Opportunity" picklist field inside the New/Edit modal. Options: Maybe, No, Yes. */
  readonly upsellOpportunityField: PicklistField;
  /** "Active" picklist field inside the New/Edit modal. Options: No, Yes. */
  readonly activeField: PicklistField;

  // ── Description Information ────────────────────────────────────────────────

  /** "Description" textarea field inside the New/Edit modal. */
  readonly descriptionField: TextField;

  constructor(page: Page) {
    super(page);
    // Account Information
    this.accountNameField = new TextField(page, 'Account Name');
    this.ratingField = new PicklistField(page, 'Rating');
    this.phoneField = new TextField(page, 'Phone');
    this.parentAccountField = new LookupField(page, 'Parent Account');
    this.faxField = new TextField(page, 'Fax');
    this.accountNumberField = new TextField(page, 'Account Number');
    this.websiteField = new TextField(page, 'Website');
    this.accountSiteField = new TextField(page, 'Account Site');
    this.tickerSymbolField = new TextField(page, 'Ticker Symbol');
    this.typeField = new PicklistField(page, 'Type');
    this.ownershipField = new PicklistField(page, 'Ownership');
    this.industryField = new PicklistField(page, 'Industry');
    this.employeesField = new NumberField(page, 'Employees');
    this.annualRevenueField = new NumberField(page, 'Annual Revenue');
    this.sicCodeField = new TextField(page, 'SIC Code');
    // Billing Address
    this.billingCountryField = new AddressPicklistField(page, 'Billing Country');
    this.billingStreetField = new TextField(page, 'Billing Street');
    this.billingCityField = new TextField(page, 'Billing City');
    this.billingStateField = new AddressPicklistField(page, 'Billing State/Province');
    this.billingZipField = new TextField(page, 'Billing Zip/Postal Code');
    // Shipping Address
    this.shippingCountryField = new AddressPicklistField(page, 'Shipping Country');
    this.shippingStreetField = new TextField(page, 'Shipping Street');
    this.shippingCityField = new TextField(page, 'Shipping City');
    this.shippingStateField = new AddressPicklistField(page, 'Shipping State/Province');
    this.shippingZipField = new TextField(page, 'Shipping Zip/Postal Code');
    // Additional Information
    this.customerPriorityField = new PicklistField(page, 'Customer Priority');
    this.slaField = new PicklistField(page, 'SLA');
    this.slaExpirationDateField = new DateField(page, 'SLA Expiration Date');
    this.slaSerialNumberField = new TextField(page, 'SLA Serial Number');
    this.numberOfLocationsField = new NumberField(page, 'Number of Locations');
    this.upsellOpportunityField = new PicklistField(page, 'Upsell Opportunity');
    this.activeField = new PicklistField(page, 'Active');
    // Description Information
    this.descriptionField = new TextField(page, 'Description');
  }

  /**
   * Navigates to the Account list view.
   */
  async navigate() {
    await this.navigateToObject('Account');
  }

  /**
   * Fills the "Account Name" field in the open modal.
   *
   * @param name - Value to enter in the Account Name field.
   */
  async fillName(name: string) {
    await this.accountNameField.fill(name);
  }

  /**
   * Creates a new Account record end-to-end:
   * opens the modal, fills the name, saves, and waits for the record page.
   *
   * @param name - Name for the new Account.
   */
  async createAccount(name: string) {
    await this.clickNew();
    await this.fillName(name);
    await this.save();
    await this.waitForRecordPage();
  }

  /**
   * Opens an Account record from the list view by its name.
   *
   * @param name - Exact Account name as shown in the list.
   */
  async openAccount(name: string) {
    await this.getListItem(name).click();
    await this.waitForRecordPage();
  }

  /**
   * Deletes an Account record end-to-end:
   * opens the record, triggers delete via the actions menu, confirms,
   * and waits for the list view to reload.
   *
   * @param name - Exact Account name to delete.
   */
  async deleteAccount(name: string) {
    await this.openAccount(name);
    await this.openActionsMenu();
    await this.clickActionMenuItem('Delete');
    await this.confirmDelete();
    await this.waitForListPage('Account');
  }
}
