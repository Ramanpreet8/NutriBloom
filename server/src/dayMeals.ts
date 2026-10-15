import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getDayMeals = async (req: Request, res: Response) => {
  try {
    const meals = await prisma.meal.findMany({
      include: {
        items: true,
      },
    });
    res.json(meals);
  } catch (error) {
    console.error("Error fetching meals:", error);
    res.status(500).json({ error: "Failed to fetch meals" });
  }
};