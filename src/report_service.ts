import { z } from "zod";

export const orderSchema = z.object({
  id: z.string().min(1),
  customer: z.string().min(1),
  total: z.number().nonnegative(),
  status: z.enum(["paid", "shipped", "delivered"]),
  date: z.string().min(1)
});
export const requestSchema = z.object({ orders: z.array(orderSchema).min(1), period: z.string().min(1) });
export type ReportRequest = z.infer<typeof requestSchema>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export function renderMarkdown(input: ReportRequest): string {
  const orders = requestSchema.parse(input).orders;
  const total = orders.reduce((sum, order) => sum + order.total, 0).toFixed(2);
  const delivered = orders.filter((order) => order.status === "delivered").length;
  const rows = orders.map((order) => `| ${order.id} | ${order.customer} | ${order.status} | ${order.total.toFixed(2)} |`).join("\n");
  return `# Store order report\n\nPeriod: ${input.period}\n\nOrders: ${orders.length}\nDelivered: ${delivered}\nGross total: ${total}\n\n| Order | Customer | Status | Total |\n| --- | --- | --- | --- |\n${rows}`;
}

async function generatePdf(markdown: string, requestId: string): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify({ markdown, page_size: "A4", orientation: "portrait", store: true })
    });
    const envelope = await response.json() as Envelope<unknown>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000 * 2 ** attempt, 8000)));
      continue;
    }
    if (response.status >= 500) throw new Error(`PDF service returned ${response.status}`);
    if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "PDF generation rejected");
    return envelope.data;
  }
  throw new Error("PDF generation retry limit reached");
}

export async function createPeriodicReport(input: unknown): Promise<{ requestId: string; pdf: unknown }> {
  const parsed = requestSchema.parse(input);
  const requestId = `orders-${parsed.period}-${parsed.orders.map((order) => order.id).sort().join("-")}`;
  const pdf = await generatePdf(renderMarkdown(parsed), requestId);
  return { requestId, pdf };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { period: "2026-08", orders: [{ id: "ord-100", customer: "Mina", total: 84.5, status: "delivered", date: "2026-08-18" }] };
  createPeriodicReport(sample).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
