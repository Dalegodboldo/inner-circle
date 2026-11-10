# Inner Circle

Landing page for Inner Circle, a private holiday day at Disneyland for CEO Life members, produced by Create Impact Now.

Live address: CreateImpactNow.org/InnerCircle (a 301 redirect in Wix points here).

## What's here

- `index.html`: the whole page (styles and script inline).
- `img/`: photos and the Create Impact Now logo.
- `vercel.json`: clean URLs and image caching.
- `apps-script/inner-circle-reservations.gs`: the Google Apps Script behind the reservation form. It lives in the "Inner Circle Reservations" Google Sheet; this copy is for reference only and is not deployed.

## Settings in index.html

Near the bottom of the file:

- `formEndpoint`: the Apps Script web app URL. Each reservation adds a row to the Sheet and emails Dale@CreateImpactNow.org.
- `bookingUrl`: a scheduling link for "Book a call". Empty means the button emails Dale instead.

## Deploy

Vercel, framework preset "Other", no build command. Every push to `main` redeploys.
