import { type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export const getDayMeals = async (req: Request, res: Response) => {
  try {
    const { dietType } = req.query;
    if (dietType !== undefined && (typeof dietType !== 'string' || dietType.length === 0)) {
      res.status(400).json({ error: 'dietType must be a non-empty string' });
      return;
    }

    // Fetch real meals from the database
    const meals = await prisma.meal.findMany({
      ...(dietType ? { where: { dietType } } : {}),
      include: {
        items: true, // Fetches the related food items for each meal
      },
    });

    res.status(200).json(meals);
  } catch (error) {
    console.error("Error fetching day meals:", error);
    res.status(500).json({ error: "Failed to fetch meals from database" });
  }
};