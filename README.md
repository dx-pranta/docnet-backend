# DocNet - Professional Doctors Networking Platform

A full-stack networking website for professional doctors built with React, TypeScript, Tailwind CSS, Node.js, Express, and PostgreSQL.

## Features

- **User Authentication** - JWT-based registration and login
- **Events** - Create, list, and register for events (free & paid)
- **News** - Share medical news articles with comments and likes
- **Galleries** - Photo albums with reactions and comments
- **Connections** - Network with other doctors
- **Messaging** - Direct messaging between connected doctors
- **Payments** - Stripe integration for paid events

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Zustand, React Query
- **Backend:** Node.js, Express, TypeScript, Sequelize ORM
- **Database:** PostgreSQL
- **Payments:** Stripe

## Project Structure

```
docnet-backend/           # Express + TypeScript API
├── src/
│   ├── config/           # Database configuration
│   ├── models/           # Sequelize models (User, Event, News, Gallery, etc.)
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API routes
│   └── app.ts            # Express app
├── .env                  # Environment variables
└── package.json

docnet-frontend/          # React + Vite SPA
├── src/
│   ├── components/       # React components
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components (14 pages)
│   ├── services/        # API service layer
│   ├── store/           # Zustand state management
│   └── App.tsx          # Main app with routing
├── .env                 # Environment variables
└── package.json
```

## Quick Start

### Prerequisites
- Node.js (v20+)
- PostgreSQL
- npm or yarn

### Database Setup

The project uses PostgreSQL. A Docker container is already running:

```bash
# Docker PostgreSQL (already running)
Host: localhost
Port: 5432
User: root
Password: 123456
Database: docnet
```

### Backend Setup

```bash
cd docnet-backend
npm install
npm run dev
```

Backend runs on: http://localhost:5001

### Frontend Setup

```bash
cd docnet-frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## Environment Variables

### Backend (.env)

```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://root:123456@localhost:5432/docnet
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile

### Events
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:id/register` - Cancel registration

### News
- `GET /api/news` - List articles
- `GET /api/news/:id` - Get article
- `POST /api/news` - Create article
- `POST /api/news/:id/like` - Like article
- `GET /api/news/:id/comments` - Get comments
- `POST /api/news/:id/comments` - Add comment

### Galleries
- `GET /api/galleries` - List galleries
- `GET /api/galleries/:id` - Get gallery
- `POST /api/galleries` - Create gallery
- `POST /api/galleries/:id/photos` - Add photos
- `POST /api/galleries/photos/:id/like` - Like photo

### Connections
- `GET /api/connections` - Get connections
- `GET /api/connections/requests` - Get pending requests
- `POST /api/connections` - Send connection request
- `PUT /api/connections/:id` - Accept/reject request

### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/:userId` - Get messages
- `POST /api/messages` - Send message

### Payments (Stripe)
- `POST /api/payments/stripe/create-intent` - Create payment intent
- `POST /api/payments/stripe/confirm` - Confirm payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/refund` - Request refund

## Test Users Created

| Email | Password | Name | Specialty |
|-------|----------|------|-----------|
| debasishsahapranta@gmail.com | password123 | Debasish Saha Pranta | - |
| john@test.com | password123 | John Doe (Dr.) | Cardiology |
| jane@test.com | password123 | Jane Smith (Dr.) | Neurology |
| mike@test.com | password123 | Mike Wilson (Dr.) | Orthopedics |

## Test Data

- **Events:**
  1. Annual Cardiology Conference 2026 (Paid - $150)
  2. Free Medical Workshop: Basic Life Support (Free)

- **News:**
  1. "Breakthrough in AI-Powered Medical Diagnostics"

- **Gallery:**
  1. Medical Conference 2025

- **Connections:**
  - Jane (3) ↔ Mike (4) - Connected

## Stripe Integration

To test payments:

1. Get Stripe test keys from https://dashboard.stripe.com/test/apikeys
2. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Use Stripe test cards: https://stripe.com/docs/testing

## Running in Production

1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure Stripe live keys
4. Set up proper CORS origins
5. Use HTTPS

## License

MIT
