import { NextResponse } from 'next/server';
import { composio } from '@/lib/composio';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  console.log('[CALLBACK API] Starting callback handler...');
  try {
    const { searchParams } = new URL(request.url);
    console.log('[CALLBACK API] Query params:', Object.fromEntries(searchParams.entries()));
    
    const cookieStore = await cookies();
    const userId = cookieStore.get('composio_user_id')?.value;
    console.log('[CALLBACK API] User ID from cookie:', userId ? 'present' : 'missing');

    // Composio redirects with: ?status=success&connectedAccountId=ca_xxx&appName=googlecalendar
    const status = searchParams.get('status');
    const connectedAccountId = searchParams.get('connectedAccountId');
    console.log('[CALLBACK API] Status:', status, 'ConnectedAccountId:', connectedAccountId);

    // Check if we have the connected account ID directly from the URL
    if (status === 'success' && connectedAccountId) {
      console.log('[CALLBACK API] Success! Storing connection ID:', connectedAccountId);
      // Composio directly gives us the connected account ID - perfect!
      cookieStore.set('composio_connection_id', connectedAccountId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax'
      });

      // Clean up connection request cookie
      cookieStore.delete('composio_connection_request_id');
      console.log('[CALLBACK API] Cookies set, redirecting to /fixed');

      // Redirect back to fixed page
      return NextResponse.redirect(new URL('/fixed?type=future&connected=true', request.url));
    }

    // Fallback: Try to get connection_request_id from URL (old method)
    const connectionRequestId = searchParams.get('connection_request_id') || searchParams.get('id');
    console.log('[CALLBACK API] Connection request ID:', connectionRequestId);
    
    if (connectionRequestId && userId) {
      console.log('[CALLBACK API] Fetching connection request status...');
      // Get connection request status
      const connectionRequest = await composio.connectedAccounts.get(connectionRequestId);
      console.log('[CALLBACK API] Connection request status:', connectionRequest.status);

      // Check if connection is active
      if (connectionRequest.status === 'ACTIVE') {
        // Get the connected account ID
        const accountId = (connectionRequest as any).connectedAccountId || (connectionRequest as any).id;
        console.log('[CALLBACK API] Account ID:', accountId);
        if (accountId) {
          const connectedAccount = await composio.connectedAccounts.get(accountId);
          console.log('[CALLBACK API] Connected account retrieved:', connectedAccount.id);

          cookieStore.set('composio_connection_id', connectedAccount.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: 'lax'
          });

          cookieStore.delete('composio_connection_request_id');
          console.log('[CALLBACK API] Cookies set, redirecting to /fixed');
          return NextResponse.redirect(new URL('/fixed?type=future&connected=true', request.url));
        }
      }
    }

    // If we get here, something went wrong
    console.log('[CALLBACK API] Error: Missing required parameters');
    if (!userId) {
      return NextResponse.redirect(new URL('/fixed?type=future&error=missing_user', request.url));
    }

    return NextResponse.redirect(new URL('/fixed?type=future&error=not_connected', request.url));
  } catch (error: any) {
    console.error('[CALLBACK API] Error:', error);
    console.error('[CALLBACK API] Error stack:', error.stack);
    console.error('[CALLBACK API] Error message:', error.message);
    return NextResponse.redirect(new URL('/fixed?type=future&error=callback_failed', request.url));
  }
}

