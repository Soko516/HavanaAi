# HavanaAi

HavanaAi is a standalone AI-powered content discovery app, intentionally separate from SokoAds.

## Included
- AI chat endpoint with provider integration through server-side environment variables
- Content discovery API with category filtering
- Mobile-first responsive interface
- Dark/light mode
- PWA manifest and service worker
- Render deployment configuration
- Local fallback mode when no AI provider is configured

## Deploy
Set these environment variables on your hosting provider:
- AI_API_URL
- AI_API_KEY
- AI_MODEL (optional)

Never put API keys in browser code or commit them to GitHub.

## Local
```bash
npm install
npm start
```

Then open the displayed local URL.

## Note
The app is a general-purpose content discovery assistant. It does not share code or deployment resources with SokoAds.
