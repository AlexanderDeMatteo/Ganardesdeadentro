> **Documento histórico** — ver [README.md](README.md) y [TEST_DOCKER.md](TEST_DOCKER.md) para instrucciones actuales.

# Personal Trainers Platform - Setup Guide

## Project Architecture

### Backend (Flask + SQLAlchemy)
- Location: `/backend`
- Language: Python
- Database: PostgreSQL
- ORM: SQLAlchemy 2.0
- API: RESTful with JWT authentication

### Frontend (Next.js 16 + React 19)
- Location: `/app`, `/components`
- Language: TypeScript/React
- Styling: Tailwind CSS + shadcn/ui
- Authentication: JWT tokens stored in localStorage

---

## Backend Setup

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: Strong random key for JWT signing
- `EXERCISEDB_API_KEY`: Get from https://rapidapi.com/justin-WFnsXH_haHLw/api/exercisedb

### 4. Initialize Database
```bash
python -c "from app.database import init_db; init_db()"
```

Or manually create tables using the SQLAlchemy models.

### 5. Run Server
```bash
python run.py
```

Server runs on `http://localhost:5000`

---

## Frontend Setup

### 1. Create .env.local
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Run Dev Server
```bash
npm run dev
# or
pnpm dev
```

Frontend runs on `http://localhost:3000`

---

## Database Schema

### Core Tables
- **users** - User accounts with email/password
- **user_profiles** - Extended user information (age, weight, etc.)
- **memberships** - Subscription tiers (Free, Premium, Pro)
- **user_memberships** - Active subscriptions per user
- **exercises** - Exercise library (cached from ExerciseDB)
- **routines** - Training programs created by admins
- **routine_exercises** - Exercise selection for each routine
- **user_routine_assignments** - Routines assigned to users
- **metrics_history** - Weight, body fat, measurements tracking

### Indexes
- Optimized for common queries (user_id, email, active status)
- Composite indexes for date range queries
- UTC timezone for all timestamps

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user (requires JWT)
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Exercises
- `GET /api/exercises/muscles` - List all muscle groups
- `GET /api/exercises/by-muscle/<muscle>` - Get exercises by muscle
- `GET /api/exercises/search?q=<query>` - Search exercises
- `GET /api/exercises/<id>` - Get exercise details
- `GET /api/exercises/cached` - Get cached exercises

### Routines (Coming soon)
- `GET /api/routines` - List routines
- `POST /api/routines` - Create routine
- `GET /api/routines/<id>` - Get routine details

### Users (Coming soon)
- `GET /api/users/<id>` - Get user profile
- `PUT /api/users/<id>` - Update profile

### Metrics (Coming soon)
- `GET /api/metrics/<user_id>` - Get metrics history
- `POST /api/metrics` - Add metric entry

---

## Security Considerations

### Password Hashing
- bcrypt with 12 rounds salt
- Never store plain passwords
- Minimum 8 characters required

### JWT Tokens
- HTTP-only cookies for token storage
- 24-hour expiration (configurable)
- CSRF protection enabled
- Secure flag in production

### Database
- SQL injection prevention via parameterized queries
- Row-level security (RLS) ready for Supabase migration
- User isolation with foreign keys
- Active flag for soft deletes

### ExerciseDB API
- Local caching to avoid rate limiting
- Cached exercises fetched first
- API key stored in environment variables

---

## Frontend Features

### Authentication Flow
1. Register/Login forms with validation
2. JWT token stored after successful auth
3. Protected routes with ProtectedRoute component
4. Auto-logout on token expiration (implement redirect)
5. Role-based access (user vs admin)

### Components
- `LoginForm` - Email/password login
- `RegisterForm` - User registration
- `ProtectedRoute` - Wrapper for protected pages
- `Navbar` - Navigation with user menu
- `AuthContext` - Global auth state management

### Pages
- `/` - Home page with features
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard (protected)
- `/routines` - Routine list (coming soon)
- `/metrics` - Progress tracking (coming soon)
- `/admin` - Admin panel (coming soon)

---

## Development Workflow

### 1. Frontend Development
- Components in `/components`
- Pages in `/app`
- Context/hooks in `/app/context`, `/hooks`
- Styles: Tailwind CSS with shadcn/ui components

### 2. Backend Development
- Models in `/backend/app/models.py`
- Routes in `/backend/app/routes/`
- Services in `/backend/app/services/`
- Database in `/backend/app/database.py`

### 3. Database Migrations
When changing models:
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## Deployment

### Backend (Flask)
Option 1: Heroku
```bash
heroku create your-app-name
heroku buildpacks:add heroku/python
git push heroku main
```

Option 2: Vercel with serverless functions
Convert Flask routes to Next.js API routes

### Frontend (Next.js)
```bash
vercel deploy
```

Update `NEXT_PUBLIC_API_URL` environment variable to production backend URL.

---

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure user has create table permissions

### JWT Token Issues
- Clear browser localStorage
- Regenerate `JWT_SECRET_KEY`
- Check token expiration

### CORS Errors
- Update `CORS_ORIGINS` in backend config
- Include frontend URL in allowed origins

### Exercise API Rate Limiting
- Check `EXERCISEDB_API_KEY` is valid
- Use cached exercises first
- Implement request queuing if needed

---

## Next Steps

1. Implement Routine CRUD endpoints
2. Create routine builder admin interface
3. Add metric tracking and visualization
4. Implement email notifications
5. Add payment integration (Stripe)
6. Deploy to production

---

## Resources

- Flask: https://flask.palletsprojects.com/
- SQLAlchemy: https://docs.sqlalchemy.org/
- Next.js: https://nextjs.org/docs
- ExerciseDB API: https://rapidapi.com/justin-WFnsXH_haHLw/api/exercisedb
- JWT: https://jwt.io/
- bcrypt: https://github.com/pyca/bcrypt
