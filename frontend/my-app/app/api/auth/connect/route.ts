import { NextResponse } from 'next/server';
import { composio, MCP_SERVER_CONFIG, getOrCreateMCPServer } from '@/lib/composio';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    // Generate a unique user ID for this session
    const userId = randomUUID();
    
    // Get or create MCP server (reuse existing one)
    const server = await getOrCreateMCPServer();

    // Determine callback URL based on environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
                      ? process.env.NEXT_PUBLIC_APP_URL  // Replace with your production URL
                      : 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/auth/callback`;

    // Initiate OAuth connection with callback URL
    const connectionRequest = await composio.connectedAccounts.initiate(
      userId,
      MCP_SERVER_CONFIG.toolkits[0].authConfigId,
      {
        callbackUrl: callbackUrl
      }
    );

    const cookieStore = await cookies();
    
    // Store user_id in cookie for callback
    cookieStore.set('composio_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    });

    // Store connection request ID
    cookieStore.set('composio_connection_request_id', connectionRequest.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      sameSite: 'lax'
    });

    // Redirect user to OAuth URL
    return NextResponse.json({
      redirect_url: connectionRequest.redirectUrl,
      user_id: userId
    });
  } catch (error: any) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}

