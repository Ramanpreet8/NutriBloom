// @ts-nocheck
// JC approved nocheck 2026-08-11

import express from "express";
import prisma from "../lib/prisma.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import rateLimit from "express-rate-limit";

const loginRouter = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET){
  throw new Error("JWT SECRET not set. copy to .env first");
}

// verify email + password at login
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return done(null, false, { message: "Invalid credentials" });
    }
    return done(null, user);
  })
);




// POST LOGIN, /login
loginRouter.post("/login", loginLimiter, passport.authenticate("local", {session: false}), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    const token = jwt.sign({sub: user.id}, JWT_SECRET, { expiresIn: "1h"});

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      uuid: user.id,
      name: user.name,
      email: user.email,
      token: token
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to login",
    });
  }
});

// POST DEMO LOGIN, /demo-login
loginRouter.post("/demo-login", async (_req, res) => {
  try {
    const demoEmail = "demo@nutribloom.com";
    let demoUser = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!demoUser) {
      const hashedPassword = await bcrypt.hash("demo123", 10);
      demoUser = await prisma.user.create({
        data: {
          name: "Demo Explorer",
          email: demoEmail,
          password: hashedPassword,
          info: {
            create: {
              age: 28,
              sex: "Female",
              heightFeet: 5,
              heightInches: 6,
              weight: 140,
              activityType: "Cardio",
              activityFrequency: "15",
              fitnessGoal: "Maintenance",
            },
          },
        },
      });

      // Populate demo meals
      await prisma.meal.create({
        data: {
          userId: demoUser.id,
          mealType: "BREAKFAST",
          date: new Date(),
          items: {
            create: {
              foodName: "Avocado Toast & Boiled Eggs",
              portion: "2 slices",
              calories: 380,
              protein: 16,
              carbs: 34,
              fat: 20,
            },
          },
        },
      });

      await prisma.meal.create({
        data: {
          userId: demoUser.id,
          mealType: "LUNCH",
          date: new Date(),
          items: {
            create: {
              foodName: "Mediterranean Grain Bowl",
              portion: "1 bowl",
              calories: 520,
              protein: 28,
              carbs: 65,
              fat: 16,
            },
          },
        },
      });
    }

    // Demo login issues a short-lived token (15m)
    const token = jwt.sign({ sub: demoUser.id }, JWT_SECRET, { expiresIn: "15m" });

    return res.status(200).json({
      message: "Demo login successful",
      uuid: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      token,
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return res.status(500).json({ message: "Failed to execute demo login" });
  }
});

export default loginRouter;
