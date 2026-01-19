
'use client';

import React, { useState } from 'react';
import { TrendingUp, DollarSign, Target, AlertTriangle, Zap, BarChart3 } from 'lucide-react';

export default function RevenueOptimizer() {
  const [metrics, setMetrics] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAIDetails, setShowAIDetails] = useState(true);

  const analyzeWithAI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/revenue/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setMetrics(data.metrics);
      setInsights(data.insights);
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to analyze revenue. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getImpactColor = (type: string) => {
    switch(type) {
      case 'critical': return 'border-l-red-500';
      case 'high-impact': return 'border-l-green-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Revenue Optimizer</h1>
              <p className="text-slate-600">Real-time marketplace intelligence & optimization</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Details (what this analysis does)</h2>
              <p className="text-sm text-slate-600 mt-1">
                A quick explanation of the data used, how to interpret confidence, and what to do next.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAIDetails((v) => !v)}
              className="text-sm font-semibold text-purple-700 hover:text-purple-800"
            >
              {showAIDetails ? 'Hide' : 'Show'}
            </button>
          </div>

          {showAIDetails && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">What data is analyzed</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>- Last 30 days of completed transactions</li>
                  <li>- Active listings + listing views (to estimate conversion)</li>
                  <li>- Category-level performance (revenue, listings, avg price)</li>
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">How to read the output</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>- <span className="font-medium">Confidence</span>: model certainty based on patterns in your data</li>
                  <li>- <span className="font-medium">Impact</span>: estimated upside if you implement the recommendation</li>
                  <li>- <span className="font-medium">Optimization score</span>: a directional health score (0–100)</li>
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">Best practices</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>- Start with <span className="font-medium">urgent/high</span> actions with low effort</li>
                  <li>- Validate changes with small experiments (A/B or limited rollout)</li>
                  <li>- Treat suggestions as guidance, not financial advice</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <label className="text-sm font-medium text-slate-700 mb-2 block">Analyze Category</label>
          <div className="flex gap-3">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="furniture">Furniture</option>
              <option value="books">Books</option>
              <option value="toys">Toys</option>
            </select>
            <button
              onClick={analyzeWithAI}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">AI analyzing your marketplace data...</p>
            </div>
          </div>
        )}

        {!loading && metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">Optimization Score</span>
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{metrics.optimizationScore}%</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">Projected Revenue</span>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">${metrics.projectedRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+{metrics.revenueIncrease.toFixed(1)}%</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">Potential Gain</span>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">${metrics.potentialGain.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">Active Insights</span>
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{insights.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-2">How to act on this analysis</h2>
              <p className="text-sm text-slate-600">
                Use the insights to identify the biggest revenue levers, then follow the recommended actions to execute.
                A good workflow is: pick 1–2 high-confidence insights → apply one urgent action → re-run the analysis after 7–14 days.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-slate-900">AI-Generated Insights</h2>
              </div>
              
              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <div key={idx} className={`border-l-4 ${getImpactColor(insight.type)} bg-slate-50 rounded-lg p-4`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500 uppercase">{insight.category}</span>
                          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{insight.title}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{insight.impact}</p>
                      </div>
                    </div>
                    <p className="text-slate-700">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-bold text-slate-900">Recommended Actions</h2>
              </div>

              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">Effort: {rec.effort}</span>
                          <span className="text-xs text-slate-500">• {rec.timeframe}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{rec.action}</h3>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-slate-700 mb-2">Implementation Steps:</p>
                      <ol className="space-y-1">
                        {rec.steps.map((step: string, sIdx: number) => (
                          <li key={sIdx} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                              {sIdx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// import OpenAI from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// interface MarketplaceData {
//   totalRevenue: number;
//   totalListings: number;
//   activeUsers: number;
//   avgOrderValue: number;
//   conversionRate: number;
//   categories: {
//     [key: string]: {
//       revenue: number;
//       listings: number;
//       avgPrice: number;
//       conversion: number;
//     };
//   };
// }

// export async function generateRevenueInsights(data: MarketplaceData) {
//   const prompt = `You are a marketplace revenue optimization expert. Analyze this data and provide 5 actionable insights:

// Marketplace Data:
// - Total Revenue: $${data.totalRevenue}
// - Total Listings: ${data.totalListings}
// - Active Users: ${data.activeUsers}
// - Average Order Value: $${data.avgOrderValue}
// - Conversion Rate: ${data.conversionRate}%

// Category Breakdown:
// ${Object.entries(data.categories).map(([name, cat]) => 
//   `- ${name}: $${cat.revenue} revenue, ${cat.listings} listings, $${cat.avgPrice} avg price, ${cat.conversion}% conversion`
// ).join('\n')}

// Provide insights in this EXACT JSON format (no markdown, no backticks):
// [
//   {
//     "type": "high-impact|medium-impact|critical",
//     "category": "Pricing|Inventory|Marketing|User Acquisition|Revenue Leak",
//     "title": "Brief title",
//     "description": "Detailed actionable description",
//     "impact": "+$X,XXX/month",
//     "confidence": 85
//   }
// ]

// Focus on: dynamic pricing, inventory optimization, conversion improvements, cart recovery, cross-selling.`;

//   const response = await openai.chat.completions.create({
//     model: 'gpt-4',
//     messages: [{ role: 'user', content: prompt }],
//     temperature: 0.7,
//   });

//   const content = response.choices[0].message.content || '[]';
//   return JSON.parse(content);
// }

// export async function generateRecommendations(insights: any[]) {
//   const prompt = `Based on these insights, create 4 prioritized action recommendations:

// ${insights.map((i, idx) => `${idx + 1}. ${i.title}: ${i.description}`).join('\n')}

// Provide recommendations in this EXACT JSON format (no markdown, no backticks):
// [
//   {
//     "priority": "urgent|high|medium",
//     "action": "Action title",
//     "steps": ["Step 1", "Step 2", "Step 3"],
//     "effort": "Low|Medium|High",
//     "timeframe": "X days|X weeks"
//   }
// ]`;

//   const response = await openai.chat.completions.create({
//     model: 'gpt-4',
//     messages: [{ role: 'user', content: prompt }],
//     temperature: 0.7,
//   });

//   const content = response.choices[0].message.content || '[]';
//   return JSON.parse(content);
// }
