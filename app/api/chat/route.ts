import { streamText, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import {
  SYSTEM_PROMPT,
  PLANNER_PROMPT,
  buildUserMessage,
  buildPlannerMessage,
} from "@/lib/prompts";

const fastModel = google("gemini-3.1-flash-lite-preview");
const fullModel = openai("gpt-5-mini");

export async function POST(request: Request) {
  const { currentHtml, message, history } = await request.json();

  const historyMessages = (history || []).map(
    (msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })
  );

  const { text: plannerResponse } = await generateText({
    model: fastModel,
    system: PLANNER_PROMPT,
    messages: [
      ...historyMessages,
      { role: "user", content: buildPlannerMessage(currentHtml, message) },
    ],
  });

  console.log("[planner] user message:", message);
  console.log("[planner] raw response:", plannerResponse);

  let plan;
  try {
    const cleaned = plannerResponse.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/, "");
    plan = JSON.parse(cleaned);
  } catch (e) {
    console.log("[planner] JSON parse failed:", e);
    plan = null;
  }

  console.log("[planner] parsed plan:", JSON.stringify(plan, null, 2));

  if (plan?.type === "targeted" && Array.isArray(plan.changes) && plan.changes.length > 0) {
    console.log("[planner] → targeted with", plan.changes.length, "patches");
    return Response.json({ type: "diff", changes: plan.changes });
  }

  console.log("[planner] → full regeneration via GPT-5 Mini");

  const result = streamText({
    model: fullModel,
    system: SYSTEM_PROMPT,
    messages: [
      ...historyMessages,
      { role: "user", content: buildUserMessage(currentHtml, message) },
    ],
  });

  return result.toTextStreamResponse();
}
