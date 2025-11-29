import { NextResponse } from 'next/server';
import { composio, getOrCreateMCPServer } from '@/lib/composio';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  console.log('[BOOKINGS API] Starting request...');
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'future' or 'past'
    const limit = parseInt(searchParams.get('limit') || '5');
    console.log('[BOOKINGS API] Params:', { type, limit });

    const cookieStore = await cookies();
    const userId = cookieStore.get('composio_user_id')?.value;
    const connectionId = cookieStore.get('composio_connection_id')?.value;
    console.log('[BOOKINGS API] Cookies:', { 
      userId: userId ? 'present' : 'missing', 
      connectionId: connectionId ? 'present' : 'missing' 
    });

    if (!userId || !connectionId) {
      console.log('[BOOKINGS API] Missing userId or connectionId');
      return NextResponse.json(
        { error: 'Not connected. Please connect your Google Calendar first.' },
        { status: 401 }
      );
    }

    console.log('[BOOKINGS API] Getting MCP server...');
    // Get or create MCP server (reuse existing one)
    const server = await getOrCreateMCPServer();
    console.log('[BOOKINGS API] MCP Server:', { id: server?.id, name: server?.name });
    
    if (!server || !server.id) {
      throw new Error('MCP server ID not found');
    }

    console.log('[BOOKINGS API] Using MCP instance for user:', userId);
    // Generate MCP instance for this user (this creates the connection)
    const instance = await composio.mcp.generate(userId, server.id);
    console.log('[BOOKINGS API] MCP Instance URL:', instance.url);

    // Calculate date range
    const now = new Date();
    const timeMin = type === 'past' 
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
      : now.toISOString();
    const timeMax = type === 'future'
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ahead
      : now.toISOString();

    console.log('[BOOKINGS API] Date range:', { timeMin, timeMax, type });

    // Use MCP instance URL to call the tool via JSON-RPC 2.0 protocol
    console.log('[BOOKINGS API] Executing MCP tool call with connectionId:', connectionId);
    
    // MCP uses JSON-RPC 2.0 format
    const mcpRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'GOOGLECALENDAR_EVENTS_LIST',
        arguments: {
          calendarId: 'primary',
          timeMin,
          timeMax,
          maxResults: limit,
          orderBy: 'startTime',
          singleEvents: true,
          connectedAccountId: connectionId
        }
      },
      id: 1
    };
    
    console.log('[BOOKINGS API] MCP Request:', JSON.stringify(mcpRequest, null, 2));
    
    const actionResponse = await fetch(instance.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream', // Required by MCP protocol
        'x-api-key': process.env.NEXT_PUBLIC_COMPOSIO_API_KEY || ''
      },
      body: JSON.stringify(mcpRequest)
    });

    console.log('[BOOKINGS API] Action API response status:', actionResponse.status);
    console.log('[BOOKINGS API] Response Content-Type:', actionResponse.headers.get('content-type'));

    if (!actionResponse.ok) {
      const errorText = await actionResponse.text();
      console.error('[BOOKINGS API] Action API failed:', errorText);
      throw new Error(`Action execution failed: ${actionResponse.statusText} - ${errorText}`);
    }

    // Check if response is SSE (text/event-stream) or JSON
    const contentType = actionResponse.headers.get('content-type') || '';
    let result: any;
    
    if (contentType.includes('text/event-stream')) {
      // Handle Server-Sent Events (SSE) format
      console.log('[BOOKINGS API] Response is SSE format, parsing stream...');
      const text = await actionResponse.text();
      console.log('[BOOKINGS API] SSE raw text (first 1000 chars):', text.substring(0, 1000));
      
      // Parse SSE format: "event: message\ndata: {...}\n\n"
      // SSE can have multiple data lines that need to be concatenated
      const lines = text.split('\n');
      const dataLines: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('data: ')) {
          dataLines.push(line.substring(6)); // Remove "data: " prefix
        }
      }
      
      // Combine all data lines (SSE allows multi-line JSON)
      let jsonData = dataLines.join('\n');
      
      if (!jsonData || jsonData.trim() === '') {
        // Try to find JSON in the text directly (fallback)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonData = jsonMatch[0];
        } else {
          console.error('[BOOKINGS API] No JSON found in SSE. Full text:', text);
          throw new Error('No JSON data found in SSE response');
        }
      }
      
      // Clean up the JSON (remove any trailing newlines/whitespace)
      jsonData = jsonData.trim();
      
      console.log('[BOOKINGS API] Extracted JSON (first 500 chars):', jsonData.substring(0, 500));
      
      try {
        result = JSON.parse(jsonData);
        console.log('[BOOKINGS API] Parsed SSE data successfully');
      } catch (e: any) {
        console.error('[BOOKINGS API] Failed to parse SSE JSON:', e);
        console.error('[BOOKINGS API] JSON data that failed:', jsonData);
        throw new Error(`Failed to parse SSE response: ${e.message}`);
      }
    } else {
      // Handle regular JSON response
      console.log('[BOOKINGS API] Response is JSON format');
      result = await actionResponse.json();
    }
    
    console.log('[BOOKINGS API] MCP response received:', { 
      hasResult: !!result,
      hasError: !!result.error,
      hasContent: !!result.result,
      keys: Object.keys(result || {})
    });

    // Handle MCP JSON-RPC 2.0 response format
    if (result.error) {
      console.error('[BOOKINGS API] MCP error:', result.error);
      throw new Error(`MCP error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    // MCP response format: result.result.content[0].text contains the data
    // or result.result might be the data directly
    let events: any[] = [];
    
    if (result.result) {
      // Check if result is in content format (MCP text response)
      if (result.result.content && Array.isArray(result.result.content)) {
        const contentText = result.result.content[0]?.text;
        if (contentText) {
          try {
            const parsed = JSON.parse(contentText);
            events = parsed.items || parsed.data?.items || [];
          } catch (e) {
            console.log('[BOOKINGS API] Content is not JSON, trying direct access');
            // If not JSON, might be direct data
            events = result.result.content;
          }
        }
      } else if (result.result.items) {
        events = result.result.items;
      } else if (result.result.data?.items) {
        events = result.result.data.items;
      } else if (Array.isArray(result.result)) {
        events = result.result;
      }
    } else if (result.data?.items) {
      events = result.data.items;
    } else if (result.items) {
      events = result.items;
    }
    
    console.log('[BOOKINGS API] Total events received:', events.length);
    
    const bookings = events
      .filter((event: any) => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date);
        return type === 'future' ? eventStart >= now : eventStart < now;
      })
      .slice(0, limit)
      .map((event: any) => ({
        id: event.id,
        title: event.summary || 'No Title',
        time: new Date(event.start?.dateTime || event.start?.date).toLocaleString(),
        duration: calculateDuration(event.start, event.end),
        attendees: event.attendees?.map((a: any) => a.email) || [],
        description: event.description || ''
      }))
      .sort((a: any, b: any) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);
        return type === 'future' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });

    console.log('[BOOKINGS API] Returning bookings:', bookings.length);
    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('[BOOKINGS API] Error:', error);
    console.error('[BOOKINGS API] Error stack:', error.stack);
    console.error('[BOOKINGS API] Error message:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings', details: error.toString() },
      { status: 500 }
    );
  }
}

function calculateDuration(start: any, end: any): string {
  if (!start || !end) return 'Unknown';
  const startTime = new Date(start.dateTime || start.date);
  const endTime = new Date(end.dateTime || end.date);
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min${mins > 1 ? 's' : ''}` : ''}`;
  }
  return `${mins} min${mins !== 1 ? 's' : ''}`;
}

