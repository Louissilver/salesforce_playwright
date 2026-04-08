# Copilot Instructions — Salesforce Playwright Automation

This project tests a Salesforce Lightning org using Playwright + TypeScript, following Page Object Model (POM). Always apply the rules below when writing or modifying any test code.

See [DOCS.md](../DOCS.md) for the full technical guide.

---

## Language

All code must be written in **English**: method names, variable names, test descriptions, and comments. The Salesforce field labels (`'Account Name'`, `'Nome de Acomodacao'`) come from the app and must match exactly — they are not subject to this rule.

---

## Project Structure

```
tests/
  auth.setup.ts          # One-time login — do not put test logic here
  fixtures/index.ts      # Registers page objects as Playwright fixtures
  pages/
    BasePage.ts          # Generic Salesforce operations — add shared logic here
    AccountPage.ts       # Account-specific interactions
    AcomodacaoPage.ts    # Acomodacao__c-specific interactions
  specs/                 # One file per Salesforce object
  utils/                 # Shared helpers, centralized locators
```

New Salesforce objects get their own `*Page.ts` extending `BasePage` and their own `*.spec.ts`.

---

## Page Object Rules (DRY)

- **Never duplicate logic** between page classes. Shared operations (modal, save, delete, navigation, waiting) belong in `BasePage`.
- If two page classes have the same method body, move it to `BasePage`.
- Field-filling in modals uses the shared pattern below — do not inline locators in specs.

```typescript
// BasePage — reusable modal field helper
async fillModalField(label: string, value: string) {
  await this.page.getByRole('dialog').getByRole('textbox', { name: label }).fill(value);
}
```

- Subclasses call `fillModalField` instead of duplicating the locator chain:

```typescript
// AccountPage
async fillName(name: string) {
  await this.fillModalField('Account Name', name);
}

// AcomodacaoPage
async fillNome(nome: string) {
  await this.fillModalField('Nome de Acomodacao', nome);
}
```

---

## Locator Priority (strictly in this order)

| Priority | Method                                                              | Use when                                            |
| -------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| 1        | `getByRole('button', { name: 'Save', exact: true })`                | Buttons, links, checkboxes, comboboxes              |
| 2        | `getByRole('dialog').getByRole('textbox', { name: 'Field Label' })` | Form fields inside modals                           |
| 3        | `getByLabel('Label text')`                                          | Native HTML inputs **outside** Shadow DOM only      |
| 4        | `getByText('...')`                                                  | Display-only text content                           |
| 5        | `locator('.slds-modal')`                                            | SLDS structural class for modal container detection |
| 6        | `locator("[data-aura-class='AuraComponentName']")`                  | When no ARIA attribute is available                 |

**Never use:**

- CSS class selectors with dynamic/generated names (e.g., `.forceRecordLayout .slds-form-element input`)
- XPath
- CSS `id` selectors inside Lightning components (IDs are generated at runtime)
- `locator('input#emc')` style — only acceptable in `auth.setup.ts` for the MFA input

---

## Salesforce-Specific Locator Patterns

```typescript
// ✅ Buttons (toolbar, modal, header)
page.getByRole("button", { name: "New" });
page.getByRole("button", { name: "Save", exact: true });
page.getByRole("button", { name: "Delete", exact: true });
page.getByRole("button", { name: "Show more actions" });

// ✅ Modal text fields — always scope to dialog first
page.getByRole("dialog").getByRole("textbox", { name: "Account Name" });
page.getByRole("dialog").getByRole("textbox", { name: "Nome de Acomodacao" });

// ✅ Modal container (structural anchor only — not for assertions)
page.locator(".slds-modal");

// ✅ Record title — Shadow DOM-safe
const title = await page.title(); // "Record Name | Object | Salesforce"
return title.split(" | ")[0];

// ✅ Record list item link
page.getByRole("link", { name: recordName, exact: true }).first();

// ❌ These break due to Salesforce Shadow DOM or dynamic classes
page.getByLabel("Account Name"); // 3+ matches via Shadow DOM
page.locator(".slds-page-header__title"); // 2+ elements in DOM
page.locator("main").getByRole("heading", { level: 1 }); // Shadow DOM scope failure
```

---

## Wait Strategy

**Never use `waitForTimeout`** — it is a fixed delay and makes tests flaky.

| Situation         | Correct wait                                                                    |
| ----------------- | ------------------------------------------------------------------------------- |
| List page ready   | `await page.getByRole('button', { name: 'New' }).waitFor({ state: 'visible' })` |
| Modal open        | `await page.locator('.slds-modal').waitFor({ state: 'visible' })`               |
| Record page ready | `waitForURL('**/lightning/r/**')` + `'Show more actions'` button visible        |
| After delete      | `waitForURL('**/lightning/o/{Object}/list**')` + `'New'` button visible         |
| Network operation | `Promise.all([page.waitForResponse(r => r.url().includes('/aura')), action()])` |

All state-changing operations (`save`, `delete`, navigation) must wait for a stable DOM anchor before returning. Do not leave a method without a wait postcondition.

---

## Assertions — Web-First Only

Always use Playwright web-first assertions. Never use `isVisible()` / `isEnabled()` inside `expect`.

```typescript
// ✅
await expect(page.getByRole("link", { name: recordName })).toBeVisible();
await expect(page.getByText("Record created")).toBeVisible();

// ❌
expect(await page.getByText("Record created").isVisible()).toBe(true);
```

---

## Test Isolation

- Every test must create its own data with a unique name using `Date.now()`:
  ```typescript
  const name = `Hotel Test ${Date.now()}`;
  ```
- Every test that creates a record must delete it (or use `afterEach`). Do not leave test data in the org.
- Tests must not depend on execution order. Each test navigates to its starting point independently.
- Use `test.beforeEach` only for navigation — never for data setup that another test relies on.

---

## Fixtures

Page objects are injected via fixtures — never instantiate them directly inside specs.

```typescript
// ✅
test('create account', async ({ accountPage }) => { ... });

// ❌
test('create account', async ({ page }) => {
  const accountPage = new AccountPage(page);
  ...
});
```

---

## Timeouts

Timeouts are configured globally in `playwright.config.ts`. Do not set per-action timeouts in page methods unless the operation is known to be slower than the global default (e.g., Apex-triggered saves).

```typescript
// Only override when justified
await this.page
  .getByRole("button", { name: "Show more actions" })
  .waitFor({ state: "visible", timeout: 30_000 }); // Apex callout may be slow
```

---

## What Not to Change

- `auth.setup.ts`: authentication logic is intentional. The `page.pause()` for MFA is deliberate for local development.
- `.auth/salesforce.json`: generated file, never commit or edit manually.
- `playwright.config.ts` timeout values: tuned for Salesforce LWC rendering speed — do not reduce them.
