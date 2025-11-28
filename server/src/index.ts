import 'dotenv/config';
import { Composio } from '@composio/core';

// Initialize Composio
const composio = new Composio({
apiKey: process.env.COMPOSIO_API_KEY!
});

// Create MCP server with multiple toolkits
const server = await composio.mcp.create("calender-mcp", {  // Pick a unique name for your MCP server
    toolkits: [
    {
      authConfigId: "mcp-config-c2irx8", // Your Google Calendar auth config ID
      toolkit: "googlecalendar"
    }
    ],
    allowedTools: ["GOOGLECALENDAR_EVENTS_LIST"]
    });

console.log(`Server created: ${server.id}`);


const instance = await composio.mcp.generate("user-73840", server.id);  // Use the user ID for which you created the connected account
console.log("MCP Server URL:", instance.url);




// https://backend.composio.dev/v3/mcp/434967a0-f4a3-45cc-8545-20e5501a439d/mcp?user_id=pg-test-e6645e49-2503-4eb0-8efe-0d1c17557456
// ak_y1wZoimmH87OBZPaUhxT


