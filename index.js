const express = require("express");
const { User } = require("./src/models/index.js");
const port = 3000;

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  return res.send((await User.findAll()).map((u) => u.toJSON()));
});

app.patch("/update-balance", async (req, res) => {
  const { userId, amount } = req.body;
  try {
    await User.increment("balance", { by: amount, where: { id: userId } });
    return res.send({ message: "Баланс обновлен успешно" });
  } catch (e) {
    return res.status(400).send({ error: "Недостаточно средств на балансе" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
