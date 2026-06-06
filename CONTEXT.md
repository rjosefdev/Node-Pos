# Gestor Financeiro Pessoal

Contexto da API REST para controle financeiro pessoal da atividade 2. O foco é registrar movimentações, listar e filtrar o histórico e calcular saldo.

## Language

**Transação**:
Uma movimentação financeira registrada na API, representando uma entrada ou uma saída de dinheiro.
_Avoid_: Movimentação, lançamento

**Receita**:
Uma transação do tipo entrada de dinheiro.
_Avoid_: Entrada, ganho

**Despesa**:
Uma transação do tipo saída de dinheiro.
_Avoid_: Saída, gasto

**Categoria**:
O rótulo livre usado para agrupar transações por tipo de uso ou origem.
No filtro, a comparação é normalizada e não distingue maiúsculas de minúsculas.
_Avoid_: Classe, grupo

**Saldo**:
O valor resultante da soma das receitas menos as despesas, podendo ser calculado no geral ou dentro de um filtro.
_Avoid_: Balanço

**Real brasileiro**:
A única moeda usada nas transações da API.
_Avoid_: Moeda, currency, valor em geral

**Descrição**:
Um texto livre opcional para detalhar a transação com mais contexto.
_Avoid_: Observação, detalhe, nota

**Valor**:
O montante da transação, sempre informado como número positivo e com suporte a centavos.
_Avoid_: Quantia, preço, total

**Ordenação padrão**:
A listagem de transações mostra primeiro as transações mais recentes.
_Avoid_: Mais antigas primeiro
