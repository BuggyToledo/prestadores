# Guia de Publicação e Configuração do MySQL

Este guia passo a passo explica como publicar o site no seu próprio domínio e configurar a conexão com o banco de dados MySQL de produção.

---

## 1. O que você precisa

1. **Seu domínio próprio** (exemplo: `sindicone.com.br` no Registro.br, GoDaddy, Hostinger, etc.).
2. **Um servidor ou hospedagem para Next.js** (Recomendamos a **Vercel** ou **Railway / VPS**).
3. **Um banco de dados MySQL** (pode ser na Hostinger, cPanel, Railway, PlanetScale, Aiven ou no mesmo servidor).

---

## 2. Como Configurar o Banco de Dados MySQL

### Passo A: Criar a base de dados no seu provedor MySQL
No painel da sua hospedagem (ex: cPanel, phpMyAdmin, Hostinger ou Cloud):
1. Crie um novo banco de dados: por exemplo `catalogo_sindicone`.
2. Crie um usuário para o banco (ex: `sindico_user`) com uma senha forte.
3. Conceda **TODOS OS PRIVILÉGIOS** para esse usuário no banco de dados criado.

### Passo B: Formato da URL de Conexão (`DATABASE_URL`)
A string de conexão deve seguir este formato:
```env
DATABASE_URL="mysql://USUARIO:SENHA@HOST:3306/NOME_DO_BANCO"
```
*Exemplo real:*
```env
DATABASE_URL="mysql://sindico_user:MinhaSenhaForte123@sql123.hostinger.com:3306/catalogo_sindicone"
```

### Passo C: Criar as tabelas automaticamente (Migração Prisma)
No seu computador ou terminal do servidor onde o projeto está clonado:
```bash
# 1. Instalar as dependências
npm install

# 2. Gerar o cliente Prisma
npx prisma generate

# 3. Criar todas as tabelas no MySQL automaticamente
npm run db:push

# 4. Inserir o usuário administrador e categorias padrão
npm run db:seed
```

> **Dados do Admin Padrão criados pelo Seed:**  
> - **E-mail:** `admin@catalogo.com`  
> - **Senha:** `admin123`  
> *(Altere a senha após o primeiro acesso no painel administrativo)*

---

## 3. Variáveis de Ambiente para Produção

No painel da sua hospedagem (ex: Vercel em *Settings > Environment Variables*), adicione:

| Variável | Valor de Exemplo | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | `mysql://usuario:senha@host:3306/banco` | Link de conexão com seu MySQL |
| `USE_REAL_PRISMA` | `true` | Ativa a conexão direta com o MySQL |
| `JWT_SECRET` | `uma_chave_longa_e_aleatoria_aqui_12345` | Segredo para gerar tokens seguros |
| `NEXT_PUBLIC_APP_URL` | `https://sindicone.com.br` | A URL pública do seu domínio com HTTPS |

---

## 4. Como Publicar o Site na Vercel (Opção mais recomendada e fácil)

A **Vercel** foi criada pelos mesmos desenvolvedores do **Next.js**, tem plano gratuito excelente e configura SSL (HTTPS) automático.

1. Crie uma conta gratuita em [vercel.com](https://vercel.com).
2. Suba o código do projeto para o seu GitHub (repositório privado ou público).
3. Na Vercel, clique em **"Add New..." > "Project"** e selecione o repositório.
4. Na seção **"Environment Variables"**, cole as 4 variáveis listadas acima.
5. Clique em **"Deploy"**. Em cerca de 2 minutos seu site estará no ar!

---

## 5. Como Apontar o seu Domínio Próprio

Depois que o site estiver no ar na Vercel (ou em sua hospedagem):

1. Na Vercel, vá em **Project Settings > Domains** e digite seu domínio:
   - `sindicone.com.br`
   - `www.sindicone.com.br`
2. A Vercel mostrará os apontamentos de DNS necessários.
3. Acesse o painel onde você comprou o domínio (por exemplo, no **Registro.br**):
   - Vá na zona de DNS e adicione:
     - **Registro Tipo A**:
       - Nome / Host: `@` (ou em branco)
       - Destino / IP: `76.76.21.21` (IP fornecido pela Vercel)
     - **Registro Tipo CNAME**:
       - Nome / Host: `www`
       - Destino: `cname.vercel-dns.com`
4. Aguarde a propagação (costuma levar de 15 minutos a poucas horas).
5. O certificado de segurança HTTPS (cadeado verde) é ativado automaticamente e gratuitamente!

---

## 6. Publicação em Servidor Próprio / VPS (Hostinger, DigitalOcean, etc.)

Se preferir rodar em um servidor VPS com Ubuntu e Nginx:
```bash
# 1. No servidor, clone o repositório
git clone <seu-repositorio>
cd <pasta-do-projeto>

# 2. Crie o arquivo .env com as variáveis de produção
nano .env

# 3. Instale e gere a build
npm install
npm run build
npm run db:push
npm run db:seed

# 4. Iniciar com PM2 para manter rodando 24 horas
npm install -g pm2
pm2 start npm --name "catalogo" -- start
pm2 save
pm2 startup
```
E configure o Nginx como proxy reverso para `http://localhost:3000`.
