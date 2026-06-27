# Notification system deployment

The hardened API requires the notification schema update before the new server starts.

## Existing database

Run `DEPLOY_NOTIFICATIONS.sql` as one complete script in SSMS. It contains the schema migration and all stored procedures with the required `GO` batch separators.

Then deploy the server and client together. The old `GET /api/Notifications` route remains available, while the client uses the new cursor-paged `/api/Notifications/inbox` route.

## Fresh database

After the users and companies tables exist, run `DEPLOY_NOTIFICATIONS.sql`. It creates the notification table when it does not already exist.

## Retention

Hangfire registers the `notification-retention` recurring job at startup. It removes read notifications after 90 days and unread notifications after 365 days.
