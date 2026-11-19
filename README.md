# NutriBloom

NutriBloom is a full-stack diet and nutrition tracking web application built with **Ionic React**, **Express**, **Prisma ORM**, and **PostgreSQL**. The platform empowers users to monitor their daily caloric and macronutrient consumption, log detailed meals by category, compute Daily Recommended Values (DRV) from personalized health assessments, and visualize dietary trends through interactive Recharts analytics.

---

## Author & Maintainer

* **Ramanpreet Singh** — Full-Stack Architecture, Database Design, API Development, Security Engineering, and UI/UX Implementation.

---

## Key Features

1. **Secure Authentication & Session Management**:
   * User registration and login powered by **Passport.js (Local & JWT strategies)** and **bcryptjs** password hashing.
   * Brute-force and credential-stuffing protection via **`express-rate-limit`** on `/login` and `/signup`.
   * **1-Click Demo Login** (`POST /demo-login`): Instantly provision and access a pre-configured demo account with historical meals and intake metrics without manual signup.

2. **Personalized Health Assessment & DRV Engine**:
   * Interactive intake assessment capturing age, sex, height, weight, activity type, frequency, and fitness goals.
   * Automated **Daily Recommended Values (DRV)** computation using the Mifflin-St Jeor formula to determine target calories, protein, carbohydrates, and fats.

3. **Comprehensive Meal & Nutrition Logging**:
   * Multi-item meal logging supporting Breakfast, Lunch, Dinner, and Snacks with individual macronutrient breakdown.
   * Relational database integrity using PostgreSQL with `onDelete: Cascade` between meals and line items.
   * Filterable daily meal planner (`/day-meals`) by dietary preference (General, Vegetarian, Vegan, High-Protein).

4. **Live Interactive Health Dashboard**:
   * Real-time **Recharts** analytics replacing all mock fixtures.
   * **Macros over Time** & **Calories over Time**: Historical consumption graphs derived directly from authenticated meal logs.
   * **Today vs. Daily Goals**: Live progress tracking of today's aggregate intake against personalized target DRVs.

5. **USDA FoodData Central Integration**:
   * Dedicated `/food-search` and `/food-details/:fdcId` proxy endpoints querying official USDA FoodData Central nutritional databases.

---

## Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Ionic React 8, Vite, Recharts, Zustand (state persistence), React Router |
| **Backend** | Node.js (v22), Express 4, TypeScript, Passport.js, JWT, express-rate-limit |
| **Database** | PostgreSQL, Prisma 7 ORM (`@prisma/adapter-pg` driver adapter) |
| **Testing** | Jest, Supertest, Vitest |
| **Deployment** | Netlify (Static Client SPA), Render (Express API Web Service + Managed PostgreSQL) |

---

## Repository Structure

```text
NutriBloom/
├── client/                     # Frontend Ionic React + Vite application
│   ├── src/
│   │   ├── pages/              # Home, Dashboard, Intake, AddMeal, DayMeals, Login, SignUp
│   │   ├── components/         # Reusable charts and container components
│   │   ├── lib/api.ts          # Centralized API client base URL configuration
│   │   └── store/              # Zustand authentication store
│   └── vite.config.ts
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── routes/             # Authentication, meals, intake survey, USDA food search
│   │   ├── lib/prisma.ts       # Prisma Client instance with PostgreSQL adapter
│   │   ├── dayMeals.ts         # Filterable day-meals controller
│   │   └── index.ts            # Main application entrypoint & middleware pipeline
│   └── test/                   # Jest + Supertest integration test suites
├── prisma/
│   ├── schema.prisma           # Authoritative database models (User, UserInfo, Meal, MealItem)
│   ├── migrations/             # Baseline SQL migration
│   └── seed.ts                 # Synthetic seed data generator (@faker-js/faker)
├── render.yaml                 # Render infrastructure-as-code blueprint
└── netlify.toml                # Netlify build and SPA redirect rules
```

---

## Local Development Setup

### 1. Prerequisites
* **Node.js** v20+ or v22+
* **PostgreSQL** running locally or hosted

### 2. Environment Configuration
Copy `.env.example` to `.env` in the repository root and supply your database credentials and a secure JWT secret:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/nutribloom?schema=public"
JWT_SECRET="replace-with-a-secure-secret-key"
CLIENT_URL="http://localhost:5173"
PORT=3000
USDA_FDC_API_KEY="DEMO_KEY"
```

### 3. Installation & Database Migration
```bash
# Install all workspace dependencies
npm install

# Generate Prisma Client & execute migrations
npm run build:api
npx prisma migrate dev

# (Optional) Seed the database with sample users and meals
npx prisma db seed
```

### 4. Running the Application
In separate terminal sessions:

```bash
# Start backend API (http://localhost:3000)
npm start

# Start frontend development server (http://localhost:5173)
cd client
npm run dev
```

---

## Production Deployment

* **Backend (Render)**:
  * Deploy using the included [`render.yaml`](render.yaml) blueprint.
  * Migrations run safely via `startCommand: npx prisma migrate deploy && npm start` when the database connection is live.
* **Frontend (Netlify)**:
  * Deployed via [`netlify.toml`](netlify.toml).
  * Set `VITE_API_URL` to your production Render API origin (e.g. `https://nutribloom-api.onrender.com`).
