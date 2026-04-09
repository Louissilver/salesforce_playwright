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
  utils/
    SalesforceFields.ts  # Typed field wrapper classes — use for ALL modal form fields
```

New Salesforce objects get their own `*Page.ts` extending `BasePage` and their own `*.spec.ts`.

---

## Typed Field Classes (`SalesforceFields.ts`) — MANDATORY

**All modal form fields must be defined using the typed field classes from `tests/utils/SalesforceFields.ts`.** Never use raw Playwright locators directly inside page objects for form field interactions.

| Class                  | Salesforce field type                           | DOM element                              |
| ---------------------- | ----------------------------------------------- | ---------------------------------------- |
| `TextField`            | Text, textarea                                  | `<input type="text">` / `<textarea>`     |
| `PicklistField`        | Standard picklist (Rating, Type, Industry…)     | `<button role="combobox">`               |
| `AddressPicklistField` | Geo-picklist (Billing/Shipping Country & State) | `<input role="combobox">`                |
| `LookupField`          | Relationship lookup (Parent Account…)           | `<input role="combobox">`                |
| `NumberField`          | Number, currency, integer                       | `<input role="spinbutton">`              |
| `DateField`            | Date                                            | `<input type="text">` with LWC date mask |
| `CheckboxField`        | Checkbox                                        | `<input type="checkbox">`                |

Each class exposes a consistent API:

- **`locator`** — the underlying Playwright `Locator`
- **`undoButton`** — the "Undo" button for that field
- **`inlineError`** — the `'Complete this field.'` message scoped to that field's listitem
- **`fill(value)` / `select(option)` / `search(value)` / `check()` / `uncheck()`** — field interaction
- **`clear()`** — resets the field to its empty state
- **`expectValue(value)`** — web-first assertion: asserts the field displays the given value
- **`expectEmpty()`** — web-first assertion: asserts the field is in its default empty state

```typescript
// ✅ Correct — declare typed field properties in the constructor
import {
  TextField,
  PicklistField,
  AddressPicklistField,
  LookupField,
  NumberField,
  DateField,
} from "../utils/SalesforceFields";

export class AccountPage extends BasePage {
  readonly accountNameField: TextField;
  readonly ratingField: PicklistField;
  readonly billingCountryField: AddressPicklistField; // geo-picklist: <input role="combobox">
  readonly parentAccountField: LookupField;
  readonly employeesField: NumberField;
  readonly slaExpirationDateField: DateField;

  constructor(page: Page) {
    super(page);
    this.accountNameField = new TextField(page, "Account Name");
    this.ratingField = new PicklistField(page, "Rating");
    this.billingCountryField = new AddressPicklistField(
      page,
      "Billing Country",
    );
    this.parentAccountField = new LookupField(page, "Parent Account");
    this.employeesField = new NumberField(page, "Employees");
    this.slaExpirationDateField = new DateField(page, "SLA Expiration Date");
  }
}

// Usage in specs:
await accountPage.accountNameField.fill("Acme Corp");
await accountPage.ratingField.select("Hot");
await accountPage.billingCountryField.select("Brazil");
await accountPage.employeesField.expectValue(500);
await accountPage.accountNameField.expectEmpty();
await expect(accountPage.accountNameField.inlineError).toBeVisible();

// ❌ Wrong — raw locators inside page objects for form fields
this.accountNameField = page
  .getByRole("dialog")
  .getByRole("textbox", { name: "Account Name" });
await this.accountNameField.fill("Acme Corp"); // skips clear(), no expectEmpty(), no inlineError
```

> **Why `AddressPicklistField` instead of `PicklistField` for address fields?**
> Billing/Shipping Country and State/Province render as `<input role="combobox">` (no `textContent`) while standard picklists render as `<button role="combobox">`. `toContainText` only works on elements with text content; `AddressPicklistField` overrides `expectValue` and `expectEmpty` to use `toHaveValue` instead.

---

## Page Object Rules (DRY)

- **Never duplicate logic** between page classes. Shared operations (modal, save, delete, navigation, waiting) belong in `BasePage`.
- If two page classes have the same method body, move it to `BasePage`.
- **Locators must be declared as `readonly` class properties** and initialized in the constructor — never built inline inside methods. This is the official Playwright POM pattern.

```typescript
// ✅ Correct — typed field class properties declared and initialized in constructor
export class AccountPage extends BasePage {
  readonly accountNameField: TextField;

  constructor(page: Page) {
    super(page);
    this.accountNameField = new TextField(page, "Account Name");
  }

  async fillName(name: string) {
    await this.accountNameField.fill(name);
  }
}

// ❌ Wrong — raw Playwright locator for a form field
export class AccountPage extends BasePage {
  readonly accountNameField: Locator;

  constructor(page: Page) {
    super(page);
    // Raw locator gives no clear(), inlineError, or expectEmpty()
    this.accountNameField = page
      .getByRole("dialog")
      .getByRole("textbox", { name: "Account Name" });
  }
}
```

- `BasePage` declares shared element properties (`newButton`, `saveButton`, `deleteButton`, `actionsMenuButton`, `modal`) — subclasses inherit and use them directly.
- `getListItem(name)` lives in `BasePage` because it is used by every object page — do not redeclare it in subclasses.
- Subclass form field properties follow the pattern: `readonly <semanticName>Field: TextField | PicklistField | AddressPicklistField | LookupField | NumberField | DateField | CheckboxField`.

---

## JSDoc

Every class and every public method in a page object **must** have a JSDoc block. Follow TypeScript/JSDoc industry conventions:

- **Class**: one-line summary describing the object it represents.
- **Property**: single-line `/** ... */` comment describing the element.
- **Method**: summary line + `@param` for each parameter (when non-obvious) + `@returns` when the return type carries semantic meaning.

```typescript
/**
 * Page object for the Salesforce Account object.
 * Covers CRUD operations on the Account list and record pages.
 */
export class AccountPage extends BasePage {
  /** "Account Name" text field inside the New/Edit modal. */
  readonly accountNameField: Locator;

  /**
   * Creates a new Account record end-to-end:
   * opens the modal, fills the name, saves, and waits for the record page.
   *
   * @param name - Name for the new Account.
   */
  async createAccount(name: string) { ... }

  /**
   * Returns the name of the currently open record.
   *
   * @returns The record name extracted from the browser page title.
   */
  async getRecordTitle(): Promise<string> { ... }
}
```

Do **not** add JSDoc to:

- `constructor` (self-explanatory)
- Private/internal inline variables
- Spec files (`*.spec.ts`) — test descriptions already document intent

---

## Locator Priority (strictly in this order)

| Priority | Method                                                              | Use when                                              |
| -------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| 0        | `SalesforceFields.ts` typed class (`TextField`, `PicklistField`…)   | **All modal form fields — always use typed classes**  |
| 1        | `getByRole('button', { name: 'Save', exact: true })`                | Buttons, links, checkboxes, comboboxes                |
| 2        | `getByRole('dialog').getByRole('textbox', { name: 'Field Label' })` | Form fields inside modals (only inside field classes) |
| 3        | `getByLabel('Label text')`                                          | Native HTML inputs **outside** Shadow DOM only        |
| 4        | `getByText('...')`                                                  | Display-only text content                             |
| 5        | `locator('.slds-modal')`                                            | SLDS structural class for modal container detection   |
| 6        | `locator("[data-aura-class='AuraComponentName']")`                  | When no ARIA attribute is available                   |

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
