# Vercel + Supabase Quick Start (15 Minutes)

Fast-track deployment guide for experienced developers.

---

## 1. Supabase Setup (5 minutes)

```bash
# Create project at https://supabase.com
# Get credentials from Settings → API

# Save these:
PROJECT_URL=https://xxxxx.supabase.co
ANON_KEY=eyJhbGci...
SERVICE_ROLE_KEY=eyJhbGci...
```

**Disable email confirmation:**
- Auth → Providers → Email → Confirm email: OFF

**Run migrations:**
- SQL Editor → Paste each migration from `supabase/migrations/` → Run

**Deploy edge functions:**
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy create-user
supabase functions deploy import-customers
supabase functions deploy import-products
supabase functions deploy import-cross-references
```

**Create admin user:**
```bash
curl -X POST \
  "https://YOUR-PROJECT-REF.supabase.co/functions/v1/create-user" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

---

## 2. GitHub Setup (2 minutes)

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore

# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

---

## 3. Vercel Deployment (5 minutes)

1. **Go to https://vercel.com → Import Project**
2. **Select your GitHub repo**
3. **Add environment variables:**
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
4. **Deploy**

---

## 4. Connect Vercel to Supabase (1 minute)

**In Supabase:**
- Auth → URL Configuration
- Add: `https://your-app.vercel.app`

---

## 5. Test (2 minutes)

1. Visit your Vercel URL
2. Login with admin credentials
3. Create a test quote

---

## Security Hardening

**Add `vercel.json`:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Commit and push** - Vercel auto-redeploys.

---

## Done!

Your application is live at: `https://your-app.vercel.app`

For detailed instructions, see: `VERCEL-SUPABASE-DEPLOYMENT.md`
