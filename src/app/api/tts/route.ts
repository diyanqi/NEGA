import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const endpoint = process.env.TTS_ENDPOINT || 'https://nega-tts.amzcd.top/v1/audio/speech';
    const apiKey = process.env.TTS_API_KEY || 'rXdgQXjGPFPWt6WMUPrb';

    console.debug(`TTS Request: endpoint=${endpoint}, text="${text.slice(0, 50)}..."`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        input: text,
        voice: voice || 'alloy',
        response_format: 'mp3',
        speed: 1.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS Provider Error:', errorText);
      return NextResponse.json({ error: `TTS Provider failed: ${response.statusText}`, details: errorText }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('TTS Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
