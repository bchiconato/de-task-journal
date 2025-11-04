# Task Journal

An AI-powered documentation generator that transforms your raw notes and task descriptions into polished technical documentation, with seamless Notion integration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Testing](#testing)

## Overview

**Task Journal** is a full-stack web application designed for data engineers, software developers, and technical professionals who need to generate comprehensive technical documentation quickly. Instead of crafting documentation from scratch, you can dump all your notes, code snippets, challenges, and learnings into a single text field, and the application uses AI to structure and format them into professional documentation.

The application operates in two specialized modes:

- **Task Mode**: For day-to-day engineering work. Submit your problem statement, solution outline, code snippets, challenges, and lessons learned—the AI synthesizes them into clear task documentation.
- **Architecture Mode**: For systems and platform-level documentation. Provide your overview, components, data flows, design decisions, and risks—the AI structures it into comprehensive architecture documentation.

Once generated, documentation can be edited in-app and sent directly to your Notion workspace with automatic chunking to respect API limits.

## Features

- **Dual Documentation Modes**: Task-focused and architecture-focused modes tailored to different documentation needs
- **AI-Powered Generation**: Uses Google Gemini API to generate professional documentation from unstructured notes
- **Notion Integration**: Send generated documentation directly to Notion with automatic large-content handling
- **In-App Editing**: Edit generated documentation with a syntax-highlighted Markdown editor before sending
- **Auto-Saving Drafts**: Form inputs are automatically saved to browser storage as you type
- **Generation History**: Keep track of your 50 most recent generated documents with one-click restoration
- **Accessible UI**: WCAG-compliant interface with keyboard navigation, screen reader support, and reduced-motion support
- **Responsive Design**: Fully responsive two-column layout for desktop and mobile
- **Real-Time Feedback**: Toast notifications and live announcements for user actions and system status

## Tech Stack

### Frontend
- **React 19** — Modern UI framework with hooks and concurrent features
- **Vite** — Fast build tool and development server
- **Tailwind CSS** — Utility-first CSS framework for styling
- **React Markdown & React Syntax Highlighter** — Markdown rendering and syntax highlighting
- **Lucide React** — Lightweight icon library
- **Vitest & Testing Library** — Testing framework and utilities
- **MSW (Mock Service Worker)** — API mocking for tests

### Backend
- **Node.js & Express** — Server runtime and HTTP framework
- **Google Gemini API** — Large language model for documentation generation
- **Notion API** — Integration for sending documentation to Notion
- **Vitest** — Testing framework for backend tests
- **Zod** — Schema validation library

### DevOps & Build
- **Makefile** — Build automation and script orchestration
- **ESLint** — Code linting and quality checks
- **Prettier** — Code formatting

## Prerequisites

Before you get started, ensure you have the following installed on your system:

- **Node.js** — Version 18.x or higher (check with `node --version`)
- **npm** — Version 9.x or higher (check with `npm --version`)
- **Make** — Optional but recommended for running commands (check with `make --version`)

### API Keys Required

1. **Google Gemini API Key** — For AI-powered documentation generation
   - Sign up at [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

2. **Notion API Key & Database Access** — For Notion integration
   - Create an integration at [Notion Developers](https://www.notion.so/my-integrations)
   - Copy your internal integration token
   - Share target Notion pages with your integration (click "Share" → "Invite" → select integration)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/bchiconato/de-task-journal.git
cd de-task-journal
```

### 2. Install Dependencies

```bash
make install
```

This command installs dependencies for both the client and server:

```bash
npm install --prefix ./client
npm install --prefix ./server
```

### 3. Set Up Environment Variables

#### Server Configuration

Create a `.env` file in the `server/` directory:

```bash
# Google Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Notion API Configuration
NOTION_API_KEY=your-notion-integration-token
NOTION_PAGE_ID=your-default-notion-page-id-optional

# Server Configuration
PORT=3001
NODE_ENV=development
```

#### Client Configuration

No environment variables are required for the client in development. The client communicates with the backend server.

### 4. Verify Installation

```bash
make build
```

This will build the client application and verify everything is set up correctly.

## Configuration

### Notion Integration Setup

1. **Create a Notion Integration**
   - Go to [Notion Developers](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Name it "Task Journal"
   - Copy the integration token (this is your `NOTION_API_KEY`)

2. **Share Pages with the Integration**
   - Open each Notion page you want to use
   - Click the "Share" button (top-right)
   - Click "Invite"
   - Select your "Task Journal" integration
   - Ensure it has "Insert content" permissions

3. **Set Default Page (Optional)**
   - Add `NOTION_PAGE_ID` to your `.env` file
   - This page will be pre-selected when the app loads

### Google Gemini API Configuration

1. **Generate API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy the key and add it to `.env` as `GEMINI_API_KEY`

2. **Rate Limits**
   - Free tier: 60 requests per minute
   - Paid tier: Up to 1,000 requests per minute
   - Adjust usage according to your plan

## Development

### Start Development Servers

```bash
make dev
```

This command starts both the backend and frontend development servers:

- **Backend**: http://localhost:3001 (Express server with hot-reload)
- **Frontend**: http://localhost:5173 (Vite dev server with hot-reload)

The frontend will automatically connect to the backend API.

### Available Development Commands

```bash
# Install dependencies
make install

# Lint code in client and server
make lint

# Fix linting issues
make lint-fix

# Format code
make format

# Check formatting without making changes
make check

# Build the client for production
make build

# Run the full test suite
make test

# Run linting, format checks, and build
make all
```

### Development Workflow

1. **Frontend Development**: The Vite dev server supports Hot Module Replacement (HMR)—changes are reflected instantly without refreshing
2. **Backend Development**: Express server restarts automatically on file changes
3. **Testing**: Run `make test` to execute the full Vitest suite across both client and server

### Project Structure

```
de-task-journal/
├── client/                          # React frontend application
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── AppErrorBoundary.jsx # Error boundary for error handling
│   │   │   ├── GeneratedContent.jsx # Markdown preview and editor
│   │   │   ├── InputForm.jsx        # Form for collecting documentation inputs
│   │   │   ├── ModeToggle.jsx       # Task/Architecture mode switcher
│   │   │   ├── Toast.jsx            # Toast notifications
│   │   │   └── Guide.jsx            # In-app help guide
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAbortableRequest.js  # Abort controller management
│   │   │   ├── useAnnouncer.js         # Live region announcements
│   │   │   └── useToast.js             # Toast state management
│   │   ├── utils/
│   │   │   ├── api.js              # API client functions
│   │   │   └── validation.js       # Form validation logic
│   │   ├── styles/                 # Global and component styles
│   │   ├── App.jsx                 # Main application component
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles
│   ├── test/                       # Frontend tests
│   │   ├── setup.js                # Vitest configuration
│   │   ├── msw.js                  # API mocking setup
│   │   └── *.test.jsx              # Component tests
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── vitest.config.js            # Vitest configuration
│   └── tailwind.config.cjs         # Tailwind CSS configuration
├── server/                         # Express backend application
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js           # Environment and config management
│   │   ├── middleware/
│   │   │   ├── validate.js        # Request validation middleware
│   │   │   └── errors.js          # Error handling middleware
│   │   ├── schemas/
│   │   │   ├── generate.js        # Zod schema for /generate endpoint
│   │   │   └── notion.js          # Zod schema for /notion endpoint
│   │   ├── services/
│   │   │   └── notion/
│   │   │       ├── client.js      # Notion API client
│   │   │       ├── markdown.js    # Markdown-to-Notion conversion
│   │   │       ├── search.js      # Notion page search utilities
│   │   │       └── config.js      # Notion configuration
│   │   ├── lib/
│   │   │   └── http.js            # HTTP utilities (fetch with retry)
│   │   ├── routes.js              # API route definitions
│   │   └── app.js                 # Express app setup
│   ├── services/
│   │   └── geminiService.js       # Google Gemini API integration
│   ├── routes/
│   │   ├── generate.js            # POST /api/generate endpoint
│   │   └── notion.js              # POST /api/notion endpoint
│   ├── test/                      # Backend tests
│   │   ├── setup.js               # Vitest configuration
│   │   └── *.test.js              # API and service tests
│   ├── index.js                   # Server entry point
│   ├── package.json               # Backend dependencies
│   └── vitest.config.js           # Vitest configuration
├── scripts/
│   ├── run-eslint.mjs             # ESLint runner
│   └── run-format.mjs             # Prettier formatter runner
├── Makefile                       # Build and development automation
├── package.json                   # Monorepo root package.json
└── README.md                      # This file
```

## Usage

### Starting the Application

1. **Ensure servers are running**:
   ```bash
   make dev
   ```
   This starts both the backend (port 3001) and frontend (port 5173) servers.

2. **Open your browser**:
   Navigate to http://localhost:5173

### Generating Documentation

#### Step 1: Select Your Documentation Mode

Click the **"Task"** or **"Architecture"** tab in the header to switch between modes:

- **Task Mode**: For individual tasks, tickets, and day-to-day work
- **Architecture Mode**: For systems, platforms, and high-level designs

#### Step 2: Select a Notion Target Page

Use the **"Notion Target"** dropdown to select where you want the documentation sent. The list is populated with pages your Notion integration has access to.

> **Tip**: If the dropdown is empty, ensure you've shared the target Notion pages with your integration (see Configuration).

#### Step 3: Fill Out the Context Field

Paste all your notes, code snippets, and information into the single **"Context"** text field. The AI handles the separation and structuring automatically.

**Example for Task Mode**:
```
# Task Overview
We needed to implement a caching layer for user profile data

# Problem
Response times were slow due to repeated database queries

# Solution Implemented
Used Redis with a 5-minute TTL for profile cache

# Code
const redis = require('redis');
const client = redis.createClient();

async function getProfile(userId) {
  const cached = await client.get(`profile:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const profile = await db.getProfile(userId);
  await client.setex(`profile:${userId}`, 300, JSON.stringify(profile));
  return profile;
}

# Challenges
Memory usage spiked initially—resolved by implementing LRU eviction
```

#### Step 4: Generate Documentation

Click the **"Generate Documentation"** button. The AI will process your input and generate professional documentation in the right panel.

#### Step 5: Edit (Optional)

Click the **"Edit"** button to modify the generated Markdown directly. Click **"Save"** to return to the preview.

#### Step 6: Send to Notion

Click **"Send to Notion"** to push the documentation to your selected Notion page. The system automatically handles large documents by splitting them into Notion-compatible chunks.

### Using History

Click the **"Clock"** icon in the header to view your 50 most recent generated documents:

- **Click an item** to restore its documentation and inputs
- **Click the ×** to remove an item from history
- **Click "Clear"** to clear the entire history

All history is stored locally in your browser.

## Testing

### Run All Tests

```bash
make test
```

This runs the complete Vitest suite for both client and server components.

### Run Tests for Specific Packages

```bash
# Frontend tests only
npm test --prefix ./client -- --run

# Backend tests only
npm test --prefix ./server -- --run
```

### Test Organization

- **Frontend Tests**: Located in `client/test/`
  - Component tests with React Testing Library
  - Hook tests with Vitest
  - Accessibility tests with jest-axe
  - API mocking with MSW

- **Backend Tests**: Located in `server/test/`
  - API endpoint integration tests
  - Service layer tests
  - Notion integration tests with snapshots
  - HTTP utility tests (retry logic, timeouts)

## Code Quality

### Linting and Formatting

```bash
# Lint code
make lint

# Fix linting issues
make lint-fix

# Format code
make format

# Check formatting without changes
make check
```

### Tools Used

- **ESLint** — JavaScript linting with React hooks and accessibility plugins
- **Prettier** — Code formatting for consistency
- **Tailwind CSS** — Utility-first CSS for maintainable styles

## Accessibility

The application prioritizes accessibility and follows WCAG 2.1 guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels, live regions, and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Color Contrast**: Meets WCAG AA standards
- **Error Messages**: Clear, accessible error handling

## API Reference

### POST /api/generate

Generates technical documentation using the Gemini API.

**Request Body**:
```json
{
  "context": "string (required, minimum 50 characters)",
  "mode": "task|architecture (optional, defaults to 'task')"
}
```

**Response**:
```json
{
  "documentation": "string (markdown formatted)"
}
```

### POST /api/notion

Sends documentation to a Notion page.

**Request Body**:
```json
{
  "content": "string (required, markdown formatted)",
  "pageId": "string (optional if using NOTION_PAGE_ID)",
  "title": "string (optional, for creating new page)",
  "mode": "task|architecture (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "blocksAdded": 42,
  "chunks": 1
}
```

## Environment Variables

### Server `.env` File

```bash
# Required
GEMINI_API_KEY=your-google-gemini-api-key
NOTION_API_KEY=your-notion-integration-token

# Optional
NOTION_PAGE_ID=default-page-id-for-sending-docs
PORT=3001
NODE_ENV=development
```

## Troubleshooting

### Notion Integration Issues

**Problem**: "No pages available" in the dropdown
- **Solution**: Ensure the Notion integration is shared with the target pages (Share → Invite → Select integration)

**Problem**: "Failed to send to Notion"
- **Solution**: Verify `NOTION_API_KEY` is correct and the integration has "Insert content" permissions

### Generation Issues

**Problem**: Generation times out
- **Solution**: Ensure `GEMINI_API_KEY` is valid and you haven't exceeded rate limits
- **Solution**: Reduce the amount of context (aim for under 10,000 characters)

**Problem**: Empty or incomplete documentation
- **Solution**: Ensure the context field has at least 50 characters of meaningful content

### Development Issues

**Problem**: Port 3001 or 5173 already in use
- **Solution**: Kill existing processes or change ports in configuration files

**Problem**: Dependencies fail to install
- **Solution**: Delete `node_modules/` and `package-lock.json`, then run `make install` again