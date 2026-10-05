# Mended

Milestones 1–2: photograph one jewelry piece, identify item information and visible damage, then review and correct repair services. Prices come in milestone 3.

## Run locally

```sh
npm ci
npx convex dev --once
npm run dev
```

`OPENAI_API_KEY` must be set in the Convex dashboard for development and
production. It is never included in the web page. Local `.env.local` contains
only deployment configuration and the public `VITE_CONVEX_URL` backend address.

## Check on a phone

```sh
npm run preview:phone
```

Open https://cool-hawk-741.convex.site on your phone. This is the development
preview. Take at least three photos of the same piece (whole piece, hallmark
close-up, another angle), mark the hallmark photo, and tap **Identify item**.
Check all fields, choose purity if the hallmark was unreadable, then tap
**Confirm item and services**. Use **Choose photos** if camera preview is
unavailable. Unknown values are allowed.

Photos are converted to JPEG and resized to at most 1024 pixels on the longest
side on the phone. Each request accepts 3–6 photos, including one designated
hallmark image. Convex validates image size, format, count and hallmark
designation before calling OpenAI. Readable hallmark evidence is required for
AI purity; the associate can select a confirmed purity manually.

The Convex action uses GPT-6.1 Sol with medium reasoning, a 500 output-token
limit, no automatic retries, and a global Convex rate limit of 100 requests per
hour. Provider failures and exhausted limits show the configured busy message.
The owner manages the $200 monthly provider limit in OpenAI.

This milestone handles one piece per analysis. Details and images last only
until the page reloads or another piece starts; durable ticket storage belongs
to a later milestone. No customer information, prices, tickets,
signatures, login, or POS integration are included here. No AI threads or
messages are saved.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

For a live check against development, use a non-sensitive JPEG resized to
1024 pixels: `node scripts/check-item-analysis.mjs /path/to/test-photo.jpg`.
This sends one AI request and also verifies the server rejects missing photos
and hallmark selection. The test image is never stored in the repository.

## Publish after milestone approval

```sh
npm run deploy
```

This builds the page, deploys the Convex backend, and uploads the page to
https://valuable-weasel-522.convex.site. Pushing to GitHub saves code; it does
not deploy. Follow AGENTS.md for the approval, commit, push and deploy order.

## Damage and service review

The Services card distinguishes visible damage, no damage visible in the supplied
photos, and views too unclear to assess. AI suggestions cite their numbered evidence
photo. Associates can edit damage text and search catalog services, add a service manually, or
remove a suggestion. Close-up photos are optional; manual entry works using the
original three photos. New photos recheck damage while preserving corrected item
information and manual repair entries. Item identification and damage assessment
use two separate AI calls, sharing the global 100 calls/hour budget.

Confirmation checks manual entries in Convex (up to 12 services, 160 characters
per damage description and a valid catalog service code). A failed AI call still permits manual
review. Reviewed details remain temporary until the storage milestone.

Service choices come from all 93 codes in `references/Jewelry_Repair_Price_Catalog.xlsx`, extracted into `shared/repair-catalog.js`. Searches match code, name, and category. Damage and service appear in two columns. AI never invents a service or assumes measurements needed to choose a variant. An unselected service requires associate selection before confirmation. Typical USD base prices use the confirmed 14K, 18K, 22K, 24K, or platinum selection. Blank 24K entries stay unavailable; additional units and add-ons remain for milestone 3.

Damage detection and catalog matching run in separate Convex AI calls. The detector receives photos and a short inspection instruction, with no catalog or prices. The matcher receives only the completed text findings and catalog. A missing match or matcher failure preserves every damage with an unselected service. Both calls use GPT-6.1-Sol at medium thinking, a 500-token output cap each, and the shared 100-calls/hour limit.

## Milestone 3 preview

Review Estimate now has editable service prices, optional additional fees per service, confirmed catalog rush/re-rhodium fees, and a USD total calculated in Convex. There are no quantities. Missing prices or services keep the estimate incomplete; zero is accepted only as a known catalog price or an explicit associate price. Invalid or negative charges cannot be confirmed. Estimates remain temporary until the persistence milestone.
