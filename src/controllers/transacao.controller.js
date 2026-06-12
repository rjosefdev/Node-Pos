import Transacao from '../models/transacao.js';
import { validarTransacaoPayload } from '../validators/transacao.js';

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DMY_REGEX = /^\d{2}-\d{2}-\d{4}$/;

function escaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizarDataFiltro(valor) {
  if (typeof valor !== 'string') {
    return null;
  }

  const dataTexto = valor.trim();

  if (!dataTexto) {
    return null;
  }

  if (YMD_REGEX.test(dataTexto)) {
    const [ano, mes, dia] = dataTexto.split('-').map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));

    if (
      data.getUTCFullYear() === ano &&
      data.getUTCMonth() === mes - 1 &&
      data.getUTCDate() === dia
    ) {
      return data;
    }
  }

  if (DMY_REGEX.test(dataTexto)) {
    const [dia, mes, ano] = dataTexto.split('-').map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));

    if (
      data.getUTCFullYear() === ano &&
      data.getUTCMonth() === mes - 1 &&
      data.getUTCDate() === dia
    ) {
      return data;
    }
  }

  return null;
}

function obterPrimeiroValorInformado(objeto, chaves) {
  for (const chave of chaves) {
    const valor = objeto?.[chave];

    if (typeof valor === 'string' && valor.trim()) {
      return valor;
    }
  }

  return null;
}

function montarFiltroTransacoes(query = {}) {
  const filtro = {};

  if (typeof query.tipo === 'string') {
    const tipo = query.tipo.trim().toLowerCase();

    if (tipo) {
      filtro.tipo = tipo;
    }
  }

  if (typeof query.categoria === 'string') {
    const categoria = query.categoria.trim();

    if (categoria) {
      filtro.categoria = new RegExp(`^${escaparRegex(categoria)}$`, 'i');
    }
  }

  const dataInicial = normalizarDataFiltro(obterPrimeiroValorInformado(query, ['dataInicio']));
  const dataFinal = normalizarDataFiltro(obterPrimeiroValorInformado(query, ['dataFim']));

  if (dataInicial || dataFinal) {
    filtro.data = {};

    if (dataInicial) {
      filtro.data.$gte = dataInicial;
    }

    if (dataFinal) {
      filtro.data.$lte = dataFinal;
    }
  }

  return filtro;
}

function calcularResumoFinanceiro(transacoes = []) {
  return transacoes.reduce(
    (resumo, transacao) => {
      const valor = Number(transacao?.valor) || 0;
      const tipo = transacao?.tipo;

      if (tipo === 'receita') {
        resumo.receitas += valor;
        resumo.saldo += valor;
      } else if (tipo === 'despesa') {
        resumo.despesas += valor;
        resumo.saldo -= valor;
      }

      return resumo;
    },
    {
      receitas: 0,
      despesas: 0,
      saldo: 0,
    }
  );
}

export async function criarTransacao(req, res, next) {
  try {
    const { erros, transacaoValida } = validarTransacaoPayload(req.body);

    if (erros.length > 0) {
      return res.status(400).json({
        mensagem: 'Nao foi possivel criar a transacao.',
        erros,
      });
    }

    const transacao = new Transacao(transacaoValida);
    const transacaoCriada = await transacao.save();

    return res.status(201).json(transacaoCriada);
  } catch (erro) {
    return next(erro);
  }
}

export async function atualizarTransacao(req, res, next) {
  try {
    const { erros, transacaoValida } = validarTransacaoPayload(req.body);

    if (erros.length > 0) {
      return res.status(400).json({
        mensagem: 'Nao foi possivel atualizar a transacao.',
        erros,
      });
    }

    const { id } = req.params;

    let transacao;

    try {
      transacao = await Transacao.findById(id).exec();
    } catch (erro) {
      if (erro?.name === 'CastError') {
        return res.status(404).json({
          mensagem: 'Transacao nao encontrada.',
        });
      }

      throw erro;
    }

    if (!transacao) {
      return res.status(404).json({
        mensagem: 'Transacao nao encontrada.',
      });
    }

    Object.assign(transacao, transacaoValida);
    const transacaoAtualizada = await transacao.save();

    return res.json(transacaoAtualizada);
  } catch (erro) {
    return next(erro);
  }
}

export async function listarTransacoes(req, res, next) {
  try {
    const filtro = montarFiltroTransacoes(req.query);
    const transacoes = await Transacao.find(filtro).sort({ data: -1, _id: -1 }).exec();

    return res.json(transacoes);
  } catch (erro) {
    return next(erro);
  }
}

export async function consultarSaldo(req, res, next) {
  try {
    const filtro = montarFiltroTransacoes(req.query);
    const transacoes = await Transacao.find(filtro).exec();
    const resumo = calcularResumoFinanceiro(transacoes);

    return res.json(resumo);
  } catch (erro) {
    return next(erro);
  }
}

export async function buscarTransacaoPorId(req, res, next) {
  try {
    const { id } = req.params;

    let transacao;

    try {
      transacao = await Transacao.findById(id).exec();
    } catch (erro) {
      if (erro?.name === 'CastError') {
        return res.status(404).json({
          mensagem: 'Transacao nao encontrada.',
        });
      }

      throw erro;
    }

    if (!transacao) {
      return res.status(404).json({
        mensagem: 'Transacao nao encontrada.',
      });
    }

    return res.json(transacao);
  } catch (erro) {
    return next(erro);
  }
}
