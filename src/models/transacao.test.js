import mongoose from 'mongoose';
import Transacao from './transacao.js';

function criarTransacaoValida(overrides = {}) {
  return new Transacao({
    tipo: 'receita',
    categoria: 'Salario',
    data: '2026-06-06',
    valor: 1250.75,
    descricao: 'Pagamento mensal',
    ...overrides,
  });
}

describe('Transacao model', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('usa a collection transacoes', () => {
    expect(Transacao.collection.name).toBe('transacoes');
  });

  it('valida uma transacao com os campos essenciais do dominio', () => {
    const transacao = criarTransacaoValida();
    const erro = transacao.validateSync();

    expect(erro).toBeUndefined();
    expect(transacao.tipo).toBe('receita');
    expect(transacao.categoria).toBe('Salario');
    expect(transacao.data).toBeInstanceOf(Date);
    expect(transacao.data.toISOString()).toBe('2026-06-06T00:00:00.000Z');
    expect(transacao.valor).toBe(1250.75);
    expect(transacao.descricao).toBe('Pagamento mensal');
  });

  it('rejeita data fora do formato ISO 8601', () => {
    const transacao = criarTransacaoValida({ data: '06-06-2026' });
    const erro = transacao.validateSync();

    expect(erro).toBeDefined();
    expect(erro.errors.data).toBeDefined();
  });

  it('mantem descricao como opcional', () => {
    const transacao = criarTransacaoValida({ descricao: undefined });
    const erro = transacao.validateSync();

    expect(erro).toBeUndefined();
    expect(transacao.descricao).toBeUndefined();
  });

  it('rejeita tipo fora do dominio permitido', () => {
    const transacao = criarTransacaoValida({ tipo: 'transferencia' });
    const erro = transacao.validateSync();

    expect(erro).toBeDefined();
    expect(erro.errors.tipo).toBeDefined();
    expect(erro.errors.tipo.message).toBe('O tipo deve ser receita ou despesa.');
  });

  it('rejeita data fora do ISO 8601', () => {
    const transacao = criarTransacaoValida({ data: '06/06/2026' });
    const erro = transacao.validateSync();

    expect(erro).toBeDefined();
    expect(erro.errors.data).toBeDefined();
  });

  it('rejeita valor zero ou negativo', () => {
    const transacao = criarTransacaoValida({ valor: 0 });
    const erro = transacao.validateSync();

    expect(erro).toBeDefined();
    expect(erro.errors.valor).toBeDefined();
  });

  it('exige os campos obrigatorios do schema', () => {
    const transacao = new Transacao({});
    const erro = transacao.validateSync();

    expect(erro).toBeDefined();
    expect(Object.keys(erro.errors)).toEqual(
      expect.arrayContaining(['tipo', 'categoria', 'data', 'valor'])
    );
  });
});
