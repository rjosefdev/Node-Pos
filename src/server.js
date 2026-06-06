import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Conectado ao MongoDB");

  })
  .catch((erro) => {
    console.error("Erro na conexão com MongoDB:");
    console.error(erro.message);
  });
 

// Model Aluno
const alunoSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true, minLength: 2 },
    idade: { type: Number, required: true, min: 0, max: 120 },
    curso: { type: String, required: true, trim: true },
    notas: { type: [Number], default: [], validate: v => v.every(n => n >= 0 && n <= 10) }
}, { collection: 'Alunos', timestamps: true });
const Aluno = mongoose.model('Aluno', alunoSchema, 'Alunos');

// Rota inicial
app.get('/', (req, res) => res.json({ msg: 'API rodando' }));

// Criar aluno
app.post('/alunos', async (req, res) => {
    const aluno = await Aluno.create(req.body);
    res.status(201).json(aluno);
});

// Listar alunos
app.get('/alunos', async (req, res) => {
    const alunos = await Aluno.find();
    res.json(alunos);
});

// Iniciar servidor
app.listen(process.env.PORT, () => console.log(`Servidor rodando em http://localhost:${process.env.PORT}`));