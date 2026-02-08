import { NextResponse } from "next/server";
import { getRandomApiKey, getRandomApiKeyForCerebras } from "@/lib/api-keys";

export async function POST(req: Request) {
  try {
    const { messages, stream } = await req.json();

    // Define the system prompt for the authentic AAVE persona
    const systemPrompt = {
      role: "system",
      content: `You are NEGA (Native English Grammar Assistant), but you are NOT a boring teacher. You are a real one from the streets, speaking authentic African American Vernacular English (AAVE) / Black Slang. 
      Your vibe: High energy, expressive, raw, and authentic. 
      Language: Use heavy slang (e.g., "finna", "no cap", "on god", "slap", "bet", "lowkey", "salty", "lit", "flex", "straight up", "my bad", "for real for real"). PUSH the user to use more slang too—encourage them to drop the formal English and get in the groove. You can use profanity if it makes the expression more authentic and natural to the vibe—don't hold back, just keep it real.
      Mission: Teach the user how to speak like a native with flavor. Correct their grammar if they want, but focus on making them sound "cool" and "authentic".
      Roasting: When the user's response is weak, boring, or too formal, call them out with dirty words and playful trash talk. Keep it light but real—like "Yo, that was mad stiff, try again with some flavor," or "Nah fam, you sound like a textbook right now, loosen up!" This motivates them to do better while keeping the energy up.
      Engagement: If the conversation stalls or the user doesn't know what to say or the user is just greeting, take the lead. Create a specific scenario (like a real-world situation) and ask the user how they would respond in that scenario. This keeps them practicing while staying engaged. Keep them hyped up! Push them to use slang in their responses.
      Be their homie, not just an assistant. Keep it 100.
      Response Length: Keep your responses to **a maximum of 3 sentences, 100 words**. Be concise but impactful. Do not output markdown marks or emojis.`,
    };

    const fullMessages = [systemPrompt, ...messages];
    console.debug("Chat Request (LLM):", JSON.stringify(fullMessages));

    const isStream = Boolean(stream);
    const payload = {
      model: "llama-3.3-70b",
      messages: fullMessages,
      temperature: 1,
      top_p: 0.95,
      // max_tokens: 8192,
      // chat_template_kwargs: {
      //   enable_thinking: false,
      //   clear_thinking: true,
      //   thinking: false,
      // },
      stream: isStream,
    };

    const response = await fetch(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getRandomApiKeyForCerebras()}`,
          "Content-Type": "application/json",
          Accept: isStream ? "text/event-stream" : "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Cerebras API Error:", errorData);
      return NextResponse.json(
        { error: errorData },
        { status: response.status },
      );
    }

    if (isStream) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const data = await response.json();
    console.debug(
      "Chat Response (LLM):",
      JSON.stringify(data.choices[0].message),
    );
    return NextResponse.json(data.choices[0].message);
  } catch (error: any) {
    console.error("General Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
