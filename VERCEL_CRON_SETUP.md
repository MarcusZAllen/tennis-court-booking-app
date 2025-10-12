# Vercel Cron Setup for ParkSports

## 🎯 Why Vercel Cron?

GitHub Actions is getting blocked by ParkSports (403 errors) because:
- GitHub Actions uses Microsoft Azure IPs (easily detected)
- ParkSports has blocked these IP ranges

Vercel uses different infrastructure, so might bypass the blocking!

## 🔧 Setup Instructions

### 1. Generate a CRON_SECRET

Run this command to generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add Secret to Vercel

Go to your Vercel project settings:
1. Navigate to: `Settings` → `Environment Variables`
2. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** [paste the generated secret from step 1]
   - **Environment:** Production, Preview, Development

### 3. Verify Existing Secrets

Make sure these are already set in Vercel:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### 4. Deploy to Vercel

```bash
git add -A
git commit -m "Add Vercel Cron for ParkSports"
git push origin main
```

Vercel will automatically deploy and activate the cron job!

## ⏰ Cron Schedule

**ParkSports Vercel Cron:**
- Schedule: `0 * * * *` (Every hour, on the hour)
- Endpoint: `/api/cron-scrape-parksports`
- Timeout: 60 seconds
- Runs: 24 times per day

**Existing Cron:**
- ClubSpark scraper: Already running via existing `/api/scrape` endpoint

## 🔒 Security

The cron endpoint checks for the `Authorization: Bearer {CRON_SECRET}` header.
Only Vercel's cron system can trigger it (others will get 401 Unauthorized).

## 📊 Expected Results

After deployment, you should see:
- ParkSports data updating hourly
- No more 403 errors (hopefully!)
- Hyde Park + Regents Park (Tennis + Padel) data staying fresh

## 🧪 Testing

To manually test (requires CRON_SECRET):
```bash
curl -X GET "https://your-app.vercel.app/api/cron-scrape-parksports" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

## 🆘 Troubleshooting

**If it still gets 403 errors:**
- Vercel IPs might also be blocked
- Try reducing frequency to every 2-6 hours
- Or disable and rely on GitHub Actions as backup

**Check logs:**
- Vercel Dashboard → Functions → View logs
- Look for "🚀 Starting ParkSports scraping from Vercel..."

