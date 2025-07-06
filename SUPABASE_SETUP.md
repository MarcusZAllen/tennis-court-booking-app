# Supabase Setup Guide

This guide will help you set up Supabase for your tennis court booking app.

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `tennis-court-booking-app`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 🔑 Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## 🗄️ Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL to create your tables

## 🔧 Step 4: Configure Environment Variables

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` with your Supabase values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## 🧪 Step 5: Test the Setup

1. Run the Clubspark scraper:
   ```bash
   node runner/scrape-clubspark-only.js
   ```

2. Check your Supabase dashboard → **Table Editor** → **tennis_slots** to see the data

## 🔒 Step 6: Configure GitHub Actions (Optional)

If you want your scrapers to save to Supabase in production:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

3. Update your GitHub Actions workflows to include these environment variables

## 📊 Step 7: Monitor Your Data

- **Supabase Dashboard** → **Table Editor**: View your data
- **Supabase Dashboard** → **Logs**: Monitor API calls
- **Supabase Dashboard** → **Analytics**: Track usage

## 🎯 Next Steps

1. **Update Frontend**: Modify your React components to read from Supabase instead of JSON files
2. **Remove JSON Dependencies**: Once everything works, you can remove the local JSON file saving
3. **Add Real-time Features**: Use Supabase's real-time subscriptions for live updates
4. **Add Authentication**: Use Supabase Auth for user accounts

## 🆘 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists and has the correct values
- Restart your development server after adding environment variables

### "Permission denied" errors
- Check that your service role key is correct
- Verify RLS policies in the database schema

### "Table doesn't exist"
- Run the schema.sql file in Supabase SQL Editor
- Check that all tables were created successfully

## 📈 Benefits of This Setup

✅ **No more GitHub deployments** for data updates  
✅ **Real-time data access**  
✅ **Better performance**  
✅ **Scalable architecture**  
✅ **Built-in backup and monitoring**  
✅ **Future-proof for additional features** 