# notifications/preferences

## Domain
Notification preferences (in-app + email toggles).

## Canonical Sources
- `docs/spec/04-user-flows/` — FL-008 preferences matrix
- `docs/spec/08-data-model/` — notification_preferences table

## Included Topics
- Preference matrix defaults
- Enforcement rules
- Digest settings

## Preference rules
- If in-app toggle OFF for a type: do not create notification records for that type.
- If email toggle OFF: do not enqueue email jobs.

## Defaults (v1)
Canonical defaults include:
- Mentions: ON for in-app and email
- Task assigned: ON/ON
- Comments: ON in-app, OFF email (for involved content)
- Announcements: ON in-app, OFF email
- Digest: OFF

## Digest
- Daily digest (email-only)
- Weekly digest (email-only)

Implementation note:
- Unknown type keys should be rejected by API validation (canonical suggests this; alternatively ignore for forward compatibility—must choose one approach).
