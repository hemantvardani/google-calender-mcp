import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Delete all Composio-related cookies
    cookieStore.delete('composio_user_id');
    cookieStore.delete('composio_connection_id');
    cookieStore.delete('composio_connection_request_id');
    
    return NextResponse.json({ 
      success: true,
      message: 'All cookies cleared successfully' 
    });
  } catch (error: any) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear cookies' },
      { status: 500 }
    );
  }
}

