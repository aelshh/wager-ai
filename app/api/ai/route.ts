import { OpenRouter } from "@openrouter/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API KEY not present");
    }

    const aiResoponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "applicaton/json",
        },
        body: JSON.stringify({
          model: "stepfun/step-3.5-flash:free",
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      },
    );

    if (!aiResoponse.body) {
      return new Response("No stream", { status: 500 });
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
