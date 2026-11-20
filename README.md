# NutriBloom — Full-Stack Nutrition & Diet Tracking Platform

[![CI](https://github.com/Ramanpreet8/NutriBloom/actions/workflows/ci.yml/badge.svg)](https://github.com/Ramanpreet8/NutriBloom/actions)

NutriBloom is a full-stack dietary analytics and meal tracking web application built to solve nutritional tracking opacity by combining personalized metabolic rate assessments with granular meal logging. Users calculate their Daily Recommended Values (DRV) via Mifflin-St Jeor biometric intake surveys, log multi-item meals categorized by time and diet type, search food nutrition via the USDA FoodData Central API with local fallback data, and track macro/calorie adherence through live Recharts trends and daily targets. Designed with a mobile-first Ionic React frontend and an Express/PostgreSQL backend managed by Prisma ORM, the platform features rate-limited JWT authentication, cascading relational integrity, and an instant zero-credential demo session seeded with two weeks of realistic dietary telemetry.

---

## Live Demo & Instant Preview

* **Live Web Application**: [NutriBloom on Netlify](https://nutribloom.netlify.app) *(or your deployed client URL)*
* **API Web Service**: [NutriBloom API on Render](https://nutribloom-api.onrender.com)

> [!NOTE]
> **Try Demo Account**: On the login screen, click the **"Try demo"** button to log in instantly without entering credentials. The application authenticates you as `demo@nutribloom.com` and navigates directly to the dashboard, which is pre-seeded with an intake profile (28yo female, maintenance goal, cardio activity) and 14 days of realistic breakfast, lunch, dinner, and snack meal logs. Demo logins receive a short-lived JSON Web Token (15-minute expiration), and all demo user resources are write-protected at the API level (modifications or deletion return HTTP `403 Forbidden`) to keep data clean and persistent.

---

## Visual Walkthrough

### Analytics Dashboard
![NutriBloom Health Analytics Dashboard](https://raw.githubusercontent.com/Ramanpreet8/NutriBloom/main/docs/screenshots/dashboard.png)
*Historical 14-day calorie and macronutrient trend lines alongside today's stacked meal breakdown vs. calculated DRV targets.*

### Biometric Intake Assessment
![Intake Assessment & DRV Calculator](https://raw.githubusercontent.com/Ramanpreet8/NutriBloom/main/docs/screenshots/intake.png)
*Personalized survey gathering height, weight, activity frequency, and fitness goals to derive daily caloric and macro targets.*

### Meal Logging & Nutritional Breakdown
![Meal Logging & Nutritional Breakdown](https://raw.githubusercontent.com/Ramanpreet8/NutriBloom/main/docs/screenshots/add-meal.png)
*Multi-item food logging supporting granular portion sizes, calories, proteins, carbohydrates, and fats.*

---

## Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Ionic React + Vite)"]
        UI["Ionic UI Components"]
        Router["IonReactRouter / React Router"]
        Store["Zustand Auth Store (JWT in memory/storage)"]
        Charts["Recharts (LineChart & ComposedChart)"]
    end

    subgraph Server["Backend API (Node.js & Express)"]
        RateLimit["express-rate-limit (15m window /login & /signup)"]
        Passport["Passport.js (Local & JWT Bearer Strategies)"]
        
        subgraph Routes["REST Route Handlers"]
            AuthRoutes["/login, /demo-login, /signup, /users"]
            SurveyRoutes["/survey, /survey/me, /intake"]
            MealRoutes["/meal, /meal/:id, /meal/today-by-type, /day-meals"]
            FoodRoutes["/food-search, /food-details/:fdcId"]
        end
        
        DRV["Mifflin-St Jeor DRV Engine"]
        DemoGuard["Demo Immutability Guard (Blocks PUT/DELETE)"]
    end

    subgraph External["External Services"]
        USDA["USDA FoodData Central API (Fallback to local JSON)"]
    end

    subgraph Database["Database Tier (PostgreSQL)"]
        PrismaClient["Prisma Client ORM (@prisma/adapter-pg)"]
        PostgresDB[("PostgreSQL Database")]
    end

    UI --> Router
    Router --> Store
    UI --> Charts

    UI -- "HTTPS / JSON API" --> RateLimit
    RateLimit --> Passport
    Passport --> Routes
    
    SurveyRoutes --> DRV
    Routes --> DemoGuard
    DemoGuard --> PrismaClient
    FoodRoutes -- "HTTPS GET" --> USDA

    PrismaClient --> PostgresDB
```

---

## Tech Stack

| Category | Technology | Purpose & Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, Ionic React (`@ionic/react`) | Cross-platform, mobile-responsive UI components and routing |
| **Build & Tooling** | Vite 5, TypeScript | Fast HMR, tree-shaking, and type-safe frontend compilation |
| **State Management** | Zustand | Lightweight client-side authentication store |
| **Data Visualization** | Recharts | Responsive SVG charts (`LineChart`, `ComposedChart`, `Bar`, `Line`) |
| **Backend Runtime** | Node.js (v22), Express 4 | RESTful API server handling HTTP middleware, auth, and data routes |
| **Authentication** | Passport.js (`passport-local`, `passport-jwt`), `bcryptjs`, `jsonwebtoken` | Token-based stateless authentication with salted password hashing |
| **API Security** | `express-rate-limit`, CORS | Protection against brute-force attacks and cross-origin resource isolation |
| **ORM & Database** | Prisma 7, PostgreSQL | Schema-first migrations, type-safe queries, and native PG driver pool (`pg`, `@prisma/adapter-pg`) |
| **Automated Testing** | Jest, Supertest, `ts-jest` | Server-side integration test suites with mock module isolation |
| **External Integration**| USDA FoodData Central REST API | Food nutrient lookups with local static dataset fallbacks |
| **Deployment** | Render (API + PostgreSQL), Netlify (Static Client SPA) | Infrastructure blueprints with automated database migrations |

---

## Prisma Schema & Relational Integrity

The application data layer is structured around four primary models configured in [`prisma/schema.prisma`](prisma/schema.prisma):

```text
  ┌────────────────────────────────────────────────────────┐
  │                         User                           │
  │  id (UUID PK), name, email (UQ), password, createdAt   │
  └───────────────┬────────────────────────┬───────────────┘
                  │ 1                      │ 1
                  │                        │
                  ▼ 1                      ▼ 0..*
  ┌───────────────────────────────┐  ┌─────────────────────────────────────────┐
  │           UserInfo            │  │                  Meal                   │
  │  userId (UUID PK/FK)          │  │  id (UUID PK), userId (UUID FK)         │
  │  age, sex, heightFeet,        │  │  mealType (BREAKFAST|LUNCH|DINNER|SNACK)│
  │  heightInches, weight,        │  │  dietType, date                         │
  │  activityType, fitnessGoal    │  └────────────────────┬────────────────────┘
  └───────────────────────────────┘                       │ 1
                                                          │
                                                          ▼ 0..*
                                     ┌─────────────────────────────────────────┐
                                     │                MealItem                 │
                                     │  id (UUID PK), mealId (UUID FK)         │
                                     │  foodName, portion, calories,           │
                                     │  protein, carbs, fat, date              │
                                     └─────────────────────────────────────────┘
```

1. **`User` $\leftrightarrow$ `UserInfo` (One-to-One)**:
   - Foreign key `UserInfo.userId` maps directly to `User.id` with `onDelete: Cascade`.
   - Stores physical metrics required by the Mifflin-St Jeor algorithm to calculate Basal Metabolic Rate (BMR) and Daily Recommended Values (DRV).
2. **`User` $\leftrightarrow$ `Meal` (One-to-Many)**:
   - Foreign key `Meal.userId` maps to `User.id` with `onDelete: Cascade`.
   - Captures the meal timestamp, dietary classification (`diet_type`), and categorical bucket (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`).
3. **`Meal` $\leftrightarrow$ `MealItem` (One-to-Many)**:
   - Foreign key `MealItem.mealId` maps to `Meal.id` with `onDelete: Cascade`.
   - Isolates line-item nutrition (portion size, calories, protein, carbs, fat). Deleting a meal automatically deletes its constituent items in a single atomic transaction.

---

## Local Development Setup

### 1. Prerequisites
* **Node.js** (v20.x or v22.x recommended)
* **PostgreSQL** instance running locally or hosted (e.g. Supabase, Neon, or local Docker)
* **npm** v10+

### 2. Environment Variables
Create a `.env` file in the project root:

```env
# Database connection string (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nutribloom?schema=public"

# JSON Web Token Secret
JWT_SECRET="your-development-jwt-secret-key-at-least-32-chars"

# Client origin for CORS
CLIENT_URL="http://localhost:5173"

# Backend server port
PORT=3000

# USDA FoodData Central API Key (optional; uses local fallback if empty or DEMO_KEY)
USDA_FDC_API_KEY="DEMO_KEY"
```

### 3. Installation & Database Migration
```bash
# Install root and workspace dependencies
npm install

# Generate Prisma Client
npm run build:api

# Run database migrations
npx prisma migrate dev --name init

# Run idempotent database seed script (creates demo user + 14 days of realistic meals)
npm run seed
```

> [!TIP]
> The seed script (`npm run seed` or `npx prisma db seed`) is completely idempotent. You can run it multiple times safely; it clears prior demo records and restores a fresh 14-day history without duplication.

### 4. Running the Application
Run the backend and frontend in separate terminal windows:

```bash
# Terminal 1: Backend API (http://localhost:3000)
npm run dev

# Terminal 2: Frontend Client (http://localhost:5173)
cd client
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Running Automated Tests

The repository includes integration test suites written in **Jest** and **Supertest** located in `server/test/`:

* **`meals.test.ts`**: Verifies `POST /meal` saves all posted items without premature loop termination.
* **`meals-id.test.ts`**: Verifies UUID string route validation for single-meal retrieval and deletion.
* **`intake.test.ts`**: Validates survey creation, DRV calculation, and duplicate survey rejection.
* **`demo-user.test.ts`**: Asserts short-lived demo token issuance (15m validity) and verifies HTTP `403 Forbidden` write protection across user, intake, and meal endpoints.

Run the test suite from the repository root:

```bash
npm test
```

Or run directly from the server directory:

```bash
cd server
NODE_OPTIONS="--experimental-vm-modules" npx jest
```

---

## Known Limitations

* **Stateless Short-Lived Tokens**: JWTs are issued with fixed expirations (1 hour for standard logins, 15 minutes for demo logins). There is no refresh token rotation mechanism implemented; expiring sessions require re-authentication.
* **Route Guards at Client Level**: Frontend views rely on state presence in the Zustand store and API-level 401/403 rejections; there is no global higher-order component checking token validity on every route transition.
* **USDA API Rate Limits**: When using `DEMO_KEY` for the USDA FoodData Central integration, requests are strictly rate-limited by the USDA. If exceeded or offline, the API falls back to a curated local nutritional catalog.
* **Cold Starts on Free-Tier Hosting**: When hosted on Render's free tier, the backend web service spins down after 15 minutes of inactivity, resulting in a 30–50 second cold-start delay on the initial request.

---

## Engineering Contributions & AI Collaboration

### Contributions by Ramanpreet Singh
* **Architecture & Monorepo Optimization**: Re-architected the project into an npm workspace monorepo, unified dependencies across packages, synchronized Express versions (`4.21.2`), and configured zero-downtime startup commands in [`render.yaml`](render.yaml) (`npx prisma migrate deploy && npm start`).
* **Security Hardening**:
  * Eliminated plaintext request body logging on sensitive authentication routes (`/signup`).
  * Implemented `express-rate-limit` middleware on `/login` and `/signup` to mitigate brute-force and credential-stuffing attacks.
  * Added JWT authentication checks to `GET /intake`, `GET /day-meals`, and scoped `GET /users` strictly to the authenticated subject.
* **Bug Remediation & Test-Driven Development (TDD)**:
  * Identified and fixed a critical loop bug in `POST /meal` where a premature `return` statement dropped subsequent meal items.
  * Fixed string UUID routing in `GET /meal/:id` and `DELETE /meal/:id` previously crashing on `Number()` conversions.
  * Corrected `POST /survey` unreachable return code and removed unpersisted schema fields.
  * Fixed client-side intake form submission in [`Intake.tsx`](client/src/pages/Intake.tsx), implementing loading indicators, error handling, and conditional navigation.
* **Feature Development & Visual Telemetry**:
  * Replaced all mock dashboard data in [`Dashboard.tsx`](client/src/pages/Dashboard.tsx) with live Recharts feeds queried from `GET /meal`, `GET /survey/me`, and `GET /meal/today-by-type`.
  * Mounted food search proxy routing for live USDA nutrition lookup.
  * Built an idempotent, non-destructive Prisma seeding pipeline generating 14 days of realistic multi-meal macronutrient data.
  * Added instant demo login with 15-minute token TTL and API-level immutability enforcement.
* **DevOps & CI/CD**: Authored automated GitHub Actions continuous integration pipelines (`ci.yml`) covering linting, database client generation, Jest testing, and frontend production builds.

### How AI Was Used in Development
* **TDD Test Fixture Generation**: AI was utilized to draft Jest and Supertest test fixtures reproducing edge-case scenarios (such as multi-item array payload handling and UUID route parsing) prior to writing source code fixes.
* **Security & Vulnerability Auditing**: Used AI prompts to audit route middleware trees, pinpointing unauthenticated data endpoints and sensitive logging leaks.
* **Macro & Telemetry Modeling**: Collaborated with AI to compute authentic caloric and macronutrient proportions across a 14-day timeline for the demo seed dataset.
* **Human-in-the-Loop Verification**: All AI-assisted suggestions were rigorously reviewed, manually tested in local environments, validated against PostgreSQL schema constraints, and verified with automated test suites before committing.
