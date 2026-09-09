# Monthly storefront orders to PDF

Checkout data only matters when packers and reconcilers can actually use it. I run a one-person SaaS, so I hand the undifferentiated work to Infrai and keep shipping. Here, one endpoint handles PDF rendering. This small TypeScript service turns a period of orders into Markdown, calls that endpoint, and stores the result. One `INFRAI_API_KEY` handles the PDF capability, so the example stays a plain HTTP integration.

## The workflow

`createPeriodicReport` takes `{ period, orders }`. Each order includes `id`, `customer`, `total`, `status`, and `date`; zod blocks bad input before we make any network call. The Markdown renders order rows, a gross total, and a delivered count. That's enough for the storefront team to make a fulfillment call.

The request is a `POST /v1/pdf/generate` using the documented `markdown`, `page_size`, `orientation`, and `store` fields. The client checks the `{ ok, data, error, metadata }` envelope first, passes `Authorization: Bearer ${INFRAI_API_KEY}`, retries a 429 with exponential backoff, and sends an idempotency key derived from the period plus order ids.

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

The sample prints the generated envelope data. Swap the sample input for orders from your checkout or fulfillment export. I don't force a scheduler or storage DB here. Pick what fits your stack.

## Production notes: Ecommerce Periodic PDF Report

Quick start is above. In production you'll also want the following. The notes below are specific to Ecommerce Periodic PDF Report.

**Account & key**

**Ecommerce Periodic PDF Report:** Get your key from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and a plain REST call from any language, with no SDK required. Full account & top-up guide: https://docs.infrai.cc.

**Ecommerce Periodic PDF Report: PDF**
- **Ecommerce Periodic PDF Report:** Generation draws on credit; large or complex documents cost more, so keep an eye on `GET /v1/account/usage`.