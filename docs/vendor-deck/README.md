# Eventopia Vendor & Organization Deck

This folder contains a polished, print-ready HTML pitch deck you can export to PDF and share with vendors and organizations.

- Deck file: `docs/vendor-deck/Eventopia_Vendor_Deck.html`
- Images folder: `docs/vendor-deck/images/`

## How to add screenshots
Place PNG screenshots in `docs/vendor-deck/images/` with these exact names:

- `welcome.png` – Welcome screen
- `events.png` – Events discovery list/grid
- `details.png` – Event details screen
- `organizer_dashboard.png` – Organizer dashboard with insights
- `create_event.png` – Create Event screen
- `verification.png` – Any verification/onboarding screen

Tip: Use device screenshots (phone). The deck scales them automatically. Keep images ≥ 1080px wide for crisp printing.

## How to update branding/contact
Open `Eventopia_Vendor_Deck.html` and update:
- Contact line near the bottom: email/phone/location
- CTA button link ("Request a Demo")
- Any copy you want to localize

## Export to PDF (easy method)
1. Open `Eventopia_Vendor_Deck.html` in Microsoft Edge or Chrome.
2. Press Ctrl+P (Print) and choose:
   - Destination: Save as PDF
   - Layout: Portrait
   - Paper size: A4 or Letter (your preference)
   - Margins: Default or None
   - Options: Enable Background graphics
   - Scale: 100% (adjust if content slightly overflows)
3. Save as `Eventopia_Vendor_Deck.pdf`.

## Export to PDF (CLI, Edge headless)
On Windows, you can export via Microsoft Edge headless. Example PowerShell command (adjust paths as needed):

```powershell
$edge1 = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
$edge2 = "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
$edge = if (Test-Path $edge1) { $edge1 } elseif (Test-Path $edge2) { $edge2 } else { $null }
if (-not $edge) { throw "Microsoft Edge not found. Open the HTML and print to PDF manually." }
$deck = "C:\\Users\\Samuel.alemayehu\\CascadeProjects\\EventopiaNew\\docs\\vendor-deck\\Eventopia_Vendor_Deck.html"
$out  = "C:\\Users\\Samuel.alemayehu\\CascadeProjects\\EventopiaNew\\docs\\vendor-deck\\Eventopia_Vendor_Deck.pdf"
& $edge --headless --disable-gpu --print-to-pdf=$out $deck
```

## Recommended talking points for vendors
- Beautiful native app experience for attendees
- Full organizer toolkit: create, feature events, pricing, important info
- Real insights: views, favorites, growth rate, top category
- Partnership-ready: sponsorships, co-branded campaigns, placements
- Secure tech stack and roadmap for monetization

## Notes
- The deck is static HTML with inline CSS—no build step required.
- For best results, ensure all screenshots are in place before exporting.
