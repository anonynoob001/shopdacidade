# SHOP CARAJÁS — Marketplace Regional de Canaã dos Carajás - PA

O **Shop Carajás** é uma plataforma web completa e profissional de comércio regional e contratação de serviços, desenvolvida especialmente para conectar moradores, lojas físicas, prestadores de serviços autônomos e entregadores de **Canaã dos Carajás, Pará, Brasil**.

---

## 1. Visão Geral e Recursos

- **Marketplace Multilojas**: Estabelecimentos comerciais de Canaã dos Carajás organizados por categorias (Construção & Reforma, Supermercado & Bebidas, Eletrônicos & Informática, etc.) com catálogos, controle de estoque, variações de produto e fotos.
- **Carrinho e Checkout Multilojas**: Separação automática de subpedidos por estabelecimento comercial com cálculo determinístico de taxas de entrega independentes e estoque no backend.
- **Pagamentos PIX & Entrega**: Geração dinâmica de código PIX Copia e Cola (padrão BR Code / Banco Central) e suporte a pagamento em dinheiro ou cartão na maquininha na entrega/retirada.
- **Plataforma de Prestadores de Serviços**: Catálogo de profissionais autônomos (ar-condicionado/climatização, eletricistas, encanadores, reformas, diaristas) com solicitação formal de orçamentos, propostas com preço e materiais inclusos, e agendamento de atendimentos com validação contra reservas duplicadas.
- **Módulo de Entregas & Entregadores**: Interface mobile-first para entregadores parceiros com controle de status online/offline, fila de pedidos aguardando coleta em Canaã, aceitação atômica e avanço de status de entrega (`A caminho da loja` → `Pedido coletado` → `Em entrega` → `Entregue`).
- **Painel Central do Administrador**: Métricas reais de negócio (GMV, pedidos confirmados, receita de comissões da plataforma), moderação de lojas e prestadores, configuração de taxas e chaves PIX, gerenciamento de banners promocionais, auditoria e exportação de relatórios em CSV.
- **PWA (Progressive Web App)**: Instalável em Android, iOS e computadores, com botão de instalação in-app guiado e aviso de conectividade offline.

---

## 2. Arquitetura Cloudflare

O projeto foi projetado com prioridade para a infraestrutura moderna e econômica da **Cloudflare**:

| Componente | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Interface do usuário responsiva e design system regional |
| **Backend API** | Cloudflare Workers (TypeScript) | Endpoints REST sob `/api/*` com runtime nativo |
| **Banco de Dados** | Cloudflare D1 (SQLite) | Banco relacional com migrations versionadas |
| **Armazenamento de Mídia** | Cloudflare R2 | Upload de fotos de produtos e portfólios |
| **Rotinas Agendadas** | Cloudflare Cron Triggers | Expiração de orçamentos e limpeza de sessões |
| **Arquivos Estáticos** | Cloudflare Workers Static Assets | Hospedagem do bundle SPA do frontend no mesmo domínio |

---

## 3. Estrutura do Projeto

```
├── .data/                        # Banco SQLite local para desenvolvimento
├── migrations/
│   └── 0001_initial_schema.sql   # Schema relacional compatível com Cloudflare D1 e SQLite
├── public/
│   ├── icon.svg                  # Identidade visual oficial do Shop Carajás
│   └── manifest.json             # Manifesto PWA
├── src/
│   ├── components/               # Header, Footer, PWAInstallButton
│   ├── context/                  # AuthContext, CartContext
│   ├── pages/                    # Home, Lojas, Produtos, Serviços, Carrinho, Painéis
│   ├── services/                 # api.ts (cliente HTTP, formatação BRL e datas)
│   └── worker/                   # Backend Cloudflare Worker
│       ├── db.ts                 # Adaptador unificado (Cloudflare D1 e Node:sqlite)
│       ├── router.ts             # Roteador central compartilhado
│       ├── index.ts              # Entry point do Cloudflare Worker (fetch + scheduled)
│       ├── types.ts              # Tipos TypeScript do domínio
│       ├── jobs/                 # Tarefas automáticas (cron)
│       ├── routes/               # Endpoints organizados por módulo
│       └── services/             # Criptografia Web Crypto, sessões e seed do banco
├── server.ts                     # Servidor Express Full-Stack (porta 3000 + Vite middlewares)
├── wrangler.jsonc                # Configuração do Cloudflare Workers, D1 e Cron
├── .dev.vars.example             # Variáveis de ambiente e segredos locais
└── README.md                     # Documentação de implantação
```

---

## 4. Como Executar Localmente

No ambiente de desenvolvimento do **Google AI Studio** ou terminal local:

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   O servidor iniciará em `http://0.0.0.0:3000`. O banco de dados local SQLite será criado automaticamente em `.data/shop_carajas.db` e populado com os dados iniciais de Canaã dos Carajás através das migrations.

---

## 5. Como Implantar na Cloudflare

### Passo 1: Criar o banco de dados D1 na Cloudflare
No terminal com o Wrangler CLI configurado:
```bash
npx wrangler d1 create shop_carajas_db
```
O comando retornará um `database_id`. Copie este ID e cole no arquivo `wrangler.jsonc` no campo:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "shop_carajas_db",
    "database_id": "COLE_O_DATABASE_ID_AQUI",
    "migrations_dir": "migrations"
  }
]
```

### Passo 2: Aplicar as migrations no Cloudflare D1
Execute a migration inicial no banco de dados remoto da Cloudflare:
```bash
npx wrangler d1 migrations apply shop_carajas_db --remote
```

### Passo 3: Configurar os Segredos (Secrets) no Cloudflare Workers
Cadastre as variáveis protegidas de produção:
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put PIX_KEY
npx wrangler secret put PIX_BENEFICIARY_NAME
```

### Passo 4: Fazer o Build e Deploy
Gere o build estático do frontend e publique na Cloudflare:
```bash
npm run build
npx wrangler deploy
```

O aplicativo será publicado na rede global da Cloudflare servindo o frontend e as rotas `/api/*` sob o mesmo domínio sem qualquer custo adicional no plano gratuito!

---

## 6. Usuários de Demonstração Pré-Configurados

Para testes imediatos de todas as funções da plataforma, o seletor rápido no topo da página permite alternar entre os seguintes perfis sem necessidade de digitação:

| Perfil | E-mail | Senha Padrão | Função |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@shopcarajas.com.br` | `123456` | Controle de taxas, aprovação de lojas e métricas de GMV |
| **Lojista Parceiro** | `lojista@shopcarajas.com.br` | `123456` | Gerenciamento de estoque, catálogo e despacho de pedidos |
| **Prestador de Serviços** | `prestador@shopcarajas.com.br` | `123456` | Envio de propostas de orçamento e agenda de atendimentos |
| **Entregador Parceiro** | `entregador@shopcarajas.com.br` | `123456` | Aceitação de corridas e confirmação de entregas |
| **Cliente de Canaã** | `cliente@shopcarajas.com.br` | `123456` | Compras em lojas locais e pedidos de serviços |

---

## 7. Conformidade e Segurança

- Senhas criptografadas usando **Web Crypto PBKDF2** com salt individual de 128 bits e 100.000 iterações (compatível nativamente com Cloudflare Workers e Node.js).
- Proteção de sessões com expiração segura em banco relacional.
- Cálculo de valores, estoque, comissões e frete executados **estritamente no backend**.
- Isolamento multi-tenant de lojas e prestadores de serviços.
- Avisos de privacidade e respeito à Lei Geral de Proteção de Dados (LGPD).
