import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateDescriptionInput {
  title: string;
  category: string;
  condition: string;
  images?: string[];
}

export async function generateProductDescription(
  input: GenerateDescriptionInput
): Promise<string> {
  const { title, category, condition } = input;

  const prompt = `Generate a compelling product description for a secondhand marketplace listing.

Product Details:
- Title: ${title}
- Category: ${category}
- Condition: ${condition}

Requirements:
- Write 2-3 paragraphs
- Highlight the item's features and condition
- Use persuasive but honest language
- Keep it concise and engaging
- Focus on value proposition for buyers

Description:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are an expert product copywriter for a secondhand marketplace. Write honest, engaging descriptions that help items sell faster.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content || "";
}

export interface PriceSuggestionInput {
  category: string;
  condition: string;
  title: string;
  description?: string;
}

export async function suggestPrice(
  input: PriceSuggestionInput
): Promise<number> {
  const { category, condition, title, description } = input;

  const prompt = `As a pricing expert for secondhand marketplaces, suggest a fair market price in INR.

Product Details:
- Title: ${title}
- Category: ${category}
- Condition: ${condition}
${description ? `- Description: ${description}` : ""}

Respond with ONLY a number representing the suggested price in INR. Consider:
- Current market rates for secondhand items
- Item condition
- Category-specific depreciation
- Local market (India)

Price (INR):`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a pricing expert for Indian secondhand marketplaces. Provide realistic price suggestions based on current market rates.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 50,
  });

  const priceText = completion.choices[0]?.message?.content?.trim() || "0";
  const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
  
  return isNaN(price) ? 0 : Math.round(price);
}

export interface ModerationInput {
  title: string;
  description: string;
}

export interface ModerationResult {
  safe: boolean;
  flags: string[];
  confidence: number;
}

export async function moderateContent(
  input: ModerationInput
): Promise<ModerationResult> {
  const { title, description } = input;

  // Use OpenAI's moderation API
  const moderation = await openai.moderations.create({
    input: `${title}\n\n${description}`,
  });

  const result = moderation.results[0];
  
  if (!result) {
    return { safe: true, flags: [], confidence: 1.0 };
  }

  const flags: string[] = [];
  
  if (result.categories.sexual) flags.push("sexual");
  if (result.categories.hate) flags.push("hate");
  if (result.categories.harassment) flags.push("harassment");
  if (result.categories.violence) flags.push("violence");
  if (result.categories["self-harm"]) flags.push("self-harm");
  if (result.categories["sexual/minors"]) flags.push("sexual/minors");
  if (result.categories["hate/threatening"]) flags.push("hate/threatening");
  if (result.categories["violence/graphic"]) flags.push("violence/graphic");

  return {
    safe: !result.flagged,
    flags,
    confidence: Math.max(...Object.values(result.category_scores)),
  };
}

export interface SemanticSearchInput {
  query: string;
  limit?: number;
}

export async function generateSearchEmbedding(
  query: string
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });

  return response.data[0]?.embedding || [];
}

// Image analysis for better categorization (future enhancement)
export async function analyzeProductImage(imageUrl: string): Promise<{
  suggestedCategory: string;
  suggestedCondition: string;
  description: string;
}> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this product image and suggest: 1) Category (CLOTHING, JEWELRY, WATCHES, PURSES, CROCKERY, ELECTRONICS, FURNITURE, BOOKS, TOYS, SPORTS, OTHER), 2) Condition (NEW, LIKE_NEW, GOOD, FAIR, POOR), 3) Brief description. Respond in JSON format.",
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const content = completion.choices[0]?.message?.content || "{}";
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      suggestedCategory: "OTHER",
      suggestedCondition: "GOOD",
      description: "Unable to analyze image",
    };
  }
}
