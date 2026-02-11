import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { type HouseholdActivityData } from "@/lib/ai/provider";

// Server-side AI route — never expose API keys to browser
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === "true";
  if (!aiEnabled) {
    return NextResponse.json({ error: "AI disabled" }, { status: 403 });
  }

  let data: HouseholdActivityData;
  try {
    data = await request.json() as HouseholdActivityData;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const providerName = process.env.NEXT_PUBLIC_AI_PROVIDER ?? "mock";

  try {
    let summary: string;

    if (providerName === "gemini" && process.env.GEMINI_API_KEY) {
      summary = await generateWithGemini(data);
    } else if (providerName === "claude" && process.env.ANTHROPIC_API_KEY) {
      summary = await generateWithClaude(data);
    } else {
      // Mock provider
      summary = generateMockSummary(data);
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("AI weekly summary error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}

function generateMockSummary(data: HouseholdActivityData): string {
  const lines: string[] = ["📊 Weekly Household Summary\n"];

  if (data.expenseCount > 0) {
    lines.push(`💰 ${data.expenseCount} expense${data.expenseCount !== 1 ? "s" : ""} recorded this week.`);
  }

  if (data.totalUnsettledCents > 0) {
    const amount = (data.totalUnsettledCents / 100).toFixed(2);
    lines.push(`📈 Total unsettled: ${data.currency} ${amount}`);
  } else {
    lines.push("✅ All expenses are settled up!");
  }

  if (data.choresCompleted > 0 || data.choresDue > 0) {
    lines.push(`🧹 Chores: ${data.choresCompleted} completed, ${data.choresDue} due.`);
  }

  if (data.upcomingEvents > 0) {
    lines.push(`📅 ${data.upcomingEvents} upcoming event${data.upcomingEvents !== 1 ? "s" : ""}.`);
  }

  lines.push("\nRemember to settle up if you owe anything! 🏠");
  return lines.join("\n");
}

async function generateWithGemini(data: HouseholdActivityData): Promise<string> {
  const prompt = buildPrompt(data);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) throw new Error("Gemini API error");
  const result = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? generateMockSummary(data);
}

async function generateWithClaude(data: HouseholdActivityData): Promise<string> {
  const prompt = buildPrompt(data);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error("Claude API error");
  const result = await response.json() as { content?: { type: string; text: string }[] };
  return result.content?.[0]?.text ?? generateMockSummary(data);
}

function buildPrompt(data: HouseholdActivityData): string {
  return `You are a friendly household assistant. Write a brief, warm weekly summary (3-5 sentences) for a shared household based on this data:

- Expenses this week: ${data.expenseCount}
- Total unsettled amount: ${data.currency} ${(data.totalUnsettledCents / 100).toFixed(2)}
- Chores completed: ${data.choresCompleted}, Chores due: ${data.choresDue}
- Upcoming events: ${data.upcomingEvents}

Keep it friendly, factual, and actionable. Use emojis sparingly. Do not add made-up details.`;
}
