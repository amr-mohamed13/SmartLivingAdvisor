# Authentication System Setup Guide

This guide will help you set up the complete authentication system for SmartLivingAdvisor.

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL database (Neon or local)
- OAuth credentials (Google, Facebook - optional)

## Backend Setup

### 1. Install Dependencies

```bash
cd website/backend
pip install -r requirements.txt
```

### 2. Database Migration

Run the migration script to update your database schema:

```bash
python -m Scripts.Database.migrate_auth_tables
```

This will:
- Add `name`, `oauth_provider`, `oauth_id`, `updated_at` columns to `users` table
- Create `refresh_tokens` table
- Update `user_interactions` table structure

### 3. Environment Variables

Create or update `website/backend/.env`:

```env
# Database
DATABASE_URL=postgresql+psycopg://user:password@host/database

# JWT Configuration (REQUIRED)
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Facebook OAuth (Optional)
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:8000/auth/facebook/callback

# Apple OAuth (Optional)
APPLE_CLIENT_ID=your-apple-service-id
APPLE_CLIENT_SECRET=your-generated-jwt-client-secret
APPLE_REDIRECT_URI=http://localhost:8000/auth/apple/callback

# CORS (Optional - defaults to localhost)
CORS_ALLOW_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Important:** Generate a strong JWT_SECRET_KEY:
```python
import secrets
print(secrets.token_urlsafe(32))
```

### 4. OAuth Setup (Optional)

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
6. Copy Client ID and Secret to `.env`

#### Facebook OAuth:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs: `http://localhost:8000/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`

#### Apple OAuth:
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an App ID and Service ID
3. Configure Sign in with Apple capability
4. Create a Key with "Sign in with Apple" enabled
5. Download the private key (.p8 file)
6. Generate client_secret JWT (see below)
7. Set Service ID, Team ID, Key ID, and client_secret to `.env`

**Generating Apple Client Secret:**
Apple requires a JWT signed with your private key. You can generate it using this Python script:

```python
import jwt
import time

# Your Apple credentials
TEAM_ID = "your-team-id"
CLIENT_ID = "your-service-id"
KEY_ID = "your-key-id"
PRIVATE_KEY_PATH = "path/to/AuthKey_XXXXX.p8"

# Read private key
with open(PRIVATE_KEY_PATH, 'r') as f:
    private_key = f.read()

# Create JWT
headers = {
    "kid": KEY_ID,
    "alg": "ES256"
}

payload = {
    "iss": TEAM_ID,
    "iat": int(time.time()),
    "exp": int(time.time()) + 86400 * 180,  # 6 months
    "aud": "https://appleid.apple.com",
    "sub": CLIENT_ID
}

client_secret = jwt.encode(payload, private_key, algorithm="ES256", headers=headers)
print(client_secret)
```

Or use a library like `PyJWT` with `cryptography` for ES256 support.

### 5. Start Backend Server

```bash
cd website/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

### 1. Install Dependencies (if needed)

```bash
cd website/frontend
npm install
```

### 2. Environment Variables

Create or update `website/frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Start Frontend Server

```bash
cd website/frontend
npm run dev
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current user (requires auth)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (revoke refresh token)
- `GET /auth/google/login` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/facebook/login` - Initiate Facebook OAuth
- `GET /auth/facebook/callback` - Facebook OAuth callback

### User Interactions

- `POST /user/save-property` - Save a property
- `DELETE /user/save-property/{property_id}` - Unsave a property
- `POST /user/view-property` - Log property view
- `GET /user/saved-properties` - Get saved property IDs
- `GET /user/interactions` - Get all user interactions

## Frontend Usage

### Using Auth Context

```jsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout, token } = useAuth()
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>
  }
  
  return <div>Welcome, {user.email}!</div>
}
```

### Protected API Calls

```jsx
const { token } = useAuth()

const response = await fetch(`${API_BASE_URL}/user/save-property`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ property_id: 123 })
})
```

## Security Features

- ✅ Passwords hashed with bcrypt
- ✅ JWT access tokens (15 min expiry)
- ✅ JWT refresh tokens (7 day expiry, stored in DB)
- ✅ Automatic token refresh
- ✅ Token revocation on logout
- ✅ Protected routes with JWT validation
- ✅ OAuth 2.0 integration
- ✅ CORS protection

## Testing

### Test Signup:
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

### Test Login:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Test Protected Endpoint:
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### "JWT_SECRET_KEY not set"
- Make sure `.env` file exists in `website/backend/`
- Add `JWT_SECRET_KEY=your-secret-key` to `.env`

### "OAuth not configured"
- OAuth is optional - you can use email/password only
- If using OAuth, ensure credentials are in `.env`

### "Database connection failed"
- Check `DATABASE_URL` in `.env`
- Ensure database is running and accessible

### "CORS errors"
- Add frontend URL to `CORS_ALLOW_ORIGINS` in backend `.env`
- Default allows `localhost:5173` and `localhost:3000`

## Next Steps

1. ✅ Run database migration
2. ✅ Set JWT_SECRET_KEY
3. ✅ Configure OAuth (optional)
4. ✅ Start backend server
5. ✅ Start frontend server
6. ✅ Test signup/login
7. ✅ Test OAuth (if configured)
8. ✅ Test property saving

## Production Checklist

- [ ] Change JWT_SECRET_KEY to strong random value
- [ ] Set secure CORS origins
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Set up proper logging
- [ ] Configure OAuth redirect URIs for production domain
- [ ] Set up database backups
- [ ] Review security headers

