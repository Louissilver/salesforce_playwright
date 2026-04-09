import { test, expect } from '../fixtures';

test.describe('Contas (Account)', () => {
  test.beforeEach(async ({ accountPage }) => {
    await accountPage.navigate();
  });

  test('deve criar uma nova conta', async ({ accountPage }) => {
    const nomeConta = `Hotel Teste ${Date.now()}`;

    await accountPage.createAccount(nomeConta);

    const titulo = await accountPage.getRecordTitle();
    expect(titulo).toContain(nomeConta);
  });

  test('deve exibir conta criada na lista', async ({ accountPage }) => {
    const nomeConta = `Hotel Lista ${Date.now()}`;

    await accountPage.createAccount(nomeConta);
    await accountPage.navigate();

    await expect(accountPage.getListItem(nomeConta)).toBeVisible();
  });

  test('deve excluir uma conta', async ({ accountPage }) => {
    const nomeConta = `Hotel Exclusao ${Date.now()}`;

    await accountPage.createAccount(nomeConta);
    await accountPage.navigate();
    await accountPage.deleteAccount(nomeConta);

    await expect(accountPage.getListItem(nomeConta)).not.toBeVisible();
  });

  test('deve preencher todos os campos de uma conta e salvar com sucesso', async ({ accountPage }) => {
    const name = `Account Full Fields ${Date.now()}`;

    await accountPage.clickNew();

    // Account Information
    await accountPage.accountNameField.fill(name);
    await accountPage.ratingField.select('Hot');
    await accountPage.phoneField.fill('+55 11 99999-9999');
    await accountPage.faxField.fill('+55 11 3333-3333');
    await accountPage.accountNumberField.fill('ACC-001');
    await accountPage.websiteField.fill('https://example.com');
    await accountPage.accountSiteField.fill('Sede');
    await accountPage.tickerSymbolField.fill('EXMPL');
    await accountPage.typeField.select('Prospect');
    await accountPage.ownershipField.select('Public');
    await accountPage.industryField.select('Technology');
    await accountPage.employeesField.fill(500);
    await accountPage.annualRevenueField.fill(1000000);
    await accountPage.sicCodeField.fill('7372');

    // Billing Address — country must be selected before state options appear
    await accountPage.billingCountryField.select('Brazil');
    await accountPage.billingStateField.select('São Paulo');
    await accountPage.billingStreetField.fill('Av. Paulista, 1000');
    await accountPage.billingCityField.fill('São Paulo');
    await accountPage.billingZipField.fill('01310-100');

    // Shipping Address
    await accountPage.shippingCountryField.select('Brazil');
    await accountPage.shippingStateField.select('Rio de Janeiro');
    await accountPage.shippingStreetField.fill('Av. Rio Branco, 500');
    await accountPage.shippingCityField.fill('Rio de Janeiro');
    await accountPage.shippingZipField.fill('20040-020');

    // Additional Information
    await accountPage.customerPriorityField.select('High');
    await accountPage.slaField.select('Gold');
    await accountPage.slaExpirationDateField.fill('31/12/2026');
    await accountPage.slaSerialNumberField.fill('SLA-2026-001');
    await accountPage.numberOfLocationsField.fill(3);
    await accountPage.upsellOpportunityField.select('Yes');
    await accountPage.activeField.select('Yes');

    // Description
    await accountPage.descriptionField.fill('Conta criada pelo teste automatizado de todos os campos.');

    await accountPage.save();
    await accountPage.waitForRecordPage();

    const title = await accountPage.getRecordTitle();
    expect(title).toBe(name);

    // Cleanup
    await accountPage.deleteAccount(name);
  });

  test('deve exibir erro de validacao ao limpar campos obrigatorios', async ({ accountPage, page }) => {
    // ── Fill all fields ─────────────────────────────────────────────────────
    await accountPage.clickNew();

    await accountPage.accountNameField.fill(`Account Validation ${Date.now()}`);
    await accountPage.ratingField.select('Hot');
    await accountPage.phoneField.fill('+55 11 99999-9999');
    await accountPage.faxField.fill('+55 11 3333-3333');
    await accountPage.accountNumberField.fill('ACC-001');
    await accountPage.websiteField.fill('https://example.com');
    await accountPage.accountSiteField.fill('Sede');
    await accountPage.tickerSymbolField.fill('EXMPL');
    await accountPage.typeField.select('Prospect');
    await accountPage.ownershipField.select('Public');
    await accountPage.industryField.select('Technology');
    await accountPage.employeesField.fill(500);
    await accountPage.annualRevenueField.fill(1000000);
    await accountPage.sicCodeField.fill('7372');
    await accountPage.billingCountryField.select('Brazil');
    await accountPage.billingStateField.select('São Paulo');
    await accountPage.billingStreetField.fill('Av. Paulista, 1000');
    await accountPage.billingCityField.fill('São Paulo');
    await accountPage.billingZipField.fill('01310-100');
    await accountPage.shippingCountryField.select('Brazil');
    await accountPage.shippingStateField.select('Rio de Janeiro');
    await accountPage.shippingStreetField.fill('Av. Rio Branco, 500');
    await accountPage.shippingCityField.fill('Rio de Janeiro');
    await accountPage.shippingZipField.fill('20040-020');
    await accountPage.customerPriorityField.select('High');
    await accountPage.slaField.select('Gold');
    await accountPage.slaExpirationDateField.fill('31/12/2026');
    await accountPage.slaSerialNumberField.fill('SLA-2026-001');
    await accountPage.numberOfLocationsField.fill(3);
    await accountPage.upsellOpportunityField.select('Yes');
    await accountPage.activeField.select('Yes');
    await accountPage.descriptionField.fill('Conta para teste de validacao.');

    // ── Clear all fields (state before country — dependent picklists) ───────
    await accountPage.accountNameField.clear();
    await accountPage.ratingField.clear();
    await accountPage.phoneField.clear();
    await accountPage.faxField.clear();
    await accountPage.accountNumberField.clear();
    await accountPage.websiteField.clear();
    await accountPage.accountSiteField.clear();
    await accountPage.tickerSymbolField.clear();
    await accountPage.typeField.clear();
    await accountPage.ownershipField.clear();
    await accountPage.industryField.clear();
    await accountPage.employeesField.clear();
    await accountPage.annualRevenueField.clear();
    await accountPage.sicCodeField.clear();
    await accountPage.billingStateField.clear();
    await accountPage.billingCountryField.clear();
    await accountPage.billingStreetField.clear();
    await accountPage.billingCityField.clear();
    await accountPage.billingZipField.clear();
    await accountPage.shippingStateField.clear();
    await accountPage.shippingCountryField.clear();
    await accountPage.shippingStreetField.clear();
    await accountPage.shippingCityField.clear();
    await accountPage.shippingZipField.clear();
    await accountPage.customerPriorityField.clear();
    await accountPage.slaField.clear();
    await accountPage.slaExpirationDateField.clear();
    await accountPage.slaSerialNumberField.clear();
    await accountPage.numberOfLocationsField.clear();
    await accountPage.upsellOpportunityField.clear();
    await accountPage.activeField.clear();
    await accountPage.descriptionField.clear();

    // ── Validate all fields are empty ──────────────────────────────────────────
    await accountPage.accountNameField.expectEmpty();
    await accountPage.ratingField.expectEmpty();
    await accountPage.phoneField.expectEmpty();
    await accountPage.parentAccountField.expectEmpty();
    await accountPage.faxField.expectEmpty();
    await accountPage.accountNumberField.expectEmpty();
    await accountPage.websiteField.expectEmpty();
    await accountPage.accountSiteField.expectEmpty();
    await accountPage.tickerSymbolField.expectEmpty();
    await accountPage.typeField.expectEmpty();
    await accountPage.ownershipField.expectEmpty();
    await accountPage.industryField.expectEmpty();
    await accountPage.employeesField.expectEmpty();
    await accountPage.annualRevenueField.expectEmpty();
    await accountPage.sicCodeField.expectEmpty();
    await accountPage.billingCountryField.expectEmpty();
    await accountPage.billingStreetField.expectEmpty();
    await accountPage.billingCityField.expectEmpty();
    await accountPage.billingStateField.expectEmpty();
    await accountPage.billingZipField.expectEmpty();
    await accountPage.shippingCountryField.expectEmpty();
    await accountPage.shippingStreetField.expectEmpty();
    await accountPage.shippingCityField.expectEmpty();
    await accountPage.shippingStateField.expectEmpty();
    await accountPage.shippingZipField.expectEmpty();
    await accountPage.customerPriorityField.expectEmpty();
    await accountPage.slaField.expectEmpty();
    await accountPage.slaExpirationDateField.expectEmpty();
    await accountPage.slaSerialNumberField.expectEmpty();
    await accountPage.numberOfLocationsField.expectEmpty();
    await accountPage.upsellOpportunityField.expectEmpty();
    await accountPage.activeField.expectEmpty();
    await accountPage.descriptionField.expectEmpty();

    // ── Inline error on Account Name is visible as soon as the field blurs ──
    await expect(accountPage.accountNameField.inlineError).toBeVisible();

    // ── Save to trigger the "We hit a snag." validation error modal ─────────
    await accountPage.save();

    await expect(accountPage.validationError.dialog).toBeVisible();
    await expect(accountPage.validationError.getFieldLink('Account Name')).toBeVisible();

    // ── Close modal and cancel — no record was created, no cleanup needed ───
    await accountPage.validationError.close();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  });
});
