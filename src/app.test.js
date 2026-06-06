import { jest } from '@jest/globals';
import request from 'supertest';

const saveMock = jest.fn();
const transacaoMock = jest.fn().mockImplementation(function (dados) {
  this.dados = dados;
  this.save = saveMock;
});

jest.unstable_mockModule('./models/transacao.js', () => ({
  default: transacaoMock,
}));

const { default: app } = await import('./app.js');

describe('API de transacoes', () => {
  beforeEach(() => {
    transacaoMock.mockClear();
    saveMock.mockReset();
  });

  it('cadastra uma transacao valida e persiste os dados normalizados', async () => {
    saveMock.mockImplementation(function () {
      return Promise.resolve({
        _id: 'transacao-1',
        ...this.dados,
      });
    });

    const resposta = await request(app).post('/transacoes').send({
      tipo: ' Receita ',
      categoria: '  Salario  ',
      data: '2026-06-06',
      valor: 1250.75,
    });

    expect(resposta.status).toBe(201);
    expect(transacaoMock).toHaveBeenCalledTimes(1);
    expect(transacaoMock).toHaveBeenCalledWith({
      tipo: 'receita',
      categoria: 'Salario',
      data: '2026-06-06',
      valor: 1250.75,
    });
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(resposta.body).toMatchObject({
      _id: 'transacao-1',
      tipo: 'receita',
      categoria: 'Salario',
      data: '2026-06-06',
      valor: 1250.75,
    });
    expect(resposta.body.descricao).toBeUndefined();
  });

  it('rejeita payload invalido com mensagens coerentes', async () => {
    const resposta = await request(app).post('/transacoes').send({
      tipo: 'transferencia',
      categoria: '',
      data: '06/06/2026',
      valor: 0,
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({
      mensagem: 'Nao foi possivel criar a transacao.',
    });
    expect(resposta.body.erros).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campo: 'tipo',
          mensagem: 'O tipo deve ser receita ou despesa.',
        }),
        expect.objectContaining({
          campo: 'categoria',
          mensagem: 'A categoria da transação é obrigatória.',
        }),
        expect.objectContaining({
          campo: 'data',
          mensagem: 'A data deve estar no formato AAAA-MM-DD ou DD-MM-AAAA.',
        }),
        expect.objectContaining({
          campo: 'valor',
          mensagem: 'O valor da transação deve ser maior que zero.',
        }),
      ])
    );
    expect(transacaoMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });
});
