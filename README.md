# TecHub Monitor

Sistema de monitoramento operacional com dashboards de SLA, MPS, Backlog e alertas inteligentes.

## Tecnologias

- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth)
- **Gráficos:** Recharts
- **Animações:** Framer Motion

## Funcionalidades

- 📊 Dashboard de monitoramento em tempo real (MPS, SLA por fila/projeto)
- 🔔 Sistema de alertas inteligentes com detecção de anomalias e tendências
- 📋 Gestão de backlog operacional com aging e heatmaps
- 📈 Relatórios de SLA e MPS com filtros avançados
- 🖥️ Modo apresentação para TV/tela grande
- 👥 Gestão de usuários e permissões por papel (role-based)
- ⚙️ Configurações de SMTP, alertas e thresholds personalizáveis

## Início Rápido

```sh
# Clonar o repositório
git clone <YOUR_GIT_URL>

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon) do Supabase |

## Estrutura do Projeto

```
src/
├── components/       # Componentes React organizados por domínio
├── contexts/         # Contextos (Auth)
├── hooks/            # Custom hooks para dados e lógica
├── integrations/     # Cliente Supabase e tipos
├── lib/              # Utilitários e funções auxiliares
├── pages/            # Páginas da aplicação
└── types/            # Tipos TypeScript
```

## Deploy

Publique via [Lovable](https://lovable.dev) clicando em **Share → Publish**.

## Licença

Projeto privado — uso interno.
