import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

interface MarketplaceData {
  totalRevenue: number;
  totalListings: number;
  activeUsers: number;
  avgOrderValue: number;
  conversionRate: number;
  categories: {
    [key: string]: {
      revenue: number;
      listings: number;
      avgPrice: number;
      conversion: number;
    };
  };
}

export async function generateRevenueInsights(data: MarketplaceData) {
  // Fallback when no API key is configured (useful for local/testing)
  if (!openai) {
    return [
      {
        type: 'high-impact',
        category: 'Pricing',
        title: 'Raise prices on high-converting categories',
        description: 'Your conversion is healthy; a 5–8% price test on top 2 categories can lift revenue without hurting volume.',
        impact: '+$1,200/month',
        confidence: 82,
      },
      {
        type: 'medium-impact',
        category: 'Inventory',
        title: 'Restock fast-moving listings',
        description: 'Several items show strong demand signals (views vs. supply). Prioritize restock/duplicates for those SKUs.',
        impact: '+$800/month',
        confidence: 78,
      },
      {
        type: 'critical',
        category: 'Revenue Leak',
        title: 'Recover abandoned checkouts',
        description: 'Cart drop-off is elevated; enable follow-up nudges or limited-time coupons for recent abandoners.',
        impact: '+$1,000/month',
        confidence: 71,
      },
      {
        type: 'high-impact',
        category: 'Marketing',
        title: 'Cross-sell complementary items',
        description: 'Bundle frequently co-viewed items and recommend during checkout to raise AOV.',
        impact: '+$650/month',
        confidence: 75,
      },
      {
        type: 'medium-impact',
        category: 'User Acquisition',
        title: 'Feature top-rated sellers',
        description: 'Spotlight trusted sellers on landing pages to improve first-time buyer conversion.',
        impact: '+$400/month',
        confidence: 69,
      },
    ];
  }

  const prompt = `You are a marketplace revenue optimization expert. Analyze this data and provide 5 actionable insights:

Marketplace Data:
- Total Revenue: $${data.totalRevenue}
- Total Listings: ${data.totalListings}
- Active Users: ${data.activeUsers}
- Average Order Value: $${data.avgOrderValue}
- Conversion Rate: ${data.conversionRate}%

Category Breakdown:
${Object.entries(data.categories).map(([name, cat]) => 
  `- ${name}: $${cat.revenue} revenue, ${cat.listings} listings, $${cat.avgPrice} avg price, ${cat.conversion}% conversion`
).join('\n')}

Provide insights in this EXACT JSON format (no markdown, no backticks):
[
  {
    "type": "high-impact|medium-impact|critical",
    "category": "Pricing|Inventory|Marketing|User Acquisition|Revenue Leak",
    "title": "Brief title",
    "description": "Detailed actionable description",
    "impact": "+$X,XXX/month",
    "confidence": 85
  }
]

Focus on: dynamic pricing, inventory optimization, conversion improvements, cart recovery, cross-selling.`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '[]';
  return JSON.parse(content);
}

export async function generateRecommendations(insights: any[]) {
  // Fallback when no API key is configured (useful for local/testing)
  if (!openai) {
    return [
      {
        priority: 'urgent',
        action: 'Enable cart recovery nudges',
        steps: [
          'Configure abandoned cart emails/push with a 10% time-bound coupon',
          'Trigger only after high-intent events (add-to-cart + view checkout)',
          'Track recovered revenue and tune cadence weekly'
        ],
        effort: 'Low',
        timeframe: '3 days',
      },
      {
        priority: 'high',
        action: 'Run 5–8% price test on top categories',
        steps: [
          'Select top 2 categories by conversion',
          'A/B test current vs +5–8% price for 7–14 days',
          'Keep lift if revenue and conversion stay neutral/positive'
        ],
        effort: 'Medium',
        timeframe: '2 weeks',
      },
      {
        priority: 'high',
        action: 'Cross-sell bundles on PDP and checkout',
        steps: [
          'Identify frequently co-viewed/co-purchased items',
          'Add “Frequently Bought Together” modules on PDP/checkout',
          'Measure AOV and attach rate after rollout'
        ],
        effort: 'Medium',
        timeframe: '2 weeks',
      },
      {
        priority: 'medium',
        action: 'Feature trusted sellers to boost first-time conversion',
        steps: [
          'Surface top-rated sellers on homepage/category pages',
          'Add trust badges on their listings',
          'Monitor first-time buyer conversion delta'
        ],
        effort: 'Low',
        timeframe: '1 week',
      },
    ];
  }

  const prompt = `Based on these insights, create 4 prioritized action recommendations:

${insights.map((i, idx) => `${idx + 1}. ${i.title}: ${i.description}`).join('\n')}

Provide recommendations in this EXACT JSON format (no markdown, no backticks):
[
  {
    "priority": "urgent|high|medium",
    "action": "Action title",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "effort": "Low|Medium|High",
    "timeframe": "X days|X weeks"
  }
]`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '[]';
  return JSON.parse(content);
}

