# AWS Deployment Guide for ReMarket

This guide covers deploying ReMarket to AWS Lambda with CloudFront CDN.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured locally
- Domain name (optional, but recommended)
- All required API keys (OpenAI, Stripe, etc.)

## Architecture Overview

```
User Request
    ↓
CloudFront (CDN)
    ↓
Lambda@Edge (Next.js SSR)
    ↓
RDS PostgreSQL
```

## Step 1: Database Setup

### Option A: AWS RDS PostgreSQL (Recommended for Production)

1. **Create RDS Instance:**
```bash
aws rds create-db-instance \
  --db-instance-identifier remarket-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --publicly-accessible
```

2. **Get Connection String:**
```
postgresql://postgres:YOUR_PASSWORD@remarket-db.xxxxx.us-east-1.rds.amazonaws.com:5432/remarket
```

3. **Update Security Group:**
Allow inbound traffic on port 5432 from Lambda security group

### Option B: Supabase (Easier Alternative)

1. Create project at https://supabase.com
2. Get connection string from project settings
3. No additional AWS configuration needed

## Step 2: Environment Variables

Create `.env.production` file:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/remarket"

# NextAuth
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com"

# OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_COMMISSION_PERCENTAGE="10"

# OpenAI
OPENAI_API_KEY="sk-..."

# App Config
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Step 3: Database Migration

Run migrations before deployment:

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Step 4: Deploy with SST

### Initial Setup

```bash
# Install SST globally
npm install -g sst

# Initialize SST
npx sst init

# Bootstrap AWS CDK (first time only)
npx sst bootstrap
```

### Deploy to Staging

```bash
# Set environment variables
export DATABASE_URL="postgresql://..."
export NEXTAUTH_SECRET="..."
# ... (set all required vars)

# Deploy to staging
npx sst deploy --stage staging
```

### Deploy to Production

```bash
# Deploy to production
npx sst deploy --stage production
```

SST will output your CloudFront URL:
```
✔  Deployed:
   SiteUrl: https://d111111abcdef8.cloudfront.net
```

## Step 5: Custom Domain Setup (Optional)

### Using Route 53

1. **Create Hosted Zone:**
```bash
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)
```

2. **Update SST Config:**

Edit `sst.config.ts`:
```typescript
customDomain: {
  domainName: "yourdomain.com",
  hostedZone: "yourdomain.com",
}
```

3. **Redeploy:**
```bash
npx sst deploy --stage production
```

SST will automatically:
- Create ACM certificate
- Set up CloudFront distribution
- Configure Route 53 records

## Step 6: Stripe Webhook Configuration

1. **Get CloudFront URL** from SST deployment

2. **Configure Webhook in Stripe Dashboard:**
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to send:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated`
     - `transfer.created`

3. **Get Webhook Secret** and update environment variable

4. **Test Webhook:**
```bash
stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe
```

## Step 7: Post-Deployment Verification

### Test Checklist

- [ ] Homepage loads
- [ ] User registration works
- [ ] Login/logout works
- [ ] Create listing works
- [ ] AI description generation works
- [ ] AI price suggestion works
- [ ] Image upload works
- [ ] Search works
- [ ] Payment flow works
- [ ] Stripe Connect onboarding works
- [ ] Webhook processing works

### Monitor Logs

```bash
# View Lambda logs
npx sst logs --stage production

# Or via CloudWatch
aws logs tail /aws/lambda/remarket-production-site --follow
```

## Step 8: Performance Optimization

### CloudFront Caching

Update `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/images/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

### Database Connection Pooling

For Lambda, use connection pooling:

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

## Monitoring & Maintenance

### CloudWatch Dashboards

Create custom dashboard:
```bash
aws cloudwatch put-dashboard \
  --dashboard-name ReMarket \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Alerts

Set up CloudWatch alarms for:
- Lambda errors
- API latency
- Database connections
- Failed payments

### Backup Strategy

RDS automated backups:
- Retention: 7 days
- Backup window: 03:00-04:00 UTC
- Snapshot before major updates

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check Lambda VPC configuration
aws lambda get-function-configuration \
  --function-name remarket-production-site
```

### Lambda Cold Starts

- Use provisioned concurrency for production
- Keep Lambda warm with scheduled CloudWatch Events

### Deployment Fails

```bash
# Check SST logs
npx sst logs --stage production

# Remove and redeploy
npx sst remove --stage staging
npx sst deploy --stage staging
```

## Cost Estimation

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Lambda | 1M requests/month | $0.20 |
| CloudFront | 10GB transfer | $0.85 |
| RDS t3.micro | 24/7 | $15.00 |
| Route 53 | 1 hosted zone | $0.50 |
| **Total** | | **~$17/month** |

## Security Best Practices

1. **Secrets Management:**
   - Use AWS Secrets Manager or SSM Parameter Store
   - Rotate credentials regularly

2. **IAM Roles:**
   - Principle of least privilege
   - Separate roles for staging/production

3. **VPC Configuration:**
   - Lambda in private subnet
   - RDS in private subnet
   - NAT Gateway for outbound traffic

4. **Rate Limiting:**
   - CloudFront rate limiting
   - API Gateway throttling

## Scaling Considerations

### Auto-Scaling Lambda

Lambda auto-scales automatically, but configure:
- Reserved concurrency
- Provisioned concurrency for production

### Database Scaling

When traffic grows:
- Upgrade RDS instance class
- Enable read replicas
- Consider Aurora Serverless

### CDN Optimization

- Enable CloudFront compression
- Use origin shield
- Optimize cache hit ratio

---

**Deployment Complete! 🚀**

Your ReMarket instance should now be live at your CloudFront URL or custom domain.
