import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

// Mock prisma before importing meals router
const mockSavedMeals: any[] = [];
const mockPrisma = {
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: "user-123", email: "test@example.com" } as never),
  },
  meal: {
    create: jest.fn().mockImplementation(((args: any) => {
      const meal = {
        id: `meal-${mockSavedMeals.length + 1}`,
        userId: args.data.userId,
        mealType: args.data.mealType,
        date: args.data.date,
        items: [args.data.items.create],
      };
      mockSavedMeals.push(meal);
      return Promise.resolve(meal);
    }) as any),
  },
};

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: mockPrisma,
}));

const passportModule = await import("passport");
const passport = passportModule.default;
const { default: mealRouter } = await import("../src/routes/meals.js");

const app = express();
app.use(passport.initialize());
app.use(express.json());
app.use("/", mealRouter);

describe("POST /meal", () => {
  beforeEach(() => {
    mockSavedMeals.length = 0;
    jest.clearAllMocks();
  });

  it("should save all three items when posting a meal with three items", async () => {
    const token = jwt.sign({ sub: "user-123" }, process.env.JWT_SECRET!);

    const payload = [
      {
        foodName: "Eggs",
        date: "2026-11-19T08:00:00Z",
        quantity: "2",
        calories: "140",
        protein: "12",
        carbs: "1",
        fat: "10",
        mealType: "breakfast",
      },
      {
        foodName: "Toast",
        date: "2026-11-19T08:00:00Z",
        quantity: "1",
        calories: "80",
        protein: "3",
        carbs: "15",
        fat: "1",
        mealType: "breakfast",
      },
      {
        foodName: "Apple",
        date: "2026-11-19T10:00:00Z",
        quantity: "1",
        calories: "95",
        protein: "0.5",
        carbs: "25",
        fat: "0.3",
        mealType: "snack",
      },
    ];

    const res = await request(app)
      .post("/meal")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(mockPrisma.meal.create).toHaveBeenCalledTimes(3);
    expect(mockSavedMeals.length).toBe(3);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
  });
});
