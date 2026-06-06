const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function isIso8601Date(value) {
  if (typeof value !== 'string' || !ISO_8601_REGEX.test(value)) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function validarTransacaoPayload(payload = {}) {
  const erros = [];

  const tipo = typeof payload.tipo === 'string' ? payload.tipo.trim().toLowerCase() : '';
  const categoria = typeof payload.categoria === 'string' ? payload.categoria.trim() : '';
  const data = payload.data;
  const valor = payload.valor;
  const descricao =
    typeof payload.descricao === 'string' ? payload.descricao.trim() || undefined : undefined;

  if (!tipo) {
    erros.push({ campo: 'tipo', mensagem: 'O tipo da transação é obrigatório.' });
  } else if (!['receita', 'despesa'].includes(tipo)) {
    erros.push({ campo: 'tipo', mensagem: 'O tipo deve ser receita ou despesa.' });
  }

  if (!categoria) {
    erros.push({ campo: 'categoria', mensagem: 'A categoria da transação é obrigatória.' });
  }

  if (data == null || data === '') {
    erros.push({ campo: 'data', mensagem: 'A data da transação é obrigatória.' });
  } else if (!isIso8601Date(data)) {
    erros.push({ campo: 'data', mensagem: 'A data deve estar em ISO 8601.' });
  }

  if (valor == null || valor === '') {
    erros.push({ campo: 'valor', mensagem: 'O valor da transação é obrigatório.' });
  } else if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    erros.push({ campo: 'valor', mensagem: 'O valor da transação deve ser um número.' });
  } else if (valor <= 0) {
    erros.push({ campo: 'valor', mensagem: 'O valor da transação deve ser maior que zero.' });
  }

  return {
    erros,
    transacaoValida:
      erros.length === 0
        ? {
            tipo,
            categoria,
            data,
            valor,
            ...(descricao !== undefined ? { descricao } : {}),
          }
        : null,
  };
}
