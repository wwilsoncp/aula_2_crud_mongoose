import mongoose from 'mongoose';

// criando o modelo para o objeto conta
const accountSchema = mongoose.Schema({
  agencia: {
    type: Number,
    required: true,
  },
  conta: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    // validando se a nota é menor que 0
    validade(balance) {
      if (balance < 0) throw new Error('Balance não pode ser menor que 0');
    },
  },
});

const accountModel = mongoose.model('account', accountSchema, 'account');

export { accountModel };
