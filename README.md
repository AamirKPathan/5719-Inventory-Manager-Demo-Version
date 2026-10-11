
# FRC Team 5719 Inventory Tracker

A browser-based inventory tracker for FRC Team 5719.

Live demo: https://aamirkpathan.github.io/5719-Inventory-Manager-Demo-Version/

## Features

- Add, edit, search, and delete inventory items.
- Organize items into robotics-specific categories.
- Record category-specific dimensions and specifications.
- Add an image using an online URL or upload an image. Uploaded images are centered and cropped to a square automatically.
- Record sign-outs and returns using a person's name.
- Automatically record transaction date and time.
- Track stock adjustments.
- Display low-stock and out-of-stock alerts.
- Export inventory to CSV.
- Responsive layout for desktop and mobile screens.

## Categories

- Bearings & Bushings
- Raw Materials & Stock
- Fasteners & Hardware
- Gears, Chains & Power Transmission
- Motors & Mechanical Assemblies
- Electronics & Controls
- Pneumatics
- Custom & Fabricated Parts
- Other / Miscellaneous

## Run locally

1. Put `index.html`, `styles.css`, `app.js`, and `README.md` in one folder.
2. Open `index.html` in a modern browser.
3. Add your team's inventory.

No build tools are required.

## Publish with GitHub Pages

1. Create or open the GitHub repository for the project.
2. Upload the four files to the repository's root directory.
3. Open the repository's **Settings**.
4. Select **Pages**.
5. Under the build and deployment settings, choose **Deploy from a branch**.
6. Select the `main` branch and `/ (root)` folder.
7. Save and wait for GitHub Pages to publish the site.

## Important data limitation

This version uses browser localStorage. Inventory changes and activity logs are stored in the browser being used.

- Other team members will not automatically see the same inventory.
- Data does not automatically synchronize between devices.
- Clearing browser data may erase the saved inventory.
- Uploaded images are stored in the same browser.
- Activity logs are not publicly shared by this prototype.

For a shared team inventory, connect a database such as Supabase and configure authentication or appropriate access policies, shared image storage, and public log access deliberately before using real team data.

## Stock handling

- Sign-out reduces available stock.
- Return increases available stock and requires a recorded outstanding checkout.
- Use Adjust to add stock, remove stock, or set the exact quantity.
- Editing an item does not change its stock quantity; use Adjust to record stock changes.

## Image limits

Uploaded images must be 1.5 MB or smaller.
Online images must use an HTTP or HTTPS URL.
