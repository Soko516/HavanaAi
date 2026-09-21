# HavanaAi

HavanaAi is an adults-only (18+) AI workspace starter with a consent-first video selection flow.

## Adult-content safety

The app now includes:

- An 18+ entry gate
- A consent acknowledgement before selecting adult video
- Video-only file filtering and a 500 MB client-side limit
- Clear warnings against minors and non-consensual content
- Demo mode that does **not** upload or store the selected file

The age gate is only a browser UX gate, not legal age verification. Before accepting real uploads, add server-side age/identity verification appropriate to each jurisdiction, consent and rights verification, moderation, hashing/scan pipelines, reporting and takedown workflows, encryption, access controls, audit logs, retention/deletion controls, and a process to detect and remove illegal material. Never permit sexual content involving minors, exploitation, coercion, trafficking, or non-consensual intimate imagery.

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. The selected video remains local and is discarded when the upload dialog closes.

## Production integration

This static demo intentionally does not transmit media. Use a secure backend with authenticated, private object storage and server-side validation before connecting the upload control. Keep AI/provider keys off the client, and consult qualified legal counsel about adult-content, privacy, copyright, and data-protection obligations.
