import "dotenv/config";

import express from "express";


import userrouts from "./routs/person.js";
import authRouter from"./routs/auth.js";
import birth_records_router from "./routs/birth_records.js"
import medical_records_router from "./routs/medical_records.js"
const app = express();
const PORT = 5000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get("/",(req,res)=>{
res.send("server worked");
});

app.use("/api/person",userrouts);
app.use("/api/auth", authRouter);
app.use("/api/birth_records", birth_records_router);
app.use("/api/medical_records", medical_records_router);