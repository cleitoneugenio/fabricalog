# FabricaLog

> Do chão de fábrica para o código — e de volta pro chão de fábrica.

O ponto de partida eram duas planilhas Excel e uma mesa cheia de papel. Uma controlava a produção semanal da cerâmica — queima, enforna, qualidade, estoque, vendas. A outra controlava o ponto dos 22 funcionários — valor diário, faltas, bônus de assiduidade, total a pagar. Era o sistema. Funcionava. Até que a fábrica cresceu e a planilha começou a mostrar o limite dela.

O problema não era o Excel em si. Era que o gerente precisava registrar dados em tempo real no meio do turno, no celular, sem internet estável. Planilha no celular não foi feita pra isso. Você perde campo, fecha sem salvar, não consegue visualizar o que importa quando está no meio da operação.

O FabricaLog nasceu dessa restrição. Um aplicativo que roda offline, pesa 5 MB, cabe em qualquer Android de fábrica e cobre todo o ciclo operacional de uma cerâmica: produção semanal, controle de fornos, carregamentos, ponto com remuneração variável automatizada, recibos em PDF e dashboards com exportação para gestão — tudo funcionando sem depender de servidor externo, sincronizando com a nuvem em silêncio quando a conexão aparece.

Problema real com restrição real gera solução real.

---

## Funcionalidades

### Semanas de Produção
- Registro diário por semana: queima, enfornas, qualidade, vendas, estoque, galpão, ocorrências
- Meta de fornos por semana com barra de progresso
- Auto-preenchimento de vendas/estoque a partir dos carregamentos registrados
- Exportação da semana em planilha `.xlsx`

### Controle de Ponto
- Tabela semanal com valores diários por funcionário
- Cálculo automático de dias trabalhados, bônus (R$ 25 para 6 dias) e total
- Bônus bloqueável individualmente pelo gestor
- Exportação em relatório `.html` com layout visual completo

### Carregamentos
- Registro de carregamentos por data: caminhão próprio ou externo
- Destino por carregamento: venda, estoque ou galpão
- Resumo diário com totais por destino

### Dashboard
- Visão geral da semana ativa: fornos, vendas, estoque
- Gráfico de barras semanal (vendas × estoque)

### Módulos Adicionais
- **Câmara** — controle de câmara de secagem
- **Forno** — planta visual dos fornos com status em tempo real
- **Equipe** — cadastro e gerenciamento de funcionários
- **Recibos** — geração de recibos individuais em PDF

### Sincronização
- Persistência local offline-first via `localStorage`
- Sincronização em nuvem com Supabase (autenticação + PostgreSQL)
- Merge automático por `updatedAt` — sem conflito entre dispositivos
- Backup automático diário exportado localmente

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite 8 |
| Estilo | CSS Modules + oklch color space |
| Mobile | Capacitor 8 (Android) |
| PWA | vite-plugin-pwa |
| Banco local | localStorage com debounce |
| Banco nuvem | Supabase (PostgreSQL + Auth) |
| Exportação | SheetJS (xlsx), HTML, jsPDF |

---

## Estrutura do Projeto

```
src/
├── modules/
│   ├── auth/          # Login com Supabase
│   ├── dashboard/     # Visão geral + gráfico
│   ├── semana/        # Controle semanal de produção
│   ├── ponto/         # Controle de ponto dos funcionários
│   ├── carga/         # Registro de carregamentos
│   ├── forno/         # Planta visual dos fornos
│   ├── camara/        # Câmara de secagem
│   ├── equipe/        # Cadastro de funcionários
│   └── configuracoes/ # Configurações da empresa
├── store/             # Custom hooks de state (sem lib externa)
├── components/        # Componentes reutilizáveis
├── utils/             # Utilitários: cálculos, formatação, exportação
├── lib/               # Supabase client + sync
└── data/              # Dados fixos (funcionários)
```

---

## Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+
- Android Studio (para build Android)

### Setup

```bash
git clone https://github.com/cleitoneugenio/fabricalog.git
cd fabricalog
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

### Rodando em desenvolvimento

```bash
npm run dev
```

Para testar no celular pela rede local (HTTPS):

```bash
npm run dev:mobile
```

---

## Build Android (APK)

### 1. Configure o keystore

Copie o arquivo de exemplo e preencha com as credenciais:

```bash
cp android/gradle.properties.example android/gradle.properties
```

Edite `android/gradle.properties` com o caminho do keystore e as senhas.

### 2. Build

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

O APK gerado fica em:

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Banco de Dados — Supabase

O schema utiliza uma única tabela `app_data` com todos os dados do usuário em colunas JSONB:

```sql
CREATE TABLE app_data (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  semanas       JSONB DEFAULT '[]',
  pontos        JSONB DEFAULT '[]',
  employees     JSONB DEFAULT '[]',
  settings      JSONB DEFAULT '{}',
  forno         JSONB DEFAULT '{}',
  carregamentos JSONB DEFAULT '[]',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON app_data
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Versão

`v1.2.0` — Maio 2026
