import { Composio } from '@composio/core';

// Initialize Composio client
export const composio = new Composio({
  apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY!
});

// Your MCP server configuration
export const MCP_SERVER_CONFIG = {
  name: "mcp-config-vz3f8k",
  toolkits: [
    {
      authConfigId: "ac_RcsHI2HowIs0", // Your Google Calendar auth config ID
      toolkit: "googlecalendar"
    }
  ],
  allowedTools: ["GOOGLECALENDAR_EVENTS_LIST"]
};

// Helper function to get or create MCP server (reuse existing server)
export async function getOrCreateMCPServer() {
  try {
    // Try to create server (will fail if already exists)
    const server = await composio.mcp.create(MCP_SERVER_CONFIG.name, {
      toolkits: MCP_SERVER_CONFIG.toolkits,
      allowedTools: MCP_SERVER_CONFIG.allowedTools
    });
    return server;
  } catch (error: any) {
    // Server already exists, find and return it
    if (error.message?.includes('already exists') || error.status === 400 || error.code === 1142) {
      try {
        // List MCP servers with required parameters, filter by name
        const serversResponse = await composio.mcp.list({
          limit: 100,
          page: 1,
          toolkits: [],
          authConfigs: [],
          name: MCP_SERVER_CONFIG.name // Filter by name directly
        });
        
        // Access the items array from the response
        if (serversResponse.items && serversResponse.items.length > 0) {
          const existingServer = serversResponse.items.find((s: any) => s.name === MCP_SERVER_CONFIG.name);
          if (existingServer) {
            return existingServer;
          }
        }
        
        // If not found by name filter, search all items
        if (serversResponse.items) {
          const existingServer = serversResponse.items.find((s: any) => s.name === MCP_SERVER_CONFIG.name);
          if (existingServer) {
            return existingServer;
          }
        }
        
        // If still not found, throw error
        throw new Error('MCP server not found in list');
      } catch (listError: any) {
        // If listing fails, log and provide helpful error
        console.error('Failed to list MCP servers:', listError);
        console.error('Original create error:', error);
        // Return a more helpful error message
        throw new Error(`MCP server "${MCP_SERVER_CONFIG.name}" already exists but could not be retrieved. Error: ${listError.message || 'Unknown error'}`);
      }
    }
    // If it's a different error, rethrow it
    throw error;
  }
}

