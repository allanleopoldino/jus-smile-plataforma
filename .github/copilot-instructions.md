# Jus Smile Plataforma - AI Coding Agent Guidelines

## Project Overview
**Jus Smile** is a full-stack legal document generation platform for dental professionals. It allows authenticated users to browse legal procedure templates (specialties → procedures) and generate personalized documents with dynamic content.

**Architecture**: Node.js/Express backend + Next.js 14 frontend with PostgreSQL database.

## Backend Architecture (`/backend`)

### Stack
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL (via `pg` driver)
- **Authentication**: JWT tokens (jsonwebtoken), bcrypt password hashing
- **Logging**: Winston (structured logging with file persistence)
- **CORS**: Configured via `process.env.FRONTEND_URL`

### Critical Data Flow
1. **Authentication Layer**: All routes except `/signup` and `/login` require JWT token in `Authorization: Bearer <token>` header
   - Token validation happens in `/src/middleware/auth.js` - validates JWT and attaches `req.user` object
   - Invalid/expired tokens trigger 401 redirect to login on frontend
2. **Database Queries**: Uses parameterized queries (`$1, $2` syntax) to prevent SQL injection
   - See `/src/services/db.js` for connection pooling pattern
3. **Document Generation**: Template system uses `{{placeholder}}` syntax
   - `/procedures/:procedureId/generate` accepts JSON body, replaces placeholders, returns rendered content

### Key Endpoints
- `POST /signup` - Register user with name, email, password, plan
- `POST /login` - Returns JWT token valid for 1 hour
- `GET /profile` - Protected, returns user profile data
- `GET /specialties` - List all legal specialties
- `GET /specialties/:specialtyId/procedures` - Get procedures for a specialty
- `GET /procedures/:procedureId` - Get single procedure details including template
- `POST /procedures/:procedureId/generate` - Generate filled document with placeholders

### Environment Variables Required
```
PORT, FRONTEND_URL, JWT_SECRET, DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT, NODE_ENV
```

### Development Workflow
- **Start dev server**: `npm run dev` (uses nodemon for auto-reload)
- **Start production**: `npm run start`
- **Logging**: Winston outputs to console + files (`logs/error.log`, `logs/all.log`) in dev mode

### Error Handling Pattern
Global error middleware at bottom of `server.js` catches all errors. Always use `next(error)` in route handlers to trigger error logging and generic 500 response. Never send raw error details to client.

## Frontend Architecture (`/frontend`)

### Stack
- **Framework**: Next.js 14.2.5 with React 18
- **Styling**: Tailwind CSS 3.4.4 with custom brand color `#462506` (`brand-brown`)
- **Build**: Standard Next.js build/dev scripts

### Global State Management
- **Error Context** (`/context/ErrorContext.js`): Provides `useError()` hook for showing error modals
  - Usage: `const { showError } = useError(); showError("Message")`
  - Auto-renders `ErrorModal` component globally in root layout
- **Auth**: Token stored in `localStorage` under key `token`

### API Integration Pattern
Use `useApi()` hook from `/hooks/useApi.js`:
```javascript
const apiFetch = useApi();
const response = await apiFetch('/endpoint', { method: 'POST', body: JSON.stringify(data) });
if (response.ok) { const data = await response.json(); }
```
This hook automatically:
- Reads token from localStorage and adds `Authorization` header
- Detects 401 responses and clears token + redirects to `/login`
- Uses `NEXT_PUBLIC_API_URL` environment variable

### File Structure
- `/app` - Next.js app router (pages as directories with `page.js`)
- `/components` - Reusable UI components (ErrorModal example shows Tailwind modal pattern)
- `/context` - React context providers (error handling central point)
- `/hooks` - Custom hooks (useApi for authenticated fetch)
- `/public` - Static assets (logo-jussmile.svg)

### Page Routes & Patterns
- `/login` - Form-based auth, stores token, redirects to `/contratos/novo` on success
- `/dashboard` - Protected pages use `useApi()` hook for authenticated requests
- `/categories/[categoryId]/documents` - Dynamic route example for viewing category-specific docs
- `/contratos/novo` - Contract/document generation page (main workflow)

### Styling Conventions
- Use `brand-brown` color for primary UI elements (buttons, accents)
- Tailwind classes directly in JSX (no separate CSS files except globals.css)
- Responsive design with Tailwind breakpoints

## Integration Points

### Authentication Flow
1. User logs in via `/login` page → calls `POST /login` endpoint
2. Backend returns JWT token → frontend stores in localStorage
3. Frontend redirects to `/contratos/novo`
4. All subsequent API calls include token via useApi() hook
5. Token expiration (1 hour) → 401 → auto logout + redirect to login

### Document Generation Workflow
1. User selects specialty → calls `GET /specialties/:id/procedures`
2. User selects procedure → calls `GET /procedures/:id` to fetch template
3. User fills form with data → calls `POST /procedures/:id/generate` with placeholders as JSON
4. Backend renders template by replacing `{{key}}` patterns with values
5. Frontend displays rendered document

## Key Development Considerations

### Database Design Patterns
- Foreign keys: `specialty_id` (procedures→specialties), `user_id` (should be used for user-specific queries)
- Templates stored as `content_template` text fields with `{{placeholder}}` markers
- Query results returned as `.rows` array from pg driver

### Security Considerations
- Passwords hashed with bcrypt (salt rounds: 10) before storage
- JWT tokens expire after 1 hour - frontend should refresh or require re-login
- CORS restricted to `FRONTEND_URL` environment variable only
- Parameterized queries prevent SQL injection

### Error Messages
- Avoid exposing database/stack trace details in API responses
- Use descriptive but generic client messages (see `/api/procedures` 404 example)
- Frontend shows errors via ErrorModal component from useError() hook

## Common Tasks & Commands

| Task | Backend | Frontend |
|------|---------|----------|
| Install deps | `npm install` | `npm install` |
| Start dev | `npm run dev` | `npm run dev` |
| Build | N/A | `npm run build` |
| Start production | `npm run start` | `npm run start` |
| Lint | N/A | `npm run lint` |

## Environment Setup
Create `.env` files in both `/backend` and `/frontend` directories:
- Backend: Set DB credentials, JWT_SECRET, FRONTEND_URL, PORT
- Frontend: Set NEXT_PUBLIC_API_URL (must be publicly accessible from client)
