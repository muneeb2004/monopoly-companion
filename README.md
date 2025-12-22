# Monopoly Tracker

A real-time Monopoly bank and property tracking application using React, TypeScript, and Supabase.

## Features

- **Real-time Synchronization**: Game state updates instantly across all connected devices.
- **Banker Features**: Manage loans, salaries (Pass GO), and money transfers.
- **Property Management**: Track ownership, houses/hotels, and mortgage status.
- **Transaction History**: Audit log of all financial movements.

## Setup Instructions

### 1. Supabase Setup

1.  Create a new project on [Supabase](https://supabase.com).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy the contents of the `supabase_schema.sql` file (located in the root of this project) and paste it into the SQL Editor.
4.  Run the script to create the necessary tables and policies.

### 2. Environment Variables

Ensure your `.env` file is configured with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Installation

```bash
npm install
```

### 4. Running the App

```bash
npm run dev
```

## Usage

1.  **Create Game**: One player creates a game and receives a Game ID.
2.  **Join Game**: Other players enter the Game ID to join the lobby.
3.  **Start**: Once players are ready, the host starts the game.