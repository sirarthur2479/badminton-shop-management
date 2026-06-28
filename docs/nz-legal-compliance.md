# NZ Legal Compliance Guide

_Last reviewed: June 2026. This document is a practical compliance reference, not legal advice. Consult a NZ lawyer before making legal representations to customers._

---

## Summary

This app collects personal data (name, phone, email) and sends transactional emails. Four NZ statutes apply. **No size-based exemptions exist under any of them** — sole traders and small businesses are covered on the same terms as large companies.

| Statute | What it requires from this app |
|---|---|
| Privacy Act 2020 | Collection notice on the order form before data entry |
| Unsolicited Electronic Messages Act 2007 | Nothing extra — transactional emails are fully exempt |
| Consumer Guarantees Act 1993 | Perform the stringing service to the statutory standard |
| Fair Trading Act 1986 | No misleading representations anywhere in the app |

---

## 1. Privacy Act 2020

### What is required

**A collection notice must appear at or before the point where customers enter their personal information** (name, phone, email). This is required by Information Privacy Principle 3 (IPP3).

The notice must cover six elements:
1. The fact that information is being collected
2. Why it is being collected (the purpose)
3. Who can access it (intended recipients)
4. Whether providing the information is optional or required
5. What happens if the customer does not provide it
6. The customer's rights to access and correct their information

A separately titled "Privacy Policy" page is **not legally mandated** — the OPC distinguishes a "privacy policy" (an internal document) from a "privacy statement" (the external-facing collection notice). What is required is that the substance of the six elements above reaches the customer before collection. A brief on-screen notice on the contact-info step of the order form satisfies this.

### IPP3A — indirect collection (in force 1 May 2026)

From 1 May 2026 IPP3A applies the same notification requirements to information collected indirectly (e.g. inferred from usage, or collected by a third party and passed to you). If the app ever collects device/analytics data or receives customer data from another source, the same notice obligations apply.

### What is NOT required

- A formal privacy policy document published on the website (best practice, not legally mandated)
- Registration with the Office of the Privacy Commissioner (no registration scheme exists in NZ)
- A specific data retention period (the Privacy Act sets no mandatory minimum or maximum — see open questions below)

### Customer rights

Customers have the right to request access to their personal information and to request corrections. The practical minimum is that there is a contact method (email or phone) where customers can make these requests. The collection notice should reference this.

### Recommended implementation

Add a short notice to the contact-info step of `StringingOrderForm.jsx`, immediately above the submit area:

> **Your information** — We collect your name, phone, and email to process your stringing order and notify you when it is ready. Your details are stored in our order system and are not shared with third parties. Providing contact details is optional but we may not be able to notify you without them. You can request access to or correction of your information by contacting us at [shop email/phone].

This single paragraph satisfies IPP3 in full for this use case.

---

## 2. Unsolicited Electronic Messages Act 2007 (UEMA / Anti-Spam)

### Transactional emails are fully exempt

Order confirmation and "racket ready for pickup" emails **are not "commercial electronic messages"** under the UEMA because they facilitate, complete, or confirm a transaction the customer previously agreed to. The Department of Internal Affairs (the enforcement body) explicitly lists these as exempt:

- Order confirmations
- Payment receipts
- Delivery/ready notifications

**Exempt messages require:**
- No prior consent from the customer
- No unsubscribe mechanism
- No sender identification obligations under the Act

The exemption applies cleanly as long as the message is purely transactional. If any promotional content is appended (e.g. a discount offer in the footer), that portion re-triggers UEMA obligations for the promotional element.

### Marketing emails require express opt-in consent

A single transaction **does not** create inferred consent for future marketing emails. If the app ever adds a newsletter, promotional campaign, or loyalty program email, a separate explicit opt-in checkbox is required at the time of collection. The consent must:
- Be clearly distinguished from the service terms
- Name the type of messages the customer is consenting to
- Be recorded (timestamp + form context) in case of dispute

### Recommended implementation

No changes needed for current functionality (transactional emails only). If marketing email is added in future, add a separate unchecked opt-in checkbox on the contact step:

> ☐ Send me occasional offers and updates from [Shop Name]

---

## 3. Consumer Guarantees Act 1993 (CGA)

The CGA applies to racket-stringing services provided to recreational players (services "ordinarily acquired for personal use"). There is no small-business exemption.

The four statutory service guarantees are:

| Guarantee | What it means in practice |
|---|---|
| **Reasonable skill and care** (s.28) | String the racket to the customer's tension, use the string they selected, without damaging the racket |
| **Fit for purpose** (s.29) | If a customer states a specific purpose (e.g. "I play aggressive smashes"), the result must be fit for that |
| **Reasonable price** (s.31) | If no price is fixed in advance, the price charged must be reasonable |
| **Reasonable time** (s.32) | If no completion time is fixed, the service must be completed within a reasonable time |

### Recommended implementation

- Show the selected racket, string, and tension on the order confirmation screen so the customer has a record
- If a turnaround time is communicated anywhere in the app (e.g. "ready in 24–48 hours"), that becomes a CGA obligation — only state it if it is reliably met
- If a price is shown, it must be accurate (see FTA below)

---

## 4. Fair Trading Act 1986 (FTA)

The FTA applies to all businesses in trade. **Intent to mislead is not required** — inadvertent or accidental misleading conduct is sufficient for liability.

### What this means for the app

Any representation made in the app — about the service, the product, the price, the turnaround time — must be accurate. This includes:

- String brand/model names and descriptions
- Prices shown in the inventory or on the order form
- Any claimed turnaround time or service standard
- Shop name, contact details, and location

### Recommended implementation

- Ensure product names and prices in the Supabase catalog are kept accurate
- Do not display turnaround estimates unless they are reliably met
- If prices include or exclude GST, be consistent and clear

---

## Required vs Best Practice — Summary Table

| Element | Legally Required? | Status |
|---|---|---|
| Collection notice on order form (IPP3) | **Yes — Privacy Act 2020** | ❌ Not yet implemented |
| Customer access/correction contact method | **Yes — Privacy Act 2020** | ❌ Not yet implemented |
| Accurate product/service representations | **Yes — Fair Trading Act 1986** | ✅ Covered by catalog data |
| CGA-compliant service delivery | **Yes — Consumer Guarantees Act 1993** | ✅ Operational, not a UI item |
| Transactional email consent/unsubscribe | **No — exempt under UEMA 2007** | N/A |
| Separate privacy policy page | No (best practice only) | — |
| OPC registration | No (no NZ registration scheme) | N/A |
| Marketing opt-in checkbox | Only if marketing emails are sent | N/A (not currently sent) |
| GST registration/display | Only if turnover > $60k/year | Separate obligation |

---

## Implementation Checklist

These are the only code changes required to bring the app into legal compliance:

### High priority (legally required)

- [ ] **Add IPP3 collection notice to `StringingOrderForm.jsx`** — a short paragraph on the contact-info step (Step 3) disclosing: purpose, storage, optionality, access/correction rights, and contact method. See recommended wording above.
- [ ] **Add shop contact email/phone to the notice** — customers must have a way to exercise access/correction rights.

### Medium priority (best practice, low effort)

- [ ] **Add a brief Privacy Statement page** (or modal) reachable from the kiosk — expands on the collection notice for customers who want more detail.
- [ ] **Ensure all prices in the catalog include GST or are consistently labelled ex-GST** — FTA accuracy obligation.
- [ ] **Remove or qualify any turnaround time claims** if they are not reliably met.

### Future (only required if features are added)

- [ ] **Marketing opt-in checkbox** — only needed if promotional emails are ever sent.
- [ ] **Data retention policy** — decide how long order records are kept and document it. No statutory minimum exists but indefinite retention of personal data conflicts with Privacy Act purpose-limitation principles.

---

## Open Questions (seek legal advice before acting)

1. **Timing of collection notice**: Must the IPP3 notice appear before the customer types their name (Step 1), or is it sufficient to show it on the contact step (Step 3) before the phone/email fields? The "as soon as practicable" standard in IPP3 likely permits Step 3, but this is not definitively resolved in OPC guidance.

2. **Data retention**: The Privacy Act imposes no specific retention period, but how long should order records (name, phone, email) be kept? Tax obligations may require retaining transaction records for 7 years; privacy principles suggest deleting personal data once it is no longer needed for its original purpose.

3. **GST display**: If annual turnover exceeds $60,000 NZD, GST registration is required and prices must be displayed inclusive of GST (or clearly labelled as ex-GST). This is an IRD obligation, not covered by this document.

---

## Sources

- Office of the Privacy Commissioner — [Your obligations](https://www.privacy.org.nz/responsibilities/your-obligations/)
- OPC — [IPP3: Collecting personal information](https://www.privacy.org.nz/privacy-principles/3/)
- OPC — [Privacy statement vs privacy policy](https://www.privacy.org.nz/resources-and-learning/a-z-topics/whats-the-difference-between-a-privacy-statement-notice-and-policy/)
- OPC — [IPP3A: Indirect collection](https://www.privacy.org.nz/resources-and-learning/a-z-topics/ipp3a/)
- Department of Internal Affairs — [NZ Spam law for businesses](https://www.dia.govt.nz/Spam-NZ-Spam-Law-for-Businesses)
- DIA — [Spam FAQ](https://www.dia.govt.nz/spam-frequently-asked-questions)
- Consumer Protection NZ — [Consumer Guarantees Act obligations](https://www.consumerprotection.govt.nz/guidance-for-businesses/complying-with-consumer-laws/obligations-under-the-consumer-guarantees-act)
- Consumer Protection NZ — [Fair Trading Act obligations](https://www.consumerprotection.govt.nz/guidance-for-businesses/complying-with-consumer-laws/obligations-under-the-fair-trading-act)
- Marketing Association NZ — [Inferred and deemed consent FAQ](https://marketing.org.nz/resource-hub/faq-inferred-and-deemed-consent)
