# Local Deployment Guide - Quote and Bid Management Tool

This guide will walk you through setting up and running the Quote and Bid Management Tool on your local machine.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installing Required Tools](#installing-required-tools)
3. [Project Setup](#project-setup)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Accessing the Application](#accessing-the-application)
7. [Creating Your First User](#creating-your-first-user)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **A Supabase account** (free tier available at https://supabase.com)

Optional but recommended:
- **Docker Desktop** (for running Supabase locally)
- **VS Code** or your preferred code editor

---

## Installing Required Tools

### 1. Install Node.js and npm

#### Windows:
1. Download the Node.js installer from https://nodejs.org/
2. Run the installer and follow the prompts
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### macOS:
Using Homebrew:
```bash
brew install node
```

Or download from https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

#### Linux (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

### 2. Install Git

#### Windows:
Download from https://git-scm.com/download/win

#### macOS:
```bash
brew install git
```

#### Linux:
```bash
sudo apt-get install git
```

Verify installation:
```bash
git --version
```

### 3. Install Docker Desktop (Optional - for local Supabase)

#### Windows:
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Run the installer
3. Restart your computer
4. Start Docker Desktop

#### macOS:
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Drag Docker.app to Applications
3. Start Docker from Applications

#### Linux:
```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

Verify installation:
```bash
docker --version
docker compose version
```

---

## Project Setup

### 1. Clone or Extract the Project

If you have the project as a zip file, extract it to your desired location.

If cloning from a repository:
```bash
git clone <repository-url>
cd quote-bid-management-tool
```

### 2. Install Project Dependencies

Navigate to the project directory and install dependencies:

```bash
npm install
```

This will install all required packages including:
- React
- Vite
- Supabase client
- Tailwind CSS
- TypeScript
- And all other dependencies

---

## Database Setup

You have two options for setting up Supabase:

### Option A: Use Supabase Cloud (Recommended for Beginners)

#### Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up for a free account
3. Click "New Project"
4. Fill in:
   - **Project Name**: Quote Management Tool
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait 2-3 minutes for setup to complete

#### Step 2: Get Your API Keys

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Click "API" in the left sidebar
3. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

#### Step 3: Configure Environment Variables

1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor and update:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

#### Step 4: Run Database Migrations

The database migrations will create all necessary tables, security policies, and functions.

You have two options:

**Option 1: Using Supabase Dashboard (Easiest)**

1. In your Supabase dashboard, click "SQL Editor"
2. For each migration file in `supabase/migrations/` (in order):
   - Open the file in a text editor
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run"
   - Wait for success confirmation before proceeding to next file

**Option 2: Using Supabase CLI**

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your_project_ref
   ```
   (Find your project ref in the Supabase dashboard URL)

4. Push migrations:
   ```bash
   supabase db push
   ```

### Option B: Use Local Supabase (Advanced)

If you prefer to run Supabase locally with Docker:

#### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

#### Step 2: Initialize Supabase

```bash
supabase init
```

#### Step 3: Start Supabase Locally

```bash
supabase start
```

This will:
- Download necessary Docker images
- Start PostgreSQL database
- Start Supabase services
- Display your local API keys and URLs

**Note**: Save the output! It contains your local credentials.

#### Step 4: Configure Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon_key_from_supabase_start_output>
```

#### Step 5: Apply Migrations

Migrations are automatically applied when you run `supabase start`.

To manually apply or reset:

```bash
supabase db reset
```

---

## Running the Application

### 1. Start the Development Server

In your project directory:

```bash
npm run dev
```

You should see output like:
```
  VITE v5.4.8  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 2. Verify the Server is Running

The application should now be running at:
- **Local**: http://localhost:5173

---

## Accessing the Application

### 1. Open Your Browser

Navigate to: http://localhost:5173

You should see the login page.

### 2. Check for Errors

If you see errors:
- Open browser DevTools (F12)
- Check the Console tab for error messages
- Common issues:
  - **Cannot connect to Supabase**: Check your `.env` file
  - **Module not found**: Run `npm install` again
  - **Port already in use**: Stop other applications using port 5173 or change the port

---

## Creating Your First User

Since this is a fresh installation, you need to create your first admin user.

### Method 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click "Authentication" in the left sidebar
3. Click "Add user" → "Create new user"
4. Fill in:
   - **Email**: your email address
   - **Password**: choose a password
   - **Auto Confirm User**: ✓ Enable this
5. Click "Create user"

### Method 2: Using the Sign Up Flow (If Enabled)

If email confirmation is disabled (default in this app):
1. Go to http://localhost:5173
2. If there's a sign-up link, click it
3. Enter your email and password
4. You'll be logged in automatically

### Assigning Admin Role

After creating a user, assign them admin privileges:

1. In Supabase dashboard, go to "SQL Editor"
2. Run this query (replace with your email):

```sql
-- Get your user ID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Insert admin role (use the ID from above)
INSERT INTO user_roles (user_id, role, email)
VALUES ('user-id-from-above', 'admin', 'your-email@example.com');
```

3. Refresh the application and log in

---

## Troubleshooting

### Application Won't Start

**Problem**: `npm run dev` fails

**Solutions**:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### Cannot Connect to Database

**Problem**: "Failed to connect to Supabase" error

**Solutions**:
1. Verify `.env` file exists and has correct values
2. Check Supabase project is running (cloud) or containers are up (local)
3. Verify URLs don't have trailing slashes
4. Check your internet connection (for cloud Supabase)

For local Supabase:
```bash
# Check if containers are running
docker ps

# If not, restart Supabase
supabase stop
supabase start
```

### Database Tables Don't Exist

**Problem**: Errors about missing tables or columns

**Solutions**:
1. Verify all migrations were applied successfully
2. Re-run migrations:
   - Cloud: Copy and paste each migration file into SQL Editor
   - Local: Run `supabase db reset`

### Login Fails

**Problem**: Cannot log in with created user

**Solutions**:
1. Check user was created:
   ```sql
   SELECT * FROM auth.users WHERE email = 'your-email@example.com';
   ```

2. Verify email is confirmed:
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = now()
   WHERE email = 'your-email@example.com';
   ```

3. Check user has a role:
   ```sql
   SELECT * FROM user_roles WHERE email = 'your-email@example.com';
   ```

### Port 5173 Already in Use

**Problem**: Port conflict when starting dev server

**Solutions**:

Option 1: Change the port in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000  // or any other available port
  },
  // ... rest of config
});
```

Option 2: Kill the process using the port:

**Windows**:
```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**macOS/Linux**:
```bash
lsof -ti:5173 | xargs kill -9
```

### Build Errors

**Problem**: TypeScript or build errors

**Solutions**:
1. Make sure TypeScript version is correct:
   ```bash
   npm install typescript@^5.5.3
   ```

2. Clear TypeScript cache:
   ```bash
   rm -rf node_modules/.vite
   npx tsc --noEmit
   ```

### Help Mode Tooltips Not Showing

**Problem**: Tooltips don't appear when hovering

**Solutions**:
1. Click the Help icon (question mark circle) in the header to enable Help Mode
2. Verify the icon turns blue when enabled
3. Clear browser cache and refresh

---

## Building for Production

When you're ready to deploy to a web server:

### 1. Create Production Build

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### 2. Preview Production Build Locally

```bash
npm run preview
```

### 3. Deploy `dist/` Directory

Upload the contents of `dist/` to your web server or hosting platform:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Your own server with nginx/Apache

---

## Next Steps

After successfully deploying locally:

1. **Import Test Data**: Use the Product Import feature to load your catalog
2. **Create Users**: Add CSR, Manager, and other role users
3. **Configure Settings**: Set up ERP integration if needed
4. **Create Customers**: Add customer records with addresses and contacts
5. **Test Quote Flow**: Create a test quote to verify everything works
6. **Review Approval Limits**: Configure approval thresholds in Settings
7. **Enable Help Mode**: Click the help icon to see tooltips for training

---

## Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **React Documentation**: https://react.dev
- **Vite Documentation**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com

For application-specific documentation, see:
- `README.md` - Project overview
- `DOCUMENTATION.md` - Feature documentation
- `TECHNICAL-ARCHITECTURE.md` - System architecture
- `FUNCTIONAL-REQUIREMENTS.md` - Business requirements

---

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Review the Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Ensure database migrations completed successfully
5. Try the troubleshooting steps above

---

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for database and user accounts
3. **Keep Supabase keys secure** - treat them like passwords
4. **Regularly update dependencies**: `npm update`
5. **For production**: Use production environment variables, not development ones
6. **Enable RLS**: Row Level Security is enabled by default - don't disable it
7. **Regular backups**: Back up your Supabase database regularly

---

## Performance Tips

For better local development experience:

1. **Use Chrome/Edge** for best DevTools
2. **Enable React DevTools** extension
3. **Close unused tabs** to free memory
4. **Use `npm run dev`** not `npm run build` for development
5. **Keep Docker Desktop** updated for better performance

---

## Quick Reference - Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Local Supabase commands
supabase start          # Start local Supabase
supabase stop           # Stop local Supabase
supabase status         # Check status
supabase db reset       # Reset database and apply migrations
supabase db push        # Push migrations to remote
```

---

**You're all set!** 🎉

Your Quote and Bid Management Tool should now be running locally. Create your first quote and explore the features.
