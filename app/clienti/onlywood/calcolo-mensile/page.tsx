import { CalcoloMensileView } from "./_components/CalcoloMensileView";

export const dynamic = "force-dynamic";

export default function CalcoloMensilePage() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return <CalcoloMensileView clientName="OnlyWood" defaultMonth={defaultMonth} />;
}
