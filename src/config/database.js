import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI nao definida');
  }

  await mongoose.connect(uri);
  console.log('Conectado ao MongoDB');
}
