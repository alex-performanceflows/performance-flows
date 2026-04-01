import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    await resend.emails.send({
      from: "Performance Flows <noreply@performanceflows.com>",
      to: "alex@performanceflows.com",
      subject: `Nuova richiesta consulenza — ${business}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a6e;">Nuova richiesta di consulenza</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold; width: 160px;">Nome</td>
              <td style="padding: 10px 12px; border: 1px solid #ddd;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Email</td>
              <td style="padding: 10px 12px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Attività</td>
              <td style="padding: 10px 12px; border: 1px solid #ddd;">${business}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Telefono</td>
              <td style="padding: 10px 12px; border: 1px solid #ddd;">${phone || "Non fornito"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Budget Ads</td>
              <td style="padding: 10px 12px; border: 1px solid #ddd;">${budget}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
