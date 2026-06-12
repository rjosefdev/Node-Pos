import { jest } from '@jest/globals';
import request from 'supertest';

const saveMock = jest.fn();
const findMock = jest.fn();
const findByIdMock = jest.fn();
const findByIdAndDeleteMock = jest.fn();
const transacaoMock = jest.fn().mockImplementation(function (dados) {
  this.dados = dados;
  this.save = saveMock;
});

transacaoMock.find = findMock;
transacaoMock.findById = findByIdMock;
transacaoMock.findByIdAndDelete = findByIdAndDeleteMock;

function criarDataUtc(ano, mes, dia) {
  return new Date(Date.UTC(ano, mes - 1, dia));
}

jest.unstable_mockModule('./models/transacao.js', () => ({
  default: transacaoMock,
}));

const { default: app } = await import('./app.js');

describe('API de transacoes', () => {
  beforeEach(() => {
    transacaoMock.mockClear();
    saveMock.mockReset();
    findMock.mockReset();
    findByIdMock.mockReset();
    findByIdAndDeleteMock.mockReset();
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
      moeda: 'BRL',
    });
    expect(resposta.body.descricao).toBeUndefined();
  });

  it('atualiza uma transacao existente e persiste as alteracoes', async () => {
    const transacaoExistente = {
      _id: 'transacao-42',
      tipo: 'despesa',
      categoria: 'Alimentacao',
      data: '2026-06-10',
      valor: 87.9,
      descricao: 'Almoco',
      save: saveMock,
    };

    const execMock = jest.fn().mockResolvedValue(transacaoExistente);
    findByIdMock.mockReturnValue({ exec: execMock });
    saveMock.mockImplementation(function () {
      return Promise.resolve({
        _id: this._id,
        tipo: this.tipo,
        categoria: this.categoria,
        data: this.data,
        valor: this.valor,
        descricao: this.descricao,
      });
    });

    const resposta = await request(app).put('/transacoes/transacao-42').send({
      tipo: ' Receita ',
      categoria: '  Salario  ',
      data: '2026-06-12',
      valor: 1500.5,
      descricao: ' Salario atualizado ',
    });

    expect(resposta.status).toBe(200);
    expect(findByIdMock).toHaveBeenCalledWith('transacao-42');
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(transacaoExistente.tipo).toBe('receita');
    expect(transacaoExistente.categoria).toBe('Salario');
    expect(transacaoExistente.data).toBe('2026-06-12');
    expect(transacaoExistente.valor).toBe(1500.5);
    expect(transacaoExistente.descricao).toBe('Salario atualizado');
    expect(resposta.body).toEqual({
      _id: 'transacao-42',
      tipo: 'receita',
      categoria: 'Salario',
      data: '2026-06-12',
      valor: 1500.5,
      descricao: 'Salario atualizado',
      moeda: 'BRL',
    });
  });

  it('rejeita atualizacao invalida com mensagens coerentes', async () => {
    const resposta = await request(app).put('/transacoes/transacao-42').send({
      tipo: 'transferencia',
      categoria: '',
      data: '06/06/2026',
      valor: -10,
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toMatchObject({
      mensagem: 'Nao foi possivel atualizar a transacao.',
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
    expect(findByIdMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('retorna 404 quando tenta atualizar uma transacao inexistente', async () => {
    const execMock = jest.fn().mockResolvedValue(null);
    findByIdMock.mockReturnValue({ exec: execMock });

    const resposta = await request(app).put('/transacoes/transacao-inexistente').send({
      tipo: 'despesa',
      categoria: 'Alimentacao',
      data: '2026-06-12',
      valor: 20,
    });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      mensagem: 'Transacao nao encontrada.',
    });
    expect(findByIdMock).toHaveBeenCalledWith('transacao-inexistente');
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(saveMock).not.toHaveBeenCalled();
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

  it('lista todas as transacoes da mais recente para a mais antiga', async () => {
    const execMock = jest.fn().mockResolvedValue([
      { _id: 't-3', data: '2026-06-03', valor: 30 },
      { _id: 't-2', data: '2026-06-02', valor: 20 },
      { _id: 't-1', data: '2026-06-01', valor: 10 },
    ]);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });

    findMock.mockReturnValue({ sort: sortMock });

    const resposta = await request(app).get('/transacoes');

    expect(resposta.status).toBe(200);
    expect(findMock).toHaveBeenCalledTimes(1);
    expect(findMock).toHaveBeenCalledWith({});
    expect(sortMock).toHaveBeenCalledWith({ data: -1, _id: -1 });
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(resposta.body).toEqual([
      { _id: 't-3', data: '2026-06-03', valor: 30, moeda: 'BRL' },
      { _id: 't-2', data: '2026-06-02', valor: 20, moeda: 'BRL' },
      { _id: 't-1', data: '2026-06-01', valor: 10, moeda: 'BRL' },
    ]);
  });

  it('filtra transacoes por tipo', async () => {
    const execMock = jest.fn().mockResolvedValue([{ _id: 't-1', tipo: 'despesa' }]);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });

    findMock.mockReturnValue({ sort: sortMock });

    const resposta = await request(app).get('/transacoes').query({ tipo: 'Despesa' });

    expect(resposta.status).toBe(200);
    expect(findMock).toHaveBeenCalledWith({ tipo: 'despesa' });
    expect(sortMock).toHaveBeenCalledWith({ data: -1, _id: -1 });
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it('filtra transacoes por categoria sem diferenciar maiusculas e minusculas', async () => {
    const execMock = jest.fn().mockResolvedValue([{ _id: 't-1', categoria: 'Alimentacao' }]);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });

    findMock.mockReturnValue({ sort: sortMock });

    const resposta = await request(app).get('/transacoes').query({ categoria: 'alimentacao' });

    expect(resposta.status).toBe(200);
    expect(findMock).toHaveBeenCalledWith({
      categoria: /^alimentacao$/i,
    });
    expect(sortMock).toHaveBeenCalledWith({ data: -1, _id: -1 });
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it('filtra transacoes por intervalo livre de datas', async () => {
    const execMock = jest.fn().mockResolvedValue([{ _id: 't-2', data: '2026-06-05' }]);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });

    findMock.mockReturnValue({ sort: sortMock });

    const resposta = await request(app).get('/transacoes').query({
      dataInicio: '2026-06-02',
      dataFim: '2026-06-10',
    });

    expect(resposta.status).toBe(200);
    expect(findMock).toHaveBeenCalledWith({
      data: {
        $gte: criarDataUtc(2026, 6, 2),
        $lte: criarDataUtc(2026, 6, 10),
      },
    });
    expect(sortMock).toHaveBeenCalledWith({ data: -1, _id: -1 });
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it('ignora aliases antigos de intervalo de datas', async () => {
    const execMock = jest.fn().mockResolvedValue([{ _id: 't-1' }]);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });

    findMock.mockReturnValue({ sort: sortMock });

    const resposta = await request(app).get('/transacoes').query({
      dataInicial: '2026-06-02',
      dataFinal: '2026-06-10',
    });

    expect(resposta.status).toBe(200);
    expect(findMock).toHaveBeenCalledWith({});
    expect(sortMock).toHaveBeenCalledWith({ data: -1, _id: -1 });
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it('combina filtros de tipo, categoria e datas na mesma consulta', async () => {
    const execMock = jest.fn().mockResolvedValue([{ _id: 't-9' }]);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });

    findMock.mockReturnValue({ sort: sortMock });

    const resposta = await request(app).get('/transacoes').query({
      tipo: 'Despesa',
      categoria: 'alimentacao',
      dataInicio: '2026-06-01',
      dataFim: '2026-06-30',
    });

    expect(resposta.status).toBe(200);
    expect(findMock).toHaveBeenCalledWith({
      tipo: 'despesa',
      categoria: /^alimentacao$/i,
      data: {
        $gte: criarDataUtc(2026, 6, 1),
        $lte: criarDataUtc(2026, 6, 30),
      },
    });
    expect(sortMock).toHaveBeenCalledWith({ data: -1, _id: -1 });
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it('consulta o saldo geral considerando receitas e despesas', async () => {
    const execMock = jest.fn().mockResolvedValue([
      { _id: 't-1', tipo: 'receita', valor: 250 },
      { _id: 't-2', tipo: 'despesa', valor: 40 },
      { _id: 't-3', tipo: 'receita', valor: 100 },
    ]);

    findMock.mockReturnValue({ exec: execMock });

    const resposta = await request(app).get('/transacoes/saldo');

    expect(resposta.status).toBe(200);
    expect(findMock).toHaveBeenCalledWith({});
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(resposta.body).toEqual({
      receitas: 350,
      despesas: 40,
      saldo: 310,
      moeda: 'BRL',
    });
  });

  it('consulta o saldo filtrado por intervalo de datas', async () => {
    const execMock = jest.fn().mockResolvedValue([
      { _id: 't-2', tipo: 'despesa', valor: 75 },
      { _id: 't-3', tipo: 'receita', valor: 125 },
    ]);

    findMock.mockReturnValue({ exec: execMock });

    const resposta = await request(app).get('/transacoes/saldo').query({
      dataInicio: '2026-06-02',
      dataFim: '2026-06-10',
    });

    expect(resposta.status).toBe(200);
    expect(findMock).toHaveBeenCalledWith({
      data: {
        $gte: criarDataUtc(2026, 6, 2),
        $lte: criarDataUtc(2026, 6, 10),
      },
    });
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(resposta.body).toEqual({
      receitas: 125,
      despesas: 75,
      saldo: 50,
      moeda: 'BRL',
    });
  });

  it('consulta uma transacao pelo identificador', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: 'transacao-42',
      tipo: 'despesa',
      categoria: 'Alimentacao',
      data: '2026-06-10',
      valor: 87.9,
      descricao: 'Almoco',
    });

    findByIdMock.mockReturnValue({ exec: execMock });

    const resposta = await request(app).get('/transacoes/transacao-42');

    expect(resposta.status).toBe(200);
    expect(findByIdMock).toHaveBeenCalledWith('transacao-42');
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(resposta.body).toEqual({
      _id: 'transacao-42',
      tipo: 'despesa',
      categoria: 'Alimentacao',
      data: '2026-06-10',
      valor: 87.9,
      descricao: 'Almoco',
      moeda: 'BRL',
    });
  });

  it('retorna 404 quando a transacao nao existe', async () => {
    const execMock = jest.fn().mockResolvedValue(null);

    findByIdMock.mockReturnValue({ exec: execMock });

    const resposta = await request(app).get('/transacoes/transacao-inexistente');

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      mensagem: 'Transacao nao encontrada.',
    });
    expect(findByIdMock).toHaveBeenCalledWith('transacao-inexistente');
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it('exclui uma transacao permanentemente e remove dos resultados', async () => {
    const transacoes = new Map();

    saveMock.mockImplementation(function () {
      const transacaoCriada = {
        _id: 'transacao-1',
        ...this.dados,
      };

      transacoes.set(transacaoCriada._id, transacaoCriada);

      return Promise.resolve(transacaoCriada);
    });

    findByIdAndDeleteMock.mockImplementation((id) => ({
      exec: jest.fn().mockImplementation(async () => {
        const transacao = transacoes.get(id) ?? null;

        if (transacao) {
          transacoes.delete(id);
        }

        return transacao;
      }),
    }));

    findMock.mockImplementation((filtro = {}) => {
      const documentos = [...transacoes.values()].filter((transacao) => {
        if (typeof filtro.tipo === 'string' && transacao.tipo !== filtro.tipo) {
          return false;
        }

        if (filtro.categoria instanceof RegExp && !filtro.categoria.test(transacao.categoria)) {
          return false;
        }

        return true;
      });

      const execMock = jest.fn().mockResolvedValue(documentos);

      return {
        sort: jest.fn().mockReturnValue({ exec: execMock }),
        exec: execMock,
      };
    });

    const criacaoResposta = await request(app).post('/transacoes').send({
      tipo: 'despesa',
      categoria: 'Alimentacao',
      data: '2026-06-11',
      valor: 45.5,
    });

    expect(criacaoResposta.status).toBe(201);
    expect(transacoes.has('transacao-1')).toBe(true);

    const exclusaoResposta = await request(app).delete('/transacoes/transacao-1');

    expect(exclusaoResposta.status).toBe(204);
    expect(exclusaoResposta.text).toBe('');
    expect(findByIdAndDeleteMock).toHaveBeenCalledWith('transacao-1');
    expect(transacoes.has('transacao-1')).toBe(false);

    const listagemResposta = await request(app).get('/transacoes');

    expect(listagemResposta.status).toBe(200);
    expect(listagemResposta.body).toEqual([]);

    const filtragemResposta = await request(app)
      .get('/transacoes')
      .query({ categoria: 'alimentacao' });

    expect(filtragemResposta.status).toBe(200);
    expect(filtragemResposta.body).toEqual([]);
  });
});
