# HavanaAi

HavanaAi is a polished, responsive AI workspace that runs immediately in any modern browser.

## Features

- Clean responsive chat workspace with mobile support
- Prompt suggestion cards and keyboard-friendly composer
- Press **Enter** to send or **Shift + Enter** for a new line
- Conversation persistence in the browser using `localStorage`
- Clear and start-new-conversation controls
- Safe rendering of user text to prevent HTML injection
- Ready for GitHub Pages

## Run locally

Open `index.html` directly, or serve the folder locally:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080.

## Connect a real AI model

The included replies are a local demo so the app works without configuration. To use a real model, replace the demo response in `app.js` with a request to your own secure backend. Keep provider API keys on the server, never in browser code.

## Deploy

Enable GitHub Pages in the repository settings and choose the `main` branch as the source.
