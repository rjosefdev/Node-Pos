import mongoose from 'mongoose';

const { Schema } = mongoose;

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function normalizeIsoDate(value) {
  if (value == null || value === '') {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' && ISO_8601_REGEX.test(value)) {
    return new Date(value);
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
      set: normalizeIsoDate,
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
