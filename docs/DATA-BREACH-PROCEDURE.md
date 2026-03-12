# Data Breach Response Procedure

**Organization:** Preik
**Contact:** hei@preik.ai
**Last updated:** 2026-03-12

---

## 1. Definition

A personal data breach is a security incident leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to personal data (GDPR Art. 4(12)).

Examples:
- Unauthorized access to the database
- Accidental exposure of chat conversations or user data
- Compromised API keys or service credentials
- Data sent to wrong recipient
- Ransomware or malware affecting stored data

## 2. Detection & Reporting

### Internal Discovery
Any team member who suspects a breach must immediately notify the incident lead (CEO/CTO) via the fastest available channel.

### External Report
If a user, customer, or third party reports a potential breach, acknowledge receipt immediately and escalate to the incident lead.

## 3. Response Timeline

| Timeframe | Action |
|-----------|--------|
| **0-1 hours** | Assess severity, contain the breach (revoke keys, block access, etc.) |
| **1-24 hours** | Document: what data, how many affected, cause, remediation steps |
| **Within 48 hours** | Notify affected data controllers (tenant customers) per DPA |
| **Within 72 hours** | Data controllers notify Datatilsynet if required (Art. 33) |
| **Within 30 days** | Post-incident review and final report |

## 4. Containment Checklist

- [ ] Rotate compromised credentials (API keys, service role key, etc.)
- [ ] Revoke affected sessions / tokens
- [ ] Block attacker IP/access if identified
- [ ] Take affected systems offline if necessary
- [ ] Preserve logs and evidence for investigation
- [ ] Verify backup integrity

## 5. Assessment

Determine:
1. **What data was affected?** (chat messages, emails, credentials, etc.)
2. **How many data subjects?** (count of affected users/sessions)
3. **What is the likely impact?** (identity theft risk, financial loss, reputation)
4. **Is notification to Datatilsynet required?** (Yes, unless unlikely to result in risk to data subjects)
5. **Is notification to data subjects required?** (Yes, if high risk to rights and freedoms)

## 6. Notification to Data Controllers (Tenants)

As a data processor, Preik must notify affected tenant customers (data controllers) without undue delay and within 48 hours. The notification must include:

- Nature of the breach
- Categories and approximate number of data subjects
- Categories and approximate number of data records
- Contact details for Preik's responsible person
- Likely consequences
- Measures taken or proposed to address the breach

Template email subject: `[Preik Security] Data Breach Notification - [Date]`

## 7. Notification to Datatilsynet (Art. 33)

The data controller (tenant customer) is responsible for notifying Datatilsynet within 72 hours. Preik assists by providing all necessary information.

Datatilsynet notification portal: https://www.datatilsynet.no/om-datatilsynet/kontakt-oss/avviksmelding/

## 8. Post-Incident Review

Within 30 days of the breach:
1. Root cause analysis
2. Review and update security measures
3. Update this procedure if gaps were identified
4. Document lessons learned
5. Communicate improvements to affected parties

## 9. Record Keeping

All breaches must be documented regardless of whether they require notification (Art. 33(5)). Records are kept for 5 years and include:
- Date and time of discovery
- Nature of the breach
- Data and subjects affected
- Consequences
- Remedial actions taken
- Notifications sent (to controllers, Datatilsynet, data subjects)
