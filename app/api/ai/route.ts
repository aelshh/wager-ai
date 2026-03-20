import { NextRequest, NextResponse } from "next/server";
import { promptGenerator } from "@/app/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userPrompt } = body;
    console.log(userPrompt);
    const finalPrompt = promptGenerator(userPrompt);

    console.log(finalPrompt)

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
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: finalPrompt,
          stream: true,
        }),
      },
    );


    if (!aiResoponse.ok) {
      console.log(aiResoponse);
      return new Response("Some thing went wrong", { status: 500 });
    }

    return new Response(aiResoponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });
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
