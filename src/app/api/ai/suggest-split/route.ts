import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface SuggestSplitRequest {
  description: string;
  amountCents: number;
  memberIds: string[];
  memberNames: Record<string, string>;
}

// Server-side AI route for split suggestions
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === "true";
  if (!aiEnabled) {
    return NextResponse.json({ error: "AI disabled" }, { status: 403 });
  }

  let body: SuggestSplitRequest;
  try {
    body = await request.json() as SuggestSplitRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const providerName = process.env.NEXT_PUBLIC_AI_PROVIDER ?? "mock";

  try {
    let suggestion: {
      splitType: "equal" | "percentage" | "exact" | "shares";
      includedMemberIds: string[];
      percentages?: Record<string, number>;
      rationale: string;
    };

    if (providerName === "gemini" && process.env.GEMINI_API_KEY) {
      suggestion = await suggestWithGemini(body);
    } else if (providerName === "claude" && process.env.ANTHROPIC_API_KEY) {
      suggestion = await suggestWithClaude(body);
    } else {
      suggestion = mockSuggestSplit(body);
    }

    return NextResponse.json(suggestion);
  } catch (err) {
    console.error("AI split suggestion error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}

function mockSuggestSplit(body: SuggestSplitRequest) {
  const lowerDesc = body.description.toLowerCase();
  const isRent = lowerDesc.includes("rent") || lowerDesc.includes("utilities");

  return {
    splitType: "equal" as const,
    includedMemberIds: body.memberIds,
    rationale: isRent
      ? "Rent and utilities are typically split equally among all housemates."
      : "Equal split suggested as a starting point. Adjust if needed.",
  };
}

async function suggestWithGemini(body: SuggestSplitRequest) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildSplitPrompt(body) }] }],
      }),
    }
  );

  if (!response.ok) return mockSuggestSplit(body);

  const result = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return JSON.parse(text) as ReturnType<typeof mockSuggestSplit>;
  } catch {
    return mockSuggestSplit(body);
  }
}

async function suggestWithClaude(body: SuggestSplitRequest) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: buildSplitPrompt(body) }],
    }),
  });

  if (!response.ok) return mockSuggestSplit(body);

  const result = await response.json() as { content?: { type: string; text: string }[] };
  const text = result.content?.[0]?.text ?? "";

  try {
    return JSON.parse(text) as ReturnType<typeof mockSuggestSplit>;
  } catch {
    return mockSuggestSplit(body);
  }
}

function buildSplitPrompt(body: SuggestSplitRequest): string {
  return `You are a helpful expense splitting assistant. Based on the expense description, suggest how to split it.

Expense: "${body.description}"
Amount: ${body.amountCents / 100}
Members: ${Object.values(body.memberNames).join(", ")}

Return ONLY valid JSON in this format:
{"splitType": "equal", "includedMemberIds": ${JSON.stringify(body.memberIds)}, "rationale": "brief explanation"}

Split types: equal, percentage, exact, shares. Default to equal unless description clearly suggests otherwise.`;
}
