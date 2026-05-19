import { AiAgentType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { createTixoraTools } from "@/lib/ai/langchain-tools";
import { getOpenAIClient } from "@/lib/ai/openai";
import { recommendEvents, serializeRecommendedEvent } from "@/lib/ai/recommendations";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const agentRequestSchema = z.object({
  message: z.string().min(2).max(1500),
  seatSessionId: z.string().min(8).max(120).optional()
});

const openAiTools = [
  {
    type: "function" as const,
    function: {
      name: "searchEvents",
      description: "Find published events by keyword or semantic vibe.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "searchSeats",
      description: "Find available seats for a ticket type.",
      parameters: {
        type: "object",
        properties: {
          ticketTypeId: { type: "number" },
          category: { type: "string", enum: ["GA", "STANDARD", "PREMIUM", "VIP", "ACCESSIBLE"] }
        },
        required: ["ticketTypeId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "getUserTickets",
      description: "Return the logged-in user's latest tickets.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

async function createFallbackResponse(message: string) {
  const recommendations = await recommendEvents(message, 5);

  return {
    answer:
      "Free mode is active. I searched events with the PostgreSQL fallback instead of paid OpenAI semantic AI.",
    events: recommendations.map(serializeRecommendedEvent),
    provider: "free-fallback"
  };
}

async function finishRun(runId: number | undefined, output: object) {
  if (!runId) return;

  await prisma.aiAgentRun.update({
    where: { id: runId },
    data: { status: "COMPLETED", output, completedAt: new Date() }
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session ? Number(session.sub) : undefined;
    const { message } = agentRequestSchema.parse(await request.json());

    const agent = await prisma.aiAgent.upsert({
      where: { slug: "tixora-support-agent" },
      update: { isActive: true, defaultModel: env.OPENAI_CHAT_MODEL },
      create: {
        slug: "tixora-support-agent",
        name: "Tixora Support Agent",
        type: AiAgentType.SUPPORT,
        description: "AI support and recommendation agent powered by OpenAI, LangChain tools, PostgreSQL, Redis, and Pinecone.",
        defaultModel: env.OPENAI_CHAT_MODEL,
        systemPrompt:
          "You are Tixora's ticket assistant. Help with event discovery, seat availability, user tickets, resale guidance, and organizer analytics. Be concise and practical.",
        toolManifest: {
          tools: ["searchEvents", "searchSeats", "getUserTickets"]
        }
      }
    });

    const run = userId
      ? await prisma.aiAgentRun.create({
          data: {
            agentId: agent.id,
            userId,
            status: "RUNNING",
            input: { message },
            startedAt: new Date(),
            modelUsed: env.OPENAI_CHAT_MODEL
          }
        })
      : null;

    const client = getOpenAIClient();
    if (!client) {
      const output = await createFallbackResponse(message);
      await finishRun(run?.id, output);
      return NextResponse.json(output);
    }

    const tools = createTixoraTools(userId);
    const toolByName = new Map<string, (typeof tools)[number]>(tools.map((item) => [item.name, item]));
    const messages: Array<Record<string, unknown>> = [
      {
        role: "system",
        content:
          "You are Tixora's AI ticket agent. Use tools for live event, seat, and ticket data. Answer in the user's language when clear. Never claim a seat is reserved unless a backend tool confirms it."
      },
      { role: "user", content: message }
    ];

    const first = await client.chat.completions
      .create({
        model: env.OPENAI_CHAT_MODEL,
        messages: messages as never,
        tools: openAiTools,
        tool_choice: "auto"
      })
      .catch(async (error) => {
        console.warn("[openai:chat] falling back to free mode", error);
        return null;
      });

    if (!first) {
      const output = await createFallbackResponse(message);
      await finishRun(run?.id, output);
      return NextResponse.json(output);
    }

    const assistantMessage = first.choices[0]?.message;
    messages.push(assistantMessage as never);

    const toolCalls = assistantMessage?.tool_calls ?? [];
    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      const functionCall = call as {
        id: string;
        function: { name: string; arguments: string };
      };
      const name = functionCall.function.name;
      const tool = toolByName.get(name);
      const args = JSON.parse(functionCall.function.arguments || "{}");
      const output = tool
        ? await (tool.invoke as (input: unknown) => Promise<unknown>)(args)
        : JSON.stringify({ error: `Unknown tool: ${name}` });

      messages.push({
        role: "tool",
        tool_call_id: functionCall.id,
        content: typeof output === "string" ? output : JSON.stringify(output)
      });

      if (run) {
        await prisma.aiAgentToolCall.create({
          data: {
            runId: run.id,
            toolName: name,
            status: tool ? "SUCCEEDED" : "FAILED",
            input: args,
            output: typeof output === "string" ? { value: output } : (output as object)
          }
        });
      }
    }

    const final = toolCalls.length
      ? await client.chat.completions
          .create({
            model: env.OPENAI_CHAT_MODEL,
            messages: messages as never
          })
          .catch(async (error) => {
            console.warn("[openai:chat-final] falling back to free mode", error);
            return null;
          })
      : first;

    if (!final) {
      const output = await createFallbackResponse(message);
      await finishRun(run?.id, output);
      return NextResponse.json(output);
    }

    const answer = final.choices[0]?.message?.content ?? "I could not generate a response.";
    const output = {
      answer,
      provider: "openai",
      model: env.OPENAI_CHAT_MODEL
    };

    if (run) {
      await prisma.aiAgentRun.update({
        where: { id: run.id },
        data: {
          status: "COMPLETED",
          output,
          tokensIn: final.usage?.prompt_tokens,
          tokensOut: final.usage?.completion_tokens,
          completedAt: new Date()
        }
      });
    }

    return NextResponse.json(output);
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid AI message." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI agent failed." },
      { status: 400 }
    );
  }
}
