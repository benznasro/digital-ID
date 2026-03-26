import "dotenv/config";

import express from "express";


import userrouts from "./Module/person/person.js";
import authRouter from"./Module/auth/auth.js";
import birth_records_router from "./Module/birth_records/birth_records.js";
import medical_records_router from "./Module/medical_records/medical_records.js";
import hospital_router from "./Module/hospital/hospital.js";
import Marriage_Notary_router from "./Module/Marriage_Notary/Marriage_Notary.js";
import passport_router from "./Module/passport/passport.js";

const app = express();
const PORT = 5000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get("/",(req,res)=>{
res.send("server worked");
});

app.use(express.static('../html'));
app.use("/api/person",userrouts);
app.use("/api/auth", authRouter);
app.use("/api/birth_records", birth_records_router);
app.use("/api/medical_records", medical_records_router);
app.use("/api/hospital",hospital_router);
app.use("/api/Marriage_Notary",Marriage_Notary_router);
app.use("/api/passport", passport_router);

