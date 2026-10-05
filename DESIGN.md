# DESIGN.md
Read this before building or changing any screen. If a choice isn't covered here, ask me instead of guessing.

## 1. The feeling, in labels
1.	The services list is the largest text on the review screen
2.	Unidentified damages get color. Everything else is neutral
3.	Typical catalog price appears immediately after a service is selected, including AI-selected services
This is what I want the user experience to feel like: Precise and Calm, like a surgeon.


## 2. References, one per component
1.	Screen to capture item images and review them: https://pin.it/3suPkytYx
Take: the main card and the horizontal scroll feature.
Ignore: the color palette and font
2.	Review screen: /Users/administrator/build-sprint-app/references/review-screen.png
Take: the layout of cards and sections
Ignore: the color palette and font. My flight text. Image of person
3.	Repair ticket: /Users/administrator/build-sprint-app/references/repair-ticket.png
Take: Invoice number for Repair ticket number, Dates, Customer card and info without the image/avatar, Item details card for services and price, Total for total estimate.
Ignore: the color palette and font. Replaces CTAs with Sign and Save
4.	Customer signature card: /Users/administrator/build-sprint-app/referencescustomer-signature-card.png and /Users/administrator/build-sprint-app/referencescustomer-signature.png
Take: The Invoice card pop up from the bottom for customer signature. Customer should be able to sign this digitally as shown in the second image.
Ignore: the color palette and font.


## 3. Type and colour

UI element	Size	Weight	Line height
Section heading	18 px	600	24 px
Body text	16 px	400	22 px
Field label	13 px	500	18 px
Estimate amount	32 px	600	38 px

Keep the whole product to three Inter weights: 400, 500, 600. That will make the UI feel disciplined and fast.
Be adequately generous with line height and vertical spacing, especially in forms and AI result cards.

Role	Color	Hex	Use
Core brand	Deep Amethyst	#4B2A5A	Primary actions, active step, app icon
Dark anchor	Ink Plum	#241A2B	Header/nav, high-emphasis text
Canvas	Warm Ivory	#F7F5F1	Main app background
Surface	White	#FFFFFF	Cards, forms, image review
Primary text	Graphite	#232326	Main text
Secondary text	Slate	#6B6870	Supporting info
AI state	Muted Iris	#7167A8	AI suggestions/analysis state
Evidence / hallmark	Champagne	#B79454	Small evidence cues only
Success	Emerald	#25735A	Confirmed / accepted / complete
Needs attention	Amber	#A85E12	Unclear hallmark, needs confirmation
Error	Garnet	#A33A43	Contradictions, invalid input, destructive action


## 4. Screens
1.	Splash screen: for when app is opening. Top to bottom: Logo. Main action: Load the app → Image capture screen.
Empty: Nothing · Loading: Logo animation · Error: Restart the app · Done: App loaded. Shows image capture screen

2.	Image capture screen: for sales associate to take multiple images of the piece. Load in-app camera. Top to bottom: “Take at least three images – wide angle, hallmark, defect - of the piece”; Camera lens view; Captured images with option to remove. Main action: Click images → Review screen
Empty: “Start Capturing” · Loading: UI skeleton · Error: “Sorry! Why don’t you try again?” · Done: Images captured

3.	Review screen: for sales associate to review item information and services based on damages identified from images. Top to bottom: Header card – Item information, Customer selection, Warranty information (if AI can’t retrieve, sales associate should add), Captured images; Detail card – Damage, service, and price of each service (sales associate can add or remove service if needed). Main action: Confirm estimate → Repair Ticket
Empty: “Upload images to see the estimate” · Loading: UI skeleton · Error: “Uh oh! Give me another shot.” · Done: Estimate reviewed, customer selected, and warranty added

4.	Repair ticket: for sales associate and customer to review and for customer to sign. Top to bottom: Header card – “Your Repair Ticket”, Estimate number, Total estimate, Today’s date, Due date (estimated by AI); Detail card – Repair services and price of each service. Main action: Customer signature → Signature card
Empty: “That’s a first!” · Loading: UI skeleton · Error: “One sec. I’ve got this!” · Done: Customer approves

5.	Signature card: for customer to approve and sign the estimate
Top to bottom: Section for customer to sign that says “Sign here”
Main action: Done
 Empty: “Sign here” · Loading: UI skeleton · Error: “Please try again.” · Done: Signaure saved


## 5. The first screen's words
Headline: Accurate repairs. Satisfied clients.
Under it: Upload images of the item and AI will handle the rest for you
Button: Start capturing

## 6. Principles
- One main action per screen
- Every AI answer can be corrected in one tap
- No color or size outside the ones in DESIGN.md without asking

## Review layout (approved)
Page heading: Review Estimate. First card: Item information, with fields sized to the available space in two columns and stone checkboxes in two columns. Second card: Services, showing “Repair services will appear here” until service identification is built.

Milestone 2: Services contains editable damage and repair service fields, evidence photo numbers, and add/remove controls. Close-ups are optional. Typical catalog base prices appear immediately for confirmed 14K, 18K, 22K, 24K, or platinum. Unknown metal or purity needs confirmation; unsupported metals and services not offered for 24K are explained without substituting prices.

Services layout (approved): Damage is editable free text in the left column. Repair service is a searchable choice from all 93 Service Catalog entries in Jewelry_Repair_Price_Catalog.xlsx in the right column. AI leaves the service unselected if the exact catalog variant is uncertain.

Approved 5 Oct: Damage and service search boxes share aligned labels and a matching height that grows with the damage text. AI checks visible scuffs and dirt, suggesting applicable catalog cleaning/polishing services. Prices are USD typical base prices from the workbook, with units and exclusions shown; extra units and add-ons are not calculated in this change.

Milestone 3 (approved 5 Oct): No quantities. Each repair has an editable USD service price and an optional additional fee. The estimate total recalculates after price changes, fees, and service removal. Associate-selected rush and eligible white-gold re-rhodium fees use the catalog. Charges without a known catalog amount are entered manually. Missing services or prices prevent confirming a complete estimate; unknown amounts are never treated as zero.
