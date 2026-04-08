import { test, expect } from '../fixtures';

test.describe('Acomodacoes (Acomodacao__c)', () => {
  test.beforeEach(async ({ acomodacaoPage }) => {
    await acomodacaoPage.navigate();
  });

  test('deve criar uma nova acomodacao', async ({ acomodacaoPage }) => {
    const nomeAcomodacao = `Suite Teste ${Date.now()}`;

    await acomodacaoPage.createAcomodacao(nomeAcomodacao);

    const titulo = await acomodacaoPage.getRecordTitle();
    expect(titulo).toContain(nomeAcomodacao);
  });

  test('deve exibir acomodacao criada na lista', async ({ acomodacaoPage }) => {
    const nomeAcomodacao = `Suite Lista ${Date.now()}`;

    await acomodacaoPage.createAcomodacao(nomeAcomodacao);
    await acomodacaoPage.navigate();

    await expect(acomodacaoPage.getListItem(nomeAcomodacao)).toBeVisible();
  });

  test('deve excluir uma acomodacao', async ({ acomodacaoPage }) => {
    const nomeAcomodacao = `Suite Exclusao ${Date.now()}`;

    await acomodacaoPage.createAcomodacao(nomeAcomodacao);
    await acomodacaoPage.navigate();
    await acomodacaoPage.deleteAcomodacao(nomeAcomodacao);

    await expect(acomodacaoPage.getListItem(nomeAcomodacao)).not.toBeVisible();
  });
});
