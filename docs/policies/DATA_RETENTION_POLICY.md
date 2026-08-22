# Data Retention & Deletion Policy

**Last Updated:** August 2026  
**Effective Date:** [INSERT DATE AFTER LEGAL REVIEW]

## 1. Introduction

This policy defines how long Londile Shuttle retains different types of personal and operational data, why we keep it, and how we delete it.

**Compliance:** This policy aligns with POPIA Section 8 (Retention limitation) and South African tax and legal requirements.

---

## 2. Data Retention Schedule

### 2.1 Guest Booking Data

| Data | Retention Period | Reason | Deletion Method |
|------|------------------|--------|-----------------|
| **Booking number** | 7 years after completion | SARS tax audit trail (Turnover Tax Act, 2011) | Kept for historical reference, anonymized |
| **Guest name, contact** | 7 years after completion | Tax records, dispute resolution | Hard deleted from active database, kept in archive |
| **Trip dates** | 7 years after completion | Tax records, audit trail | Kept with anonymized booking record |
| **Verification code** | 30 days after trip completion | Security, booking lookup | Deleted, no recovery |
| **Address provided** | 7 years after completion | Tax/legal hold, disputes | Anonymized (replaced with "DELETED_USER_123") |

**Timeline Example:**
- Guest books: Jan 1, 2024
- Trip completes: Jan 15, 2024
- Retention until: Jan 15, 2031 (7 years)
- Automatic deletion: Jan 16, 2031

---

### 2.2 Registered User Account Data

| Data | Retention Period | Reason | Deletion Method |
|------|------------------|--------|-----------------|
| **Email address** | Active account + 1 year after deletion | Account identity, SARS records if billing | Anonymized (replaced with "USER_DELETED_XXX@anonymized.local") |
| **Password (hash)** | Active account only | Authentication | Automatically deleted on account termination |
| **Name, ID number** | Active account + 1 year after deletion | Dispute resolution, tax records | Anonymized if within tax hold period |
| **Contact number** | Active account + 1 year after deletion | Communication records, fraud prevention | Anonymized |
| **Booking history** | Active account + 1 year after deletion | Booking records (cross-reference 7-year rule below) | Anonymized if < 7 years old, kept if > 7 years (tax hold) |
| **Saved addresses** | Active account + 6 months after deletion | POPIA right to be forgotten | Hard deleted |
| **Account activity logs** | 1 year after account deletion | Security investigation, audit trail | Hard deleted after 1 year |

**User Deletion Timeline:**
- User deletes account: March 1, 2024
- Data retained until: March 1, 2025 (1 year)
- Automatic anonymization: March 2, 2025

---

### 2.3 Agent Account Data

| Data | Retention Period | Reason | Deletion Method |
|------|------------------|--------|-----------------|
| **Email, contact** | Active + 2 years after termination | Business records, tax compliance | Anonymized after 2 years |
| **Company name, registration** | Active + 2 years after termination | Business records, auditing | Anonymized after 2 years |
| **VAT/tax number** | Active + 6 years after termination | SARS compliance, tax audits | Archived but anonymized |
| **Agent-created bookings** | 7 years after each booking completion | Tax trail (who created booking), auditing | Anonymized but cross-referenced |
| **Performance ratings/reviews** | Active + 1 year after termination | Quality assurance, dispute resolution | Hard deleted after 1 year |

**Agent Termination Timeline:**
- Agent account closed: June 1, 2024
- Bookings retained until: [Completion date + 7 years]
- Agent profile anonymized: June 1, 2026 (2 years)

---

### 2.4 Administrator Account Data

| Data | Retention Period | Reason | Deletion Method |
|------|------------------|--------|-----------------|
| **Email, credentials** | Active + 1 year after termination | Employment records, access control | Anonymized |
| **Admin action logs** | 3 years after termination | Security audit, incident investigation, legal compliance | Hard deleted after 3 years |
| **User management history** | 3 years | Audit trail (who approved/rejected roles) | Hard deleted after 3 years |

---

### 2.5 Payment Records

| Data | Retention Period | Reason | Deletion Method |
|------|------------------|--------|-----------------|
| **Transaction ID** | 6 years | SARS tax audit requirement (Income Tax Act) | Archived with anonymized booking reference |
| **Amount, date** | 6 years | Tax records | Kept with anonymized user info |
| **Card last 4 digits** | Not kept beyond 90 days | PCI DSS compliance (payment security) | Deleted automatically |
| **Full card number** | NEVER stored | PCI DSS compliance | N/A - Not collected |

---

### 2.6 Audit & Security Logs

| Data | Retention Period | Reason | Deletion Method |
|------|------------------|--------|-----------------|
| **System logs (who accessed what)** | 1 year | Security incident investigation | Deleted automatically after 1 year |
| **Failed login attempts** | 90 days | Fraud detection, brute-force prevention | Deleted automatically |
| **Role change logs** | 3 years | Audit trail, compliance | Hard deleted after 3 years |
| **Security patches applied** | Indefinitely | System documentation | Kept in technical archives |

---

### 2.7 Backups

| Data | Retention Period | Reason | Deletion Method |
|------|------------------|--------|-----------------|
| **Database backups** | 30 days | Disaster recovery | Automatically purged by Supabase |
| **Deleted user data in backups** | 30 days max | GDPR/POPIA compliance (data subject deletion rights) | Permanently purged after 30 days |

**Important:** When you request deletion, your data is removed from production within 20 days, then from all backups within 30 days maximum.

---

## 3. Legal Holds

Retention periods may be **extended** if:

1. **Court Order / Subpoena**
   - Law enforcement requests data
   - Court orders data preservation
   - Data held indefinitely until case closed

2. **Active Dispute**
   - Booking dispute ongoing
   - Payment reversal in progress
   - Data held until resolution

3. **Fraud Investigation**
   - Suspected fraud or abuse
   - Data held during investigation (typically 90 days)

4. **Tax Audit**
   - SARS requests data
   - Data held per audit timeline

**Notification:** If data is on legal hold, we inform you. You may request hold status.

---

## 4. Anonymization vs. Deletion

### 4.1 Anonymization
Data is anonymized by:
- Removing name, contact number, ID
- Replacing with: "DELETED_USER_123456"
- Keeping booking record/amounts (for audit)
- Making it impossible to re-identify person

**Example:**
```
BEFORE: John Smith | +27123456789 | 45123456789
AFTER:  DELETED_USER_78901 | DELETED | DELETED
```

### 4.2 Hard Deletion
Data is hard deleted by:
- Removing from production database
- Removing from all backups (after 30 days)
- Destroying encryption keys
- Overwriting storage sectors

**Result:** Data is unrecoverable.

### 4.3 When We Anonymize vs. Delete

| Scenario | Action | Why |
|----------|--------|-----|
| User deletes account (within 1 year of last booking) | Anonymize | Booking record still needed for audit/tax |
| User deletes account (7+ years after last booking) | Hard delete | Tax retention period expired |
| Guest booking deleted (before 7-year hold) | Anonymize | Tax/legal requirement |
| Guest booking deleted (after 7-year hold) | Hard delete | Retention period complete |
| Payment record after 6 years | Hard delete | Tax retention expired |

---

## 5. Automatic Deletion Process

### 5.1 How We Delete

**Step 1: Mark for Deletion**
- User initiates deletion
- System marks record as "deleted"
- Data hidden from user view (within 1 day)

**Step 2: Production Deletion**
- Data removed from active database (within 20 days)
- User cannot recover it

**Step 3: Backup Purge**
- Automatically removed from all backups (within 30 days)
- Supabase purges from restore points

**Step 4: Confirmation**
- We email user deletion confirmation (within 5 business days)

### 5.2 Timeline Summary
```
Day 0: Deletion request received
Day 1: Data hidden from user view
Day 20: Removed from production database
Day 30: Removed from all backups
Day 35: Confirmation email sent
```

---

## 6. Retention by Data Category

### 6.1 Short-Term Data (< 90 days)
- Verification codes
- Password reset tokens
- Session cookies
- Failed login attempts

### 6.2 Medium-Term Data (3-12 months)
- User activity logs
- Performance ratings
- Chat history
- System audit logs

### 6.3 Long-Term Data (1-3 years)
- Booking records (per trip completion)
- Account deletion archives
- Admin action logs
- Dispute records

### 6.4 Very Long-Term Data (3-7+ years)
- Booking records (tax hold)
- Payment records (tax hold)
- Legal dispute documents
- Tax audit records

---

## 7. Special Circumstances

### 7.1 Disputed Charges
- Data retained until dispute resolved (typically 30-60 days)
- Booking record kept for chargeback documentation
- Contact info kept to communicate on dispute

### 7.2 Fraud Investigation
- Data retained for 90 days while investigating
- May be extended if referred to police
- User notified of hold reason

### 7.3 Active Booking
- Data retained until booking completes
- Completion = 30 days after trip date (grace period for issues)
- Then retention rules apply

### 7.4 Pending Refund
- Data retained until refund processed
- Typically 5-7 days
- Contact info needed to confirm refund

---

## 8. User Rights & Requests

### 8.1 Right to Know Retention Period
You can request to know:
- How long we keep your data
- Why we keep it
- When we'll delete it

**Submit to:** [privacy@londile-shuttle.co.za](mailto:privacy@londile-shuttle.co.za)
**Response time:** 10 business days

### 8.2 Right to Early Deletion
You can request deletion any time, but we may retain if:
- Retention required by law (tax hold)
- Dispute is active
- Fraud investigation ongoing

### 8.3 Right to Anonymization Instead of Deletion
You can request we anonymize instead of deleting if:
- You want data inaccessible to you but kept for historical record
- We will anonymize and you lose access to booking details

---

## 9. Compliance with Laws

### 9.1 POPIA Compliance
- We comply with POPIA Section 8 (Retention limitation)
- We only keep data as long as needed
- We provide deletion on request

### 9.2 Income Tax Act Compliance
- We keep tax records for 6 years (standard requirement)
- Booking records (evidence of revenue) kept for 7 years
- We cooperate with SARS audits

### 9.3 General Data Protection Regulation (GDPR)
- If you're in EU: GDPR applies to your data
- Your data in EU backup deleted same as SA data
- Right to erasure honored within 30 days

---

## 10. Data Transfers During Retention

Your data may be transferred to:
- **Supabase (South Africa)** - Primary data center, encrypted
- **Vercel (USA)** - Backup and disaster recovery
- **SARS (South Africa)** - Tax authority (if audited)
- **Law enforcement** - If court-ordered

**No commercial transfer:** We never sell or transfer to third-party companies.

---

## 11. Scheduled Deletion Tasks

Our system runs automated deletion jobs:

| Task | Frequency | Data Affected |
|------|-----------|---------------|
| Delete verification codes | Daily | Guest booking codes > 30 days |
| Delete failed logins | Daily | Failed attempts > 90 days |
| Delete session tokens | Hourly | Expired tokens |
| Anonymize guest bookings | Monthly | Bookings reaching 7-year mark |
| Hard delete anonymized data | Quarterly | Old anonymized records > 2 years |
| Purge old backups | Daily | Backups > 30 days old |

---

## 12. Data Retention Exceptions

### 12.1 If SARS (Tax Authority) Audits
- We provide all records for audit period (typically 5 years)
- Retention extended per SARS requirements
- User is notified of audit hold

### 12.2 If There's a Legal Dispute
- Data is preserved per court order
- Cannot be deleted until dispute resolved
- May take 6-12 months or longer

### 12.3 If Referred to Police
- Data provided to law enforcement
- Retention continues while criminal case open
- May take 1-5 years depending on case

---

## 13. Deletion Failure Scenarios

### What If Deletion Fails?
If we accidentally don't delete data on time:
1. We manually investigate
2. Perform emergency hard deletion
3. Notify user within 5 business days
4. Provide explanation and remedial action

### What If Backup Fails to Purge?
If backup servers don't auto-purge:
1. We manually request Supabase delete backup
2. Data deleted within 5 additional days
3. Confirmation provided to user

---

## 14. Request Deletion Process

### Step 1: Submit Request
Email: [support@londile-shuttle.co.za](mailto:support@londile-shuttle.co.za)
Subject: **DATA DELETION REQUEST**
Include: Your full name, email, account ID (if applicable)

### Step 2: Verify Identity
We confirm you're the data subject via:
- Email verification link
- SMS code verification
- Government ID scan (if needed)

### Step 3: Check for Holds
We review:
- Active disputes
- Tax holds
- Legal holds
- Payment pending

### Step 4: Notify Holds
If data can't be fully deleted:
- We explain why
- Offer anonymization alternative
- Provide timeline for full deletion

### Step 5: Execute Deletion
- Anonymize or hard delete per agreement
- Monitor backup deletion (30 days)
- Send confirmation email

### Step 6: Confirmation
- Email sent within 5 business days
- Details of what was deleted
- Retention of any legally-held data

---

## 15. Queries & Complaints

### Retention Questions
**Email:** [privacy@londile-shuttle.co.za](mailto:privacy@londile-shuttle.co.za)
**Response:** Within 10 business days

### Complaints About Retention
**Email:** [complaints@londile-shuttle.co.za](mailto:complaints@londile-shuttle.co.za)
**Response:** Within 10 business days

### POPIA Complaints
**Information Regulator:** https://www.justice.gov.za/inforeg/

---

## ⚖️ LEGAL NOTICE

**THIS POLICY HAS NOT BEEN REVIEWED BY A LAWYER.**

Before publishing:
1. **Have a South African tax attorney review** - Especially tax retention periods
2. **Confirm SARS requirements** - Tax hold periods may differ
3. **Review with Supabase** - Confirm backup deletion policies
4. **Get legal sign-off** - Before launch

**Cost Estimate:** R2,000 - R4,000 for legal review

---

**Version:** 1.0  
**Status:** DRAFT - AWAITING LEGAL REVIEW  
**Last Review:** August 2026  
**Next Review:** 6 months after launch
