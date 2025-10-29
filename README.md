# Data Engineering Task Documenter

A full-stack web application that helps data engineers document their work by automatically generating professional technical documentation using Google Gemini AI and sending it to Notion.

## Features

- **Intuitive Input Form**: Capture task context, code implementation, and challenges (accepts input in any language)
- **AI-Powered Documentation**: Generate comprehensive technical documentation in English using Google Gemini AI (FREE tier available)
- **Notion Integration**: Automatically send generated documentation to your Notion page with smart chunking (handles documents >100 blocks)
- **Modern UI**: Clean, responsive design built with React and Tailwind CSS
- **Error Handling**: Robust error handling with user-friendly messages
- **Copy to Clipboard**: Easily copy generated documentation

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Prism.js (syntax highlighting)

### Backend
- Node.js
- Express
- Google Gemini API (REST)
- Notion API

## Project Structure

```
de-task-journal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── InputForm.jsx
│   │   │   ├── GeneratedContent.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   ├── utils/
│   │   │   └── api.js      # API utilities
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx
│   │   └── index.css       # Tailwind styles
│   └── package.json
├── server/                 # Express backend
│   ├── routes/
│   │   ├── generate.js     # Gemini API route
│   │   └── notion.js       # Notion API route (with chunking)
│   ├── services/
│   │   ├── geminiService.js  # Google Gemini integration
│   │   └── notionService.js  # Notion integration (100-block chunking)
│   ├── index.js            # Express server
│   └── package.json
├── .env                    # Environment variables
├── .env.example            # Environment template
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Google Gemini API key (FREE tier available!)
- Notion Integration Token

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd de-task-journal
```

### 2. Configure Environment Variables

Copy the example file and configure your keys:

```bash
cp .env.example .env
```

Then edit `.env` with your API keys:

```env
# Google Gemini API Key (FREE tier available!)
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model (optional, defaults to gemini-2.0-flash-exp)
GEMINI_MODEL=gemini-2.0-flash-exp

# Notion API Integration Token
NOTION_API_KEY=your_notion_api_key_here

# Notion Page ID
NOTION_PAGE_ID=your_notion_page_id_here

# Server Port
PORT=3001
```

### 3. Get Your API Keys

#### Google Gemini API Key (FREE!)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API key" or "Create API key"
4. Copy the key and add it to your `.env` file as `GEMINI_API_KEY`

**Free Tier Limits:**
- 15 requests per minute (RPM)
- 1 million tokens per minute (TPM)
- 1,500 requests per day (RPD)
- No credit card required!

**Available Models:**
- `gemini-2.0-flash-exp` (Recommended - Latest, fastest, free)
- `gemini-1.5-flash` (Fast, efficient)
- `gemini-1.5-pro` (Most capable)

#### Notion Integration Token

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "DE Task Documenter")
4. Select the workspace
5. Copy the "Internal Integration Token"
6. Add it to your `.env` file as `NOTION_API_KEY`

#### Get Notion Page ID

1. Open your Notion page in a browser
2. The URL will look like: `https://www.notion.so/Page-Name-299c6319-3f57-808a-a250-f75cfdd7f47b`
3. The page ID is the last part: `299c6319-3f57-808a-a250-f75cfdd7f47b`
4. **Important**: You must share the page with your integration:
   - Open the page in Notion
   - Click "Share" button
   - Click "Invite"
   - Select your integration from the list

### 4. Install Dependencies

#### Install server dependencies:
```bash
cd server
npm install
```

#### Install client dependencies:
```bash
cd ../client
npm install
```

### 5. Run the Application

You need to run both the server and client:

#### Terminal 1 - Run the backend server:
```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001`

#### Terminal 2 - Run the frontend:
```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173` (or another port if 5173 is busy)

### 6. Open the Application

Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Enter Task Context** (required): Describe your data engineering task
2. **Add Code Implementation** (optional): Paste any relevant code
3. **Describe Challenges** (optional): Note any difficulties faced
4. **Click "Generate Documentation"**: Wait for Claude AI to generate your documentation
5. **Review Generated Content**: Read through the generated documentation
6. **Copy or Send to Notion**: Either copy to clipboard or send directly to your Notion page

## Generated Documentation Structure

The AI generates documentation with the following sections in English:

1. **Summary**: 1-2 sentences summarizing the task and its purpose
2. **Problem Solved**: Description of the business or technical problem
3. **Solution Implemented**: Technical approach and key implementation decisions
4. **Code Highlights**: Brief explanation of code snippet with inferred language (python, sql, javascript, etc.)
5. **Challenges & Learnings**: Main obstacles or insights as bullet points

The system accepts input in any language but always generates output in English.

## API Endpoints

### POST /api/generate
Generates technical documentation using Google Gemini AI

**Request Body:**
```json
{
  "context": "Task context (required)",
  "code": "Code implementation (optional)",
  "challenges": "Challenges faced (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "documentation": "Generated markdown documentation..."
}
```

### POST /api/notion
Sends content to Notion page (automatically chunks documents >100 blocks)

**Request Body:**
```json
{
  "content": "Markdown content to send"
}
```

**Response:**
```json
{
  "success": true,
  "blocksAdded": 150,
  "chunks": 2,
  "message": "Content successfully sent to Notion"
}
```

**Note:** The endpoint automatically splits large documents into chunks of ≤100 blocks to comply with Notion's API limits.

## Troubleshooting

### Server won't start
- Make sure the PORT (default 3001) is not already in use
- Check that all environment variables are set correctly

### Gemini API errors
- Verify your `GEMINI_API_KEY` is correct and active
- Check the [Google AI Studio](https://aistudio.google.com/app/apikey) for API status
- Ensure you haven't exceeded free tier limits (15 RPM, 1500 RPD)
- Try using a different model (e.g., `gemini-1.5-flash` instead of `gemini-2.0-flash-exp`)

### Notion API errors
- **"object_not_found"**: Ensure your `NOTION_API_KEY` is correct
- **"unauthorized"**: Verify you've shared the Notion page with your integration
  - Open the page in Notion
  - Click "Share" → "Invite" → Select your integration
- **"validation_error"**: Check the `NOTION_PAGE_ID` is correct
- **100-block limit**: The app automatically chunks large documents, but verify chunking is working in server logs

### CORS errors
- Make sure the backend server is running on port 3001
- Check that the API_BASE_URL in `client/src/utils/api.js` matches your server URL

### Generated content not in English
- Check your `GEMINI_MODEL` supports system instructions (recommended: `gemini-2.0-flash-exp`)
- The system instructions should enforce English output
- Verify the prompt explicitly states "Output MUST be 100% in ENGLISH"
- Try regenerating or using a different model

## Development

### Running in Development Mode

Both client and server support hot reloading:

```bash
# Server (with nodemon)
cd server
npm run dev

# Client (with Vite)
cd client
npm run dev
```

### Building for Production

```bash
# Build client
cd client
npm run build

# The built files will be in client/dist/
```

## Testing

The project uses Vitest for both server and client testing with comprehensive test coverage.

### Running Tests

```bash
# Run all tests (server + client) once
npm test

# Run all tests in watch mode
npm run test:watch

# Run tests for a specific file or pattern
npm test -- InputForm

# Run tests matching a specific name
npm test -- -t "validates context field"

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

**Server Tests** (Node environment):
- API integration tests with Supertest
- HTTP retry and timeout tests
- Snapshot tests for Notion block conversion
- Unit tests for service functions

**Client Tests** (jsdom environment):
- Component tests with React Testing Library
- Hook tests with renderHook
- User interaction tests with user-event
- Network mocking with MSW

### Coverage

Tests are configured with the following coverage thresholds:
- Lines: 80%
- Branches: 70%
- Functions: 80%
- Statements: 80%

Coverage reports are generated in:
- `server/coverage/` for backend tests
- `client/coverage/` for frontend tests

### Updating Snapshots

```bash
# Update all snapshots
npm test -- -u

# Update snapshots for a specific file
npm test -- notionService.snapshot -u
```