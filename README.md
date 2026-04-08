# Automação de Testes Salesforce — Playwright

Suite de testes automatizados para o app **Hoteis** no Salesforce, construída com [Playwright](https://playwright.dev/) e TypeScript. Cobre operações de CRUD para os objetos **Account** (nativo) e **Acomodacao\_\_c** (customizado).

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- Google Chrome (instalado automaticamente pelo Playwright)
- Acesso a uma org Salesforce com o app Hoteis

---

## Configuração

### 1. Instalar dependências

```bash
npm ci
npx playwright install --with-deps chromium
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha com suas credenciais:

```bash
cp .env.example .env
```

```env
SF_BASE_URL=https://<sua-org>.my.salesforce.com
SF_USERNAME=seu-usuario@exemplo.com
SF_PASSWORD=suasenha
SECURITY_TOKEN=seutoken
```

### 3. Autenticar (somente na primeira vez)

Abre o navegador em modo headed para que você complete o MFA manualmente. A sessão é salva em `.auth/salesforce.json` e reutilizada em todas as execuções seguintes.

```bash
npm run auth
```

> Execute novamente sempre que sua sessão Salesforce expirar.

---

## Executando os Testes

| Comando               | Descrição                       |
| --------------------- | ------------------------------- |
| `npm test`            | Execução headless (padrão CI)   |
| `npm run test:headed` | Execução com browser visível    |
| `npm run test:ui`     | Modo interativo do Playwright   |
| `npm run test:debug`  | Modo de depuração passo a passo |
| `npm run test:report` | Abre o último relatório HTML    |

---

## Estrutura do Projeto

```
.github/
  workflows/
    playwright.yml           # Pipeline de CI com GitHub Actions
tests/
  auth.setup.ts              # Login único — salva sessão em .auth/
  fixtures/
    index.ts                 # Expõe os page objects como fixtures do Playwright
  pages/
    BasePage.ts              # Operações comuns: New, Save, Delete, navegação
    AccountPage.ts           # Interações específicas de Account
    AcomodacaoPage.ts        # Interações específicas de Acomodacao__c
  specs/
    accounts.spec.ts         # Testes de CRUD de Account
    acomodacoes.spec.ts      # Testes de CRUD de Acomodacao__c
  utils/                     # Helpers compartilhados e locators centralizados
.env.example                 # Modelo de variáveis de ambiente
playwright.config.ts         # Configuração do Playwright
DOCS.md                      # Guia técnico de decisões e troubleshooting
```

---

## Arquitetura

Os testes seguem o padrão **Page Object Model (POM)**:

- **`BasePage`** — operações genéricas do Salesforce (navegar para lista, abrir modal, salvar, deletar, aguardar record/list page)
- **`AccountPage` / `AcomodacaoPage`** — estendem `BasePage` com interações específicas de cada objeto
- **`fixtures/index.ts`** — registra os page objects no sistema de fixtures do Playwright, injetando-os nos specs via parâmetros de função

A autenticação utiliza `storageState` do Playwright: autentique uma vez com `npm run auth` e todas as execuções seguintes reutilizarão a sessão salva.

---

## CI/CD

O workflow do GitHub Actions (`.github/workflows/playwright.yml`) é executado a cada push e pull request para `main`/`master`.

**Secrets necessários no repositório:**

| Secret        | Descrição                      |
| ------------- | ------------------------------ |
| `SF_BASE_URL` | URL completa da org Salesforce |
| `SF_USERNAME` | Usuário de login do Salesforce |
| `SF_PASSWORD` | Senha do Salesforce            |

O relatório HTML é publicado como artefato do workflow (`playwright-report`, retido por 30 dias).

> **Atenção:** O passo `auth.setup.ts` requer uma sessão sem MFA no CI. Configure o usuário Salesforce para permitir login sem MFA a partir do IP do CI, ou utilize uma conta de serviço dedicada.

---

## Documentação

Consulte o [DOCS.md](DOCS.md) para o guia técnico completo, cobrindo:

- Por que a automação no Salesforce é desafiadora (Shadow DOM, LWC, IDs dinâmicos)
- Estratégias de autenticação e tratamento de MFA
- Padrões de locators que funcionam no Salesforce
- Estratégias de espera para componentes LWC
- Validação híbrida API + UI
- Boas práticas gerais e configuração de CI/CD
