import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express from "express";
import type { Request, Response } from "express";
import intakeRouter from "./routes/intake.js";
import loginRouter from "./routes/login.js";
import router from "./routes/sign-up.js"
import cors from "cors";
import passport from "passport";
import mealRouter from "./routes/meals.js";
import { getDayMeals } from "./dayMeals.js";


//@ts-ignore
const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

// JSON middleware MUST come before routes
app.use(passport.initialize());
app.use(cors({
  origin: [...new Set(allowedOrigins)],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))
app.use(express.json());
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.get("/day-meals", getDayMeals);
app.use("/signup", router);
app.use("/SignUp", router);
app.use("/users", router);
app.use("/", router);
app.use("/", loginRouter);
app.use("/", intakeRouter);
app.use("/", mealRouter);


app.get("/", (req: Request, res: Response) => {
  res.send("Diet API is running!");
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
