import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function GET(){
    try{
        const cookieStore = await cookies();
        const userId = cookieStore.get('composio_user_id')?.value;
        const connectionId = cookieStore.get('composio_connection_id')?.value;

        console.log('[BOOKINGS API] Cookies:', { 
            userId: userId ? 'it is present' : 'it is missing', 
            connectionId: connectionId ? 'it is present' : 'it is missing' 
        });

        if (!userId || !connectionId) {
            console.log('[BOOKINGS API] Missing userId or connectionId');
            return NextResponse.json(
            { status:false, error: 'Not connected. Please connect your Google Calendar first.' },
            { status: 401 }
            );
        }
        return NextResponse.json(
            { status: true},
            { status: 200 }
            );

    }catch{
         
        return NextResponse.json(
        { status:false, error: 'Something went wrong.' },
        { status: 503 }
        );
        
    }
}