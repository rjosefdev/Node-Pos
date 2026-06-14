# Node-Pos

API em Node para matéria de Fullstack Developer - Pós Graduação.

## Estrutura do Projeto

A estrutura padrão do repositório segue uma separação por responsabilidade:

```text
src/
  config/
    database.js
  models/
    user.model.js
  controllers/
    user.controller.js
  routes/
    user.routes.js
  services/
    user.service.js
```

### Fluxo da aplicação

O fluxo recomendado para cada requisição é:

```text
Request
  ↓
Route
  ↓
Controller
  ↓
Service
  ↓
Model/MongoDB
  ↓
Response
```

### Responsabilidade de cada camada

- `routes`: define os endpoints e direciona a requisição para o controller.
- `controllers`: recebe a requisição, extrai dados e monta a resposta.
- `services`: concentra as regras de negócio.
- `models`: representa o acesso ao MongoDB e as operações de dados.
- `config`: centraliza configurações da aplicação, como conexão com o banco.

### Prints do INSOMNIA

[POST] Adicionar Transação de Entrada

![add transacao tipo entrada](/assets/addTransacaoEntrada.png)

[DELETE] Transação por ID

![delete by id](/assets/deleteById.png)
