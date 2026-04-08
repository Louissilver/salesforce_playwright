import { test as base } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';
import { AcomodacaoPage } from '../pages/AcomodacaoPage';

type Pages = {
  accountPage: AccountPage;
  acomodacaoPage: AcomodacaoPage;
};

export const test = base.extend<Pages>({
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  acomodacaoPage: async ({ page }, use) => {
    await use(new AcomodacaoPage(page));
  },
});

export { expect } from '@playwright/test';
