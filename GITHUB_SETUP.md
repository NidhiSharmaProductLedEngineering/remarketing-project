# GitHub Setup & Contribution Guide

## Initial Repository Setup

### 1. Push to GitHub

```bash
# Navigate to project directory
cd remarketing-project

# Initialize git
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: ReMarket AI-powered marketplace"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/NidhiSharmaProductLedEngineering/remarket.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 2. Repository Settings

#### Enable GitHub Pages (for documentation)
- Go to Settings → Pages
- Source: Deploy from branch
- Branch: `main` → `/docs`

#### Branch Protection Rules
- Settings → Branches → Add rule
- Branch name pattern: `main`
- Enable:
  - [x] Require pull request reviews before merging
  - [x] Require status checks to pass before merging

#### Secrets Configuration
Add the following secrets (Settings → Secrets and variables → Actions):

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

## Project Structure

```
remarket/
├── .github/
│   ├── workflows/          # CI/CD workflows
│   │   ├── ci.yml
│   │   └── deploy.yml
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── docs/                   # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── CONTRIBUTING.md
├── infrastructure/         # AWS deployment configs
├── prisma/                # Database schema & migrations
├── src/                   # Application source code
├── tests/                 # Test files
├── .env.example          # Environment template
├── .gitignore
├── README.md
└── package.json
```

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add AI price suggestion feature
fix: resolve Stripe webhook timeout
docs: update deployment guide
refactor: optimize database queries
test: add unit tests for listing creation
chore: update dependencies
```

### Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: remarket_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Run database migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/remarket_test
        run: npx prisma migrate deploy
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/remarket_test
        run: npm run test:unit
      
      - name: Build
        run: npm run build
```

### Deployment Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npx prisma migrate deploy
      
      - name: Deploy to AWS
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npx sst deploy --stage production
```

## Testing Strategy

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## Contributing Guidelines

### How to Contribute

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'feat: add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style

- ESLint configuration enforced
- Prettier for formatting
- TypeScript strict mode
- Meaningful variable names
- Comments for complex logic

### Documentation

Update documentation when:
- Adding new features
- Changing API endpoints
- Modifying database schema
- Updating deployment process

## Issue Management

### Bug Reports

Use the bug report template:
```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g. macOS]
- Browser: [e.g. chrome 120]
- Version: [e.g. 1.0.0]
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the feature

**Problem it Solves**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about
```

## Release Process

### Versioning

Follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Creating a Release

```bash
# Update version
npm version patch # or minor, major

# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin main --tags

# Create GitHub release
# Go to Releases → Draft new release
# Select tag, write release notes, publish
```

## Demo Deployment

### Vercel (Quick Demo)

Fastest way to get a demo link:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Get demo URL
# https://remarket-xyz.vercel.app
```

Note: Configure environment variables in Vercel dashboard

## Monitoring & Analytics

### Error Tracking
- Sentry for error monitoring
- CloudWatch for AWS logs

### Analytics
- Vercel Analytics
- Google Analytics (optional)

### Performance Monitoring
- Lighthouse CI in GitHub Actions
- Web Vitals tracking

## Security

### Dependency Scanning
```bash
npm audit
npm audit fix
```

### Security Headers
All configured in `next.config.js`

### OWASP Top 10
Regular security audits for common vulnerabilities

## Support

- **Documentation**: `/docs`
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: nidhi@example.com

---

**Happy Contributing! 🚀**
