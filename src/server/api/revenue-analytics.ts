import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';
import { generateRevenueInsights, generateRecommendations } from '@/lib/ai/revenue-optimizer';

// Cast to ensure access to all generated model delegates (helps type-checking in some IDE setups)
const prisma = db as PrismaClient & {
  revenueInsight: any;
  revenueMetric: any;
};

export async function getMarketplaceData(category?: string) {
  // Get transactions from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const normalizedCategory = category && category !== 'all' ? category : undefined;

  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: 'COMPLETED',
      ...(normalizedCategory
        ? {
            listing: { category: normalizedCategory as any },
          }
        : {}),
    },
    include: {
      listing: true,
    },
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const avgOrderValue = totalRevenue / transactions.length || 0;

  // Get active users
  const activeUsers = await prisma.user.count({
    where: {
      listings: {
        some: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }
    }
  });

  // Get listings
  const listings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      ...(normalizedCategory ? { category: normalizedCategory as any } : {})
    }
  });

  // Category breakdown
  const categories: any = {};
  const categoryGroups = await prisma.listing.groupBy({
    by: ['category'],
    where: { status: 'ACTIVE' },
    _count: { id: true },
    _avg: { price: true },
  });

  for (const cat of categoryGroups) {
    const catTransactions = await prisma.transaction.findMany({
      where: {
        listing: { category: cat.category as any },
        createdAt: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
    });

    const catRevenue = catTransactions.reduce((sum, t) => sum + t.amount, 0);
    const catViews = await prisma.listing.aggregate({
      where: { category: cat.category },
      _sum: { views: true },
    });

    const conversion = (catTransactions.length / (catViews._sum.views || 1)) * 100;

    categories[cat.category.toLowerCase()] = {
      revenue: catRevenue,
      listings: cat._count.id,
      avgPrice: cat._avg.price || 0,
      conversion: parseFloat(conversion.toFixed(2)),
    };
  }

  const totalViews = await prisma.listing.aggregate({
    _sum: { views: true },
  });

  const conversionRate = (transactions.length / (totalViews._sum.views || 1)) * 100;

  return {
    totalRevenue,
    totalListings: listings.length,
    activeUsers,
    avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    categories,
  };
}

export async function analyzeRevenue(category?: string) {
  // Get marketplace data
  const data = await getMarketplaceData(category);

  // Generate AI insights
  const insights = await generateRevenueInsights(data);

  // Save insights to database
  await prisma.revenueInsight.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  for (const insight of insights) {
    await prisma.revenueInsight.create({
      data: insight,
    });
  }

  // Generate recommendations
  const recommendations = await generateRecommendations(insights);

  // Calculate metrics
  const projectedIncrease = Array.isArray(insights)
    ? insights.reduce<number>((sum: number, i: { impact: string }) => {
        const match = i.impact.match(/\$([0-9,]+)/);
        return sum + (match ? parseInt(match[1].replace(',', '')) : 0);
      }, 0)
    : 0;

  const projectedRevenue = data.totalRevenue + projectedIncrease;
  const revenueIncrease =
    data.totalRevenue > 0
      ? ((projectedRevenue - data.totalRevenue) / data.totalRevenue) * 100
      : 0;
  const optimizationScore = Math.min(100, Math.round(60 + insights.length * 5 + revenueIncrease));

  const metrics = {
    projectedRevenue,
    revenueIncrease: parseFloat(revenueIncrease.toFixed(2)),
    optimizationScore,
    potentialGain: projectedIncrease,
  };

  // Save metrics
  await prisma.revenueMetric.create({
    data: {
      totalRevenue: data.totalRevenue,
      projectedRevenue: metrics.projectedRevenue,
      optimizationScore: metrics.optimizationScore,
      potentialGain: metrics.potentialGain,
      category: category === 'all' ? null : category,
    },
  });

  return { metrics, insights, recommendations };
}