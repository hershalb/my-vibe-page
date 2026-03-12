# Vibe Page

An AI-powered web page generator where you describe what you want in natural language and watch the page transform in real-time. Type something like "make this a cyberpunk portfolio" or "add a navigation bar" and the page updates live.

## How It Works

Each page starts as a blank canvas with an embedded chat widget. When you send a message:

1. **Planning step** — A fast model (Gemini Flash Lite) analyzes your request and decides whether the page needs a full regeneration or small targeted patches.
2. **Targeted patches** — For localized edits (changing text, adding a button, tweaking colors), the planner returns search-and-replace diffs that are applied instantly.
3. **Full regeneration** — For broad changes (new themes, redesigns, complete overhauls), GPT-5 Mini streams a brand-new HTML document.

Pages are persisted to S3 and accessible via shareable URLs at `/p/[id]`. Appending `?view=true` hides the chat widget for a clean view-only experience.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS 4
- **AI**: Vercel AI SDK with OpenAI (GPT-5 Mini) and Google (Gemini Flash Lite)
- **Storage**: AWS S3 for page persistence

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key
- A Google AI API key
- An AWS S3 bucket with credentials

### Environment Variables

Create a `.env.local` file in the project root:

```
OPENAI_API_KEY=your-openai-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key

AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-1
```

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to a fresh page where you can start vibing.

## Project Structure

```
app/
  page.tsx              # Redirects to /p/new
  p/[id]/page.tsx       # Main page — loads or creates a vibe page
  api/chat/route.ts     # Chat endpoint (planner + generation)
  api/pages/route.ts    # Page persistence API
  api/feedback/route.ts # Feedback collection
  components/
    page-renderer.tsx   # Renders the HTML page in an iframe with the chat widget
    chat-widget.tsx     # Embedded chat UI
    toast.tsx           # Toast notifications
lib/
  prompts.ts            # System prompts for the planner and generator
  store.ts              # S3 read/write for page data
  parse-html.ts         # HTML parsing utilities
  apply-diff.ts         # Applies targeted patches to HTML
  validate-html.ts      # HTML validation
  starter-template.ts   # Default starter page HTML
```
