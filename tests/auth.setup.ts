import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/salesforce.json');

setup('authenticate', async ({ page }) => {
  // Reutiliza sessão salva sem fazer login novamente.
  // Execute "npm run auth" quando a sessão expirar (~1 mês).
  if (fs.existsSync(authFile)) {
    console.log('Sessão salva encontrada, pulando login.');
    return;
  }

  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await page.goto('https://login.salesforce.com');

  await page.getByLabel('Username').fill(process.env.SF_USERNAME!);
  await page.getByLabel('Password').fill(process.env.SF_PASSWORD!);
  await page.getByRole('button', { name: 'Log In' }).click();

  // Aguarda possível tela de verificação por e-mail (MFA)
  const verificationInput = page.locator('input#emc').first();
  const hasMfa = await verificationInput.isVisible({ timeout: 5_000 }).catch(() => false);

  if (hasMfa) {
    console.log('\n⚠️  Código de verificação solicitado pelo Salesforce.');
    console.log('   1. Verifique seu e-mail e insira o código no browser.');
    console.log('   2. Clique em "Verify".');
    console.log('   3. Pressione o botão "Resume" no Playwright Inspector para continuar.\n');
    await page.pause();
  }

  await page.waitForURL('**/lightning/**', { timeout: 120_000 });
  await expect(page.getByTitle('App Launcher')).toBeVisible();

  await page.context().storageState({ path: authFile });
  console.log(`Sessão salva em: ${authFile}`);
});
