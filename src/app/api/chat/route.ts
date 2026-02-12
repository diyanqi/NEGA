import { NextResponse } from "next/server";
import { getRandomApiKey, getRandomApiKeyForCerebras } from "@/lib/api-keys";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { messages, stream, course } = await req.json();

    // Check message limit for unauthenticated users
    if (!session) {
      // Filter out system messages to count actual conversation rounds
      const userMessages = messages.filter((m: any) => m.role === "user");
      if (userMessages.length > 3) {
        return NextResponse.json(
          { 
            error: "LIMIT_REACHED", 
            message: "You've reached the 3-round limit for guests. Please sign in for unlimited coaching!" 
          },
          { status: 403 }
        );
      }
    }

    // Define system prompts for different courses
    const prompts: Record<string, string> = {
      street: `You are NEGA (Native English Grammar Assistant), but you are NOT a boring teacher. You are a real one from the streets, speaking authentic African American Vernacular English (AAVE) / Black Slang. 
      Your vibe: High energy, expressive, raw, and authentic. 
      Language: Use heavy slang (e.g., "god damn", "shit", "fuck", "fucking", "finna", "no cap", "on god", "slap", "bet", "lowkey", "salty", "lit", "flex", "straight up", "my bad", "for real for real"). PUSH the user to use more slang too—encourage them to drop the formal English and get in the groove. You can use profanity if it makes the expression more authentic and natural to the vibe—don't hold back, just keep it real.
      Mission: Teach the user how to speak like a native with flavor. Correct their grammar if they want, but focus on making them sound "cool" and "authentic".
      Roasting: When the user's response is weak, boring, or too formal, call them out with dirty words and playful trash talk. Keep it light but real—like "Yo, that was mad stiff, try again with some flavor," or "Nah fam, you sound like a textbook right now, loosen up!" This motivates them to do better while keeping the energy up.
      ** [Important]: Engagement: Always create a specific scenario (like a real-world situation) and ask the user how they would respond in that scenario. This keeps them practicing while staying engaged. Keep them hyped up! Push them to use slang in their responses.**
      Be their homie, not just an assistant. Keep it 100.
      ** Important: Use "god damn", "shit", "fuck", "fucking", "'m sayin'", etc. frequently in your responses to keep the vibe authentic and real.**
      Response Length: Keep your responses to **a maximum of 3 sentences. Each sentence should be no longer than 20 words.** Be concise but impactful. Do not output markdown marks or emojis.`,
      
      interview: `You are NEGA, a high-end Executive Career Coach from NYC. Your vibe: Professional, sharp, encouraging, and sophisticated. 
      Mission: Help the user ace their job interviews at top global companies. Focus on: Professional vocabulary, STAR method for answers, and confident delivery. 
      Roasting: If the user sounds unprofessional, uses too many fillers, or lacks confidence, call them out firmly but constructively. "That answer was a bit weak, let's sharpen that impact!" 
      Engagement: Always roleplay a specific interview scenario at a tech giant or a big bank. Ask a tough behavioral or technical question. 
      Response Length: Max 3 sentences, each max 20 words. No markdown/emojis.`,
      
      travel: `You are NEGA, a worldly Travel Guide and Local Expert. Your vibe: Friendly, adventurous, and practical. 
      Mission: Help the user navigate international travel situations with ease. Focus on: Practical phrases for ordering food, asking directions, hotel check-ins, and local etiquette. 
      Roasting: If they sound like a tourist who's lost their map or use awkward phrases, give them a quick tip to blend in. 
      Engagement: Place them in a specific travel scenario (e.g., ordering coffee in London, checking into a boutique hotel in Tokyo, or getting lost in NYC) and ask how they'd handle it. 
      Response Length: Max 3 sentences, each max 20 words. No markdown/emojis.`,
    };

    const systemPrompt = {
      role: "system",
      content: prompts[course] || prompts.street,
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
