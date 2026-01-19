# 🚀 Quick Start Guide

Get ReMarket running locally in 5 minutes.

## Prerequisites

Make sure you have installed:
- Node.js 20+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Git ([Download](https://git-scm.com/))

## 1. Clone Repository

```bash
git clone https://github.com/NidhiSharmaProductLedEngineering/remarket.git
cd remarket
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Generate NextAuth secret
openssl rand -base64 32
# Copy output and paste into NEXTAUTH_SECRET in .env.local
```

Minimum required variables for local development:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/remarket"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 4. Start Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Verify it's running
docker ps
```

## 5. Setup Database

```bash
# Run migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npx prisma db seed
```

## 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## Optional: Configure External Services

### OpenAI (for AI features)
1. Get API key: https://platform.openai.com/api-keys
2. Add to `.env.local`:
```env
OPENAI_API_KEY="sk-..."
```

### Stripe (for payments)
1. Create account: https://stripe.com
2. Get test keys from Dashboard
3. Add to `.env.local`:
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

4. Install Stripe CLI for webhooks:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Google OAuth (optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect: `http://localhost:3000/api/auth/callback/google`
4. Add to `.env.local`:
```env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:migrate      # Create migration
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database

# Testing
npm run test            # Run all tests
npm run test:unit       # Unit tests only
npm run test:e2e        # E2E tests only
npm run lint            # Run linter
npm run type-check      # TypeScript check
```

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── api/           # API routes
│   └── (routes)/      # App routes
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   └── marketplace/  # Feature components
├── lib/              # Utilities
│   ├── ai/           # OpenAI integration
│   ├── stripe.ts     # Stripe helpers
│   ├── db.ts         # Prisma client
│   └── auth.ts       # NextAuth config
├── server/           # Server-side code
│   └── api/          # tRPC routers
└── types/            # TypeScript types
```

## Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Database connection error
```bash
# Check if PostgreSQL is running
docker ps

# Restart database
docker-compose restart

# Check logs
docker logs remarket-postgres
```

### Prisma Client not generated
```bash
npx prisma generate
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

## Next Steps

1. **Read Documentation**: Check `/docs` folder
2. **Try Features**: Create listing, test AI tools
3. **Configure Services**: Set up Stripe, OpenAI
4. **Deploy**: Follow `infrastructure/DEPLOYMENT.md`

## Need Help?

- 📚 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/NidhiSharmaProductLedEngineering/remarket/issues)
- 💬 [Discussions](https://github.com/NidhiSharmaProductLedEngineering/remarket/discussions)

---

**Happy coding! 🎯**
