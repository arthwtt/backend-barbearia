# Sistema de Barbearia - Backend API 💈

Este projeto consiste no desenvolvimento de uma API RESTful para um sistema de gestão de barbearias. A plataforma conecta clientes a barbeiros, permitindo agendamentos, gestão de horários e autenticação segura.

Desenvolvido como parte da disciplina de Laboratório de Orientação a Objetos (2025-2).

## 🚀 Tecnologias Utilizadas

* **Node.js** (Ambiente de execução)
* **Express** (Framework Web)
* **MySQL** (Banco de Dados)
* **Sequelize** (ORM para gestão do banco)
* **JWT** (JSON Web Token para autenticação)
* **Swagger** (Documentação da API)
* **Bcrypt** (Criptografia de senhas)

## 📋 Funcionalidades Implementadas

* **Autenticação:**
    * Cadastro de Usuários (Clientes).
    * Login com geração de Token JWT.
    * Diferenciação de perfil (Cliente vs Barbeiro).
* **Agendamentos:**
    * Criação de novos agendamentos.
    * Listagem de histórico (Filtrado por Cliente ou Barbeiro).
    * Cancelamento de agendamentos (Com validação de permissão).
* **Documentação:**
    * Interface Swagger UI acessível em `/docs`.

## ⚙️ Como Rodar o Projeto

### Pré-requisitos
* Node.js instalado.
* MySQL rodando (XAMPP ou serviço local).

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU_USUARIO/barbearia-backend.git](https://github.com/SEU_USUARIO/barbearia-backend.git)
    cd barbearia-backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto e configure conforme o seu banco de dados:
    ```env
    TOKEN_SECRET=sua_chave_secreta_aqui
    ```
    *Nota: As configurações do banco de dados ficam em `config/config.json`.*

4.  **Configure o Banco de Dados (Sequelize):**
    ```bash
    # Cria o banco
    npx sequelize-cli db:create

    # Cria as tabelas
    npx sequelize-cli db:migrate

    # Cria o Barbeiro inicial (Seed)
    npx sequelize-cli db:seed:all
    ```

5.  **Inicie o Servidor:**
    ```bash
    npm run dev
    ```

6.  **Acesse a Documentação:**
    Abra o navegador em: `http://localhost:3000/docs`

## 👨‍💻 Autores (Equipe 1)

* Anna Julya
* Arthur José
* Gabriel Tatagiba
* João Pedro Teixeira
* Ricardo Cury
* Roberto Cabral
* Jefferson Bartholazi

---
*Projeto educacional.*