import "dotenv/config";

import express from "express";


import userrouts from "./routs/person.js";
import authRouter from"./routs/auth.js";

const app = express();
const PORT = 5000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


app.use("/api/person",userrouts);
app.use("/api/auth", authRouter);