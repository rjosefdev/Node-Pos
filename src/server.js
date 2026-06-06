import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = process.env.PORT || 3000;

try {
  await connectDatabase(process.env.MONGODB_URI);

  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
} catch (erro) {
  console.error('Erro ao iniciar a aplicacao:');
  console.error(erro.message);
  process.exit(1);
}
