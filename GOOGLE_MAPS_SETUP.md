# Google Maps API Setup

This guide will help you set up the Google Maps API for the distance calculation feature.

## Prerequisites

- A Google Cloud Platform account
- A project in Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Required APIs

Enable the following APIs in your Google Cloud project:

1. **Geocoding API** - For converting addresses to coordinates
2. **Places API** - For address autocomplete functionality
3. **Maps JavaScript API** - For loading the Places Autocomplete widget

To enable these APIs:

1. Go to "APIs & Services" > "Library"
2. Search for each API
3. Click "Enable" for each one

## Step 3: Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key
4. (Optional) Click "Restrict Key" to secure it:
   - For development: Leave unrestricted for easier testing
   - For production: Consider adding IP or referrer restrictions
   
   Note: If adding restrictions, be aware that Geocoding API has limitations with HTTP referrer restrictions. For production, consider implementing a server-side proxy endpoint.

## Step 4: Add API Key to Your Project

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Add your Google Maps API key to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server if it's running

## Free Tier Limits

Google Maps provides a generous free tier:

- **Geocoding API**: $200 free credit per month (~40,000 requests)
- **Places API**: $200 free credit per month (~17,000 requests for Autocomplete)
- **Maps JavaScript API**: $200 free credit per month

For a low-traffic app, you should stay well within the free tier.

## Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your app in the browser
3. Click the location button in the navbar
4. Try entering an address - you should see autocomplete suggestions
5. Set a location and open a booking modal - you should see distances and directional arrows

## Troubleshooting

### "Google Maps API key not configured" error

- Make sure you've added the API key to `.env.local`
- Ensure the key starts with `NEXT_PUBLIC_` (required for Next.js client-side access)
- Restart your development server after adding the key

### Autocomplete not working

- Verify that the **Places API** is enabled in Google Cloud Console
- Check browser console for any API errors
- Ensure your API key restrictions allow requests from your domain

### Geocoding fails

- Verify that the **Geocoding API** is enabled
- Check that you haven't exceeded your quota
- Look for error messages in the browser console

### Distance calculations are incorrect

- Verify that location coordinates in the location config files are accurate
- The Haversine formula should provide accuracy within ~0.5% for most cases

## Security Best Practices

1. **Always restrict your API key** to specific domains and APIs
2. **Monitor usage** in Google Cloud Console to avoid unexpected charges
3. **Don't commit** your `.env.local` file to version control
4. **Rotate keys** if they're ever exposed publicly

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Geocoding API Guide](https://developers.google.com/maps/documentation/geocoding)
- [Places API Guide](https://developers.google.com/maps/documentation/places)

