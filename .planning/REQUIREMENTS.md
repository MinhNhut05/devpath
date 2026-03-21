# Requirements: SOHA Program Summarizer

**Defined:** 2026-03-22
**Core Value:** Turn a 4-page detailed program into a polished 1-2 page Canva design in seconds, with correct formatting rules applied automatically.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### File Processing

- [ ] **FILE-01**: User can upload PDF file and system extracts text content accurately (Vietnamese)
- [ ] **FILE-02**: User can upload DOCX file and system extracts text content accurately (Vietnamese)
- [ ] **FILE-03**: User can preview extracted content to verify parsing accuracy before proceeding

### AI Summarization

- [ ] **SUMM-01**: System summarizes detailed program (2-6 pages) into condensed format (1-2 pages) using AI
- [ ] **SUMM-02**: System applies company formatting rules automatically (greeting type, day/session layout, menu section)
- [ ] **SUMM-03**: System auto-detects audience type (school vs corporate) from file content and applies correct greeting
- [ ] **SUMM-04**: User can preview and edit summarized content before Canva design creation
- [ ] **SUMM-05**: System shows progress/loading state during summarization (10-30 seconds)

### Canva Integration

- [ ] **CANV-01**: User can select from fixed templates (1-day tour, 2-day tour, school event, corporate event)
- [ ] **CANV-02**: System creates Canva design from selected template via Canva Connect API with summarized content
- [ ] **CANV-03**: System returns editable Canva link that user can click to edit directly in Canva

### User Management

- [ ] **USER-01**: User can log in with provisioned account (no public registration)
- [ ] **USER-02**: User can log out from any page
- [ ] **USER-03**: User can view history of generated designs (filename, template, date, Canva link)
- [ ] **USER-04**: System shows clear, human-readable error messages for all failure cases

### Admin

- [ ] **ADMN-01**: Admin can create/edit/delete summarization rules (trigger condition -> action)
- [ ] **ADMN-02**: Admin can manage Canva template IDs (map template type to Canva template)
- [ ] **ADMN-03**: Admin can provision user accounts (create/disable)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Processing

- **ADVP-01**: System can handle scanned PDFs via OCR
- **ADVP-02**: System supports batch upload (multiple files at once)
- **ADVP-03**: System supports additional file formats (PPT, Google Docs)

### Notifications

- **NOTF-01**: User receives notification when design is ready (if async processing)
- **NOTF-02**: Admin receives notification of generation errors

### Analytics

- **ANLT-01**: Admin can view usage dashboard (generations per user, per template)
- **ANLT-02**: Admin can view error rate and common failure types

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Direct PDF/image export from web app | Canva handles export better; avoids duplicating Canva's core functionality |
| Mobile app | Internal ops tool; file upload from phone is impractical; desktop-first |
| Real-time collaboration | Canva already provides collaboration on shared edit links |
| Public signup / self-registration | Internal tool; controlled access via admin provisioning only |
| Custom Canva template builder in app | Canva is already the template editor; just manage template IDs |
| Webhook / API public endpoint | Premature for internal tool; add explicit integration later if needed |
| Design versioning in app | Canva already has version history; app tracks by generation event |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FILE-01 | - | Pending |
| FILE-02 | - | Pending |
| FILE-03 | - | Pending |
| SUMM-01 | - | Pending |
| SUMM-02 | - | Pending |
| SUMM-03 | - | Pending |
| SUMM-04 | - | Pending |
| SUMM-05 | - | Pending |
| CANV-01 | - | Pending |
| CANV-02 | - | Pending |
| CANV-03 | - | Pending |
| USER-01 | - | Pending |
| USER-02 | - | Pending |
| USER-03 | - | Pending |
| USER-04 | - | Pending |
| ADMN-01 | - | Pending |
| ADMN-02 | - | Pending |
| ADMN-03 | - | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
