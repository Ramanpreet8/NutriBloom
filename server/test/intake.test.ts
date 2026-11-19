import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

const mockPrisma = {
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: "user-123", email: "test@example.com" } as any),
  },
  userInfo: {
    findUnique: jest.fn().mockResolvedValue(null as any),
    create: jest.fn().mockImplementation(((args: any) => {
      return Promise.resolve({
        ...args.data,
        updatedAt: new Date(),
      });
    }) as any),
  },
};

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: mockPrisma,
}));

const passportModule = await import("passport");
const passport = passportModule.default;
const { default: intakeRouter } = await import("../src/routes/intake.js");

const app = express();
app.use(passport.initialize());
app.use(express.json());
app.use("/", intakeRouter);

describe("POST /survey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create intake information for authenticated user and return 201", async () => {
    const token = jwt.sign({ sub: "user-123" }, process.env.JWT_SECRET!);

    const payload = {
      age: 25,
      feet: "5",
      inches: "10",
      weight: 160,
      sex: "Male",
      atype: "Cardio",
      afreq: "10",
      goal: "WeightLoss",
    };

    const res = await request(app)
      .post("/survey")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(mockPrisma.userInfo.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.userInfo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: "user-123",
          age: 25,
          heightFeet: 5,
          heightInches: 10,
          weight: 160,
          sex: "Male",
          activityFrequency: "10",
          activityType: "Cardio",
          fitnessGoal: "WeightLoss",
        },
      })
    );
  });
});
