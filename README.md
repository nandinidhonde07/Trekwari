# TreckWari – Adventure Trekking & Expedition Platform

TreckWari is a premium full-stack adventure website that conducts trekking expeditions, safaris, and nature outings. It features dynamic registration systems, attendance QR code check-ins, SOS security parameters, Cloudinary media galleries, interactive itinerary builders, blogs, gamified level milestones, and referral systems.

## Tech Stack
* **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion, TypeScript
* **Backend**: Node.js, Express, TypeScript
* **Database & ORM**: PostgreSQL, Prisma
* **Integrations**: Cloudinary (media upload), Resend/Nodemailer (email notification), OpenWeather API (real-time weather widgets), Google Maps (routes & coordinates)

## Monorepo Layout
```
treckwari/
├── backend/       # Express REST API & Prisma Database Client
└── frontend/      # Next.js web application
```

## Setup Instructions

### Prerequisites
* Node.js (v18+)
* npm (v9+)
* PostgreSQL (Optional: falls back to local SQLite if not configured)

### 1. Installation
In the root directory, install all workspace dependencies:
```bash
npm run install:all
```
*(On Windows systems where script policies restrict npm, you may need to use `npm.cmd` directly).*

### 2. Environment Configurations
Configure the `.env` files in both the `backend/` and `frontend/` folders.

#### Backend Env (`backend/.env`):
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/treckwari?schema=public" # Or omit to use local SQLite fallback
JWT_SECRET="your-jwt-super-secret-key-12345"
GOOGLE_CLIENT_ID="mock-google-client-id"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
RESEND_API_KEY="your-resend-key"
OPENWEATHER_API_KEY="your-weather-key"
FRONTEND_URL="http://localhost:3000"
```

#### Frontend Env (`frontend/.env`):
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_GOOGLE_MAPS_KEY="your-maps-key"
```

### 3. Database Initialization
Navigate to the `backend` workspace to build schemas and seed the initial completed/upcoming treks:
```bash
cd backend
npx prisma db push
npx prisma db seed
```

### 4. Running the Project
In the root directory, run both servers concurrently:
```bash
npm run dev
```
* **Frontend UI**: `http://localhost:3000`
* **Backend REST API**: `http://localhost:5000`
