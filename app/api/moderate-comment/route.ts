import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { content } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ ok: false, reason: "Invalid input" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [
        {
          role: "user",
          content: `以下のコメントが不適切かどうか判定してください。
不適切な内容: 誹謗中傷、差別的発言、スパム、個人情報、性的内容、暴力的内容、宣伝目的のURL羅列。
コメント: 「${content}」

不適切なら "NG: 理由を20字以内で"、問題なければ "OK" とだけ答えてください。`,
        },
      ],
    });

    const result = (message.content[0] as { type: string; text: string }).text.trim();
    if (result.startsWith("NG")) {
      const reason = result.replace(/^NG[:\s]*/, "").trim() || "不適切なコメントです";
      return NextResponse.json({ ok: false, reason });
    }
    return NextResponse.json({ ok: true });
  } catch {
    // APIエラー時は通過させる（フォールバック）
    return NextResponse.json({ ok: true });
  }
}
