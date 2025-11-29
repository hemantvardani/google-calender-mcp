# Calendar MCP - AI-Powered Calendar Assistant

A lightweight web application that connects to Google Calendar using the Model Context Protocol (MCP) and provides an intelligent interface to interact with your calendar events. Built as an internal tooling layer that demonstrates how to integrate third-party systems with AI capabilities.

## What This Does

This app gives you two ways to interact with your Google Calendar:

1. **Classical View** - A traditional table-based interface where you can fetch and view your past or upcoming meetings. You can also generate AI summaries for past meetings to get a quick recap of what might have been discussed.

2. **Ask Feature** - An AI-powered chat interface where you can ask natural language questions about your calendar. The AI uses MCP tools to fetch calendar data on-demand and answer questions like "What meetings do I have this week?" or "When is my next meeting with John?"

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with Shadcn UI components
- **Calendar Integration**: Composio MCP (Model Context Protocol)
- **AI**: OpenAI GPT-4o-mini for chat and meeting summaries
- **State Management**: React Context API for API key management

## Prerequisites

Before you start, make sure you have:

- Node.js 18+ installed
- A Composio account with Google Calendar integration set up
- An OpenAI API key (for AI features)
- A Google account (for calendar access)

## Getting Started

### 1. Clone and Install

```bash
cd frontend/my-app
npm install
```

### 2. Environment Variables

Create a `.env` file in the `frontend/my-app` directory:

```env
# Composio API Key (get this from your Composio dashboard)
NEXT_PUBLIC_COMPOSIO_API_KEY=your_composio_api_key_here

# Optional: Your app URL (for OAuth callbacks)
# Defaults to http://localhost:3000 in development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### First Time Setup

1. **Connect Your Calendar**: Click the "Connect to my Google Calendar" button on the home page. This will redirect you to Google's OAuth page where you'll authorize the app to access your calendar.

2. **Enter OpenAI API Key**: Once connected, enter your OpenAI API key in the header input field. This is needed for:
   - Generating AI summaries of past meetings
   - Using the "Ask" feature to chat about your calendar

### Using the Classical View

Navigate to the "Classical" menu and choose between:
- **Upcoming Bookings**: View your future meetings
- **Past Bookings**: View your past meetings with the option to generate AI summaries

You can specify how many bookings you want to fetch (1-20). For past bookings, click "Generate Summary" to get an AI-generated recap of what might have been discussed.

### Using the Ask Feature

Go to "Ask thing" in the navigation and start asking questions about your calendar. The AI will:
- Use MCP tools to fetch relevant calendar data
- Answer your questions in natural language
- Format responses with markdown for better readability

Example questions:
- "What meetings do I have this week?"
- "When is my next meeting?"
- "Who am I meeting with today?"
- "What did I have scheduled last Monday?"


 
## Assumptions & Design Decisions

### Why MCP Instead of Direct API?

I chose to use Composio's MCP implementation instead of calling the Google Calendar API directly because:
- MCP provides a standardized way to integrate tools with AI agents
- It abstracts away OAuth complexity and token management
- Makes it easier to add more integrations in the future
- The assignment specifically required using MCP, not vanilla APIs

### Why Two Different Interfaces?

The "Classical" view and "Ask" feature serve different use cases:
- **Classical**: Good for structured data viewing, bulk operations, and when you need to see all details at once
- **Ask**: Better for quick queries, natural language interaction, and when you don't know exactly what you're looking for
 

### Session Management

The app uses HTTP-only cookies to store:
- `composio_user_id`: Unique identifier for the session
- `composio_connection_id`: The connected Google Calendar account ID

This approach:
- Keeps sensitive data server-side
- Maintains session across page refreshes
- Automatically handles OAuth callback flow

## Tradeoffs

### What I Prioritized

1. **Both Functionality and polish**: I tried to focus on both getting core features working and UI
2. **Clear error messages**: Users always know what went wrong and how to fix it


### What I Simplified

1. **No persistent storage**: Sessions are cookie-based, no database needed
2. **Single calendar support**: Only connects to the primary Google Calendar
3. **Basic UI**: Used Shadcn components but didn't spend time on custom styling
4. **Limited error recovery**: Basic retry logic, could be more robust

### Known Limitations

- Only works with Google Calendar (primary calendar)
- Summaries are generated based on metadata, not actual meeting content
- No offline support
- OAuth tokens expires (need to reconnect)
   