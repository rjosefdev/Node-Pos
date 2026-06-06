import Transacao from '../models/transacao.js';
import { validarTransacaoPayload } from '../validators/transacao.js';

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
