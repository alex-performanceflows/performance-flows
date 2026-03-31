import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, business, phone, budget } = body;

    if (!name || !email || !business || !budget) {
      return NextResponse.json(
        { error: "Campi obbligatori mancanti" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email non valida" },
        { status: 400 }
      );
    }

    // Send email via Resend (configure RESEND_API_KEY in env)
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
          subject: `Nuova richiesta consulenza - ${business}`,
          html: `
            <h2>Nuova richiesta di consulenza</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nome</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${name}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Attività</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${business}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefono</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${phone || "Non fornito"}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Budget Ads</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${budget}</td></tr>
            </table>
          `,
        }),
      });
    } else {
      // Log to console in development
      console.log("New contact form submission:", body);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
