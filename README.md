# HavanaAi

A clean, responsive AI workspace that runs immediately in any modern browser. The current starter app includes a polished chat interface, prompt suggestions, responsive mobile layout, and a local demo assistant response.

## Run it

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080.

## Connect a real AI model

The interface is intentionally frontend-only so it can be deployed immediately. To connect an AI provider, replace the demo `setTimeout` response in `app.js` with a request to your own secure backend. Keep provider API keys on the server, never in browser code.

## Deploy

This is ready for GitHub Pages: enable Pages in the repository settings and choose the `main` branch as the source.
