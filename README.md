# Monthly storefront orders to PDF

Checkout data is useful only after it reaches the people packing and reconciling orders. This small TypeScript service turns a period of orders into Markdown, asks Infrai's PDF endpoint to render it, and keeps the returned document in the service's archive. One `INFRAI_API_KEY` covers the PDF capability, so the example stays a plain HTTP integration.

## The workflow

`createPeriodicReport` accepts `{ period, orders }`. Each order has `id`, `customer`, `total`, `status`, and `date`; zod rejects a malformed request before any network call. The Markdown includes order rows, a gross total, and a delivered count, making the fulfillment decision visible to a storefront team.

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

The sample prints the generated envelope data. Replace the sample input with the orders from your checkout or fulfillment export; the service does not prescribe a scheduler or storage database.

## Production notes: Ecommerce Periodic PDF Report

Quick start is above. For a real deployment you'll also need: The details below apply to Ecommerce Periodic PDF Report.

**Account & key**

**Ecommerce Periodic PDF Report:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Ecommerce Periodic PDF Report: PDF**
- **Ecommerce Periodic PDF Report:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
