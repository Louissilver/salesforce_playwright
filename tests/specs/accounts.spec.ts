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
});
