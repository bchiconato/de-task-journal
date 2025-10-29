# Client Application

Frontend for the Data Engineering Task Documenter, built with React and Vite.

## Environment variables

- Client code must read envs via `import.meta.env`.
- Only `VITE_*` variables are exposed to the client bundle.
- `.env`, `.env.local`, and `.env.[mode]` are supported; mode files take precedence.
- Restart `vite` after editing `.env*` files.

### Available Variables

- `VITE_API_BASE_URL` — Base URL for backend API (default: `http://localhost:3001/api`)

### Usage Example

```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';
```

### Local Overrides

Create a `.env.local` file at the project root to override default values for your local environment:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

**Note**: `.env.local` is git-ignored and will not be committed.
