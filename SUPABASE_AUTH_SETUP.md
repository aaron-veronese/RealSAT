# Supabase Auth Setup Guide

## Step 1: Enable Email Authentication in Supabase Dashboard

1. Go to your Supabase project: https://vttwzilzseskzlrxtycc.supabase.co
2. Navigate to **Authentication** → **Providers** (left sidebar)
3. Find **Email** in the list of providers
4. Toggle it **ON** (enable)
5. Configure settings:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email**: DISABLE this for testing (you can enable later)
   - ✅ **Secure email change**: Optional
   - Click **Save**

## Step 2: Configure Site URL (Important!)

1. Still in **Authentication** section, go to **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000`
   - `http://localhost:3000/**` (wildcard for all routes)
4. Click **Save**

## Step 3: Check Users Table Trigger (Already exists, but verify)

Your `users` table should automatically create entries when someone signs up. Verify this trigger exists:

1. Go to **Database** → **Functions** (or **Triggers**)
2. Look for a trigger that creates a user record in `users` table after `auth.users` insert
3. If it doesn't exist, run this SQL:

```sql
-- Create a trigger function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role, gems_balance, video_requests, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'STUDENT',
    50,
    ARRAY[]::text[],
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 4: Test the Signup Flow

1. Make sure `npm run dev` is running
2. Go to: http://localhost:3000
3. Click **"Take a Free Test Now"**
4. Complete at least one module
5. Try to access a blocked feature (leaderboard, progress, or click video explanation)
6. Signup modal should appear
7. Fill in:
   - Email: test@example.com
   - Username: testuser
   - Password: password123
   - Full Name: Test User
8. Click **Create Account**
9. Should redirect and unlock all features

## Step 5: Verify in Supabase Dashboard

After signing up, check:
1. **Authentication** → **Users**: Should see new user
2. **Database** → **users** table: Should have matching entry with:
   - Same `id` as auth user
   - `email`, `username`, `name` filled
   - `role` = 'STUDENT'
   - `gems_balance` = 50
   - `video_requests` = []

## Step 6: Test Sign In

1. Sign out (if there's a sign out button, or clear localStorage)
2. Try signing in again with the same credentials
3. Verify all your test results are still there

## Step 7: Create Test Users for Dashboard Testing

Once auth is working, you can create multiple test users:

```sql
-- This will be useful for populating dashboards with real data
-- Run this SQL in Supabase SQL Editor after auth is enabled

-- Note: For real users, they should sign up through the UI
-- But for testing, you can manually insert into auth.users
-- (This is advanced - let's do UI signups first)
```

## Troubleshooting

### "Email not confirmed" error
- Go to **Authentication** → **Email Templates**
- Disable "Confirm email" requirement for testing

### "Invalid credentials" on signup
- Check that email provider is enabled
- Verify Site URL and Redirect URLs are correct

### User created in auth.users but not in public.users
- The trigger (Step 3) isn't set up
- Run the SQL to create the trigger

### Signup modal doesn't appear
- Check browser console for errors
- Verify `components/signup-modal.tsx` is imported correctly

## Next Steps After Auth Works

1. ✅ Create 5-10 test user accounts through the UI
2. ✅ Have each user take tests to populate test_results
3. ✅ Test leaderboard with real competition
4. ✅ Test progress charts with multiple attempts
5. ✅ Test teacher/admin dashboards with real student data
6. ✅ Enable email confirmation for production
7. ✅ Set up password reset flow
8. ✅ Configure production redirect URLs

---

**Your Supabase project URL**: https://vttwzilzseskzlrxtycc.supabase.co
