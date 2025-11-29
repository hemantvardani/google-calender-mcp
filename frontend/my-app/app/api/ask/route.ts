import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { composio, getOrCreateMCPServer } from '@/lib/composio';
import { MCPClient } from "@mastra/mcp";
import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

// Cost calculation for GPT-4o-mini
// Input: $0.15 per 1M tokens, Output: $0.60 per 1M tokens
const MAX_COST = 0.30; // $0.30 limit
const INPUT_COST_PER_TOKEN = 0.15 / 1_000_000; // $0.15 per 1M tokens
const OUTPUT_COST_PER_TOKEN = 0.60 / 1_000_000; // $0.60 per 1M tokens

function calculateCost(promptTokens: number, completionTokens: number): number {
  return (promptTokens * INPUT_COST_PER_TOKEN) + (completionTokens * OUTPUT_COST_PER_TOKEN);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, apiKey } = body;

    if (!question || question.trim() === '') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }

    console.log('[ASK API] Processing question:', question);

    // Check connection status
    const cookieStore = await cookies();
    const userId = cookieStore.get('composio_user_id')?.value;
    const connectionId = cookieStore.get('composio_connection_id')?.value;

    if (!userId || !connectionId) {
      return NextResponse.json(
        { error: 'Not connected. Please connect your Google Calendar first.' },
        { status: 401 }
      );
    }

    // Get or create MCP server
    const server = await getOrCreateMCPServer();
    if (!server || !server.id) {
      throw new Error('MCP server ID not found');
    }

    // Generate MCP instance for this user
    const instance = await composio.mcp.generate(userId, server.id);
    console.log('[ASK API] MCP Instance URL:', instance.url);

    // Add API key to MCP URL for authentication
    const mcpUrl = new URL(instance.url);
    mcpUrl.searchParams.set('api_key', process.env.NEXT_PUBLIC_COMPOSIO_API_KEY || '');

    // Create MCP client connected to Composio MCP instance
    const mcpClient = new MCPClient({
      id: "ask-mcp-client",
      servers: {
        composio: {
          url: mcpUrl
        }
      }
    });

    // Get tools from the MCP client
    const tools = await mcpClient.getTools();
    // console.log('[ASK API] Available MCP tools:', tools.map((t: any) => t.name));

    // Create OpenAI provider with API key
    const openaiProvider = createOpenAI({ apiKey: apiKey });

    // Create agent with MCP tools
    const agent = new Agent({
      name: "Calendar Assistant",
      description: "AI assistant that can answer questions about your Google Calendar",
      instructions: `You are a helpful AI assistant that answers questions about the user's Google Calendar.
You have access to calendar tools that you can use to fetch events.
Always use the current date when querying calendar events. Today's date is: ${new Date().toISOString().split('T')[0]}.
When answering questions, be concise and helpful. If you don't have information, say so.`,
      model: openaiProvider("gpt-4o-mini"),
      tools: tools,
    });

    // Generate answer with cost tracking
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];
    const query = `${question} Today is ${currentDate}.`;

    console.log('[ASK API] Generating answer with agent...');
    const result = await agent.generate(query);

    // Calculate cost from usage
    const usage = result.usage;
    let totalCost = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    if (usage) {
      promptTokens = (usage as any).promptTokens || 0;
      completionTokens = (usage as any).completionTokens || 0;
      totalCost = calculateCost(promptTokens, completionTokens);
      
      console.log('[ASK API] Token usage:', {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: `$${totalCost.toFixed(4)}`
      });

      // Check if cost exceeds limit
      if (totalCost > MAX_COST) {
        console.warn('[ASK API] Cost limit exceeded:', totalCost);
        return NextResponse.json(
          { 
            error: `Request cost ($${totalCost.toFixed(4)}) exceeds maximum allowed cost ($${MAX_COST}). Please try a simpler question.`,
            cost: totalCost,
            tokens: { promptTokens, completionTokens }
          },
          { status: 400 }
        );
      }
    }

    const answer = result.text;
    
    if (!answer) {
      throw new Error('Failed to generate answer');
    }

    console.log('[ASK API] Answer generated successfully');

    return NextResponse.json({ 
      answer,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: totalCost
      }
    });
  } catch (error: any) {
    console.error('[ASK API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process question' },
      { status: 500 }
    );
  }
}
