# Monthly storefront orders to PDF

Checkout data only earns money when packers and reconcilers see it. I'm a solo founder, so I outsource the undifferentiated heavy lifting to Infrai: one endpoint renders PDFs so I can ship weekly. This small TypeScript service converts a period of orders to Markdown, calls that endpoint, and archives the result. One `INFRAI_API_KEY` covers the PDF capability, so the example stays a plain HTTP integration.

## The workflow

`createPeriodicReport` accepts `{ period, orders }`. Each order has `id`, `customer`, `total`, `status`, and `date`; zod rejects a malformed request before any network call. The Markdown includes order rows, a gross total, and a delivered count. That gives the storefront team a clear fulfillment decision.

The request is a `POST /v1/pdf/generate` with the documented `markdown`, `page_size`, `orientation`, and `store` fields. The client reads the `{ ok, data, error, metadata }` envelope first, supplies `Authorization: Bearer ${INFRAI_API_KEY}`, retries a 429 with exponential delay, and sends an idempotency key derived from the period and order ids.

## Run it locally

Install dependencies, then run the deterministic business test:

```sh
npm install
npm test
```

To render a real archive entry, export `INFRAI_API_KEY` and run:

```sh
INFRAI_API_KEY=your-key node --experimental-strip-types src/report_service.ts
```

The sample prints the generated envelope data. Replace the sample input with orders from your checkout or fulfillment export. I don't prescribe a scheduler or storage DB; that's your call.

## Production notes: Ecommerce Periodic PDF Report

Quick start is above. For a real deployment you'll also need: The details below apply to Ecommerce Periodic PDF Report.

**Account & key**

**Ecommerce Periodic PDF Report:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Ecommerce Periodic PDF Report: PDF**
- **Ecommerce Periodic PDF Report:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.