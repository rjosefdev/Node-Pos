import express from 'express';
import transacaoRoutes from './routes/transacao.routes.js';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => res.json({ msg: 'API rodando' }));
app.use(transacaoRoutes);

app.use((erro, _req, res, _next) => {
  console.error(erro);
  res.status(500).json({
    mensagem: 'Erro interno ao processar a requisicao.',
  });
});

export default app;
