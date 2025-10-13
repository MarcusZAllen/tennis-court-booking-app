# Resend Email Setup for Feedback Feature

## 🎯 What is Resend?

Resend is a modern email API service that makes it easy to send transactional emails.
- **Free tier:** 100 emails/day, 3,000/month
- **Perfect for:** Feedback forms, notifications
- **Setup time:** ~5 minutes

## 🚀 Setup Instructions

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" (free)
3. Verify your email

### Step 2: Get API Key

1. After logging in, go to "API Keys" in the dashboard
2. Click "Create API Key"
3. Name it: "CourtBook Feedback"
4. Copy the API key (starts with `re_...`)
5. **Save it somewhere safe** - you won't see it again!

### Step 3: Add API Key to Vercel

1. Go to your Vercel project dashboard
2. Navigate to: `Settings` → `Environment Variables`
3. Click "Add New"
4. Add:
   - **Name:** `RESEND_API_KEY`
   - **Value:** [paste your API key from Step 2]
   - **Environment:** Check "Production"
5. Click "Save"

### Step 4: Verify Domain (Optional but Recommended)

**Option A: Use Resend's Test Domain (Quickest)**
- Update the `from` email in `src/pages/api/send-feedback.ts`
- Change to: `from: 'onboarding@resend.dev'`
- Works immediately, no verification needed
- Emails might go to spam

**Option B: Verify Your Own Domain (Best)**
- In Resend dashboard, go to "Domains"
- Click "Add Domain"
- Add your domain (e.g., `courtbook.app`)
- Follow DNS setup instructions
- Once verified, update `from` email to: `feedback@courtbook.app`
- Emails won't go to spam

### Step 5: Deploy

```bash
git push origin main
```

Vercel will automatically redeploy with the new environment variable!

## 🧪 Testing

After deployment, test the feedback button:
1. Open your live site
2. Click the "Feedback" button (bottom-right)
3. Type a test message
4. Click "Submit Feedback"
5. Check your email: marcus.zhang.allen@gmail.com

## 📊 Monitoring

Check Resend dashboard to see:
- Emails sent
- Delivery status
- Usage stats (stay within 100/day limit)

## 🆘 Troubleshooting

**"Email service not configured" error:**
- RESEND_API_KEY not set in Vercel
- Redeploy after adding the key

**Emails going to spam:**
- Use Resend's test domain initially
- Verify your own domain for better deliverability

**Rate limit exceeded:**
- Free tier: 100 emails/day
- Upgrade to paid plan if needed (unlikely for feedback)

## 💰 Cost

**Free tier includes:**
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ Perfect for feedback forms
- ✅ No credit card required

For a feedback form, you'll likely never exceed the free tier!

