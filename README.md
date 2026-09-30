# 📒 Páginas Amarelas - Catálogo de Prestadores de Serviços

Aplicação web completa no estilo **Páginas Amarelas** (Catálogo de Prestadores de Serviços) desenvolvida com **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, **Prisma ORM** e **MySQL**.

---

## ✨ Funcionalidades

### 🌐 Área Pública (Catálogo)
- **Busca Rápida Inteligente**: Pesquisa em tempo real por nome do prestador, serviços/especialidades, bairros e cidades.
- **Categorias com Ícones**: Navegação organizada por ramos (Eletricistas, Encanadores, Pintores, Ar-Condicionado, Chaveiros, Marcenaria, etc.).
- **Cards de Prestadores**:
  - Foto/Logotipo e informações do negócio.
  - Selo de **Destaque / Verificado**.
  - **Botão Direto para WhatsApp** com mensagem de orçamento pré-preenchida.
  - **Botão para Ligar** diretamente do celular ou desktop.
  - Endereço, Bairro e Cidade.
  - CNPJ ou CPF formatado.
- **Página de Detalhes do Prestador**: Perfil completo com foto de capa, galeria de serviços, contatos (WhatsApp, Telefone, E-mail, Site, Instagram) e contador de acessos.
- **Filtros Dinâmicos**: Filtragem combinada por categoria, cidade e palavras-chave.

---

### 🛡️ Painel Administrativo (`/admin`)
- **Autenticação Segura**: Login e senha protegidos com JWT e cookies `HttpOnly` com criptografia `bcryptjs`.
- **Dashboard com Métricas**: Total de prestadores cadastrados, ativos, categorias e total de visualizações.
- **Gerenciamento de Prestadores**:
  - Listagem com busca e filtros de status.
  - Ativação/Desativação de empresas em 1 clique.
  - Marcação de empresas em Destaque.
  - Formulário completo de cadastro e edição (Nome, Categoria, CNPJ, WhatsApp, Telefone, E-mail, Site, Instagram, Endereço, Cidade, Estado, CEP, Descrição, Especialidades e Fotos).
  - Exclusão com modal de confirmação.
- **Gerenciamento de Categorias**:
  - Criar, editar e excluir categorias.
  - Seletor visual de ícones.
  - Proteção contra exclusão acidental de categorias que possuam prestadores associados.

---

## 🚀 Como Configurar e Rodar o Projeto

### 1. Configurar o Banco de Dados MySQL
Abra o arquivo `.env` na raiz do projeto e ajuste as credenciais do seu MySQL local:

```env
DATABASE_URL="mysql://SEU_USUARIO:SUA_SENHA@localhost:3306/catalogo_servicos"
JWT_SECRET="chave_secreta_super_segura_catalogo_servicos_2025"
```

> **Dica**: Caso o banco `catalogo_servicos` ainda não exista, o Prisma cria automaticamente ao executar o comando abaixo.

### 2. Sincronizar as Tabelas no MySQL
Execute o comando para criar a estrutura de tabelas no MySQL:

```bash
npm run db:push
```

### 3. Popular com Dados Iniciais e Criar o Usuário Admin
Execute o seed para carregar as categorias padrão, prestadores de exemplo e o administrador inicial:

```bash
npm run db:seed
```

### 4. Iniciar a Aplicação
Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra seu navegador em [http://localhost:3000](http://localhost:3000).

---

## 🔑 Credenciais de Acesso ao Painel Admin

- **URL de Acesso**: [http://localhost:3000/admin](http://localhost:3000/admin) (ou clique em **Painel Admin** no cabeçalho)
- **E-mail**: `admin@catalogo.com`
- **Senha**: `admin123`

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor em modo desenvolvimento na porta 3000 |
| `npm run build` | Valida a tipagem TypeScript e compila para produção |
| `npm run start` | Inicia o servidor de produção compilado |
| `npm run db:push` | Aplica o schema do Prisma diretamente no MySQL |
| `npm run db:seed` | Executa o script de dados iniciais e admin |
| `npm run db:studio` | Abre a interface visual do Prisma Studio no navegador |
