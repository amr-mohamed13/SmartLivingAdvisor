# Google Maps API Setup

## Getting Started

1. **Get Your Free API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select an existing one
   - Enable the "Maps JavaScript API"
   - Create credentials (API Key)
   - Copy your API key

2. **Add API Key to Your Project**
   - Create a `.env` file in the `website/frontend/` directory (or copy `.env.example`)
   - Add your API key: `VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE`
   - Replace `YOUR_API_KEY_HERE` with your actual API key
   - The `.env` file is already in `.gitignore` to keep your key secure

3. **Free Tier Limits**
   - Google Maps offers **$200 FREE credit per month**
   - This equals approximately **28,000 map loads per month**
   - Most projects never exceed this limit
   - You only get charged if you exceed $200/month

## Security Best Practices

For production, consider:
- Restricting your API key to specific domains
- Using environment variables instead of hardcoding
- Setting up API key restrictions in Google Cloud Console

## Testing

Once you've added your API key, the map will automatically:
- Display property locations using `latitude` and `longitude` from your dataset
- Show markers for each property
- Display info windows with property details when clicked

