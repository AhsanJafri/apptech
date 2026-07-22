# SupplyGuard: Complete Product Plan

> Working product name: **SupplyGuard**. This document defines a greenfield, commercial ads.txt and app-ads.txt revenue-protection platform. The final product name can be changed without affecting the plan.

SupplyGuard continuously verifies that websites and apps remain authorized to monetize, detects crawler and seller problems, and gives customers exact steps to fix issues before they affect advertising revenue.

The complete product consists of:

- A mobile application
- A web dashboard
- A reliable monitoring backend
- Ads.txt and app-ads.txt validation
- Google crawler diagnostics
- Sellers.json verification
- File change monitoring
- Alerts and incident management
- Managed file publishing
- Agency and team features
- Reports, APIs, and integrations

## Table of contents

1. [Product vision](#1-product-vision)
2. [Target customers](#2-target-customers)
3. [Product editions](#3-product-editions)
4. [Product platforms](#4-product-platforms)
5. [Feature roadmap](#5-feature-roadmap)
6. [Authentication](#6-authentication)
7. [Organizations and permissions](#7-organizations-and-permissions)
8. [Property types](#8-property-types)
9. [Onboarding](#9-onboarding)
10. [Scanner and crawler](#10-scanner-and-crawler)
11. [Google crawler simulator](#11-google-crawler-simulator)
12. [File parsing](#12-file-parsing)
13. [Expected seller lines](#13-expected-seller-lines)
14. [Sellers.json verification](#14-sellersjson-verification)
15. [Risk and scoring engine](#15-risk-and-scoring-engine)
16. [Change monitoring](#16-change-monitoring)
17. [Incident management](#17-incident-management)
18. [Guided remediation](#18-guided-remediation)
19. [Alerts](#19-alerts)
20. [Managed file editor and publishing](#20-managed-file-editor-and-publishing)
21. [Reports](#21-reports)
22. [Application screens](#22-application-screens)
23. [Technical architecture](#23-technical-architecture)
24. [Data model](#24-data-model)
25. [API design](#25-api-design)
26. [Scheduling and job processing](#26-scheduling-and-job-processing)
27. [Billing](#27-billing)
28. [Security and privacy](#28-security-and-privacy)
29. [Testing](#29-testing)
30. [Observability and operations](#30-observability-and-operations)
31. [Product analytics](#31-product-analytics)
32. [Development roadmap](#32-development-roadmap)
33. [MVP acceptance criteria](#33-mvp-acceptance-criteria)
34. [Launch strategy](#34-launch-strategy)
35. [Features to avoid initially](#35-features-to-avoid-initially)
36. [Product positioning](#36-product-positioning)

## 1. Product vision

### Problem

Publishers and app developers frequently experience:

- Missing ads.txt or app-ads.txt files
- Incorrect publisher IDs
- Deleted seller entries
- `DIRECT` and `RESELLER` mistakes
- App-store developer website mismatches
- Redirect and HTTPS problems
- Google crawler restrictions
- Sellers.json inconsistencies
- Unauthorized sellers
- Large files that are difficult to maintain
- No reliable record of when something changed
- No notification until revenue is already affected

Incorrect authorization can prevent advertising demand from spending, while app-ads.txt is intended to prevent counterfeit inventory. SupplyGuard turns this technical configuration problem into an understandable revenue-protection workflow.

### Solution

SupplyGuard should:

1. Discover the correct ads.txt or app-ads.txt URL.
2. Scan files automatically.
3. Diagnose crawler accessibility.
4. Validate every record.
5. Cross-check seller IDs with sellers.json.
6. Detect meaningful changes.
7. Create incidents for important failures.
8. Notify the correct people.
9. Explain how to fix every problem.
10. Verify that the fix worked.
11. Optionally host and publish the file.
12. Produce compliance and client reports.

### Primary customer outcome

The customer should always be able to answer:

- Is my inventory authorized to monetize?
- Can Google and other crawlers access my file?
- Are my important seller IDs present?
- Did anything important change?
- Are the declared sellers legitimate?
- What needs to be fixed immediately?
- Who made or approved a change?

### Product principles

- Lead with customer and revenue impact, not parser terminology.
- Provide a fix for every supported finding.
- Separate critical authorization failures from minor formatting issues.
- Make monitoring independent of the mobile app being open.
- Preserve evidence and history for auditing.
- Never modify or publish a customer's file without explicit authorization.
- Use deterministic validation rules for compliance decisions.
- Avoid claiming exact financial loss without actual revenue data.

## 2. Target customers

### Independent app developers

Needs:

- Simple app-ads.txt setup
- Google Play and Apple App Store support
- AdMob seller-line verification
- Developer website diagnostics
- Easy hosting
- Immediate alerts

Likely price: **$9–29/month**.

### Website publishers

Needs:

- Ads.txt validation
- Google Ad Manager support
- Multiple monetization partners
- File history
- Revenue-risk detection
- Managed publishing

Likely price: **$29–99/month**.

### Publishing groups

Needs:

- Hundreds of domains
- Bulk operations
- Teams and permissions
- Portfolio health
- Audit records
- API and webhooks

Likely price: **$149–499/month**.

### Agencies and consultants

Needs:

- Separate client workspaces
- White-label reports
- Bulk imports
- Scheduled client reports
- Team collaboration
- Client access

Likely price: **$199–999/month**.

### SSPs, ad networks, and monetization companies

Needs:

- Monitor whether publishers include their seller IDs
- Detect competitor additions and removals
- Discover prospects
- Understand market-level changes
- Connect signals with CRM systems

Likely price: **$499–5,000+/month**.

## 3. Product editions

### SupplyGuard Protect

Designed for publishers and app developers.

Includes:

- Monitoring
- Validation
- Alerts
- Sellers.json verification
- Managed publishing
- Compliance reporting

### SupplyGuard Intelligence

Designed for SSPs, networks, and sales teams.

Includes:

- Large-scale public file monitoring
- Competitor signals
- Seller adoption reports
- Prospect discovery
- CRM integrations
- Market analytics

SupplyGuard Protect should be built first. SupplyGuard Intelligence requires a much larger crawler infrastructure and a different sales strategy.

## 4. Product platforms

### Mobile application

Best suited to:

- Receive alerts
- View property health
- Acknowledge incidents
- Approve changes
- Run checks
- Share reports
- Perform quick actions

Recommended technology:

- Expo and React Native
- TypeScript
- React Navigation
- TanStack Query or Redux Toolkit
- Expo Notifications
- Secure token storage
- Sentry

### Web dashboard

Best suited to:

- Manage large files
- Compare versions
- Perform bulk operations
- Manage agency accounts
- Generate reports
- Manage teams
- Configure billing and integrations

Recommended technology:

- Next.js
- TypeScript
- Tailwind CSS
- A mature accessible component library
- TanStack Query
- A charting library

### Backend

Scheduled monitoring cannot depend on the mobile app.

Recommended technology:

- Node.js and TypeScript
- NestJS or Fastify
- PostgreSQL
- Redis and BullMQ for jobs
- Object storage for snapshots and reports
- Cloud Run, AWS ECS, or equivalent container hosting
- Cloud Scheduler, EventBridge, or an equivalent scheduler

Firebase Authentication can be retained for a faster initial release while application data is stored in PostgreSQL.

## 5. Feature roadmap

### Release 1: Sellable MVP

- Account creation and login
- Organizations and basic memberships
- Website monitoring
- Google Play app monitoring
- Apple App Store monitoring
- Manual and scheduled scans
- Ads.txt and app-ads.txt parser
- Crawler-accessibility diagnostics
- Expected seller-line tracking
- Status and risk score
- Email and push alerts
- Check history
- Version differences
- Guided remediation
- Billing and plan limits
- Basic PDF reports

### Release 2: Professional product

- Sellers.json cross-verification
- Slack, Telegram, and webhook alerts
- Incident management
- Weekly reports
- Bulk CSV import
- Client workspaces
- Roles and permissions
- Public compliance reports
- Managed file editor
- WordPress, Cloudflare, and GitHub publishing

### Release 3: Enterprise product

- SSO and SAML
- Approval workflows
- Complete audit logs
- Service-level agreements
- Custom retention
- API keys
- Large portfolio analytics
- White-label reports
- Dedicated crawler regions
- Custom notification policies

### Release 4: Intelligence product

- Competitor monitoring
- Seller adoption analytics
- Prospect signals
- CRM integrations
- Market-level search
- Data exports
- Historical industry trends

## 6. Authentication

Support:

- Email and password
- Email verification
- Password reset
- Google login
- Apple login
- Optional multi-factor authentication
- Session management
- Device and session revocation
- Account deletion
- Personal data export

Enterprise expansion:

- SAML
- OpenID Connect
- Enforced MFA
- Domain-based access policies

Authentication acceptance criteria:

- Unverified accounts cannot access paid monitoring.
- Reset links expire and can only be used once.
- Users can view and revoke active sessions.
- Account deletion enters a recoverable grace period before permanent removal.
- Every protected API request verifies both identity and organization membership.

## 7. Organizations and permissions

Every resource should belong to an organization rather than directly to a user.

An organization contains:

- Name
- Logo
- Billing email
- Time zone
- Default alert settings
- Subscription
- Members
- Client workspaces
- Properties
- Integrations
- Reports
- Audit records

### Roles

| Role | Main permissions |
| --- | --- |
| Owner | Full access, ownership transfer, organization deletion |
| Administrator | Members, properties, integrations, reports, settings |
| Editor | Properties, seller lines, file drafts, incident actions |
| Analyst | Scans, findings, history, reports, comments |
| Viewer | Read-only access |
| Billing manager | Subscription, invoices, and payment methods only |

### Client workspaces

Agency organizations can create a workspace for each client. A workspace contains its own:

- Properties
- Users
- Branding
- Reports
- Alert policies
- API permissions

Organization owners must be able to grant a client access to only its workspace without exposing other clients.

## 8. Property types

### Website property

Required:

- Display name
- Root hostname
- Whether ads.txt is monitored
- Whether app-ads.txt is monitored
- Monitoring frequency

Optional:

- Tags
- Expected owner domain
- Expected seller IDs
- Client workspace
- Notification policy

### Android app

Required:

- Google Play package ID or listing URL

Automatically discover:

- App name
- Icon
- Developer name
- Developer website
- Developer hostname
- Store country
- app-ads.txt URL

### iOS app

Required:

- App Store URL or numeric app ID

Automatically discover:

- App name
- Icon
- Developer
- Marketing or developer website
- Developer hostname
- Country storefront
- app-ads.txt URL

### Combined app

Allow one product record to contain:

- Android package ID
- Apple app ID
- Shared developer domain
- Shared or separate monitoring rules

### Property lifecycle

Statuses:

- Pending setup
- Active
- Paused
- Needs attention
- Archived
- Deleted

Archived properties retain history but do not consume scan capacity. Deletion follows the configured retention policy.

## 9. Onboarding

### First-time onboarding

1. User creates an account.
2. User verifies their email.
3. User creates an organization.
4. User chooses a role: app developer, publisher, agency, or ad network.
5. User adds the first property.
6. SupplyGuard runs an immediate scan.
7. The user receives a prioritized report.
8. The user enters important seller IDs.
9. The user configures alerts.
10. The user starts a trial.

### Website onboarding

1. Enter `example.com`.
2. Normalize the hostname.
3. Resolve DNS.
4. Check HTTP and HTTPS.
5. Check ads.txt and app-ads.txt.
6. Check root and `www` redirect behavior.
7. Inspect robots.txt.
8. Parse discovered files.
9. Generate a health score.
10. Recommend expected seller entries.

### App onboarding

1. Paste a store URL or identifier.
2. Resolve the store listing.
3. Extract the developer website.
4. Verify the website is publicly visible.
5. Normalize the developer hostname.
6. Check app-ads.txt.
7. Check HTTP and HTTPS accessibility.
8. Ask for AdMob or other publisher IDs.
9. Confirm exact matches.
10. Enable recurring monitoring.

### Onboarding failure states

Provide explicit instructions when:

- A store listing is private
- An app is unavailable in the selected country
- The developer website is missing
- The developer website redirects unexpectedly
- app-ads.txt is hosted on the wrong hostname
- The file is unreachable
- The publisher ID is missing
- The supplied identifier is invalid

## 10. Scanner and crawler

### Scan lifecycle

```text
Scheduler
   ↓
Scan job
   ↓
URL discovery
   ↓
Safe network fetch
   ↓
HTTP and crawler diagnostics
   ↓
Parser
   ↓
Seller matching
   ↓
Sellers.json verification
   ↓
Risk engine
   ↓
Snapshot and change detection
   ↓
Incident and notifications
```

### Fetch behavior

For each monitored file:

- Try HTTPS
- Test HTTP separately when crawler simulation is enabled
- Follow a limited number of redirects
- Record every redirect
- Resolve DNS safely
- Enforce connection and total timeouts
- Limit response size
- Record status code
- Record content type
- Record encoding
- Record response time
- Record final URL
- Calculate a content hash
- Detect compressed responses
- Detect redirect loops
- Detect soft 404 pages
- Detect HTML returned instead of plain text
- Detect invalid UTF-8
- Detect byte-order marks
- Capture cache and server headers where useful

### Crawler safety

Because customers can submit hostnames, the backend must protect against server-side request forgery.

Block:

- Private IP ranges
- Loopback addresses
- Link-local addresses
- Cloud metadata endpoints
- Internal DNS names
- Unsupported protocols
- Redirects to blocked networks

Enforce:

- Maximum redirect count
- Maximum file size
- Per-host rate limits
- Request concurrency limits
- DNS rebinding protection
- Revalidation of every redirect target
- A descriptive user agent and support URL

## 11. Google crawler simulator

The Google crawler simulator should be a named, marketable product feature.

### Tests

- Does the root URL return HTTP 200?
- Is HTTPS available?
- Is HTTP available?
- Does the root domain redirect to `www` correctly?
- Does the file redirect to a different hostname?
- Is any redirect blocked or looping?
- Does robots.txt block `Google-adstxt`?
- Does robots.txt block Googlebot?
- Is the response actually HTML?
- Is the response a soft 404?
- Is the content valid UTF-8?
- Are hidden characters present?
- Is the file located at the root?
- Does the app-store developer website match the host?
- Is the app publicly listed?
- Was the store website recently changed?
- Is the response intermittently failing?
- Is a CDN or firewall treating crawler traffic differently?

### Diagnostic output

Do not only show a technical error. Explain the likely discovery problem:

```text
Likely reason Google cannot verify this app

The Google Play developer website points to:
www.example.com

Your app-ads.txt file is hosted on:
files.example.net

Google starts its lookup from the developer website hostname,
so it may not discover this file.
```

Each diagnostic includes:

- Severity
- Customer impact
- Evidence
- Corrective steps
- Retest button
- Relevant external documentation

## 12. File parsing

### Seller record

Parse:

```text
advertising-system.com, seller-id, DIRECT, certification-id
```

Store:

- Advertising system domain
- Publisher or seller ID
- Relationship
- Certification authority ID
- Source line
- Raw normalized line
- Associated comment
- Validation state

### Variables

Support current IAB variables, including:

- `OWNERDOMAIN`
- `MANAGERDOMAIN`
- `CONTACT`
- `SUBDOMAIN`
- `INVENTORYPARTNERDOMAIN`

The parser should be version-aware so future specification updates can be introduced without rewriting the entire parser.

### Validation rules

Detect:

- Missing fields
- Too many fields
- Empty publisher ID
- Invalid advertising-system hostname
- Invalid relationship
- Invalid certification ID format
- Duplicate records
- Conflicting relationships
- Hidden Unicode characters
- Invalid encoding
- Invalid comments
- Invalid variable declarations
- Duplicate variables
- Suspicious whitespace
- HTML content
- Placeholder misuse
- Excessively large files
- Missing owner information
- Owner and manager inconsistencies

Keep parser rules separate from product severity rules. A syntactic issue is not always a revenue-critical issue.

## 13. Expected seller lines

Users should be able to define records that must remain present.

### Exact match

Compare:

- Advertising system
- Seller ID
- Relationship
- Certification ID when required

### Flexible match

Compare:

- Advertising system only
- Advertising system and seller ID
- Relationship optionally

### File-specific match

Apply an expectation to:

- ads.txt only
- app-ads.txt only
- Both files

### Seller states

- Found
- Missing
- Relationship mismatch
- Certification mismatch
- Duplicate
- Invalid
- Not checked
- Sellers.json mismatch

### Bulk management

- CSV import
- Paste multiple lines
- Template import
- Copy from another property
- Apply to a property group
- Export
- Bulk approval
- Bulk removal

## 14. Sellers.json verification

For each advertising system:

1. Locate its sellers.json file.
2. Download it safely.
3. Cache it globally.
4. Validate the JSON structure.
5. Locate the seller ID.
6. Compare the seller type.
7. Compare seller name and domain.
8. Check confidentiality.
9. Check the relationship with ads.txt or app-ads.txt.
10. Record when the seller was last observed.

### Verification states

- Verified
- Seller ID missing
- Sellers.json unreachable
- Invalid sellers.json
- Seller confidential
- Seller type mismatch
- Seller domain mismatch
- Stale data
- Unknown

### Relationship checks

Examples:

- Ads.txt says `DIRECT`, but sellers.json says `INTERMEDIARY`.
- Ads.txt says `RESELLER`, but sellers.json says `PUBLISHER`.
- Seller ID does not exist.
- Seller domain conflicts with `OWNERDOMAIN`.
- Advertising system has no valid sellers.json.
- Seller disappeared since the previous scan.

### Caching

Sellers.json files may be very large. Do not download one copy for every customer.

Use:

- A global cache per advertising system
- Conditional requests using ETag or Last-Modified
- Compressed storage
- Streaming JSON parsing for large files
- Refresh intervals based on observed update frequency
- Shared verification results

## 15. Risk and scoring engine

### Score structure

Provide:

- Overall score
- Crawler accessibility score
- Authorization score
- Seller transparency score
- File quality score
- Monitoring reliability score

Example:

```text
Overall Revenue Protection Score: 78/100

Authorization:          55/100
Crawler accessibility: 90/100
Seller transparency:   70/100
File quality:           95/100
```

### Severity levels

#### Critical

Likely to block or materially affect monetization:

- File missing
- Important publisher ID removed
- Store developer domain does not lead to app-ads.txt
- HTTP 404
- App cannot be verified
- Expected direct seller missing

#### High

Significant authorization or supply-chain risk:

- `DIRECT` or `RESELLER` mismatch
- Seller ID missing from sellers.json
- Crawler blocked by robots.txt
- File intermittently unavailable
- Unexpected critical seller change

#### Medium

May reduce trust or create operational problems:

- Duplicate seller entries
- Missing owner variables
- Redirect complexity
- Invalid certification ID

#### Low

File hygiene:

- Formatting
- Comments
- Ordering
- Nonstandard spacing

### Scoring model

Start at 100 and deduct weighted penalties.

Example defaults:

- Critical issue: −30
- High issue: −15
- Medium issue: −7
- Low issue: −2

Apply category caps so many formatting warnings do not create a lower score than one missing critical seller ID. Store the rule weights in configuration so scoring can evolve without migrating historical scan data.

Never advertise an exact financial loss unless real revenue data has been integrated and the calculation can be explained.

## 16. Change monitoring

### Snapshot comparison

For every successful scan, compare:

- Content hash
- Seller entries
- Variables
- Redirect destination
- HTTP status
- Developer website
- Store metadata
- Sellers.json relationships

### Change types

- Seller added
- Seller removed
- Relationship changed
- Publisher ID changed
- Certification ID changed
- Variable added or removed
- Developer website changed
- Redirect changed
- Availability changed
- robots.txt changed
- Sellers.json entry changed

### Change classification

- Expected
- Approved
- Unapproved
- Informational
- Potentially dangerous
- Revenue critical

### Visual difference

```diff
- google.com, pub-111111, DIRECT, f08c47fec0942fa0
+ google.com, pub-222222, DIRECT, f08c47fec0942fa0

+ newssp.com, account-55, RESELLER
```

### Approval workflow

1. A change is detected.
2. An incident or approval request is created.
3. An assigned team member reviews it.
4. The member approves, rejects, or comments.
5. The decision is recorded in the audit log.
6. Future identical changes can optionally be auto-approved.

## 17. Incident management

A finding is one scan observation. An incident persists across scans until recovery or manual resolution.

### Incident fields

- Organization
- Property
- Category
- Severity
- Status
- First detected time
- Last detected time
- Duration
- Evidence
- Assigned member
- Comments
- Resolution
- Notification state
- Stable finding fingerprint

### Incident statuses

- Open
- Acknowledged
- Investigating
- Waiting for external crawler
- Resolved
- Ignored
- Accepted risk

### Deduplication

Do not create a new alert after every scan. Create a stable fingerprint based on:

- Property
- File
- Rule
- Seller ID when applicable
- Relevant evidence

### Recovery

Resolve an incident after a configurable recovery threshold, such as three consecutive successful scans. Notify subscribed users when recovery occurs and record whether the incident was automatically or manually resolved.

## 18. Guided remediation

Every supported rule must have a remediation template.

Each issue page contains:

- Plain-language title
- What happened
- Why it matters
- Technical evidence
- Exact correction
- Copy button
- Platform-specific instructions
- External documentation
- Retest button
- Assignment action

### Hosting guides

Provide instructions for:

- WordPress
- Cloudflare
- Firebase Hosting
- GitHub Pages
- Vercel
- Netlify
- cPanel
- Nginx
- Apache
- Shopify
- Custom servers

### Example

```text
Issue: Google publisher ID is missing

Expected:
google.com, pub-1234567890, DIRECT, f08c47fec0942fa0

Why it matters:
Google may treat inventory as unauthorized.

Recommended action:
Add the line above to app-ads.txt at the root of the developer
website linked from the app-store listing.
```

## 19. Alerts

### Channels

- Mobile push
- Email
- Slack
- Microsoft Teams
- Telegram
- Discord
- Webhook
- SMS for enterprise customers

### Alert policies

Users can configure:

- Immediate critical alerts
- Immediate all-change alerts
- Daily summary
- Weekly summary
- Recovery alerts
- Escalation delay
- Quiet hours
- Time zone
- Property-specific overrides

### Alert contents

Every alert includes:

- Property
- Severity
- Issue
- First detected time
- Customer impact
- Suggested fix
- Deep link
- Acknowledge action

### Escalation example

1. Push notification immediately.
2. Email after 15 minutes.
3. Slack message after 30 minutes.
4. Notify an administrator after two hours.
5. Repeat once daily until acknowledged.

## 20. Managed file editor and publishing

### Editor capabilities

- Import an existing file
- Syntax highlighting
- Table and raw-text modes
- Search and filtering
- Duplicate detection
- Inline validation
- Partner grouping
- Comments
- Draft versions
- Preview
- Approval
- Publish
- Rollback

### Publishing options

- SupplyGuard-hosted endpoint
- WordPress plugin
- Cloudflare Worker
- GitHub repository
- SFTP
- API or webhook
- Download for manual publishing

### Hosted option

Customers could configure:

```text
example.com/ads.txt
       ↓ redirect or proxy
SupplyGuard-managed file
```

Requirements:

- Highly available CDN
- Version history
- Emergency rollback
- Appropriate cache control
- Public endpoint monitoring
- No application authentication on public file endpoints
- Signed administrative changes
- Strict tenant isolation

Because publishing affects monetization, enterprise customers should be able to require two-person approval.

## 21. Reports

### Report types

- Property health report
- Portfolio health report
- Weekly change report
- Seller authorization report
- Sellers.json verification report
- Incident report
- Compliance certificate
- Client report
- Executive summary

### Formats

- Web page
- PDF
- CSV
- JSON
- Scheduled email
- API response

### Public report

Allow an optional share link:

```text
example.com
Verified by SupplyGuard
Last successful scan: 22 July 2026
Crawler accessibility: Passed
Expected sellers: 12/12
Open critical issues: 0
```

Public reports must not expose private seller expectations, revenue data, internal comments, or organization membership.

## 22. Application screens

### Mobile navigation

#### Dashboard

- Overall score
- Critical incidents
- Properties needing attention
- Recent changes
- Monitoring status

#### Properties

- Search
- Filters
- Tags
- Health status
- Last check
- Next check

#### Alerts

- Open incidents
- Acknowledged incidents
- Resolved incidents
- Assigned incidents

#### Reports

- Recent reports
- Share report
- Export PDF

#### Settings

- Account
- Organization
- Notifications
- Billing
- Integrations
- Security

### Property detail

Tabs:

1. Overview
2. Issues
3. Files
4. Sellers
5. Changes
6. History
7. Settings

### Web-first screens

- File editor
- Bulk import
- Team management
- Client workspaces
- Approval queue
- Analytics
- API keys
- Integration management
- Billing administration

### Internal administrative dashboard

Internal staff need:

- Customer lookup
- Subscription status
- Failed job inspection
- Crawler queue status
- Email and push delivery status
- System incidents
- Abuse controls
- Feature flags
- Validation-rule configuration
- Support impersonation with mandatory audit logging

## 23. Technical architecture

```text
Mobile app                 Web dashboard
    │                            │
    └────────── HTTPS API ───────┘
                 │
          Authentication
                 │
         Application backend
          │       │       │
          │       │       └── PostgreSQL
          │       └────────── Object storage
          └────────────────── Redis/job queue
                                  │
                           Scheduler/workers
                         │        │         │
                    Store APIs  File crawl  Sellers.json
                                  │
                         Findings/risk engine
                                  │
                       Incidents/notifications
                        │      │      │
                      Push   Email   Webhooks
```

### Service boundaries

Recommended initial services:

- API service
- Scheduler service
- Crawler worker
- Sellers.json worker
- Notification worker
- Report worker

These can begin as modules in one codebase and deploy separately only when scaling requirements justify it.

### Environments

Maintain:

- Local development
- Automated test
- Staging
- Production

Use different databases, queues, storage buckets, notification credentials, and billing accounts for each non-local environment.

## 24. Data model

### `users`

- `id`
- `email`
- `display_name`
- `email_verified_at`
- `created_at`
- `last_login_at`
- `status`

### `organizations`

- `id`
- `name`
- `slug`
- `logo_url`
- `timezone`
- `plan_id`
- `billing_customer_id`
- `created_at`

### `memberships`

- `organization_id`
- `user_id`
- `role`
- `status`
- `invited_by`
- `joined_at`

### `workspaces`

- `id`
- `organization_id`
- `name`
- `client_name`
- `branding`
- `status`

### `properties`

- `id`
- `organization_id`
- `workspace_id`
- `type`
- `name`
- `hostname`
- `status`
- `score`
- `monitoring_frequency`
- `notifications_enabled`
- `next_scan_at`
- `created_at`

### `store_listings`

- `id`
- `property_id`
- `platform`
- `store_identifier`
- `country`
- `listing_url`
- `developer_name`
- `developer_website`
- `last_resolved_at`

### `monitored_files`

- `id`
- `property_id`
- `file_type`
- `expected_url`
- `resolved_url`
- `enabled`
- `last_status`
- `last_success_at`

### `scan_jobs`

- `id`
- `property_id`
- `trigger`
- `state`
- `scheduled_at`
- `started_at`
- `completed_at`
- `attempt_count`

### `scan_results`

- `id`
- `scan_job_id`
- `monitored_file_id`
- `status_code`
- `response_time_ms`
- `content_hash`
- `content_type`
- `final_url`
- `score`
- `checked_at`

### `seller_entries`

- `id`
- `scan_result_id`
- `system_domain`
- `seller_id`
- `relationship`
- `certification_id`
- `source_line`
- `normalized_hash`

### `expected_sellers`

- `id`
- `property_id`
- `file_type`
- `system_domain`
- `seller_id`
- `relationship`
- `certification_id`
- `match_mode`
- `criticality`

### `findings`

- `id`
- `scan_result_id`
- `rule_code`
- `severity`
- `category`
- `title`
- `evidence`
- `remediation_code`
- `fingerprint`

### `incidents`

- `id`
- `property_id`
- `fingerprint`
- `severity`
- `status`
- `assigned_user_id`
- `first_detected_at`
- `last_detected_at`
- `resolved_at`

### `snapshots`

- `id`
- `monitored_file_id`
- `content_hash`
- `storage_key`
- `captured_at`
- `retention_until`

### `change_events`

- `id`
- `property_id`
- `event_type`
- `severity`
- `before_data`
- `after_data`
- `detected_at`
- `approval_status`

### `notification_channels`

- `id`
- `organization_id`
- `type`
- `configuration_encrypted`
- `verified_at`
- `enabled`

### `reports`

- `id`
- `organization_id`
- `property_id`
- `report_type`
- `storage_key`
- `share_token`
- `expires_at`

### `audit_logs`

- `id`
- `organization_id`
- `actor_user_id`
- `action`
- `resource_type`
- `resource_id`
- `before_data`
- `after_data`
- `ip_address`
- `created_at`

## 25. API design

Use versioned routes such as `/api/v1`.

### Authentication

```text
POST   /auth/register
POST   /auth/login
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/logout
GET    /auth/sessions
DELETE /auth/sessions/:id
```

### Organizations

```text
GET    /organizations
POST   /organizations
GET    /organizations/:id
PATCH  /organizations/:id
GET    /organizations/:id/members
POST   /organizations/:id/invitations
PATCH  /organizations/:id/members/:userId
DELETE /organizations/:id/members/:userId
```

### Properties

```text
GET    /properties
POST   /properties
GET    /properties/:id
PATCH  /properties/:id
DELETE /properties/:id
POST   /properties/:id/scan
GET    /properties/:id/health
GET    /properties/:id/history
GET    /properties/:id/changes
```

### Sellers

```text
GET    /properties/:id/sellers
POST   /properties/:id/expected-sellers
POST   /properties/:id/expected-sellers/import
PATCH  /expected-sellers/:id
DELETE /expected-sellers/:id
GET    /seller-systems/:domain/status
```

### Incidents

```text
GET  /incidents
GET  /incidents/:id
POST /incidents/:id/acknowledge
POST /incidents/:id/assign
POST /incidents/:id/resolve
POST /incidents/:id/ignore
POST /incidents/:id/comments
```

### Reports

```text
POST /reports
GET  /reports
GET  /reports/:id
POST /reports/:id/share
POST /reports/:id/revoke
```

### Integrations

```text
GET    /integrations
POST   /integrations/slack
POST   /integrations/telegram
POST   /integrations/webhooks
POST   /integrations/:id/test
DELETE /integrations/:id
```

### API conventions

- Cursor pagination for large collections
- Idempotency keys for mutation endpoints that may be retried
- Consistent error envelopes
- Request IDs in responses and logs
- Rate-limit headers
- UTC timestamps in ISO 8601 format
- OpenAPI documentation
- Signed webhooks with replay protection

## 26. Scheduling and job processing

### Job types

- Resolve store listing
- Scan monitored file
- Parse file
- Refresh sellers.json
- Match expected sellers
- Calculate risk score
- Detect changes
- Update incident
- Send notification
- Generate report
- Clean expired snapshots

### Scheduling model

Do not create one system cron entry per property.

1. The scheduler runs every minute.
2. It selects properties whose `next_scan_at` has passed.
3. It creates scan jobs.
4. Workers process jobs with concurrency limits.
5. The next scan time is calculated after completion.
6. Failed jobs use exponential retry.
7. Exhausted jobs enter a dead-letter queue.

### Retry rules

Retry:

- Timeouts
- Temporary DNS failures
- HTTP 429
- Temporary 5xx failures

Usually do not retry immediately:

- HTTP 404
- Invalid hostname
- Permanent redirect loop
- Unsupported protocol

Require multiple failures before declaring a transient availability incident critical.

### Idempotency

- A scheduled time creates at most one scan job per property.
- Replaying a completed job must not duplicate incidents.
- Notification jobs record provider message IDs.
- Report jobs reuse an existing identical result when safe.

## 27. Billing

Use Stripe or an equivalent provider.

### Billable dimensions

- Number of properties
- Monitoring frequency
- History retention
- Team members
- Client workspaces
- Reports
- API usage
- Notification channels
- Managed hosting
- Market intelligence volume

### Suggested plans

| Plan | Properties | Monitoring | Main features | Price |
| --- | ---: | --- | --- | ---: |
| Free | 1 | Manual or daily | Basic validation | $0 |
| Developer | 10 | Daily | Push/email and crawler diagnostics | $19/month |
| Pro | 50 | Hourly | Sellers.json, reports, change intelligence | $69/month |
| Agency | 250 | 15–60 minutes | Clients, teams, white-label reports | $249/month |
| Enterprise | Custom | Custom | SSO, SLA, API, dedicated support | Custom |

### Trial

- 14-day Pro trial
- No payment method required initially
- Full scan and sellers.json report
- Downgrade instead of immediate deletion when the trial ends
- Preserve history for 30 days

### Billing requirements

- Customer billing portal
- Invoice history
- Tax collection where required
- Upgrade and downgrade proration
- Grace period after payment failure
- Webhook reconciliation
- Server-side plan enforcement
- Usage warnings before limits are reached

## 28. Security and privacy

### Essential controls

- Organization-level tenant isolation
- Role-based authorization
- Encrypted integration credentials
- TLS everywhere
- Secret manager for backend credentials
- Database backups
- Audit logging
- Rate limiting
- Signed webhook requests
- API key rotation
- Secure password and session policies
- Dependency scanning
- Static security analysis
- Regular penetration testing

### Crawler controls

- SSRF prevention
- DNS rebinding prevention
- Private network blocking
- Response-size limits
- Safe redirect handling
- Rate limits per hostname
- Identifiable user agent
- Abuse monitoring

### Data retention

Suggested defaults:

- Parsed scan results: 12 months
- Raw snapshots: 90 days
- Incident history: 24 months
- Audit logs: 24 months
- Deleted-account grace period: 30 days

Enterprise plans can offer custom retention.

### Compliance preparation

Prepare for:

- GDPR data export and deletion
- Privacy policy
- Cookie consent for web analytics
- Terms of service
- Subprocessor list
- Data processing agreement
- Incident-response policy

## 29. Testing

### Unit tests

Cover:

- Domain normalization
- URL safety
- Ads.txt parser
- Variable parser
- Seller matching
- Relationship validation
- Risk scoring
- Change detection
- Incident fingerprinting
- Plan limits

### Golden parser fixtures

Maintain example files for:

- Fully valid files
- Empty files
- Byte-order marks
- Invalid UTF-8
- Inline comments
- Duplicate entries
- Large files
- Invalid relationships
- HTML soft 404 responses
- Redirected files
- Missing owner domain
- Conflicting records

### Integration tests

Test:

- HTTP fetcher
- Redirect handling
- DNS safety
- Store lookup
- Sellers.json retrieval
- Database transactions
- Queue retries
- Email and push providers
- Stripe webhooks

### End-to-end tests

Cover this complete lifecycle:

1. A user signs up.
2. The user adds a website.
3. A scan completes.
4. A finding appears.
5. An alert is delivered.
6. The user fixes the file.
7. Recovery is detected.
8. The incident resolves.
9. A report is generated.

### Load tests

Measure:

- Properties scanned per minute
- Concurrent hosts
- Large sellers.json parsing
- Alert bursts
- Portfolio dashboard queries
- Report generation

### Release gates

Every production release must pass:

- Type checking
- Linting
- Unit tests
- Integration tests for affected services
- Database migration validation
- Dependency vulnerability scan
- Staging smoke test

## 30. Observability and operations

Use:

- Sentry for application errors
- OpenTelemetry for distributed tracing
- Centralized logs
- Infrastructure metrics
- Queue monitoring
- Synthetic checks
- Public status page

### Operational metrics

Track:

- Scan success rate
- Scan duration
- Queue delay
- Retry rate
- DNS failure rate
- HTTP status distribution
- Notification delivery rate
- Sellers.json cache hit rate
- Store-resolution success rate
- Incidents opened and recovered
- System cost per scan

### Internal alerts

Notify engineering when:

- Queue delay exceeds its threshold
- Scan failure rate increases unexpectedly
- A crawler region fails
- Database connections are exhausted
- Notifications fail
- Store resolution breaks
- Billing webhooks fail
- Backup verification fails

### Backup and recovery

- Automated database backups
- Point-in-time recovery
- Object-store versioning where appropriate
- Quarterly restore exercises
- Documented recovery-time and recovery-point objectives
- Separate backup access credentials

## 31. Product analytics

Track events such as:

- Account created
- Property added
- First scan completed
- Critical issue found
- Expected seller added
- Issue fixed
- Alert channel connected
- Report shared
- Team member invited
- Trial started
- Subscription purchased
- Subscription canceled

### Primary business metrics

- Time to first successful scan
- Activation rate
- Properties per organization
- Percentage of customers enabling alerts
- Percentage finding at least one actionable issue
- Issue-resolution rate
- Weekly active organizations
- Trial-to-paid conversion
- Monthly recurring revenue
- Customer acquisition cost
- Churn
- Expansion revenue

### North-star metric

> Number of actively protected properties that completed a successful scan during the last seven days.

## 32. Development roadmap

Assumption: two full-stack developers, one part-time designer, and approximately six months.

### Sprint 0: Discovery and specifications

Duration: **1–2 weeks**.

Deliverables:

- Final personas
- Product requirements
- Wireframes
- Parser rule catalog
- Technical architecture
- Database schema
- Design system
- Pricing hypothesis
- Legal-document outline

### Sprints 1–2: Foundation

Duration: **4 weeks**.

Build:

- Authentication
- Organizations
- Memberships
- Database
- API foundation
- Job queue
- Logging
- Mobile and web project structure
- CI/CD
- Development and staging environments

Exit criteria:

- A user can create an organization.
- Protected API endpoints enforce membership.
- Jobs can be queued, retried, and observed.

### Sprints 3–4: Core scanning

Duration: **4 weeks**.

Build:

- Website property creation
- Safe fetcher
- Ads.txt parser
- File validation
- Manual scans
- Scan history
- Basic dashboard
- Findings

Exit criteria:

- A website can be scanned reliably.
- Valid and invalid fixtures produce expected results.
- SSRF tests pass.

### Sprint 5: App-store support

Duration: **2 weeks**.

Build:

- Google Play resolver
- Apple App Store resolver
- Developer-domain extraction
- app-ads.txt discovery
- Store mismatch findings

Exit criteria:

- Public Android and iOS apps can be resolved.
- Missing developer websites produce guided errors.

### Sprint 6: Scheduled monitoring

Duration: **2 weeks**.

Build:

- Recurring schedules
- Worker scaling
- Retry behavior
- Next-scan calculation
- Monitoring status
- Usage limits

Exit criteria:

- Scans run without the client application being open.
- Transient failures are retried safely.

### Sprint 7: Alerts and incidents

Duration: **2 weeks**.

Build:

- Incident model
- Deduplication
- Email alerts
- Push alerts
- Recovery alerts
- Notification preferences

Exit criteria:

- One continuing failure creates one incident.
- Recovery closes the incident.
- Users receive configured notifications.

### Sprint 8: Crawler simulator

Duration: **2 weeks**.

Build:

- Robots.txt diagnostics
- HTTP and HTTPS comparison
- Redirect analysis
- Soft 404 detection
- Encoding diagnostics
- Detailed remediation

Exit criteria:

- Every crawler finding includes evidence and a fix.

### Sprint 9: Change intelligence

Duration: **2 weeks**.

Build:

- Snapshots
- Seller-entry differences
- Variable differences
- Change timeline
- Critical-removal alerts

Exit criteria:

- Users can see exactly what changed between scans.

### Sprints 10–11: Sellers.json

Duration: **4 weeks**.

Build:

- Sellers.json downloader
- Global cache
- Streaming parser
- Seller lookup
- Relationship comparison
- Seller transparency score

Exit criteria:

- Seller entries can be verified without downloading the same file separately for every customer.

### Sprint 12: Reports and billing

Duration: **2 weeks**.

Build:

- PDF reports
- Share links
- Stripe subscriptions
- Trial
- Plan enforcement
- Billing portal

Exit criteria:

- A customer can subscribe and receive the correct limits.
- Reports exclude private organizational data.

### Sprints 13–14: Beta hardening

Duration: **4 weeks**.

Complete:

- Accessibility
- Performance
- Security review
- Load testing
- Error-state refinement
- Analytics
- Customer onboarding
- Documentation
- App-store submissions
- Web production launch

## 33. MVP acceptance criteria

The MVP is ready to sell when:

- Users can register, verify email, and reset passwords.
- Users can create an organization.
- Users can monitor websites, Android apps, and iOS apps.
- Scheduled scans run from the backend.
- Files are fetched with SSRF protection.
- Valid files parse correctly.
- Critical crawler problems are detected.
- Expected seller lines can be configured.
- Important changes create incidents.
- Email and push alerts work.
- Recovery is detected.
- Users can view history and differences.
- Every supported finding includes remediation.
- Customers can subscribe and manage billing.
- Plan limits are enforced server-side.
- Production monitoring and backups are enabled.
- Privacy policy, terms, and support contact exist.

## 34. Launch strategy

### Free diagnostic tool

Create a public web scanner:

```text
Enter a website, Google Play URL, or App Store URL
```

Return:

- Basic score
- File availability
- First three issues
- Partial seller verification

Require signup for:

- Full report
- Monitoring
- Alerts
- History
- Complete sellers.json details

This scanner becomes the main customer-acquisition channel.

### Content strategy

Publish searchable guides:

- Why AdMob cannot find app-ads.txt
- How to fix app-ads.txt on Firebase
- How to fix app-ads.txt on WordPress
- `DIRECT` versus `RESELLER`
- How sellers.json relates to ads.txt
- Why a Google seller ID is missing
- app-ads.txt setup for iOS
- app-ads.txt setup for Android

### Partnerships

Target:

- App-development agencies
- AdMob consultants
- Google Certified Publishing Partners
- WordPress hosting providers
- Monetization agencies
- SSPs
- Publisher communities

### Beta program

Recruit:

- 20 independent app developers
- 10 website publishers
- 5 agencies
- 3 monetization partners

Ask each participant:

- What issue did SupplyGuard find?
- Was the explanation understandable?
- Did it prevent or recover revenue?
- Which alert channels matter?
- Would they pay?
- How many properties would they monitor?

### Launch checklist

- Production domain and email configured
- Marketing site published
- Public scanner available
- Documentation and status page online
- Billing tested end to end
- Support inbox staffed
- Privacy policy and terms published
- Monitoring and on-call alerts active
- Backups and restore test completed
- Mobile store listings approved
- Ten customer testimonials or case studies targeted after beta

## 35. Features to avoid initially

Do not delay the MVP for:

- AI chatbot
- Complex revenue prediction
- Automatic deletion of suspicious sellers
- Full market-wide crawling
- Blockchain verification
- Custom enterprise SSO
- Dozens of notification channels
- Advanced CRM integrations
- Automated edits without approval

An AI assistant can later summarize issues and draft remediation guidance, but deterministic rules should remain the source of compliance and incident decisions.

## 36. Product positioning

### Homepage headline

> Protect your ad revenue from broken ads.txt and app-ads.txt files.

### Supporting message

> SupplyGuard continuously monitors authorization files, verifies sellers against sellers.json, detects crawler problems, and tells your team exactly what to fix.

### Core selling points

- Catch revenue-blocking errors
- Understand why Google cannot verify a file
- Detect seller changes immediately
- Verify the programmatic supply chain
- Fix problems with guided instructions
- Manage every app, site, and client from one dashboard

### Recommended commercial build sequence

1. Backend scheduled monitoring
2. Google crawler simulator
3. Android and iOS support
4. Expected seller tracking
5. Change detection
6. Sellers.json verification
7. Revenue Protection Score
8. Guided remediation
9. Alerts and incident recovery
10. Shareable compliance reports

That combination provides a clear recurring reason to pay: customers purchase continuous revenue protection rather than access to a text-file parser.
