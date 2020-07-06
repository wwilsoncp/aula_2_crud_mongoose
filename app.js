import express from "express";
import mongoose from "mongoose";
import { accountRouter } from "./routes/accountRouter.js";

// URL de conexão com o MongoDB
const URL_CONECTION =
  "mongodb+srv://willadmin:willadmin@bootcamp.llec9.mongodb.net/accounts?retryWrites=true&w=majority";

// conectar ao MongoDB pelo mongoose
const conectar = async () => {
  try {
    await mongoose.connect(URL_CONECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    console.log("Database Connected.");
  } catch (error) {
    console.log("Error on Connected MongoDB " + error);
  }
};

conectar();

const app = express();

app.use(express.json());
app.use(accountRouter);

app.listen(3000, () => {
  console.log("API Started");
});
