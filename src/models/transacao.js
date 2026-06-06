import mongoose from 'mongoose';

const { Schema } = mongoose;

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DMY_REGEX = /^\d{2}-\d{2}-\d{4}$/;

function normalizeAcceptedDate(value) {
  if (value == null || value === '') {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' && YMD_REGEX.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  if (typeof value === 'string' && DMY_REGEX.test(value)) {
    const [day, month, year] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  return new Date(NaN);
}

const transacaoSchema = new Schema(
  {
    tipo: {
      type: String,
      required: [true, 'O tipo da transação e obrigatório.'],
      enum: {
        values: ['receita', 'despesa'],
        message: 'O tipo deve ser receita ou despesa.',
      },
      trim: true,
      lowercase: true,
    },
    categoria: {
      type: String,
      required: [true, 'A categoria da transação e obrigatória.'],
      trim: true,
    },
    data: {
      type: Date,
      required: [true, 'A data da transação e obrigatória.'],
      set: normalizeAcceptedDate,
    },
    valor: {
      type: Number,
      required: [true, 'O valor da transação e obrigatório.'],
      min: [0.01, 'O valor da transação deve ser maior que zero.'],
    },
    descricao: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  {
    collection: 'transacoes',
    versionKey: false,
  }
);

const Transacao =
  mongoose.models.Transacao || mongoose.model('Transacao', transacaoSchema, 'transacoes');

export default Transacao;
export { transacaoSchema };
