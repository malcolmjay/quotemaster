# User Creation Fix - Admin Edge Function

## Problem
The User Management page was failing with "Signups are not allowed for this instance" because it was using the regular `signUp()` method, which is disabled for security reasons.

## Solution
Created a secure Edge Function (`create-user`) that uses the Supabase Admin API with the service role key to create users. This bypasses the public signup restriction while maintaining security through role-based access control.

## What Was Fixed

### 1. Created Edge Function ✅
**File:** `supabase/functions/create-user/index.ts`

Features:
- Uses Supabase Admin API with service role key
- Requires authentication (Bearer token)
- Checks that requesting user has ADMIN or MANAGER role
- Validates email and password requirements
- Creates user with auto-confirmed email
- Automatically creates user_metadata entry
- Returns detailed success/error responses
- Full CORS support

### 2. Updated User Management Component ✅
**File:** `src/components/management/UserManagement.tsx`

Changes:
- Replaced `supabase.auth.signUp()` with Edge Function call
- Added password length validation (minimum 8 characters)
- Gets current session token for authentication
- Calls `/functions/v1/create-user` endpoint
- Better error handling and user feedback

## Deployment Steps

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link your project**:
```bash
supabase link --project-ref axrjsmaqxsxutfrjfjpn
```

4. **Deploy the Edge Function**:
```bash
supabase functions deploy create-user
```

5. **Verify deployment**:
```bash
supabase functions list
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** section
3. Click **New Function**
4. Name it: `create-user`
5. Copy the contents of `supabase/functions/create-user/index.ts`
6. Paste into the editor
7. Click **Deploy**

### Option 3: Manual Deployment via API

```bash
# Set your project ref and access token
PROJECT_REF="axrjsmaqxsxutfrjfjpn"
ACCESS_TOKEN="your-access-token"

# Deploy the function
curl -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "create-user",
    "name": "create-user",
    "verify_jwt": true,
    "entrypoint_path": "index.ts",
    "import_map": false
  }'
```

## Testing the Fix

### 1. Test the Edge Function Directly

```bash
# Get your access token first (login to app and check browser DevTools > Application > Local Storage > supabase.auth.token)

curl -X POST \
  'https://axrjsmaqxsxutfrjfjpn.supabase.co/functions/v1/create-user' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "email_confirm": true
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com",
    "created_at": "2025-01-18T..."
  }
}
```

### 2. Test via User Management UI

1. Login to the application as an Admin or Manager
2. Navigate to **User Management** page
3. Click **Create User** button
4. Fill in:
   - Email: `testuser@test.com`
   - Password: `TestPass123!` (minimum 8 characters)
5. Click **Create User**
6. User should be created successfully and appear in the list

### 3. Verify Permissions

Test that non-admin users cannot create users:

1. Login as a CSR or regular user (not Admin/Manager)
2. Try to create a user
3. Should receive: "Insufficient permissions. Admin or Manager role required."

## Security Features

### Role-Based Access Control
- Only users with ADMIN or MANAGER role can create users
- Enforced at the Edge Function level
- Cannot be bypassed from the client

### Authentication Required
- Must be logged in with valid session token
- Token is verified using `supabase.auth.getUser()`
- Invalid or expired tokens are rejected

### Password Requirements
- Minimum 8 characters
- Validated both client-side and server-side

### Audit Trail
- New users have `user_metadata.created_by` field
- Tracks which admin created each user
- Includes creation timestamp

### Service Role Key Protection
- Service role key is stored in Supabase environment
- Never exposed to the client
- Only accessible by Edge Functions

## Troubleshooting

### Error: "Authentication failed"
- Ensure you're logged in
- Check that your session hasn't expired
- Refresh the page and try again

### Error: "Insufficient permissions"
- Your user account needs ADMIN or MANAGER role
- Contact an administrator to assign the role
- Check `user_roles` table in database

### Error: "User creation failed"
- Email may already be in use
- Check Supabase Auth logs in dashboard
- Verify service role key is configured

### Edge Function not found
- Ensure function is deployed: `supabase functions list`
- Check function URL matches environment variable
- Verify project reference is correct

### Password validation errors
- Password must be at least 8 characters
- Use a mix of letters, numbers, and symbols
- Avoid common passwords

## Environment Variables

The Edge Function uses these Supabase-provided variables:
- `SUPABASE_URL` - Your project URL (auto-provided)
- `SUPABASE_ANON_KEY` - Anonymous key (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (auto-provided)

No additional configuration needed!

## API Reference

### Create User Endpoint

**URL:** `https://[project-ref].supabase.co/functions/v1/create-user`

**Method:** `POST`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "email_confirm": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-18T12:00:00Z"
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication failed"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Insufficient permissions. Admin or Manager role required."
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

or

```json
{
  "success": false,
  "message": "Password must be at least 8 characters"
}
```

**User Already Exists:**
```json
{
  "success": false,
  "message": "User already registered",
  "error": {...}
}
```

## Post-Deployment Checklist

- [ ] Edge Function deployed successfully
- [ ] Function appears in Supabase Dashboard > Edge Functions
- [ ] Test user creation as Admin
- [ ] Verify new user appears in User Management
- [ ] Test permission denial for non-admin users
- [ ] Check that user can login with created password
- [ ] Verify user_metadata is created
- [ ] Test password validation (< 8 chars)
- [ ] Test duplicate email handling

## Additional Notes

### Email Confirmation
The `email_confirm` parameter is set to `true` by default, which means:
- Users can login immediately after creation
- No email verification required
- Suitable for admin-created internal accounts

If you want to require email verification:
1. Change `email_confirm: false` in UserManagement.tsx
2. Configure SMTP settings in Supabase Dashboard
3. Update email templates as needed

### User Roles
After creating a user, assign roles via:
1. User Management UI > "Manage Roles" button
2. Direct database insert into `user_roles` table
3. Another Edge Function (if needed for bulk operations)

### Integration with Existing System
- Works with existing RLS policies
- Compatible with current authentication flow
- No changes needed to other components
- Backward compatible with existing users

## Success!

Once deployed, you should be able to create new users from the User Management page without any "signups not allowed" errors. The system now properly uses admin privileges to create users while maintaining security through role-based access control.
