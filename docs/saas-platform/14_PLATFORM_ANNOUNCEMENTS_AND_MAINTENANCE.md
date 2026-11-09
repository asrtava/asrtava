# Platform Announcements & Maintenance Broadcasts

## 1. Overview
The centralized announcement module allows platform administrators to broadcast operational updates, emergency downtime alerts, and feature release notes across all subscribed hospital portals.

## 2. Priority Levels & Display Treatment
- `critical`: Red emergency banner fixed at the top of all staff and admin workspaces with persistent dismissal tracking.
- `warning`: Amber notice for scheduled maintenance windows (e.g. database indexing).
- `info`: Blue highlight for new feature announcements or system enhancements.

## 3. Targeting & Expiration
- Announcements can be targeted to specific subscription tiers (`all`, `trial`, `starter`, `professional`, `enterprise`).
- Automatic expiration timestamp (`expires_at`) cleans up outdated notices from portal headers.
- Tenant read confirmations are recorded in `tenant_announcement_reads`.

