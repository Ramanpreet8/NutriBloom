// @ts-nocheck
// JC approved nocheck 2026-08-11
import express from "express";
import passport from "passport";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";


const intakeRouter = express.Router();

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT SECRET not set. copy to .env first");
}
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      console.log("JWT STRATEGY RAN");
      console.log("PAYLOAD:", payload);

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      console.log("USER:", user);
      return done(null, user ?? false);

    }
  )
);

// CREATE INTAKE, /intake
intakeRouter.post("/survey", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const {
      age,
      feet,
      inches,
      weight,
      sex,
      atype,
      afreq,
      goal,
    } = req.body;

    //const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    const user = req.user;
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.email === "demo@nutribloom.com") {
      return res.status(403).json({
        error: "Demo user cannot be modified or deleted",
      });
    }


    if (!user.id) {
      return res.status(400).json({
        error: "uuid is required",
      });
    }

    const existingInfo = await prisma.userInfo.findUnique({
      where: {
        userId: user.id
      },
    });

    if (existingInfo) {
      return res.status(409).json({
        error: "Intake information already exists",
      });
    }

    const intake = await prisma.userInfo.create({
      data: {
        userId: user.id,
        age: Number(age),
        heightFeet: Number(feet),
        heightInches: Number(inches),
        weight: Number(weight),
        sex: sex,
        activityFrequency: afreq,
        activityType: atype,
        fitnessGoal: goal,
      },
    });
    return res.status(201).json(intake);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create intake",
    });
  }
});


function calculateDRV(intake) {
  if (!intake) {
    return {
      dailyCalories: 2000,
      dailyProtein: 100,
      dailyCarbs: 250,
      dailyFat: 65,
    };
  }

  const totalInches = (Number(intake.heightFeet) * 12) + Number(intake.heightInches);
  let bmr = (10 * (Number(intake.weight) * 0.453592)) + (6.25 * (totalInches * 2.54)) - (5 * Number(intake.age));
  if (intake.sex === "Male") bmr += 5; else bmr -= 161;

  const activityMult = intake.activityFrequency === "20" ? 1.725
    : intake.activityFrequency === "15" ? 1.55
    : intake.activityFrequency === "10" ? 1.375
    : 1.2;

  let dailyCalories = Math.round(bmr * activityMult);
  if (intake.fitnessGoal === "WeightLoss") dailyCalories -= 500;
  if (intake.fitnessGoal === "WeightGain" || intake.fitnessGoal === "MuscleGain") dailyCalories += 300;
  dailyCalories = Math.max(dailyCalories, 1200);

  return {
    dailyCalories,
    dailyProtein: Math.round((dailyCalories * 0.25) / 4),
    dailyCarbs: Math.round((dailyCalories * 0.50) / 4),
    dailyFat: Math.round((dailyCalories * 0.25) / 9),
  };
}

const getSurveyHandler = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const intake = await prisma.userInfo.findUnique({
      where: {
        userId: user.id,
      },
    });

    const drv = calculateDRV(intake);

    return res.status(200).json({
      ...(intake || {}),
      ...drv,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get intake information" });
  }
};

// GET CURRENT USER'S INTAKE & DRV
intakeRouter.get("/survey", passport.authenticate("jwt", { session: false }), getSurveyHandler);
intakeRouter.get("/survey/me", passport.authenticate("jwt", { session: false }), getSurveyHandler);

/*
const intake = await prisma.userInfo.create({
  data: {
    userId: user.id,
    age: Number(age),
    heightFeet: Number(feet),
    heightInches: Number(inches),
    weight: Number(weight),
    sex: sex,
    bmi: ((Number(feet) * 12 + Number(inches)) / Number(weight)) ^ 2,
    activityFrequency: afreq,
    activityType: atype,
    fitnessGoal: goal,
  },
});
*/

// GET INTAKE FOR AUTHENTICATED USER
intakeRouter.get("/intake", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const intake = await prisma.userInfo.findMany({
      where: {
        userId: user.id,
      },
    });

    res.status(200).json(intake);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to get intake information",
    });
  }
}
);
// UPDATE INTAKE
intakeRouter.put("/survey", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (user.email === "demo@nutribloom.com") {
      return res.status(403).json({
        error: "Demo user cannot be modified or deleted",
      });
    }
    const {
      age,
      feet,
      inches,
      weight,
      sex,
      bmi,
      activityFrequency,
      activityType,
      fitnessGoal,
    } = req.body;

    const existingInfo = await prisma.userInfo.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!existingInfo) {
      return res.status(404).json({
        error: "Intake information not found",
      });
    }
    const intake = await prisma.userInfo.update({
      where: {
        userId: user.id,
      },
      data: {
        age: Number(age),
        heightFeet: Number(feet),
        heightInches: Number(inches),
        weight: Number(weight),
        sex,
        activityFrequency,
        activityType,
        fitnessGoal,
      },
    });

    return res.status(200).json(intake);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update intake information" });
  }
}
);


// DELETE CURRENT USER'S INTAKE
intakeRouter.delete(
  "/survey",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      if (user.email === "demo@nutribloom.com") {
        return res.status(403).json({
          error: "Demo user cannot be modified or deleted",
        });
      }

      const existingInfo = await prisma.userInfo.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!existingInfo) {
        return res.status(404).json({
          error: "Intake information not found",
        });
      }

      await prisma.userInfo.delete({
        where: {
          userId: user.id,
        },
      });

      return res.status(200).json({
        message: "Intake information deleted successfully",
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Failed to delete intake information",
      });
    }
  }
);

export default intakeRouter;
