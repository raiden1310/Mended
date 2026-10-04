# PRODUCT.md

## 1. The job
When a customer brings in a piece of jewelry for repair, I want to determine repair services to be performed and provide an accurate estimate for them, so I can avoid back and forth with the jeweler and customer for estimate approval, allowing me to focus on selling or clienteling.

Who, by situation (not age or city): a jewelry retail sales associate taking in a repair for a customer
Today they hire: master jeweler to review the repair ticket and update the estimate after inspecting the item

(Advanced, optional) What needs doing: identifying repair services to be performed from item images, and creating a repair ticket with accurate estimates for the repair services to be performed
(Advanced, optional) How they want to feel: confident
(Advanced, optional) How they want to look to others: efficient

(B2B only) The bench: end user - sales associate in a jewelry retail store, decision maker – master jeweler, store owner, who pays - store owner or finance head
The one we serve first: sales associate

## 2. The switch
What they'd fire: master jeweler inspecting every repair intake to review estimates and perform re-estimation

Push (what's wrong with today): high turnaround time for repairs due to back and forth with the jeweler and customer 
Pull (what your product promises): gives sales associates their time back to focus on selling or clienteling
Anxiety (what worries them about switching): will it really save time?
Habit (what keeps them where they are): no viable alternative

The one worry onboarding must remove: will it really save time?
How I know (what they did, not what they said): a jewelry retail store owner complained about a clunky system that took up more time of his sales associates than it helped with operations.

## 3. The core flow
The story: As a user, I want to determine jewelry repair services to be performed and provide an accurate estimate for them, so I can avoid back and forth with the jeweler and customer for estimate approval, allowing me to focus on selling or clienteling.

1.	(Trigger) Customer brings in an item/items for repair
2.	Sales Associate (SA) opens this app on their phone
3.	SA clicks at least 3 images (one mandatorily of the hallmark close up)
4.	AI analyzes the images
5.	AI determines item details (item type, metal(s), metal purity, stone(s)) 
6.	AI determines damages or repairs needed
7.	SA receives item info with identified damages and services needed in app for review – SA can add or remove services
a.	What can go wrong:
i.	Incorrect item information identified – SA must correct this on review screen
ii.	Damage not found – SA should click a close up picture of the damage and upload it
iii.	Incorrect services determined – SA must correct this on review screen
8.	AI generates estimates for repair services – Use standard price list that I will provide
a.	What can go wrong:
i.	Incorrect price for services leading to faulty estimate – SA must correct on review screen
9. 	SA selects the customer
10. 	AI determines warranty, past purchase
11.	SA gets approval from customer in real-time for estimate
a. 	What can go wrong:
i.	If the piece is under warranty, the estimate gets updated before the customer approves it
12.	SA saves this information
13.	A repair ticket with all the item info, service details, total amount, turnaround time, and images is created
14.	Customer digitally signs repair ticket
15.	SA prints two copies of the ticket – one for the store, one for the customer
16.	SA goes back to selling/clienteling (Job Done)
Things they do today: 12 · Things they do with my product: 7

What can go wrong:
Step [4]: [Blurry images that cannot be read/used by AI] -> what must happen: [Ask SA to capture media again]
Step [5]: [AI cannot determine item information] -> [Ask SA to pick from drop down fields of item type, metal(s), metal purity, stone(s)]
Step [6]: [AI cannot identify/determine damages even though they are present] -> [SA receives item info with identified damages and services needed in app for review – SA can add or remove services]
Step [10]: [Estimate not updated for piece in warranty] -> [Allow SA to update estimate manually]

Next story (only once this one works end to end): [ ]

## 4. Onboarding
First value (the moment it first does the job for them): Associate photographing a real piece and seeing a filled-in repair ticket with an estimate
The worry it removes (from section 2): will it really save time?

From opening the link to the first value:
1. [Sales associate opening an app on the counter tablet/iPad] removes: [Navigating to Repair module in a POS]
2. [Uploading images of the item] removes: [nothing]
3. [receiving a filled-in repair ticket with estimates]

Login: [not in v1 because it isn’t needed to generate the first ticket]
What we don't ask on day one: [permissions, full price list, login, POS integration]
What we ask later, and when: [permissions, full price list, login, POS integration] after [sign up]

## 5. v1
Does (one person finishes the one job): [Generates an accurately filled-in repair ticket with item information and estimates]
Doesn't (parked, not forgotten): [Integrate with POS, Use store specific price list for estimate generation]
Nice to have, only after the must-haves work: [Login, Use-role permissions]
How I'll know it worked (what they do again, not what they say): [Generate the second repair ticket]

## 6. The riskiest guess
If this is false, the product is pointless: [If the item information (type, metal type, metal purity, stones) is incorrect or the estimate is incorrect]
How I tested it, and what happened: [Clicked 24 pictures of 9 different jewelry items and checked how many items were identified correctly with damages. Output: “Type correct on 9/9”, “Metal correct on 8/9”, “Damage correct on 5/9”, “Identified correct repair service on 5/5 damaged pieces”, “Pulled correct price from list for 5/5 damaged pieces”]
What changed in the plan: [Moved SA check to before the price estimate]

## 7. Milestones
1. I can determine the item information 
2. I can identify damages to the item
3. I can generate an accurate estimate for repair services needed
4. I can generate a repair ticket and get the customer’s digital signature
Last: I can close it, reopen it, and my data is still there.
