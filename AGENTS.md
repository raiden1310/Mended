# AGENTS.md

## 1. How the product works
Interface: a web page on the associate’s phone and the one thing they do there: take pictures of jewelry pieces to generate estimates
Business logic: AI analyzes the images, determines the item information (item type, metal(s) type, metal purity), identifies damages, assesses repair services needed, and provides estimates from a price list
Database: Tickets, Customer, Price List, Images
Third party: OpenAI
Not in v1: Login, permissions, full price list, POS integration

When I report a bug, I'll name the part. Look there first, and tell me if you think I named the wrong one.

## 2. How we work
- Read IDEA_SCOPE.md, PRODUCT.md, PLAN.md and PROGRESS.md before anything else, and DESIGN.md before any screen work.
- Before writing code, tell me in two or three sentences what you think I'm after, then your plan. Wait for my yes. Don't guess.
- One milestone at a time: the next one in PLAN.md, working end to end. Nothing outside it.
- If I ask for something new mid-milestone, add it to the parked list in PLAN.md and carry on.
- Never say "done" until you've seen it work (a test, or a screenshot at phone width) and told me how to check it on my phone.
- When I report a bug, find the cause before changing anything. Fix only that.
- After I confirm a milestone works: commit, push, and add one line to PROGRESS.md.
- Never put a key or password in code, in a VITE_ variable (those are sent to every visitor) or in a committed file.

## 3. Shipping
Live link: https://valuable-weasel-522.convex.site
Repo: https://github.com/raiden1310/Mended, public
Deploy: npm run deploy. A push never deploys by itself. After I say a milestone works: commit, push, then deploy.
Keys: OPENAI_API_KEY lives in Convex environment variables, set for dev and for prod. Never in code, a VITE_ variable or a committed file. Never ask me to paste it into chat.
.gitignore covers .env.local.
Real people's data (chats, names, phone numbers) never goes in the repo, not even as a test file. Tests use made-up examples.
Every limit and every "is this allowed" check happens in a Convex function, never only on screen.
Before I share the link: I open it on my phone, logged out, on mobile data, and do the core flow once.

## 4. The AI call
Model: GPT-6.1-Sol, thinking medium
What goes in, and its limit: a photo shrunk to 1024 pixels on the longest side, on the phone / at most 300 messages
Where it runs: a Convex action. Never in the interface.
Key: OPENAI_API_KEY in Convex environment variables, dev and prod.
Reply cap: max_output_tokens 500
Calls cap: at most 100 AI calls an hour across the app, checked in the kitchen (Convex rate limiter)
Provider limit: a hard monthly limit of $200, set by me
When a cap is hit or the call fails: show "Busy right now. Try again in a few minutes."
Login: None in v1
The AI must never: assume metal purity, assume defects in items, apply warrant if not confirmed
