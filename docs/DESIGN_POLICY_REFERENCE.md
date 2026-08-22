# Design Reference: Legal Policies Footer & Page Layout

This document provides guidance for designers on where and how to integrate legal policies into the Londile Shuttle website/app.

---

## 1. Footer Layout

### 1.1 Standard Footer Structure

```
LONDILE SHUTTLE FOOTER
═════════════════════════════════════════════════════════════

[Company Logo]                           [Social Media Icons]
Londile Shuttle (Pty) Ltd                Facebook | Instagram | Twitter

Contact                                  Legal
📧 support@londile-shuttle.co.za          • Privacy Policy
📞 +27 (XX) XXX XXXX                      • Terms & Conditions  
📍 [Office Address]                       • Data Retention Policy
                                          • Cookie Policy
                                          
Hours                                    About
Mon-Fri: 9AM-5PM SAST                     • About Us
Sat-Sun: Closed                           • Contact Us
                                          • Careers
                                          
Newsletter                               Company
[Email Input] [Subscribe]                 • Blog
                                          • Testimonials
                                          • FAQ

© 2026 Londile Shuttle (Pty) Ltd. All rights reserved.
[Company Registration Number]
═════════════════════════════════════════════════════════════
```

### 1.2 Footer Links (Mobile-Responsive)

**Desktop (3+ columns):**
```
[Logo] [Support] [Legal] [About] [Newsletter]
```

**Tablet (2 columns):**
```
[Logo]          [Support]       
[Legal]         [About]         
[Newsletter]    [Social]        
```

**Mobile (1 column, stacked):**
```
[Logo]
[Support]
[Legal]
[About]
[Newsletter]
[Social]
```

---

## 2. Legal Section Links

### 2.1 Footer Legal Links
Position: **Bottom right or dedicated Legal column**

```
Legal
├── Privacy Policy
├── Terms & Conditions
├── Data Retention Policy
└── Cookie Policy
```

### 2.2 Link Styling
- **Font Size:** 12-14px
- **Color:** Secondary text color (lighter than main text)
- **Hover State:** Highlight or underline
- **Target:** Opens in new tab or modal
- **Mobile:** Full width, easy to tap

---

## 3. Policy Pages Layout

### 3.1 Privacy Policy Page

**URL:** `https://londile-shuttle.co.za/privacy`

**Page Structure:**
```
┌─────────────────────────────────────────┐
│ PRIVACY POLICY                          │ [Version 1.0]
│ Last Updated: August 2026               │ [Legal Review Status]
└─────────────────────────────────────────┘

[Breadcrumb Navigation]
Home > Legal > Privacy Policy

[Table of Contents - Sticky Sidebar]
1. Introduction
2. What We Collect
3. Legal Basis
... [scrollable list]

[Main Content - 800px max width]
1. Introduction
   Lorem ipsum dolor sit amet...
   [Expandable sections for mobile]

2. What We Collect
   [Table of data types]
   [Icons showing POPIA-regulated vs operational]

...

[Contact Section at Bottom]
Questions? Contact privacy@londile-shuttle.co.za
Information Regulator: https://www.justice.gov.za/inforeg/

[Legal Disclaimer Box - Highlighted]
⚠️ LEGAL NOTICE: This policy awaits legal review...

[Related Links]
→ Terms & Conditions
→ Data Retention Policy
→ Cookie Policy
```

### 3.2 Terms & Conditions Page

**URL:** `https://londile-shuttle.co.za/terms`

**Layout:** Same as Privacy Policy
- Table of contents
- Numbered sections
- Contact info
- Legal disclaimer
- Related links

### 3.3 Data Retention Policy Page

**URL:** `https://londile-shuttle.co.za/data-retention`

**Layout:** Same, but with enhanced tables
- Retention schedule as interactive table
- Timeline visualizations (e.g., 7-year calendar)
- Deletion process flowchart
- FAQ accordion

---

## 4. Policy Integration Points

### 4.1 Booking Form
**Location:** Before final confirmation

```
┌──────────────────────────────────────────────┐
│ CONFIRM BOOKING                              │
├──────────────────────────────────────────────┤
│                                              │
│ Booking Details                              │
│ [Summary of booking]                         │
│                                              │
│ ☐ I agree to the Terms & Conditions         │
│   [Link: Terms & Conditions]                │
│                                              │
│ ☐ I have read the Privacy Policy            │
│   [Link: Privacy Policy]                    │
│   and consent to data collection            │
│                                              │
│ ☐ I understand the Data Retention Policy    │
│   [Link: Data Retention Policy]             │
│   and my booking data will be kept for      │
│   7 years                                    │
│                                              │
│ ☐ I consent to receive SMS/Email updates    │
│   [Link: Privacy Policy > Communications]   │
│                                              │
│ [Confirm Booking]  [Cancel]                 │
└──────────────────────────────────────────────┘
```

### 4.2 Signup Form
**Location:** Before "Create Account"

```
┌──────────────────────────────────────────────┐
│ CREATE ACCOUNT                               │
├──────────────────────────────────────────────┤
│                                              │
│ Email: [____________]                        │
│ Password: [____________]                     │
│                                              │
│ ☐ I agree to the Terms & Conditions        │
│   [Link]                                    │
│                                              │
│ ☐ I have read the Privacy Policy           │
│   [Link]                                    │
│                                              │
│ ☐ I consent to receive marketing emails    │
│   (Optional)                                │
│                                              │
│ [Create Account]                            │
│                                              │
│ By signing up, you agree to our Terms.     │
│ See our Privacy Policy.                     │
│ [Link] [Link]                               │
└──────────────────────────────────────────────┘
```

### 4.3 Login Page
**Location:** Footer of login form

```
┌──────────────────────────────────────────────┐
│ LOGIN                                        │
├──────────────────────────────────────────────┤
│ Email: [____________]                        │
│ Password: [____________]                     │
│ [Remember Me]  [Forgot Password?]            │
│                                              │
│ [Login]                                      │
│                                              │
│ Don't have an account? [Sign Up]             │
│                                              │
│ By logging in, you accept our               │
│ Terms & Conditions and Privacy Policy       │
│ [Link] [Link]                               │
└──────────────────────────────────────────────┘
```

### 4.4 Profile/Account Settings
**Location:** "Legal & Privacy" section

```
ACCOUNT SETTINGS
================

Personal Information
├── Name
├── Email
├── Phone
└── Address

Privacy & Data
├── [View My Data] → Download as JSON/CSV
├── [Delete My Account] → Initiates deletion process
├── [Privacy Policy]
├── [Data Retention] → Shows when your data will be deleted
├── [Marketing Preferences] → Email/SMS opt-in/out
└── [Communication Frequency]

Legal Documents
├── [Privacy Policy]
├── [Terms & Conditions]
├── [Data Retention Policy]
└── [Cookie Policy]
```

### 4.5 Agent Onboarding
**Location:** Before company details submit

```
┌──────────────────────────────────────────────┐
│ AGENT ONBOARDING                             │
├──────────────────────────────────────────────┤
│                                              │
│ COMPANY DETAILS                              │
│ Company Name: [________________]              │
│ VAT Number: [________________]                │
│ Registration: [________________]              │
│ Address: [________________]                   │
│                                              │
│ ☐ I confirm my company details are accurate │
│                                              │
│ ☐ I understand my company information      │
│   will be stored for verification           │
│   (see Data Retention Policy)               │
│   [Link]                                    │
│                                              │
│ ☐ I have read the Agent Terms of Service   │
│   [Link: Agent-specific Terms]              │
│                                              │
│ [Submit for Approval]                       │
│                                              │
│ Your account will be reviewed by admin.     │
│ See Privacy Policy for timeline.            │
│ [Link]                                      │
└──────────────────────────────────────────────┘
```

---

## 5. Color & Typography

### 5.1 Policy Page Styling

**Header Section (Privacy Policy page):**
- Background: Light blue or company brand color
- Text: White/dark, 32-40px bold
- Subtext: "Last Updated", "Version", gray 14px

**Navigation (Table of Contents):**
- Position: Sticky sidebar (desktop) / Collapsible menu (mobile)
- Scroll indicator: Highlights current section
- Links: Underlined on hover

**Content Sections:**
- Heading: 24px bold, company color
- Subheading: 18px semi-bold, dark gray
- Body: 16px, line-height 1.6, dark gray
- Links: Company brand color, underlined

**Tables & Code Blocks:**
- Light gray background (#F5F5F5)
- Monospace font for code
- Striped rows for readability
- Responsive: Scroll horizontally on mobile

**Legal Disclaimer Box:**
- Background: Light red/yellow (#FFF9E6)
- Border: Red left border (4px)
- Icon: ⚠️ Warning emoji or icon
- Text: 14px bold, red or orange
- Prominent but not intrusive

### 5.2 Mobile-Specific

**Policy Pages:**
- No sidebar (move TOC to top)
- Full-width content
- Larger touch targets for links (44px min height)
- Collapsible sections for long content

**Footer:**
- Stack vertically on mobile
- Larger text (14px+)
- Tap-friendly spacing (8px+ between links)

---

## 6. Content Modules (Reusable Components)

### 6.1 Policy Link Module
```html
<div class="policy-link">
  <a href="/privacy">
    <span class="icon">📄</span>
    <span class="text">Privacy Policy</span>
    <span class="arrow">→</span>
  </a>
</div>
```

### 6.2 Consent Checkbox Module
```html
<div class="consent-checkbox">
  <input type="checkbox" id="privacy-consent" required>
  <label for="privacy-consent">
    I have read and agree to the 
    <a href="/privacy" target="_blank">Privacy Policy</a>
    and 
    <a href="/terms" target="_blank">Terms & Conditions</a>
  </label>
</div>
```

### 6.3 Legal Disclaimer Module
```html
<div class="legal-disclaimer">
  <div class="disclaimer-icon">⚠️</div>
  <div class="disclaimer-text">
    <strong>LEGAL NOTICE:</strong> This policy has not been reviewed 
    by a lawyer. Before launch, please have a South African attorney 
    review. <a href="#">Learn more about legal review</a>.
  </div>
</div>
```

### 6.4 Last Updated Module
```html
<div class="last-updated">
  Last Updated: <time datetime="2026-08-22">August 22, 2026</time>
  <span class="status">DRAFT - AWAITING LEGAL REVIEW</span>
</div>
```

---

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 Compliance (AA Level)

**Contrast Ratios:**
- Text on background: 4.5:1 (normal), 3:1 (large)
- Links: Underlined or distinct color (3:1 minimum)

**Keyboard Navigation:**
- All links/buttons focusable (Tab key)
- Focus indicator visible (outline or highlight)
- Skip link to main content

**Screen Readers:**
- Proper heading hierarchy (h1, h2, h3...)
- Link text descriptive ("Read Privacy Policy", not "Click here")
- Form labels associated with inputs
- Tables have proper `<th>` and `<td>` markup

**Mobile:**
- Touch targets: 44x44px minimum
- No hovering required
- Readable without horizontal scroll

### 7.2 Language
- Simple, clear language (reading level: Grade 9+)
- Avoid legal jargon where possible
- Definitions for technical terms
- Plain English translations in parentheses

---

## 8. Version Control & Updates

### 8.1 Version Display
Each policy page shows:
```
Version: 1.0
Last Updated: August 22, 2026
Status: DRAFT - AWAITING LEGAL REVIEW
Next Review: [Date 6 months after launch]
```

### 8.2 Change Log (Optional)
```
CHANGELOG
═════════
v1.0 (Aug 22, 2026)
  - Initial draft
  - POPIA sections added
  - Awaiting legal review

v0.9 (Aug 15, 2026)
  - Draft created
  - Internal review
```

### 8.3 Update Notification
When policies change:
- Email notification to registered users
- In-app banner notification
- Notification in account settings
- 30-day notice before changes take effect

---

## 9. SEO & Analytics

### 9.1 Meta Tags
```html
<meta name="description" content="Londile Shuttle Privacy Policy - POPIA compliant">
<meta name="keywords" content="privacy policy, data protection, POPIA, South Africa">
<meta name="author" content="Londile Shuttle">
<meta property="og:title" content="Privacy Policy - Londile Shuttle">
```

### 9.2 Structured Data (Schema.org)
```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Privacy Policy",
  "url": "https://londile-shuttle.co.za/privacy",
  "dateModified": "2026-08-22",
  "lastReviewed": "2026-08-22",
  "legalStatus": "DRAFT"
}
```

### 9.3 Analytics Tracking
- Track policy page views
- Track scroll depth (how far users read)
- Track consent checkbox submissions
- Track deletion requests

---

## 10. Testing Checklist

### Before Launch

- [ ] **Legal Review:** Attorney approved all policies
- [ ] **Desktop View:** Renders correctly on Chrome, Firefox, Safari, Edge
- [ ] **Mobile View:** Responsive on iOS and Android
- [ ] **Accessibility:** WCAG 2.1 AA compliance verified
- [ ] **Links:** All internal/external links working
- [ ] **Consent Forms:** Checkboxes functional, required fields enforced
- [ ] **Deletion Process:** End-to-end tested
- [ ] **Email Notifications:** Delivery verified
- [ ] **Search:** Policies discoverable in search results
- [ ] **Analytics:** Tracking implemented and firing

---

## 11. Pre-Launch Checklist

Before publishing policies:

### Legal Review
- [ ] Hire South African attorney
- [ ] Review Privacy Policy (POPIA compliance)
- [ ] Review Terms & Conditions (liability, disputes)
- [ ] Review Data Retention Policy (tax requirements)
- [ ] Get written sign-off

### Customization
- [ ] Add company registration number
- [ ] Add office address
- [ ] Add support email addresses
- [ ] Add phone number
- [ ] Verify retention periods with accountant/tax advisor
- [ ] Verify DPO contact (if applicable)

### Publishing
- [ ] Design layouts approved
- [ ] Copy-edited for grammar/tone
- [ ] Linked from footer on all pages
- [ ] Linked from booking form
- [ ] Linked from signup form
- [ ] Added to sitemap.xml
- [ ] Redirects setup (old URLs if any)

### Compliance
- [ ] POPIA-compliant consent collection
- [ ] GDPR compliance (if EU users)
- [ ] Data deletion functionality tested
- [ ] Audit logging enabled
- [ ] Breach notification process documented

---

## 12. Questions for Designer

1. What is the company brand color? (Use for links, headings)
2. Should policies open in modal or new page?
3. Mobile-first or desktop-first design?
4. Do you want "sticky" table of contents on desktop?
5. Should legal disclaimer box be always visible or dismissible?
6. Font preferences? (Serif vs. sans-serif)
7. Should policies be PDFs or web pages?
8. Do you need multi-language support?

---

**Status:** DRAFT - Ready for designer input  
**Next Step:** Finalize design mockups, then get legal review
