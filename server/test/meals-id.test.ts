import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

const mockMeal = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "user-123",
  mealType: "BREAKFAST",
  date: new Date(),
  items: [],
};

const mockPrisma = {
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: "user-123", email: "test@example.com" } as any),
  },
  meal: {
    findFirst: jest.fn().mockImplementation(((args: any) => {
      // Prisma expects id to be a string UUID. If it receives NaN or number, it fails.
      if (typeof args.where.id !== "string" || !args.where.id) {
        return Promise.reject(new Error("Prisma client error: id must be a string UUID"));
      }
      if (args.where.id === mockMeal.id && args.where.userId === "user-123") {
        return Promise.resolve(mockMeal);
      }
      return Promise.resolve(null);
    }) as any),
    delete: jest.fn().mockImplementation(((args: any) => {
      if (typeof args.where.id !== "string" || !args.where.id) {
        return Promise.reject(new Error("Prisma client error: id must be a string UUID"));
      }
      return Promise.resolve(mockMeal);
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

describe("UUID vs Number & Duplicate Routes in meals.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get a meal by UUID using GET /meal/:id", async () => {
    const token = jwt.sign({ sub: "user-123" }, process.env.JWT_SECRET!);

    const res = await request(app)
      .get(`/meal/${mockMeal.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mockMeal.id);
    expect(mockPrisma.meal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: mockMeal.id,
          userId: "user-123",
        },
      })
    );
  });

  it("should delete a meal by UUID using DELETE /meal/:id without converting to NaN", async () => {
    const token = jwt.sign({ sub: "user-123" }, process.env.JWT_SECRET!);

    const res = await request(app)
      .delete(`/meal/${mockMeal.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mockPrisma.meal.delete).toHaveBeenCalledWith({
      where: {
        id: mockMeal.id,
      },
    });
  });
});
