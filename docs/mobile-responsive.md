Mobile responsive updates

What I changed
- Setup Screen
  - Top-aligned layout on small screens to avoid input being hidden by mobile keyboards (`items-start sm:items-center`).
  - Token picker now uses `grid-cols-3` by default with `sm:grid-cols-4` for larger screens for better touch targets and readability.
  - Settings button nudged inward to avoid clipping on small screens.
  - Card width grows on larger screens (`sm:max-w-lg`).

- Settings Modal
  - Modal overlays align to bottom on small screens (`items-end sm:items-center`) to act like a bottom-sheet.
  - Modal becomes a scrollable panel with `max-h-[90vh]` and content area is `overflow-auto` so long forms scroll while header/footer stay visible.
  - Header is sticky so controls remain accessible while scrolling (`sticky top-0 z-10`).
  - Bank threshold inputs stack on mobile (`grid-cols-1 sm:grid-cols-2`).
  - Footer is sticky on mobile so Save/Cancel remain accessible while scrolling.

Tests added
- `setupscreen.test.tsx` now asserts the token grid defaults to `grid-cols-3` to catch regressions.
- `settings-modal.test.tsx` checks the overlay uses mobile alignment and that the bank threshold grid stacks (`grid-cols-1`).

Follow-ups / UX suggestions
- Implemented a dedicated `BottomSheet` component and migrated `SettingsModal` to use it for consistent bottom-sheet behavior and better accessibility (keyboard escape, close button).
- Add e2e tests (Cypress/Playwright) to verify keyboard behavior on real mobile viewports and confirm inputs remain accessible.
- Tune spacing and touch target sizes for very small devices (~320px). 
- Consider hiding the large header spacing when the keyboard opens on mobile for a better fit.

How to test locally
1. Run unit tests: `npm test` (already passing).
2. Start dev server: `npm run dev`, open in a mobile emulator (Chrome DevTools), and verify:
   - Token grid shows 3 columns on narrow widths.
   - Settings modal appears from bottom and scrolls with sticky header/footer.

If you'd like, I can also implement a dedicated BottomSheet component and wire it into `SettingsModal` as a follow-up.
