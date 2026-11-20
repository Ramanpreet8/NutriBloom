import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

const mockDemoUser = {
  id: "demo-user-uuid",
  email: "demo@nutribloom.com",
  name: "Demo Explorer",
  password: "hashedpassword",
};

const mockPrisma = {
  user: {
    findUnique: jest.fn().mockImplementation(((args: any) => {
      if (args?.where?.id === mockDemoUser.id || args?.where?.email === mockDemoUser.email) {
        return Promise.resolve(mockDemoUser);
      }
      return Promise.resolve(null);
    }) as any),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
  userInfo: {
    findUnique: jest.fn().mockResolvedValue({ userId: mockDemoUser.id } as never),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
  meal: {
    findFirst: jest.fn().mockResolvedValue({ id: "meal-1", userId: mockDemoUser.id } as never),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: mockPrisma,
}));

const passportModule = await import("passport");
const passport = passportModule.default;
const { default: loginRouter } = await import("../src/routes/login.js");
const { default: signUpRouter } = await import("../src/routes/sign-up.js");
const { default: intakeRouter } = await import("../src/routes/intake.js");
const { default: mealRouter } = await import("../src/routes/meals.js");

const app = express();
app.use(passport.initialize());
app.use(express.json());
app.use("/", loginRouter);
app.use("/", signUpRouter);
app.use("/users", signUpRouter);
app.use("/", intakeRouter);
app.use("/", mealRouter);

describe("Demo User Security & Restrictions", () => {
  const demoToken = jwt.sign({ sub: mockDemoUser.id }, process.env.JWT_SECRET!);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /demo-login returns a short-lived token (15m)", async () => {
    const res = await request(app).post("/demo-login");
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const decoded = jwt.decode(res.body.token) as { iat: number; exp: number; sub: string };
    expect(decoded.sub).toBe(mockDemoUser.id);
    expect(decoded.exp - decoded.iat).toBe(15 * 60); // 15 minutes = 900 seconds
  });

  it("PUT /users/:id blocks updating demo user", async () => {
    const res = await request(app)
      .put(`/users/${mockDemoUser.id}`)
      .send({ name: "Hacked Name" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/demo user cannot be modified/i);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("DELETE /users/:id blocks deleting demo user", async () => {
    const res = await request(app).delete(`/users/${mockDemoUser.id}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/demo user cannot be modified or deleted/i);
    expect(mockPrisma.user.delete).not.toHaveBeenCalled();
  });

  it("PUT /survey blocks modifying demo user intake", async () => {
    const res = await request(app)
      .put("/survey")
      .set("Authorization", `Bearer ${demoToken}`)
      .send({ age: 30, weight: 150 });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/demo user cannot be modified or deleted/i);
    expect(mockPrisma.userInfo.update).not.toHaveBeenCalled();
  });

  it("DELETE /survey blocks deleting demo user intake", async () => {
    const res = await request(app)
      .delete("/survey")
      .set("Authorization", `Bearer ${demoToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/demo user cannot be modified or deleted/i);
    expect(mockPrisma.userInfo.delete).not.toHaveBeenCalled();
  });

  it("PUT /meal/:id blocks modifying demo user meals", async () => {
    const res = await request(app)
      .put("/meal/meal-1")
      .set("Authorization", `Bearer ${demoToken}`)
      .send({ mealType: "LUNCH" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/demo user cannot be modified or deleted/i);
    expect(mockPrisma.meal.update).not.toHaveBeenCalled();
  });

  it("DELETE /meal/:id blocks deleting demo user meals", async () => {
    const res = await request(app)
      .delete("/meal/meal-1")
      .set("Authorization", `Bearer ${demoToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/demo user cannot be modified or deleted/i);
    expect(mockPrisma.meal.delete).not.toHaveBeenCalled();
  });

  it("POST /meal blocks adding meals to demo user", async () => {
    const res = await request(app)
      .post("/meal")
      .set("Authorization", `Bearer ${demoToken}`)
      .send([{ foodName: "Snack", calories: 100, mealType: "snack" }]);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/demo user cannot be modified or deleted/i);
    expect(mockPrisma.meal.create).not.toHaveBeenCalled();
  });
});
