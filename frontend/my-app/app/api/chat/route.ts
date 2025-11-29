import {  } from '@/lib/calender';
import { NextResponse } from 'next/server';

// For POST requests:
export async function POST(request: Request) {
  const body = await request.json();
  const {type,action,count,query} = body

//   await getChatCalenderData({type, action, count, query});
  return NextResponse.json({ data: body });
}

