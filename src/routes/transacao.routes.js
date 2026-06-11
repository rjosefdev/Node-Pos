import { Router } from 'express';
import {
  buscarTransacaoPorId,
  criarTransacao,
  listarTransacoes,
} from '../controllers/transacao.controller.js';

const router = Router();

router.get('/transacoes', listarTransacoes);
router.post('/transacoes', criarTransacao);
router.get('/transacoes/:id', buscarTransacaoPorId);

export default router;
