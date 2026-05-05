# Product

## Register

product

## Users

A solo user (the maintainer) today, with intent to grow into people who think about money primarily through the lens of saving, not spending. Sessions are mixed: a daily quick check ("can I still spend this?"), a weekly ledger pass, and an occasional Friday-evening "where am I on my goals" review. Local-only by default; an online version is on the roadmap, so the design needs to scale to multi-device sync without a redesign.

## Product Purpose

A savings-first money tracker. Other finance apps optimize for "where did it go?"; this one answers "how much further until I get there?" and "do I have anything left to spend this period?". Money is divided into named goals so the user sees committed vs. spendable at a glance instead of one undifferentiated bank balance. Success looks like a user who closes the app feeling oriented (knowing exactly what's left and what's growing), not anxious.

## Brand Personality

Confident, serious, encouraging, modern. Voice is direct and numerate: no breathless coaching, no fintech jargon, no exclamation points. Encouragement comes from the data being legible (a goal bar visibly filling, the allowance number staying green), not from copy cheerleading. The app stands upright; it doesn't slouch and it doesn't peacock.

## Anti-references

- **Bank-app cliché.** Navy + gold, dense corporate tables, "Welcome back, valued client" energy.
- **Fintech-landing-page-2024.** SaaS-cream backgrounds, lifeless 3D illustrations, gradient-on-gradient hero text, "Money, simplified." headlines.
- **YNAB / Mint chart-soup.** Five charts on the same screen, each fighting for attention, none decisive.
- **Crypto neon-on-black.** Glowing accents, "degen" energy, rocket emojis, anything that implies risk-tolerance trading.

## Design Principles

1. **Saved beats spent.** Every screen leads with what's growing or remaining, not with what was lost. Spending is reported, never headlined.
2. **Money has names.** Numbers without context are noise. Every figure is paired with the goal, wallet, or category it belongs to so the user always knows which bucket they're looking at.
3. **One number per question.** Each screen answers one question well rather than five questions partially. Charts earn their place; redundant chrome doesn't.
4. **Encourage through evidence, not copy.** Progress shows in interface state (a filling bar, a green delta, a quiet weekend on the heatmap), never in congratulatory text.
5. **Local-feel, online-ready.** Must feel as fast as a local app even when sync ships. No spinner-soup, no "loading..." placeholders that flash on every navigation.

## Accessibility & Inclusion

WCAG AA contrast as the floor. Color is never the sole carrier of meaning: status uses dot + label + color together, not color alone (the goals page already does this; the rest of the app follows). Motion respects `prefers-reduced-motion`. Chart and heatmap palettes pick hues distinguishable under protan/deutan color blindness, not red-vs-green pairs at the same lightness.
