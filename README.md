# ReMarket - AI-Powered Flea Marketplace

Production-grade marketplace platform built with Next.js 14, PostgreSQL, and AWS Lambda.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CloudFront CDN                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              AWS Lambda (Next.js 14)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   App Router │  │  API Routes  │  │   tRPC API   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────┬──────────────────┬──────────────────┬────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────┐  ┌────────▼────────┐  ┌─────▼──────────┐
│   RDS Postgres │  │  Stripe Connect │  │  OpenAI API    │
│   (PostgreSQL) │  │   (Payments)    │  │  (AI Features) │
└────────────────┘  └─────────────────┘  └────────────────┘
```

## 🚀 Features

### Core Marketplace
- ✅ User authentication (Email + OAuth)
- ✅ Product listing management (CRUD)
- ✅ Search & filtering
- ✅ User verification system
- ✅ Review & rating system
- ✅ Local pickup coordination

### AI-Powered Features
- 🤖 Auto-generate product descriptions
- 🔍 Smart semantic search
- 💰 AI price suggestions
- 🛡️ Content moderation

### Payment System
- 💳 Stripe Connect integration
- 📊 Commission-based model
- 🔒 Secure escrow handling
- 📈 Transaction history

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes, tRPC, Node.js 20 |
| **Database** | PostgreSQL 15, Prisma ORM |
| **Auth** | NextAuth.js v5 |
| **Payments** | Stripe Connect |
| **AI** | OpenAI GPT-4 |
| **Deployment** | AWS Lambda, CloudFront, RDS |
| **IaC** | SST (Serverless Stack) |

## 🛠️ Project Structure

```
remarket/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/             # Auth routes
│   │   ├── (marketplace)/      # Main app routes
│   │   ├── api/                # API routes
│   │   └── layout.tsx
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── marketplace/        # Marketplace-specific
│   │   └── layout/             # Layout components
│   ├── lib/                    # Utilities
│   │   ├── db/                 # Database client
│   │   ├── ai/                 # OpenAI integration
│   │   ├── stripe/             # Stripe helpers
│   │   └── auth/               # Auth config
│   ├── server/                 # Server-side code
│   │   ├── api/                # tRPC routers
│   │   └── db/                 # Database operations
│   └── types/                  # TypeScript types
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # DB migrations
├── infrastructure/             # AWS SST config
├── public/                     # Static assets
└── docker-compose.yml          # Local dev setup
```

## 🚦 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- AWS CLI configured
- Stripe account
- OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/NidhiSharmaProductLedEngineering/remarket.git
cd remarket
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Configure `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/remarket"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_COMMISSION_PERCENTAGE="10"

# OpenAI
OPENAI_API_KEY="sk-..."

# AWS (for deployment)
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="your-account-id"
```

### 3. Start Local Development

```bash
# Start PostgreSQL
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start dev server
npm run dev
```

Visit `http://localhost:3000`

## 🗄️ Database Schema

### Core Tables

```prisma
User
├── id (UUID)
├── email (unique)
├── name
├── verified (boolean)
├── stripeAccountId
└── listings → Listing[]

Listing
├── id (UUID)
├── title
├── description (AI-generated option)
├── price (AI-suggested option)
├── category
├── condition
├── images[]
├── status (DRAFT | ACTIVE | SOLD | REMOVED)
├── userId → User
└── transactions → Transaction[]

Transaction
├── id (UUID)
├── listingId → Listing
├── buyerId → User
├── sellerId → User
├── amount
├── commission
├── stripePaymentIntentId
└── status (PENDING | COMPLETED | CANCELLED)

Review
├── id (UUID)
├── transactionId → Transaction
├── rating (1-5)
└── comment
```

## 🤖 AI Features

### 1. Auto Description Generator

```typescript
// src/lib/ai/description-generator.ts
import { generateProductDescription } from '@/lib/ai/openai'

const description = await generateProductDescription({
  title: "Vintage Leather Jacket",
  category: "Clothing",
  condition: "Good",
  images: [...imageUrls]
})
```

### 2. Smart Search

```typescript
// Uses OpenAI embeddings for semantic search
const results = await searchListings({
  query: "warm winter coat",
  semanticSearch: true
})
```

### 3. Price Suggestions

```typescript
const suggestedPrice = await getSuggestedPrice({
  category: "Electronics",
  condition: "Like New",
  description: "iPhone 13 Pro"
})
```

### 4. Content Moderation

```typescript
const moderation = await moderateContent({
  title: "...",
  description: "..."
})
// Returns: { safe: boolean, flags: string[] }
```

## 💳 Stripe Integration

### Commission Model

ReMarket uses **Stripe Connect** with a 10% commission:

```typescript
// Create connected account for seller
const account = await stripe.accounts.create({
  type: 'express',
  country: 'IN',
  capabilities: {
    transfers: { requested: true }
  }
})

// Process payment with commission
const payment = await stripe.paymentIntents.create({
  amount: 10000, // ₹100
  currency: 'inr',
  application_fee_amount: 1000, // 10% commission
  transfer_data: {
    destination: sellerStripeAccountId
  }
})
```

## 🚀 Deployment to AWS

### Option 1: SST Framework (Recommended)

```bash
# Install SST
npm install -g sst

# Deploy to staging
npx sst deploy --stage staging

# Deploy to production
npx sst deploy --stage production
```

### Option 2: Manual AWS Setup

See `infrastructure/README.md` for detailed CloudFormation/CDK setup.

### Infrastructure Components

```
┌─────────────────────────────────────┐
│         CloudFront CDN              │
│  - Global edge caching              │
│  - SSL/TLS termination              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Lambda@Edge Functions          │
│  - Next.js SSR/ISR                  │
│  - API Routes                       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         RDS PostgreSQL              │
│  - Multi-AZ deployment              │
│  - Automated backups                │
└─────────────────────────────────────┘
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📊 Monitoring & Analytics

- **Logs:** CloudWatch Logs
- **Metrics:** CloudWatch Metrics
- **Errors:** Sentry integration
- **Analytics:** Vercel Analytics (or custom)

## 🔒 Security Checklist

- ✅ Environment variables secured
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (Next.js built-in)
- ✅ CSRF tokens (NextAuth)
- ✅ Rate limiting on API routes
- ✅ Input validation (Zod schemas)
- ✅ Secure headers (next.config.js)
- ✅ Content Security Policy

## 📝 License

MIT

## 👥 Contributing

See `CONTRIBUTING.md` for guidelines.

## 🆘 Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@remarketing.com

---

**Built with ❤️ by Nidhi Sharma**
# remarketing-project
