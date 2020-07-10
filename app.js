import express from 'express';
import mongoose from 'mongoose';
import { accountRouter } from './routes/accountRouter.js';
import dotenv from 'dotenv';

// inicializando o arquivo .env
dotenv.config();

// conectar ao MongoDB pelo mongoose
const conectar = async () => {
  const URL_CONNECTION = `mongodb+srv://${process.env.USERDB}:${process.env.PASSDB}@bootcamp.llec9.mongodb.net/${process.env.NAMEDB}?retryWrites=true&w=majority`;
  try {
    await mongoose.connect(URL_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    console.log('Database Connected.');
  } catch (error) {
    console.log('Error on Connected MongoDB ' + error);
  }
};

conectar();

const app = express();

// Definindo que a manipulação será via json
app.use(express.json());
// Definindo as rotas da aplicação
app.use(accountRouter);

app.listen(process.env.PORT, () => {
  console.log('API Started');
});
