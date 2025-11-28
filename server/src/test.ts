import 'dotenv/config';
import { MCPClient } from "@mastra/mcp";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";


// Use the MCP server URL you generated

export const client = new MCPClient({
id: "docs-mcp-client",
servers: {
composio: { 
  url: new URL(process.env.MCP_URL!)
},
}
});

export const agent = new Agent({
name: "Assistant",
description: "Helpful AI with MCP tools",
instructions: "Use the MCP tools to answer. Always use the current date when querying calendar events. Today's date is: " + new Date().toISOString().split('T')[0],
model: openai("gpt-4o"),
tools: await client.getTools()
});

(async () => {
const today = new Date();
const currentDate = today.toISOString().split('T')[0];
const query = `What meetings do I have this week? Today is ${currentDate}. Please fetch events from the current week.`;
const res = await agent.generate(query);
console.log(res.text);
})();