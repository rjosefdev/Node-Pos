import { Router } from 'express';
import {
  atualizarTransacao,
  buscarTransacaoPorId,
  criarTransacao,
  excluirTransacao,
  consultarSaldo,
  listarTransacoes,
} from '../controllers/transacao.controller.js';

const router = Router();

router.get('/transacoes', listarTransacoes);
router.get('/transacoes/saldo', consultarSaldo);
router.post('/transacoes', criarTransacao);
router.put('/transacoes/:id', atualizarTransacao);
router.delete('/transacoes/:id', excluirTransacao);
router.get('/transacoes/:id', buscarTransacaoPorId);

export default router;
