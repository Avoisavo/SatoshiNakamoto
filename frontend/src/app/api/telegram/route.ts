import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken, chatId, message } = body;

    if (!botToken || !chatId || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: botToken, chatId, or message' 
        },
        { status: 400 }
      );
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // Enable HTML formatting for bold, code, etc.
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({
        success: true,
        messageId: data.result?.message_id,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.description || 'Failed to send message',
        errorCode: data.error_code,
      }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Error in Telegram API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

