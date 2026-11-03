# Expiry Everything

A shared board for the dates a household forgets: passports, driver's licenses, warranties, medications, makeup, and the rest. Not food. No account.

Anyone with the link sees the same board. A new board gets a long, unguessable id. That link is the only key. There is also a view-only link that can look and download the calendar, and cannot change dates.

Adding a date is one line. `passport Mia jun 2027` becomes a passport for Mia expiring June 2027 (the 1st, because no day was written). Confirm it, or switch to a short form when the line is ambiguous.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

The demo board is [http://127.0.0.1:4317/b/demo](http://127.0.0.1:4317/b/demo). Those dates are samples for a made-up household, and the page says so. The demo links are public on purpose. A board you start is not.

Boards are stored in `data/boards.json`, created on first use and gitignored. Delete that file to reset the demo and any boards you made.

```bash
npm test
```

## What the prototype does

- Board sorted by days left, colored overdue / within 30 days / within 90 days / later, with a category icon and a person filter.
- One-line add with a preview you confirm, and a form when the line has no date.
- Item notes, and Renewed, which asks for the new date and keeps the previous one.
- “Add all to my calendar” downloads an `.ics` file. Each date is an all-day event with alerts 90, 30, and 7 days before. A single date can be downloaded from the item.
- Family link and view-only link.

Photo capture and date OCR are not in this version. There are no accounts, no push notifications, and no hosted service. Reminders live in the calendar file.
