import express from "express";
import { accountModel } from "../models/account.js";

const app = express();

// item ?? - listar todas as agências e contas
app.get("/account", async (req, res) => {
  try {
    const account = await accountModel.find({});
    res.send(account);
  } catch (error) {
    res.status(500).send(error);
  }
});

// item ?? - listar todas as agências e contas
app.get("/account/:agencia", async (req, res) => {
  try {
    const account = await accountModel.find({ agencia: req.params.agencia });
    res.send(account);
  } catch (error) {
    res.status(500).send(error);
  }
});

// item 04 - registrar despósito em uma agencia e conta
app.patch("/account/deposito/:agencia/:conta/:valor", async (req, res) => {
  try {
    // validando se o valor informado para depósito é maior que zero, caso contrário será exibida uma validação
    if (parseFloat(req.params.valor) <= 0) {
      throw new Error(
        `O valor do depósito deve ser maior que 0 (zero). Valor informado: ${req.params.valor}`
      );
    }

    let account = await accountModel.findOne({
      agencia: req.params.agencia,
      conta: req.params.conta,
    });
    if (!account)
      res.status(400).send({
        error: `Conta não encontrada para os parâmetros informados: agência: ${req.params.agencia} conta: ${req.params.conta}`,
      });
    const valorDeposito = parseFloat(req.params.valor);

    account.balance += valorDeposito;

    const constNewAccount = await accountModel.findOneAndUpdate(
      {
        _id: account._id,
      },
      account,
      { new: true }
    );

    res.send(constNewAccount);
  } catch (error) {
    res.status(500).send(error);
  }
});

// item 05 - registrar saque em uma agência e conta, cobrar 1 real de tarifa
app.patch("/account/saque/:agencia/:conta/:valor", async (req, res) => {
  try {
    const tarifa = 1;

    // validando se o valor informado para depósito é maior que zero, caso contrário será exibida uma validação
    if (parseFloat(req.params.valor) <= 0) {
      throw new Error(
        `O valor do saque deve ser maior que 0 (zero). Valor informado: ${req.params.valor}`
      );
    }

    let account = await accountModel.findOne({
      agencia: req.params.agencia,
      conta: req.params.conta,
    });

    // validando se agência e conta existe, caso contrário será exibida uma validação
    if (!account) {
      res.status(400).send({
        error: `Conta não encontrada para os parâmetros informados: agência: ${req.params.agencia} conta: ${req.params.conta}`,
      });
      return;
    }

    const valorSaque = parseFloat(req.params.valor);
    const valorSaqueTarifado = valorSaque + tarifa;

    // verificando se existe saldo na conta
    if (valorSaqueTarifado > account.balance) {
      res.status(400).send({
        error: `Conta não possui saldo suficiente para o saque (valor da tarifa por saque: ${tarifa}). Saldo disponível: ${account.balance}`,
      });
      return;
    }

    account.balance -= valorSaqueTarifado;
    account.save();

    res.send(account);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item 06 - consultar saldo de uma agência e conta
app.get("/account/saldo/:agencia/:conta", async (req, res) => {
  try {
    let account = await accountModel.findOne({
      agencia: req.params.agencia,
      conta: req.params.conta,
    });

    // validando se agência e conta existe, caso contrário será exibida uma validação
    if (!account) {
      res.status(400).send({
        error: `Conta não encontrada para os parâmetros informados: agência: ${req.params.agencia} conta: ${req.params.conta}`,
      });
      return;
    }
    res.send(account);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item 07 - excluir um conta de uma agência e retornar o número de contas da agência
app.delete("/account/:agencia/:conta", async (req, res) => {
  try {
    const account = await accountModel.findOneAndDelete({
      agencia: req.params.agencia,
      conta: req.params.conta,
    });

    // retornar o número de contas ativas da agência
    const qtdContaNaAgencia = await accountModel.countDocuments({
      agencia: req.params.agencia,
    });

    // validando se agência e conta existe, caso contrário será exibida uma validação
    if (!account) {
      res.status(400).send({
        error: `Conta não encontrada para os parâmetros informados: agência: ${req.params.agencia} conta: ${req.params.conta}`,
        agencia: req.params.agencia,
        qtdContaAtiva: qtdContaNaAgencia,
      });
      return;
    }
    res.send({
      messagem: `Conta ${req.params.conta} excluída com sucesso.`,
      agencia: req.params.agencia,
      qtdContaAtiva: qtdContaNaAgencia,
    });
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item 08 - tranferência entre contas, se agência diferente, cobrar taxa de 8
app.patch(
  "/account/transferencia/:contaOrigem/:contaDestino/:valor",
  async (req, res) => {
    try {
      // validando se o valor informado para transferência é maior que zero, caso contrário será exibida uma validação
      if (parseFloat(req.params.valor) <= 0) {
        throw new Error(
          `O valor da transferência deve ser maior que 0 (zero). Valor informado: ${req.params.valor}`
        );
      }

      let contaOrigem = await accountModel.findOne({
        conta: req.params.contaOrigem,
      });

      let contaDestino = await accountModel.findOne({
        conta: req.params.contaDestino,
      });

      if (!contaOrigem && !contaDestino) {
        res.status(400).send({
          error: `Conta de origem e conta de destino inexistentes.`,
          contaOrigem: req.params.contaOrigem,
          contaDestino: req.params.contaDestino,
        });
        return;
      } else if (!contaOrigem) {
        res.status(400).send({
          error: `Conta de origem inexistente.`,
          contaOrigem: req.params.contaOrigem,
        });
        return;
      } else if (!contaDestino) {
        res.status(400).send({
          error: `Conta de destino inexistente.`,
          contaDestino: req.params.contaDestino,
        });
        return;
      }

      const tarifa = 8;
      const valorTransferencia = parseFloat(req.params.valor);
      const valorTransferenciaTarifado = valorTransferencia + tarifa;

      // se as contas pertencerem à mesma agência, não possui taxa de transferência
      if (contaOrigem.agencia === contaDestino.agencia) {
        // verificando se na conta de origem possui saldo
        if (valorTransferencia > contaOrigem.balance) {
          res.status(400).send({
            error: `Conta '${contaOrigem.conta}' não possui saldo suficiente para a transfência (isenta de tarifa). Saldo disponível: ${contaOrigem.balance}`,
          });
          return;
        }

        contaOrigem.balance -= valorTransferencia;
        contaDestino.balance += valorTransferencia;
      } else {
        // verificando se na conta de origem possui saldo, com tarifa de 8
        if (valorTransferenciaTarifado > contaOrigem.balance) {
          res.status(400).send({
            error: `Conta '${contaOrigem.conta}' não possui saldo suficiente para a transfência (valor da tarifa por saque: ${tarifa}). Saldo disponível: ${contaOrigem.balance}`,
          });
          return;
        }
        contaOrigem.balance -= valorTransferenciaTarifado;
        contaDestino.balance += valorTransferencia;
      }

      contaOrigem.save();
      contaDestino.save();

      res.send({
        messagem: `Transferência realizada com sucesso.`,
        agenciaOrigem: contaOrigem.agencia,
        contaOrigem: contaOrigem.conta,
        saldoOrigem: contaOrigem.balance,
        agenciaDestino: contaDestino.agencia,
        contaDestino: contaDestino.conta,
        saldoDestino: contaDestino.balance,
      });
    } catch (error) {
      res.status(500).send({ erro: error.message });
    }
  }
);

// item extra - Médio do saldo de todas as agências
app.get("/account/mediaSaldo/geral", async (req, res) => {
  try {
    const mediaPorAgencia = await accountModel.aggregate([
      { $group: { _id: "$agencia", mediaBalance: { $avg: "$balance" } } },
    ]);
    res.send(mediaPorAgencia);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item 09 - Média do saldo dos clientes de uma determinada agência
app.get("/account/mediaSaldo/:agencia", async (req, res) => {
  try {
    //verificando se a agência informada existe, caso contrário será exibida uma validação
    const qtdAgencia = await accountModel.countDocuments({
      agencia: req.params.agencia,
    });

    if (qtdAgencia === 0) {
      res.status(400).send({
        error: `Agência '${req.params.agencia}' não encontrada para cálculo da média do saldo.`,
        agencia: req.params.agencia,
      });
      return;
    }

    const mediaPorAgencia = await accountModel.aggregate([
      { $match: { agencia: parseInt(req.params.agencia) } },
      { $group: { _id: "$agencia", mediaBalance: { $avg: "$balance" } } },
    ]);
    res.send(mediaPorAgencia);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item extra - menor saldo por agência
app.get("/account/menorSaldo/geral", async (req, res) => {
  try {
    const maiorSaldoPorAgencia = await accountModel.aggregate([
      { $group: { _id: "$agencia", maiorSaldo: { $min: "$balance" } } },
    ]);
    res.send(maiorSaldoPorAgencia);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item 10 - Menor saldo em conta, por quantidade de clientes
app.get("/account/menorSaldo/:qtdCliente", async (req, res) => {
  try {
    const accounts = await accountModel
      .find({}, { _id: 0, name: 0 })
      .sort({ balance: 1 })
      .limit(parseInt(req.params.qtdCliente));
    res.send(accounts);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item extra - maior saldo por agência
app.get("/account/maiorSaldo/geral", async (req, res) => {
  try {
    const maiorSaldoPorAgencia = await accountModel.aggregate([
      { $group: { _id: "$agencia", maiorSaldo: { $max: "$balance" } } },
    ]);
    res.send(maiorSaldoPorAgencia);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item 11 - Maior saldo em conta, por quantidade de clientes
app.get("/account/maiorSaldo/:qtdCliente", async (req, res) => {
  try {
    const accounts = await accountModel
      .find({}, { _id: 0 })
      .sort({ balance: -1, name: 1 })
      .limit(parseInt(req.params.qtdCliente));
    res.send(accounts);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

// item 12 - Migrar os clientes mais ricos para uma agência privada (99)
app.patch("/account/migrarPrivate", async (req, res) => {
  try {
    // obter todas as agências distintas
    const agenciaPrivada = 99;

    const maiorSaldoPorAgencia = await accountModel.distinct("agencia", {
      agencia: { $ne: agenciaPrivada },
    });

    for (var j = 0; j < maiorSaldoPorAgencia.length; j++) {
      let accountPorAgencia = await accountModel
        .find({ agencia: maiorSaldoPorAgencia[j] })
        .sort({ balance: -1, name: 1 })
        .limit(1);
      let accountTemp = await accountModel.findOne({
        _id: accountPorAgencia[0]._id,
      });
      accountTemp.agencia = agenciaPrivada;
      await accountTemp.save();
    }

    // consultando todos os clientes da agência privada para exibição
    const accounts = await accountModel.find({ agencia: agenciaPrivada });
    res.send(accounts);
  } catch (error) {
    res.status(500).send({ erro: error.message });
  }
});

export { app as accountRouter };
