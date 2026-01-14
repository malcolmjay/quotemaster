# Local Deployment Checklist

Use this checklist to ensure you complete all steps for local development setup.

Print this page or keep it open while following the [Local Deployment Guide](LOCAL-DEPLOYMENT-GUIDE.md).

---

## ☑️ Prerequisites

- [ ] **Node.js 18+** installed → `node --version`
- [ ] **npm** installed → `npm --version`
- [ ] **Git** installed → `git --version`
- [ ] **Code editor** installed (VS Code recommended)
- [ ] **Supabase account** created at https://supabase.com
- [ ] (Optional) **Docker Desktop** installed for local Supabase

---

## ☑️ Project Setup

- [ ] Project files extracted or repository cloned
- [ ] Terminal opened in project directory
- [ ] **`npm install`** completed successfully
- [ ] `node_modules` folder exists
- [ ] No error messages during installation

---

## ☑️ Supabase Setup - Cloud (Recommended Path)

- [ ] Logged into https://supabase.com
- [ ] New project created
- [ ] Project name: ________________
- [ ] Database password saved securely
- [ ] Project initialization complete (2-3 minutes)
- [ ] Project URL copied from Settings → API
- [ ] Anon/public key copied from Settings → API

---

## ☑️ Supabase Setup - Local (Advanced Path)

- [ ] Docker Desktop running
- [ ] Supabase CLI installed → `supabase --version`
- [ ] `supabase init` executed
- [ ] `supabase start` executed
- [ ] Local credentials displayed and saved
- [ ] Supabase Studio accessible at http://localhost:54323

---

## ☑️ Environment Configuration

- [ ] `.env.example` file exists in project root
- [ ] **`.env`** file created → `cp .env.example .env`
- [ ] `.env` file opened in text editor
- [ ] `VITE_SUPABASE_URL` updated with your URL
- [ ] `VITE_SUPABASE_ANON_KEY` updated with your key
- [ ] No trailing slashes in URL
- [ ] No extra spaces or quotes in values
- [ ] File saved

**Your .env should look like:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ☑️ Database Migrations

### Method 1: Supabase Dashboard (Easier)

- [ ] Opened Supabase Dashboard
- [ ] Clicked "SQL Editor" in sidebar
- [ ] Opened first migration file: `supabase/migrations/20250911210238_autumn_bridge.sql`
- [ ] Copied entire file contents
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run"
- [ ] Success message appeared
- [ ] Repeated for each migration file in chronological order:
  - [ ] 20250911210238_autumn_bridge.sql
  - [ ] 20250912131544_muddy_block.sql
  - [ ] 20250912171028_small_gate.sql
  - [ ] 20250918172933_raspy_spring.sql
  - [ ] 20250918172956_warm_pine.sql
  - [ ] (Continue with all files...)

### Method 2: Supabase CLI

- [ ] `supabase login` completed
- [ ] `supabase link --project-ref <ref>` executed
- [ ] `supabase db push` completed successfully
- [ ] No error messages

---

## ☑️ Database Verification

Run in Supabase SQL Editor:

- [ ] Tables exist:
  ```sql
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
  ```
  Expected: 20+ tables

- [ ] Key tables present:
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
  ```
  Should include: customers, products, quotes, quote_line_items, user_roles, etc.

---

## ☑️ Start Application

- [ ] Terminal opened in project directory
- [ ] **`npm run dev`** executed
- [ ] Server started successfully
- [ ] URL displayed: http://localhost:5173
- [ ] No error messages in terminal

---

## ☑️ Browser Verification

- [ ] Browser opened to http://localhost:5173
- [ ] Login page displayed correctly
- [ ] Page loads without errors
- [ ] DevTools opened (F12)
- [ ] Console tab checked - no red errors
- [ ] Network tab checked - requests successful

---

## ☑️ Create First User

### Via Supabase Dashboard

- [ ] Navigated to Authentication → Users
- [ ] Clicked "Add user"
- [ ] Selected "Create new user"
- [ ] Email entered: ________________
- [ ] Password entered (saved securely)
- [ ] **"Auto Confirm User" enabled** ✓
- [ ] User created successfully
- [ ] User ID copied: ________________

---

## ☑️ Assign Admin Role

- [ ] Supabase Dashboard → SQL Editor opened
- [ ] Following SQL prepared with your email and user ID:
  ```sql
  INSERT INTO user_roles (user_id, role, email)
  VALUES ('your-user-id-here', 'admin', 'your-email@example.com');
  ```
- [ ] SQL executed successfully
- [ ] Role assignment confirmed:
  ```sql
  SELECT * FROM user_roles WHERE email = 'your-email@example.com';
  ```

---

## ☑️ Login Test

- [ ] Application refreshed in browser
- [ ] Email entered on login form
- [ ] Password entered
- [ ] "Sign In" clicked
- [ ] Successfully logged in
- [ ] Dashboard/Quote Builder displayed
- [ ] User name shown in header
- [ ] No error messages

---

## ☑️ Feature Verification

### Navigation
- [ ] Header displays correctly
- [ ] Menu button works (mobile/hamburger icon)
- [ ] Can navigate to different pages
- [ ] All menu items load

### Help Mode
- [ ] Help icon visible in header (? circle)
- [ ] Clicking enables Help Mode (turns blue)
- [ ] Hovering over buttons shows tooltips
- [ ] Tooltips are helpful and descriptive
- [ ] Can disable Help Mode

### Basic Functionality
- [ ] Quote Builder page loads
- [ ] Customer Management page loads
- [ ] Product Management page loads
- [ ] User Management page loads
- [ ] Settings page loads
- [ ] No console errors on any page

---

## ☑️ Test Quote Creation

- [ ] Navigate to Quote Builder
- [ ] Click customer search
- [ ] Type test characters
- [ ] Search works (may show empty)
- [ ] Product search field visible
- [ ] Can type in product search
- [ ] "New Quote" button visible

---

## ☑️ Troubleshooting (If Needed)

If you encountered issues, check:

- [ ] All previous checklist items completed
- [ ] Error messages documented
- [ ] Browser console checked (F12)
- [ ] Terminal output reviewed
- [ ] `.env` file verified
- [ ] Supabase project online
- [ ] Internet connection stable

Common fixes tried:
- [ ] Cleared browser cache
- [ ] Restarted dev server (Ctrl+C, then `npm run dev`)
- [ ] Reinstalled dependencies (`rm -rf node_modules && npm install`)
- [ ] Verified Supabase credentials
- [ ] Checked firewall/antivirus

---

## ☑️ Optional Setup

- [ ] Additional users created
- [ ] Test customers added
- [ ] Test products imported
- [ ] Settings configured
- [ ] ERP integration configured (if needed)
- [ ] Approval limits set

---

## ☑️ Documentation Review

- [ ] Read LOCAL-DEPLOYMENT-GUIDE.md
- [ ] Reviewed QUICK-REFERENCE.md
- [ ] Bookmarked Supabase dashboard
- [ ] Saved credentials securely
- [ ] Know where to find help

---

## ✅ Success!

### All items checked above?

**Congratulations!** Your local development environment is ready!

### Quick Reference

```bash
# Start development
npm run dev

# Stop (in terminal)
Ctrl + C

# Access application
http://localhost:5173

# Access Supabase Dashboard
https://supabase.com/dashboard

# Access local Supabase Studio (if using local)
http://localhost:54323
```

### Next Steps

1. ✨ **Try Help Mode** - Click the help icon and explore tooltips
2. 📥 **Import Data** - Use Product Import to add your catalog
3. 👥 **Add Team** - Create user accounts for your team
4. 💼 **Create Quote** - Walk through a complete quote process
5. ⚙️ **Configure** - Set up approval limits and preferences

### Need Help?

- Check the [Troubleshooting section](LOCAL-DEPLOYMENT-GUIDE.md#troubleshooting) in the deployment guide
- Review QUICK-REFERENCE.md for common commands
- Check browser console for specific errors
- Verify all checklist items are complete

---

## 📝 Notes

Use this space to record any issues, solutions, or observations:

**Date:** _______________

**Issues Encountered:**
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

**Solutions Applied:**
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

**Additional Notes:**
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

**Checklist Version:** 1.0
**For Local Development Only**

Keep this checklist for reference when setting up additional development machines!
