import { NextResponse } from "next/server";
import { getScoreLevel, MAX_SCORE } from "@/lib/quiz-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, url, answers, score } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Campi obbligatori mancanti" },
        { status: 400 }
      );
    }

    const { level, message } = getScoreLevel(score);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Performance Flows <noreply@performanceflows.com>",
          to: "alex@performanceflows.com",
          subject: `Quiz Shopify completato - ${name} (${score}/${MAX_SCORE})`,
          html: `
            <h2>Nuovo quiz completato</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nome</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${name}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefono</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${phone}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>URL Store</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${url || "Non fornito"}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Punteggio</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${score}/${MAX_SCORE}</strong> — ${level}</td></tr>
            </table>
            <br/>
            <p><strong>Risposte:</strong> ${JSON.stringify(answers)}</p>
            <p><strong>Valutazione:</strong> ${message}</p>
          `,
        }),
      });
    } else {
      console.log("Quiz submission:", { name, email, phone, url, score, level });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
