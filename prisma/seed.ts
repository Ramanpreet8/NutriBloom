// prisma/seed.ts
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const DEMO_USER_EMAIL = 'demo@nutribloom.com';

const SAMPLE_MENUS = [
  {
    breakfast: {
      name: 'Oatmeal with Blueberries & Almonds',
      portion: '1 bowl',
      calories: 380,
      protein: 14,
      carbs: 62,
      fat: 10,
    },
    lunch: {
      name: 'Grilled Chicken & Quinoa Salad',
      portion: '1 bowl',
      calories: 540,
      protein: 44,
      carbs: 48,
      fat: 16,
    },
    dinner: {
      name: 'Baked Salmon with Sweet Potato & Asparagus',
      portion: '1 plate',
      calories: 620,
      protein: 42,
      carbs: 52,
      fat: 22,
    },
    snack: {
      name: 'Greek Yogurt with Honey & Walnuts',
      portion: '1 cup',
      calories: 260,
      protein: 20,
      carbs: 24,
      fat: 9,
    },
  },
  {
    breakfast: {
      name: 'Avocado Toast with Poached Eggs',
      portion: '2 slices',
      calories: 430,
      protein: 18,
      carbs: 36,
      fat: 24,
    },
    lunch: {
      name: 'Turkey, Spinach & Hummus Wrap',
      portion: '1 wrap',
      calories: 510,
      protein: 38,
      carbs: 46,
      fat: 18,
    },
    dinner: {
      name: 'Grass-fed Beef Stir-Fry with Brown Rice',
      portion: '1 bowl',
      calories: 660,
      protein: 46,
      carbs: 64,
      fat: 20,
    },
    snack: {
      name: 'Apple Slices with Almond Butter',
      portion: '1 apple + 2 tbsp',
      calories: 250,
      protein: 6,
      carbs: 28,
      fat: 14,
    },
  },
  {
    breakfast: {
      name: 'Spinach & Feta Egg White Omelet with Whole Grain Toast',
      portion: '1 plate',
      calories: 390,
      protein: 28,
      carbs: 34,
      fat: 14,
    },
    lunch: {
      name: 'Mediterranean Chickpea & Tuna Salad',
      portion: '1 bowl',
      calories: 530,
      protein: 40,
      carbs: 50,
      fat: 15,
    },
    dinner: {
      name: 'Herb-Roasted Chicken Breast with Couscous & Veggies',
      portion: '1 plate',
      calories: 610,
      protein: 48,
      carbs: 56,
      fat: 16,
    },
    snack: {
      name: 'Protein Smoothie with Whey, Banana & Spinach',
      portion: '1 glass (16oz)',
      calories: 290,
      protein: 30,
      carbs: 34,
      fat: 4,
    },
  },
];

async function main() {
  console.log('Seeding demo user and 14 days of realistic meal data...');

  const passwordHash = await bcrypt.hash('demo123', 10);

  // 1. Idempotently upsert demo user
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {
      name: 'Demo Explorer',
      password: passwordHash,
    },
    create: {
      name: 'Demo Explorer',
      email: DEMO_USER_EMAIL,
      password: passwordHash,
    },
  });

  // 2. Idempotently upsert intake profile (UserInfo)
  await prisma.userInfo.upsert({
    where: { userId: demoUser.id },
    update: {
      age: 28,
      sex: 'Female',
      heightFeet: 5,
      heightInches: 6,
      weight: 140,
      activityType: 'Cardio',
      activityFrequency: '15',
      fitnessGoal: 'Maintenance',
    },
    create: {
      userId: demoUser.id,
      age: 28,
      sex: 'Female',
      heightFeet: 5,
      heightInches: 6,
      weight: 140,
      activityType: 'Cardio',
      activityFrequency: '15',
      fitnessGoal: 'Maintenance',
    },
  });

  // 3. Clean existing demo meals so re-running seed is 100% idempotent and non-duplicative
  await prisma.meal.deleteMany({
    where: { userId: demoUser.id },
  });

  // 4. Seed exactly 14 days of realistic meals up to and including today (dayOffset 13 down to 0)
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const menu = SAMPLE_MENUS[dayOffset % SAMPLE_MENUS.length];

    const mealPlans = [
      { type: 'BREAKFAST' as const, time: 8, item: menu.breakfast },
      { type: 'LUNCH' as const, time: 12, item: menu.lunch },
      { type: 'DINNER' as const, time: 18, item: menu.dinner },
      { type: 'SNACK' as const, time: 15, item: menu.snack },
    ];

    for (const plan of mealPlans) {
      const mealDate = new Date();
      mealDate.setUTCDate(mealDate.getUTCDate() - dayOffset);
      mealDate.setUTCHours(plan.time, 30, 0, 0);

      await prisma.meal.create({
        data: {
          userId: demoUser.id,
          mealType: plan.type,
          dietType: 'General',
          date: mealDate,
          items: {
            create: {
              foodName: plan.item.name,
              portion: plan.item.portion,
              calories: plan.item.calories,
              protein: plan.item.protein,
              carbs: plan.item.carbs,
              fat: plan.item.fat,
              date: mealDate,
            },
          },
        },
      });
    }
  }

  console.log(`Seed complete: Demo user '${DEMO_USER_EMAIL}' is ready with 14 days of meals and intake.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
