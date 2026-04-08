# Documentação: Automação de Testes Salesforce com Playwright

> Baseado na experiência prática do projeto e no artigo  
> [Salesforce Test Automation With Playwright: Challenges, Setup, and Proven Strategies](https://www.testrigtechnologies.com/salesforce-test-automation-with-playwright-challenges-setup-and-proven-strategies/) — Testrig Technologies

## Sumário

1. [Por que automatizar testes no Salesforce é difícil?](#1-por-que-automatizar-testes-no-salesforce-é-difícil)
2. [Por que Playwright para Salesforce?](#2-por-que-playwright-para-salesforce)
3. [Autenticação](#3-autenticação)
4. [Métodos que não funcionaram](#4-métodos-que-não-funcionaram)
5. [Locators: o que funciona e o que não funciona](#5-locators-o-que-funciona-e-o-que-não-funciona)
6. [Esperas (Waits): como lidar com LWC](#6-esperas-waits-como-lidar-com-lwc)
7. [Validação híbrida: API + UI](#7-validação-híbrida-api--ui)
8. [Padrões de Page Object para Salesforce](#8-padrões-de-page-object-para-salesforce)
9. [Boas práticas gerais](#9-boas-práticas-gerais)
10. [Configurações do playwright.config.ts](#10-configurações-do-playwrightconfigts)

---

## 1. Por que automatizar testes no Salesforce é difícil?

O Salesforce apresenta desafios únicos em comparação com aplicações web convencionais:

### 1.1 DOM Lightning dinâmico (Shadow DOM)

O Salesforce Lightning gera IDs em tempo de execução (ex: `id="21:1886;a"`) e usa Shadow DOM extensivamente via LWC. Locators baseados em IDs ou XPath absolutos **quebram a cada release**. Toda estratégia de seleção deve ser construída sobre atributos estáveis.

### 1.2 Três releases por ano

O Salesforce lança atualizações três vezes ao ano (Spring, Summer, Winter). Cada release pode alterar estruturas de DOM, rótulos e fluxos. Os testes precisam ser modulares e desacoplados da implementação visual.

### 1.3 Workflows multi-módulo complexos

Fluxos reais abrangem múltiplos objetos (Leads → Opportunities → Accounts), abas, verificações de sincronização em tempo real e validações baseadas em perfil de usuário.

### 1.4 Acesso baseado em papéis (Role-Based Access)

Layouts e campos disponíveis diferem por perfil (Admin, Sales Rep, Agent). A automação precisa considerar renderização condicional e permissões que mudam a UI.

### 1.5 Integrações de terceiros

O Salesforce se conecta com ERPs, CRMs e sistemas de pagamento. Uma cobertura completa exige combinar validação de UI com chamadas de API.

---

## 2. Por que Playwright para Salesforce?

### 2.1 Suporte nativo a Shadow DOM

O Salesforce Lightning depende fortemente de Shadow DOM. Frameworks tradicionais como Selenium exigem execução de JavaScript customizado para acessar elementos dentro de Shadow Roots:

```javascript
// Selenium — requer JS manual para piercing de Shadow DOM
WebElement shadowHost = driver.findElement(By.cssSelector("lightning-input"));
WebElement shadowRoot = (WebElement) ((JavascriptExecutor) driver)
    .executeScript("return arguments[0].shadowRoot", shadowHost);
WebElement input = shadowRoot.findElement(By.cssSelector("input"));
```

O Playwright acessa a árvore de acessibilidade (ARIA) nativamente, que já atravessa os Shadow Roots do browser:

```typescript
// Playwright — sem JavaScript manual, funciona nativamente
await page
  .getByRole("dialog")
  .getByRole("textbox", { name: "Account Name" })
  .fill("Meu Hotel");
```

### 2.2 Auto-waiting integrado

Salesforce executa operações assíncronas pesadas (Apex, SOQL, REST API). O Playwright aguarda automaticamente que os elementos estejam prontos antes de interagir, eliminando `sleep()` frágeis.

### 2.3 Integração nativa de API + UI

É possível combinar chamadas REST ao Salesforce com validações de UI no mesmo teste e no mesmo contexto, sem bibliotecas externas.

### 2.4 Execução paralela para regressão em escala

O runner nativo do Playwright permite executar grandes suítes de regressão em paralelo no CI/CD.

### 2.5 Suporte multi-browser

Chrome, Firefox, WebKit (Safari) e emulação mobile — tudo com a mesma API.

---

## 3. Autenticação

### 3.1 Abordagem adotada: `storageState` (cookies/sessão persistidos)

É a abordagem **recomendada para aplicações Salesforce comuns** (Developer Edition, trial orgs, orgs de homologação) onde a aplicação não é uma Connected App configurada para OAuth machine-to-machine.

**Como funciona:**

1. Você executa `npm run auth` uma única vez em modo `--headed` (browser visível).
2. O script (`tests/auth.setup.ts`) faz login via UI normalmente e salva toda a sessão (cookies, localStorage, sessionStorage) em `.auth/salesforce.json`.
3. Nas execuções seguintes, o Playwright injeta esse arquivo de sessão diretamente, pulando o login completamente.
4. A sessão dura **aproximadamente 1 mês** (tempo de expiração dos cookies de sessão do Salesforce). Quando expirar, basta executar `npm run auth` novamente.

```typescript
// playwright.config.ts — projeto chromium usa a sessão salva
{
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    storageState: '.auth/salesforce.json',  // injeta a sessão em todo teste
  },
  dependencies: ['setup'],  // executa auth.setup.ts antes
}
```

```typescript
// tests/auth.setup.ts — só faz login se o arquivo não existir
if (fs.existsSync(authFile)) {
  console.log("Sessão salva encontrada, pulando login.");
  return;
}

await page.goto("https://login.salesforce.com");
await page.getByLabel("Username").fill(process.env.SF_USERNAME!);
await page.getByLabel("Password").fill(process.env.SF_PASSWORD!);
await page.getByRole("button", { name: "Log In" }).click();
// ...
await page.context().storageState({ path: authFile });
```

**Vantagens:**

- Sem overhead de login em cada teste.
- Funciona com qualquer `authFlow` do Salesforce (UI clássica, Lightning).
- Simples: basta um `npm run auth` quando a sessão expirar.

**Como executar:**

```bash
npm run auth       # headed, para suportar MFA manual
npm test           # usa a sessão salva automaticamente
```

---

### 3.2 Tratamento de MFA (verificação por e-mail)

O Salesforce pode exigir verificação de dois fatores no primeiro login de uma nova máquina ou após longo período. O script detecta isso e pausa para interação manual:

```typescript
const verificationInput = page.locator("input#emc").first();
const hasMfa = await verificationInput
  .isVisible({ timeout: 5_000 })
  .catch(() => false);

if (hasMfa) {
  console.log(
    "⚠️  Código de verificação solicitado. Insira o código e clique em Verify.",
  );
  console.log('   Depois pressione "Resume" no Playwright Inspector.');
  await page.pause(); // congela o teste até o usuário continuar manualmente
}
```

`page.pause()` abre o **Playwright Inspector** e trava a execução. O usuário insere o código de verificação no browser, clica "Verify" e pressiona "Resume" no Inspector. Após isso, a sessão é salva normalmente.

---

### 3.3 Abordagem OAuth 2.0 com Connected App

Esta é a abordagem **recomendada para pipelines CI/CD e orgs de produção** com Connected App configurada. Não requer interação manual e se integra nativamente com gestores de segredos (Vault, GitHub Secrets).

**Como funciona:**

```
POST https://login.salesforce.com/services/oauth2/token
  grant_type=password
  client_id=<Consumer Key>
  client_secret=<Consumer Secret>
  username=<user>
  password=<senha+security_token>
```

Com o `access_token` retornado, usa-se `frontdoor.jsp` para criar uma sessão de browser:

```
GET https://<org>.salesforce.com/secur/frontdoor.jsp?sid=<access_token>
```

**Implementação completa (conforme artigo Testrig):**

```typescript
// utils/auth.ts
const authenticateWithOAuth = async (page) => {
  const loginUrl = process.env.SALESFORCE_LOGIN_URL;
  const username = process.env.SALESFORCE_USERNAME;
  // Salesforce exige senha + security token concatenados
  const password = process.env.SALESFORCE_PASSWORD + process.env.SECURITY_TOKEN;

  const response = await page.request.post(
    `${loginUrl}/services/oauth2/token`,
    {
      form: {
        grant_type: "password",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        username,
        password,
      },
    },
  );

  const authData = await response.json();
  return {
    accessToken: authData.access_token,
    instanceUrl: authData.instance_url,
  };
};
```

```typescript
// tests/login.spec.ts
import { test, request, expect } from "@playwright/test";
import { authenticateWithOAuth } from "../utils/auth";

test("Salesforce OAuth Login", async () => {
  const req = await request.newContext();
  const { accessToken, instanceUrl } = await authenticateWithOAuth(req);
  expect(accessToken).toBeTruthy();
  console.log(`Connected to Salesforce instance: ${instanceUrl}`);
});
```

**Variáveis de ambiente necessárias (`.env`):**

```
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_USERNAME=your-username
SALESFORCE_PASSWORD=your-password
SECURITY_TOKEN=your-security-token
CLIENT_ID=your-consumer-key
CLIENT_SECRET=your-consumer-secret
```

**Por que não foi adotada neste projeto:**

- Requer criar uma **Connected App** no Setup com OAuth habilitado.
- Exige configuração de `ip_relaxation` e `refresh_token scope`.
- A org utilizada (`orgfarm-4823e5f7b8-dev-ed`) não possui Connected App configurada.
- Para orgs de homologação simples ou Developer Edition, `storageState` é mais prático.

**Quando usar OAuth:**

- Pipelines CI/CD sem browser headed disponível
- Orgs de produção onde login manual é inviável
- Cenários que exigem refresh automático de token

---

## 4. Métodos que não funcionaram

### 4.1 `waitForLoadState('domcontentloaded')` após navegação

```typescript
// ❌ Não funciona — evento dispara antes do LWC renderizar os componentes
await page.goto(`/lightning/o/${objectApiName}/list`);
await page.waitForLoadState("domcontentloaded");
// Aqui os botões e tabelas ainda não existem no DOM
```

**Motivo:** O Salesforce Lightning usa **Lightning Web Components (LWC)** com renderização assíncrona. O evento `domcontentloaded` e até `networkidle` disparam antes dos componentes ficarem visíveis. Ao tentar interagir logo depois, os elementos ainda não estão prontos.

**Solução:** Aguardar explicitamente um elemento-âncora confiável como o botão "New":

```typescript
// ✅ Funciona — botão "New" aparece apenas quando o LWC terminou de renderizar
await page.getByRole("button", { name: "New" }).waitFor({ state: "visible" });
```

---

### 4.2 `div[role="dialog"]` como locator para o modal

```typescript
// ❌ Falha com "strict mode violation: resolved to 2 elements"
await page.locator('div[role="dialog"]').waitFor({ state: "visible" });
```

**Motivo:** O Salesforce sempre tem um elemento `div[role="dialog"]` invisível no DOM chamado `auraError` — um container de erros que fica presente o tempo todo, mesmo quando não há erro. Portanto, ao aguardar `div[role="dialog"]`, o Playwright encontra 2 elementos: o modal real + o `auraError`.

**Solução:** Usar `.slds-modal` que identifica apenas modais visuais do SLDS (Salesforce Lightning Design System):

```typescript
// ✅ Funciona — .slds-modal existe apenas quando o modal real está aberto
await page.locator(".slds-modal").waitFor({ state: "visible" });
```

---

### 4.3 `getByLabel('Account Name')` dentro do modal

```typescript
// ❌ Falha — encontra 3+ elementos diferentes no DOM
await page.getByLabel("Account Name").fill("Meu Hotel");
```

**Motivo:** O Playwright resolve `getByLabel` buscando por:

- `<label for="...">` → rótulo de input
- `aria-label="..."` → atributo diretamente no elemento
- `aria-labelledby="..."` → aponta para outro elemento pelo ID

No Salesforce, todos esses matches ocorrem simultaneamente para "Account Name":

1. O `<th aria-label="Account Name">` da coluna da **tabela da lista** (que ainda está no DOM em background)
2. O slider de redimensionamento da coluna (`<input type="range" aria-label="Account Name">`)
3. O botão de edição inline (`<button aria-label="Account Name">`)
4. O campo real no modal

O Playwright entra em **strict mode** e recusa executar a ação quando há mais de 1 match.

```typescript
// ❌ Ainda falha mesmo com exact — o <th aria-label> também é match exato
await page.getByLabel("Account Name", { exact: true }).fill("Meu Hotel");

// ❌ Falha — Shadow DOM impede que a busca de label percorra os roots corretamente
await page.locator(".slds-modal").getByLabel("Account Name").fill("Meu Hotel");
```

**Por que `.slds-modal + getByLabel` também falha:**

Dentro do modal Salesforce, os `<input>` vivem em Shadow Roots separados dos seus `<label>`. A associação `<label for="id">` não funciona atravessando Shadow DOM boundaries. O `getByLabel` em escopo CSS não consegue percorrer esses limites.

**Solução:** `getByRole('dialog').getByRole('textbox', { name })` usa a **árvore de acessibilidade** (ARIA), que é processada pelo browser de forma a atravessar Shadow DOM:

```typescript
// ✅ Funciona — getByRole usa a árvore de acessibilidade, que atravessa Shadow DOM
await page
  .getByRole("dialog")
  .getByRole("textbox", { name: "Account Name" })
  .fill("Meu Hotel");
await page
  .getByRole("dialog")
  .getByRole("textbox", { name: "Nome de Acomodacao" })
  .fill("Suite");
```

---

### 4.4 `locator('main').getByRole('heading', { level: 1 })` para aguardar o detalhe do registro

```typescript
// ❌ Timeout — elemento existe mas não é encontrado via busca de role no DOM
await page
  .locator("main")
  .getByRole("heading", { level: 1 })
  .waitFor({ state: "visible" });
```

**Motivo:** O `<h1>` do título do registro fica dentro de múltiplos níveis de Shadow DOM aninhados dentro de `<main>`. A combinação `locator('main')` faz uma busca CSS que não atravessa Shadow Roots, então o `getByRole('heading')` subsequente não encontra o `<h1>` real.

Confirmado via MCP Playwright: o elemento existe e está visível no snapshot, mas o Playwright falsa o timeout porque o `locator()` CSS scope não expõe os filhos de Shadow Root para o `.getByRole()` seguinte.

**Solução 1 — `page.title()`** (adotada): O Salesforce configura o `<title>` da página como `"NomeDoRegistro | TipoDoObjeto | Salesforce"` — sem Shadow DOM, completamente acessível:

```typescript
// ✅ Funciona — page.title() não tem Shadow DOM
const title = await this.page.title();
return title.split(" | ")[0]; // "Hotel Teste 123"
```

**Solução 2 — aguardar um elemento âncora confiável**: O botão "Show more actions" sempre aparece no header do registro e não vive em Shadow DOM profundo:

```typescript
// ✅ Funciona — botão comprovado por estar no topo do DOM do record page
await page
  .getByRole("button", { name: "Show more actions" })
  .waitFor({ state: "visible" });
```

---

## 5. Locators: o que funciona e o que não funciona

### Resumo

| Locator                                            | Contexto                  | Resultado | Motivo                                           |
| -------------------------------------------------- | ------------------------- | --------- | ------------------------------------------------ |
| `getByLabel('Account Name')`                       | Modal de criação          | ❌        | 3+ matches (th, slider, botão de edição)         |
| `getByLabel('Account Name', {exact:true})`         | Modal                     | ❌        | `<th aria-label>` também é match exato           |
| `locator('.slds-modal').getByLabel(...)`           | Modal                     | ❌        | Shadow DOM quebra associação `<label for>`       |
| `getByRole('dialog').getByRole('textbox', {name})` | Modal                     | ✅        | ARIA tree atravessa Shadow DOM                   |
| `locator('div[role="dialog"]')`                    | Modal                     | ❌        | `auraError` sempre presente no DOM               |
| `locator('.slds-modal')`                           | Modal (aguardar abertura) | ✅        | Só existe quando modal SLDS está aberto          |
| `locator('main').getByRole('heading', {level:1})`  | Record page               | ❌        | `<h1>` aninhado em Shadow DOM profundo           |
| `page.title()`                                     | Record page               | ✅        | `<title>` é nativo do document, sem Shadow DOM   |
| `getByRole('button', {name:'Show more actions'})`  | Record page               | ✅        | No topo do DOM, fora de Shadow Root problemático |
| `getByRole('button', {name:'New'})`                | List page                 | ✅        | Renderizado no DOM acessível                     |
| `getByRole('link', {name, exact:true}).first()`    | List page                 | ✅        | Links de registro são acessíveis na tabela       |
| `getByRole('menuitem', {name:'Delete'})`           | Menu de ações             | ✅        | Menu renderizado no DOM principal                |

---

### Por que Shadow DOM é o grande vilão no Salesforce Cada componente LWC tem seu próprio Shadow Root isolado. Isso significa:

```
document
└─ <main>
   └─ #shadow-root (lightning-record-view-form)
      └─ <div>
         └─ #shadow-root (lightning-record-edit-form)
            └─ <div>
               └─ <label>Account Name</label>   ← em um shadow root
               └─ #shadow-root (lightning-input)
                  └─ <input>                    ← em outro shadow root
```

A `<label>` e o `<input>` estão em **Shadow Roots diferentes**. A associação `<label for="inputId">` não funciona através de Shadow DOM boundaries (é uma limitação da especificação HTML). Por isso:

- `getByLabel` falha em escopo dentro do modal
- `locator('.slds-modal').getByLabel(...)` não encontra o input

O `getByRole('textbox', {name})` funciona porque ele usa a **árvore de acessibilidade do browser** (que os browsers expõem piercing Shadow DOM via ARIA) em vez de usar o DOM diretamente.

---

## 6. Esperas (Waits): como lidar com LWC

### Regra geral

**Nunca confie em `waitForLoadState`** para componentes LWC. Use sempre esperas por elementos-âncora específicos.

### Padrão de espera por página

```typescript
// Aguardar lista pronta
await page.getByRole("button", { name: "New" }).waitFor({ state: "visible" });

// Aguardar modal aberto
await page.locator(".slds-modal").waitFor({ state: "visible" });

// Aguardar record page carregada
await page.waitForURL("**/lightning/r/**", { timeout: 30_000 });
await page
  .getByRole("button", { name: "Show more actions" })
  .waitFor({ state: "visible" });

// Aguardar retorno para lista após delete
await page.waitForURL("**/lightning/o/{ObjectName}/list**", {
  timeout: 30_000,
});
await page.getByRole("button", { name: "New" }).waitFor({ state: "visible" });
```

### Aguardar resposta de API Salesforce (`waitForResponse`)

Para operações que disparam chamadas Apex ou Aura, use `waitForResponse` para garantir que o servidor processou antes de prosseguir:

```typescript
// Aguardar a resposta da ação Salesforce antes de verificar o resultado
const [response] = await Promise.all([
  page.waitForResponse(
    (resp) => resp.url().includes("/aura") && resp.status() === 200,
  ),
  page.getByRole("button", { name: "Save", exact: true }).click(),
]);

// ⚠️ Anti-padrão — evite waitForTimeout
// await page.waitForTimeout(3000); // quebrável, não espera o servidor de fato
```

### Timeouts recomendados para Salesforce

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 90_000, // timeout total por teste (LWC é lento)
  expect: { timeout: 15_000 }, // assertions tentam por 15s antes de falhar

  use: {
    actionTimeout: 30_000, // click, fill, etc. — aguarda até 30s
    navigationTimeout: 60_000, // page.goto, waitForURL — aguarda até 60s
  },
});
```

---

## 7. Validação híbrida: API + UI

Uma técnica poderosa é combinar chamadas de API REST com asserções de UI no mesmo teste. Isso reduz dependência de renderização e acelera a limpeza de dados.

### Exemplo: criar via UI, validar via API, limpar via API

```typescript
test("Account criada aparece na lista", async ({ page, request }) => {
  const accountPage = new AccountPage(page);

  // 1. Criar via UI
  await accountPage.navigateToObject("Account");
  await accountPage.clickNew();
  await accountPage.fillName("Hotel Teste Híbrido");
  await accountPage.save();
  await accountPage.waitForRecordPage();

  // 2. Validar via API REST Salesforce
  const query = `SELECT Id, Name FROM Account WHERE Name = 'Hotel Teste Híbrido' LIMIT 1`;
  const res = await request.get(
    `/services/data/v59.0/query?q=${encodeURIComponent(query)}`,
  );
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.records).toHaveLength(1);
  const accountId = data.records[0].Id;

  // 3. Limpar via API (mais rápido que navegar pela UI)
  const del = await request.delete(
    `/services/data/v59.0/sobjects/Account/${accountId}`,
  );
  expect(del.status()).toBe(204);
});
```

> **Dica**: o objeto `request` do Playwright herda automaticamente os cookies da sessão carregada via `storageState`, portanto a autenticação já está incluída.

---

## 8. Padrões de Page Object para Salesforce

### Estrutura recomendada

```
tests/
  auth.setup.ts              → login único, salva sessão
  fixtures/
    index.ts                 → expõe page objects para os specs
  pages/
    BasePage.ts              → operações comuns (New, Save, Delete, navegação)
    AccountPage.ts           → operações específicas de Account
    AcomodacaoPage.ts        → operações específicas de Acomodacao__c
  utils/
    locators.ts              → seletores centralizados e reutilizáveis
  specs/
    accounts.spec.ts         → testes de Account
    acomodacoes.spec.ts      → testes de Acomodacao__c
```

### BasePage — operações genéricas

```typescript
// Navegar para a lista de um objeto (API name)
async navigateToObject(objectApiName: string) {
  await this.page.goto(`/lightning/o/${objectApiName}/list`);
  await this.page.getByRole('button', { name: 'New' }).waitFor({ state: 'visible' });
}

// Abrir modal de criação
async clickNew() {
  await this.page.getByRole('button', { name: 'New' }).click();
  await this.page.locator('.slds-modal').waitFor({ state: 'visible' });
}

// Aguardar record page
async waitForRecordPage() {
  await this.page.waitForURL('**/lightning/r/**', { timeout: 30_000 });
  await this.page.getByRole('button', { name: 'Show more actions' }).waitFor({ state: 'visible', timeout: 30_000 });
}

// Obter nome do registro via page title (sem Shadow DOM)
async getRecordTitle(): Promise<string> {
  await this.page.getByRole('button', { name: 'Show more actions' }).waitFor({ state: 'visible' });
  const title = await this.page.title(); // "Hotel ABC | Account | Salesforce"
  return title.split(' | ')[0];          // "Hotel ABC"
}
```

### Acessar campos do modal

```typescript
// ✅ Padrão correto para qualquer campo de texto em modal Salesforce
await this.page
  .getByRole("dialog")
  .getByRole("textbox", { name: "Account Name" })
  .fill(name);
await this.page
  .getByRole("dialog")
  .getByRole("textbox", { name: "Nome de Acomodacao" })
  .fill(nome);
```

---

## 9. Boas práticas gerais

### 9.1 Seletores estáveis com `data-aura-class`

Evite seletores frágeis baseados em classes geradas dinamicamente. Prefira atributos de acessibilidade e atributos Aura:

```typescript
// ✅ Estável — usa aria-label e data-aura-class
page.locator("[data-aura-class='forceOutputLookup']");
page.getByRole("button", { name: "Save", exact: true });
page.getByRole("dialog").getByRole("textbox", { name: "Account Name" });

// ❌ Frágil — classes CSS geradas podem mudar a cada release
page.locator(".forceRecordLayout .slds-form-element input");
```

### 9.2 Isolamento de dados por teste

Para evitar interferência entre testes, use prefixo com `Date.now()` em todos os dados criados:

```typescript
const uniqueName = `Hotel Automação ${Date.now()}`;
await accountPage.fillName(uniqueName);
```

Em ambientes CI, considere usar **scratch orgs** (Salesforce DX) para isolamento completo — cada pipeline recebe uma org descartável.

### 9.3 Execução paralela

Com dados isolados, é possível habilitar paralelismo em CI:

```typescript
// playwright.config.ts
workers: process.env.CI ? 2 : 1,  // 2 workers em CI, 1 local
fullyParallel: false,              // specs em paralelo, steps em sequência
```

### 9.4 Testes de acessibilidade com axe-core

```typescript
import AxeBuilder from "@axe-core/playwright";

test("página de Account é acessível", async ({ page }) => {
  await page.goto("/lightning/o/Account/list");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

Instale com: `npm install --save-dev @axe-core/playwright`

### 9.5 Integração CI/CD (GitHub Actions)

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          SF_BASE_URL: ${{ secrets.SF_BASE_URL }}
          SF_USERNAME: ${{ secrets.SF_USERNAME }}
          SF_PASSWORD: ${{ secrets.SF_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

> **Nota**: em CI, não haverá sessão `.auth/salesforce.json` salva. Configure `auth.setup.ts` para aceitar `SF_USERNAME` e `SF_PASSWORD` como variáveis de ambiente e executar o login programaticamente sem `page.pause()`.

---

## 10. Configurações do `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: "./tests",
  timeout: 90_000, // Salesforce LWC é lento — 90s por teste
  fullyParallel: false, // Evita race conditions em dados compartilhados
  workers: process.env.CI ? 2 : 1,
  expect: { timeout: 15_000 },

  use: {
    baseURL: process.env.SF_BASE_URL,
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    trace: "on", // Sempre grava trace (útil para debug)
    screenshot: "only-on-failure",
    video: "on",
  },

  projects: [
    {
      name: "setup", // Roda auth.setup.ts antes de qualquer teste
      testMatch: "**/auth.setup.ts",
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/salesforce.json", // Injeta sessão salva
      },
      dependencies: ["setup"],
      testMatch: "**/specs/**/*.spec.ts",
    },
  ],
});
```

---

## Referências

- [Playwright storageState docs](https://playwright.dev/docs/auth)
- [Playwright Shadow DOM](https://playwright.dev/docs/locators#locate-in-shadow-dom)
- [Salesforce LWC & Shadow DOM](https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.create_components_shadow_dom)
- [SLDS Component Library](https://www.lightningdesignsystem.com/)
- [Testrig Technologies — Salesforce Test Automation with Playwright](https://www.testrigtechnologies.com/salesforce-test-automation-with-playwright-challenges-setup-and-proven-strategies/)
- [axe-core para Playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
