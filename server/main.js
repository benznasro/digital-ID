
import express from "express";
import usersrouts from "./routs/users.js";

const app = express();
const PORT = 5000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use("/users",usersrouts);