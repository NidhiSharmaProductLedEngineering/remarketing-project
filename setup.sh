#!/bin/bash

# ReMarket Setup Script
# This script automates the initial setup process

set -e

echo "🚀 ReMarket Setup Script"
echo "========================"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need it for local database."
    echo "   Install from: https://www.docker.com/products/docker-desktop"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup environment file
echo ""
echo "🔧 Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from template"
    
    # Generate NEXTAUTH_SECRET
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    if [ -n "$NEXTAUTH_SECRET" ]; then
        # Update .env.local with generated secret
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|NEXTAUTH_SECRET=\"\"|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env.local
        else
            sed -i "s|NEXTAUTH_SECRET=\"\"|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env.local
        fi
        echo "✅ Generated NEXTAUTH_SECRET"
    fi
else
    echo "ℹ️  .env.local already exists, skipping..."
fi

# Start database
echo ""
echo "🗄️  Starting PostgreSQL database..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run database migrations
echo ""
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Generate Prisma Client
echo ""
echo "🔨 Generating Prisma Client..."
npx prisma generate

# Optional: Seed database
echo ""
read -p "❓ Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    echo "✅ Database seeded successfully"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Review .env.local and add your API keys:"
echo "   - OPENAI_API_KEY (for AI features)"
echo "   - STRIPE_SECRET_KEY (for payments)"
echo "   - STRIPE_PUBLISHABLE_KEY"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, see:"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - README.md - Full documentation"
echo "   - PROJECT_HANDOFF.md - Implementation roadmap"
echo ""
echo "🎉 Happy coding!"
