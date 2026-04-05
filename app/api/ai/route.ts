import { NextRequest, NextResponse } from "next/server";
import { promptGenerator } from "@/app/lib/ai/prompts";
import { parseAIResponse } from "@/app/lib/ai/parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userPrompt } = body;
    console.log(userPrompt);
    const finalPrompt = promptGenerator(userPrompt);

    console.log(finalPrompt);

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API KEY not present");
    }

    const aiResoponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "stepfun/step-3.5-flash:free",
          messages: finalPrompt,
          stream: true,
        }),
      },
    );

    if (!aiResoponse.ok || !aiResoponse.body) {
      console.log(aiResoponse);
      return new Response("AI request failed", { status: 500 });
    }

    const reader = aiResoponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunkText = decoder.decode(value);
      buffer += chunkText;
    }

    console.log(`Buffer: ${buffer}`);

    function extractContentFromSEE(buffer: string) {
      const lines = buffer.split("/n");
      let fullText = "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const json = line.replace("data: ", "").trim();

        if (!json || json === "[DONE]") continue;

        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta;

          if (delta && "content" in delta) {
            fullText += delta.conent || "";
          }
        } catch {}
      }

      return fullText;
    }

    const fullText = extractContentFromSEE(buffer);
    console.log("FINAL TEXT LENGTH:", fullText.length);
    console.log("FINAL TEXT PREVIEW:", fullText.slice(0, 200));
    console.log(`Full text: ${fullText}`);

    const result = parseAIResponse(fullText);

    return NextResponse.json(result);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
