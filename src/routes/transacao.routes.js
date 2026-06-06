import { Router } from 'express';
import { criarTransacao } from '../controllers/transacao.controller.js';

const router = Router();

router.post('/transacoes', criarTransacao);

export default router;
