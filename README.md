# ToDo List Frontend

Frontend React para gerenciamento de tarefas com autenticação, workspaces, listas, itens e visualização em Kanban.

## Sobre

O projeto fornece a interface web de uma aplicação Todo List integrada à API [ArtScapin/api-todo-list](https://github.com/ArtScapin/api-todo-list). Depois de autenticado, o usuário pode organizar tarefas por workspaces, criar listas, cadastrar itens e alternar entre uma navegação tradicional por listas e um quadro Kanban.

## Funcionalidades

- Login e cadastro de usuário.
- Rotas públicas e rotas protegidas por sessão.
- Persistência de access token e refresh token no navegador.
- Renovação automática de sessão via refresh token.
- Listagem, criação, edição e exclusão de workspaces.
- Alternância entre modo lista e modo Kanban por workspace.
- Configurações de workspace com alternância de visualização e exclusão com confirmação.
- Listagem, criação, edição e exclusão de listas.
- Configurações de lista com edição de nome, cor e exclusão com confirmação.
- Listagem, criação, edição, conclusão, reabertura e exclusão de itens.
- Modal compartilhada para editar itens na lista e no Kanban.
- Quadro Kanban com colunas ordenadas por posição.
- Drag and drop de cards entre colunas e posições.
- Atualização otimista ao mover cards no Kanban.
- Configuração de colunas do Kanban com criação, edição, ordenação e exclusão com confirmação.
- Tema claro/escuro persistido localmente.
- Interface em `pt-BR`, `en-US` e `es-ES`.
- Mensagens de erro para falhas de autenticação, carregamento e operações da API.

## Tecnologias

- React
- TypeScript
- Vite
- React Router
- Axios
- @hello-pangea/dnd
- CSS

## Estrutura do projeto

```text
src/
  components/     Componentes compartilhados, layout, toolbar e modais
  pages/          Páginas roteáveis da aplicação
  services/       Integrações com API, sessão e preferências locais
  services/api/   Clientes HTTP separados por domínio
  styles/         Estilos por área da aplicação
  App.tsx         Configuração de rotas
  i18n.tsx        Traduções e controle de idioma
  main.tsx        Entrada da aplicação React
```

## Requisitos

- Node.js
- npm
- API [ArtScapin/api-todo-list](https://github.com/ArtScapin/api-todo-list) configurada

## Como executar

Clone o repositório e instale as dependências:

```bash
npm install
```

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

Configure a URL base da API:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação ficará disponível no endereço exibido pelo Vite no terminal.

## Scripts

```bash
npm run dev
```

Inicia a aplicação em modo de desenvolvimento.

```bash
npm run build
```

Executa a checagem TypeScript e gera a versão de produção.

```bash
npm run lint
```

Executa o ESLint no projeto.

```bash
npm run preview
```

Serve localmente o build de produção gerado pelo Vite.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `VITE_API_BASE_URL` | URL base da API consumida pelo frontend. |

## Rotas

| Rota | Descrição |
| --- | --- |
| `/login` | Autenticação do usuário. |
| `/register` | Cadastro de usuário. |
| `/workspaces` | Listagem e criação de workspaces. |
| `/workspaces/:workspaceId/lists` | Visualização de listas de um workspace. |
| `/workspaces/:workspaceId/lists/:listId` | Visualização de itens de uma lista. |
| `/workspaces/:workspaceId/board` | Visualização Kanban do workspace. |

## Integração com a API

Este frontend consome a API [ArtScapin/api-todo-list](https://github.com/ArtScapin/api-todo-list), responsável pelos recursos de autenticação, usuários, workspaces, listas e itens.

As chamadas HTTP ficam centralizadas em `src/services/api`. O arquivo `src/services/api/api.ts` concentra a configuração comum das requisições, incluindo:

- Cliente Axios compartilhado.
- URL base da API.
- Header `Content-Type`.
- Header `Authorization` em rotas autenticadas.
- Renovação de token expirado.
- Reenvio de requisição após refresh de sessão.
- Redirecionamento para login quando a sessão expira.
- Tratamento comum de erros HTTP e falhas de conexão.

Os contratos específicos ficam separados por domínio:

- `auth.ts`
- `users.ts`
- `workspaces.ts`
- `lists.ts`
- `items.ts`

## Autenticação

Após o login, a aplicação armazena os tokens no `localStorage`:

- `todo-list:access-token`
- `todo-list:refresh-token`

As rotas protegidas verificam a existência de sessão antes de renderizar as páginas privadas. Quando o access token está expirado, a aplicação chama `/login/refresh`, salva os novos tokens e repete a requisição original.

## Kanban

O modo Kanban representa listas como colunas e itens como cards. As listas e os itens são ordenados pelo campo `position`.

As configurações do Kanban permitem criar colunas, editar nome e cor, reorganizar por drag and drop e excluir colunas após confirmação. Ao excluir uma coluna, a interface informa que os itens associados também serão removidos.

Ao mover um card:

1. A interface atualiza o estado local imediatamente.
2. A aplicação chama `PATCH /item/{id}/move`.
3. Se a API retornar erro, o estado anterior é restaurado.

O quadro também tolera falhas parciais no carregamento de itens: uma coluna com erro não impede a renderização das demais colunas.

## Configurações

A aplicação possui modais de configuração para recursos principais:

- Workspaces: alternância entre modo lista e modo Kanban, além de exclusão com confirmação.
- Listas: edição de nome e cor, além de exclusão com confirmação.
- Colunas do Kanban: criação, edição, reordenação e exclusão com confirmação.

A edição de nomes também pode ser feita diretamente pelos títulos em páginas como listas e workspaces.

## Tema e idioma

O tema e o idioma selecionados são persistidos localmente. As traduções ficam centralizadas em `src/i18n.tsx` e atendem aos idiomas:

- Português do Brasil
- Inglês dos Estados Unidos
- Espanhol da Espanha

## Build

Para gerar a versão de produção:

```bash
npm run build
```

Os arquivos finais são gerados em `dist/`.
