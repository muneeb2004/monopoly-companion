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
