# Monopoly Tracker

A feature-rich, real-time Monopoly companion app built with **React**, **TypeScript**, and **Supabase**. It automates banking, property management, and game state tracking, allowing players to focus on trading and strategy rather than math.

## ✨ Key Features

### 🎮 Gameplay Management
- **Real-time Synchronization**: Game state updates instantly across all connected devices using Supabase Realtime.
- **Lobby System**: Create a new session or join an existing one via a unique 6-character Game ID.
- **Player Roles**: Supports up to 8 players with custom names, colors, and tokens.
- **Digital & Physical Modes**:
    - **Digital Dice**: Integrated 3D-style RNG dice roller that automatically moves tokens and handles board events.
    - **Physical Dice**: Manual input mode for players who prefer rolling real dice.

### 🏦 Banking & Finance
- **Automated Transactions**: Handle rent payments, salaries (Pass GO), and tax payments with a single click.
- **Direct Transfers**: Send money between players or to/from the bank.
- **Loan System**: Take out loans from the bank with tracked debt.
- **Transaction History**: A complete audit log of every financial movement in the game.

### 🏠 Property Management
- **Portfolio Tracking**: View all owned properties, their current rent, and mortgage status.
- **Building**: Buy/sell houses and hotels with automated cost calculations.
- **Mortgaging**: Mortgage/unmortgage properties with instant balance updates.
- **Property Overrides**: Customize specific property prices or rent values in the settings for house rules.

### ⚖️ Trading System
- **Complex Trades**: Propose trades involving both cash and multiple properties.
- **Negotiation Flow**: Send offers, wait for the other player to accept or reject, and counter-offer.

### ⚙️ Customizable Rules
- **House Rules Engine**:
    - **Starting Money**: Adjust the initial balance for all players.
    - **Inflation/Deflation**: Set global price and rent multipliers (e.g., Double Rent mode).
    - **Jail Rules**: Configure the bail amount. Choose to pay bail (ends turn) or serve time (skip 3 turns).
    - **Advanced Overrides**: Manually edit the rent or price of specific board properties.

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for phones and tablets.
- **Action Center**: A scrolling action bar on mobile keeps essential controls accessible.
- **Interactive Map**: A scrollable, zoomable board view to see player positions and property ownership at a glance.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A [Supabase](https://supabase.com) account

### 1. Database Setup
1.  Create a new project on Supabase.
2.  Navigate to the **SQL Editor**.
3.  Execute the contents of `supabase_schema.sql` to set up the core tables.
4.  Run the following update scripts in order to enable all features:
    - `update_schema_game_settings.sql` (Settings engine)
    - `update_schema_property_overrides.sql` (Custom property values)
    - `update_schema_jail_settings.sql` (Jail configuration)
    - `update_schema_dice_mode.sql` (Dice logic)
    - `update_schema_tokens.sql` (Player tokens)

### 2. Environment Variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🕹️ Program Flow

1.  **Landing Screen**:
    - User chooses to **Create New Game** or **Join Existing**.
    - **Spectator Mode**: Users can join as observers without affecting game state.

2.  **Setup Lobby**:
    - Host shares the **Game ID**.
    - Players enter their name and pick a token (Car, Dog, Hat, etc.).
    - Host selects the **Dice Mode** (Digital/Physical) and starts the game.

3.  **Active Dashboard**:
    - **Top Bar**: Shows current turn number and access to Map/Properties/Settings.
    - **Player Grid**: Displays all players, their balance, net worth, and active status.
    - **Action Center (Bottom)**:
        - **Dice Roller**: Rolls dice, moves player, and triggers landing events (Rent, Tax, Go to Jail).
        - **Pay/Receive**: Quick manual transactions.
        - **Trade**: Initiate property/cash swaps.
        - **Loan**: Manage bank loans.
    - **Jail State**:
        - If jailed, the dice roller is replaced by **Pay Bail** (ends turn) or **Skip Turn**.

4.  **End Game**:
    - The game state persists in Supabase, allowing sessions to be paused and resumed anytime.

---

## 🧭 Additional Features & Notes

### 🧩 UI & Accessibility Enhancements
- **BottomSheet Component**: Settings and other modals use a mobile-optimized bottom-sheet with a slide-in animation, body-scroll lock, overlay click to close, and Escape to dismiss. It includes a focus trap to keep keyboard users inside the dialog.
- **Mobile Numpad & Formatting Hints**: Numeric inputs include `inputMode` and `pattern` attributes to trigger the mobile numeric keyboard. Inputs also display a `Formatted:` hint (e.g., "1,500") while typing using `formatNumberInput`.
- **Validation**: Price and rent overrides accept validation on the UI (price must be a non-negative integer; rent must be comma-separated non-negative numbers) and show inline errors.

### 🧾 Property Overrides (Setup)
- The **Properties** tab in the setup lobby lets hosts set per-property **price** and **rent** overrides before starting the game.
- When the host clicks **Start Game** a confirmation is shown: "Property overrides will be applied when starting the game." Confirming will persist overrides into the `game_properties` rows in the DB so they are applied for that game session.

### 🗄️ Database & Migrations
- The schema supports per-game overrides via `game_properties.price_override` (integer) and `game_properties.rent_override` (jsonb array).
- Migrations included in this repo:
  - `update_schema_property_overrides.sql` — adds `price_override` and `rent_override` to `game_properties` when missing.
  - `update_schema_property_overrides_validation.sql` — sanitizes existing values and adds DB-level CHECK constraints to ensure `price_override >= 0` and that `rent_override` is an array of non-negative numbers (uses an immutable helper function for validation).

Run migrations in Supabase Console → SQL Editor or via `psql`:

```bash
# Example using psql (replace connection string)
psql "postgresql://<user>:<pass>@<host>:5432/<db>" -f update_schema_property_overrides.sql
psql "postgresql://<user>:<pass>@<host>:5432/<db>" -f update_schema_property_overrides_validation.sql
```

> Note: migrations are idempotent and can be re-run safely.

### ✅ Testing & CI
- **Unit Tests**: Vitest + @testing-library/react for component/unit tests. `vitest.config.ts` excludes the `e2e/` folder to avoid Playwright files being executed by Vitest.
- **E2E Tests**: Playwright with a `mobile-iphone` project (iPhone emulation) is included. Tests validate mobile keyboard behavior, focus/escape interactions, and full flows (e.g., set overrides → start game → verify behavior).
- NPM scripts added:
  - `npm test` — run unit tests (Vitest)
  - `npm run test:e2e` — run Playwright E2E tests

Suggested GitHub Actions workflow:
1. Install dependencies (npm ci) and run `npm test`.
2. Build (`npm run build`).
3. Optionally run `npx playwright install --with-deps` and `npx playwright test` for E2E on a separate job (or as an approval-protected job for production deploys).
4. Apply DB migrations or run them from a protected deployment job before the first production migration.

---

If you'd like, I can add a GitHub Actions workflow file to this repo that runs tests, builds the app, and optionally runs Playwright E2E tests and migrations before deploy. Let me know which CI provider and policies you prefer (e.g., run E2E only on `main` or on every PR).
