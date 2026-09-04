import assert from "node:assert/strict";
import { renderMarkdown } from "./report_service.ts";

const markdown = renderMarkdown({ period: "2026-08", orders: [
  { id: "a", customer: "Lee", total: 12, status: "delivered", date: "2026-08-01" },
  { id: "b", customer: "Jo", total: 8.5, status: "shipped", date: "2026-08-02" }
] });
assert.match(markdown, /Delivered: 1/);
assert.match(markdown, /Gross total: 20\.50/);
console.log("report decision test passed");
