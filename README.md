# Shared Checklist App

Create multiple checklists for personal and business tasks.

This is a standalone, browser-only version. It starts completely empty,
with no seeded checklists and no existing user data. Each visitor creates
their own checklists, saved in their own browser, so one visitor cannot
see or change another visitor's lists.

## What it does

- Create multiple checklists, each with a title and optional notes.
- Add items with an optional detail and an optional section.
- Check items off with large white boxes with a thick black border and a
  bold black check.
- Edit, reorder, and delete items, and rename or delete whole checklists.
- Pick one checklist as the default that the app opens on, falling back
  to the newest list if the default is deleted.

## Hosting

This is a single self-contained `index.html` page with no server and no
database. It is served by GitHub Pages from the root of the main branch.
