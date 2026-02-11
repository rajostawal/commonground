import { type AiProvider } from "./provider";
import { MockAiProvider } from "./mockProvider";

let _provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (_provider) return _provider;

  const providerName = process.env.NEXT_PUBLIC_AI_PROVIDER ?? "mock";

  // Always use mock provider on client side for now
  // Real providers (gemini/claude) are called via server routes only
  _provider = new MockAiProvider();

  return _provider;
}

export { type AiProvider, type SplitSuggestion, type HouseholdActivityData } from "./provider";
