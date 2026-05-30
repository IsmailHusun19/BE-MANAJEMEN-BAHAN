import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routers/routeUsers.js";
import Bahan from "./routers/routeBahan.js";
import BahanMasuk from "./routers/routeBahanMasuk.js";
import BahanSisa from "./routers/routeBahanSisa.js";
import Dashboard from "./routers/routeDashboad.js"



const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.use("/users", userRoute);
app.use("/bahan", Bahan);
app.use("/bahan-masuk", BahanMasuk);
app.use("/bahan-sisa", BahanSisa);
app.use("/dashboard", Dashboard);









export default app;
