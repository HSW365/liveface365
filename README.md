# LiveFace365 — HSW365 Creator Studio

LiveFace365 is a mobile-responsive creator studio foundation for camera preview, original visual looks, and livestream setup guidance.

## Current implementation

- React + Vite application with a responsive creator-studio UI.
- Local browser camera preview using `getUserMedia`, including permission/error handling and camera shutdown.
- Original look selector with category filters and selected-look state.
- Camera mirror setting and look-intensity control UI.
- OBS/platform setup guide and safe stream-key guidance.
- Accessible dialog patterns, keyboard focus states, reduced-motion support, and mobile layouts.
- No video is uploaded by the current camera preview.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

The generated static site is in `dist/`.

## Deploy on Render as a Static Site

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- No server-side environment variables are required for the current UI.

Use HTTPS in production for browser camera access.

## Important product status

This repository currently provides the front-end foundation, not a complete real-time face-swap or streaming service. The camera preview and look selector do not transform facial identity. The OBS guide is instructional and does not transmit a live stream.

Before production launch, implement and test:

1. A real-time avatar/face-rendering provider or an owned processing pipeline with consent and likeness rights.
2. A streaming output path (for example, a supported virtual-camera/OBS workflow or a provider-backed WebRTC/RTMP service). TikTok LIVE access depends on platform eligibility and permissions.
3. Secure authentication and server-side authorization.
4. Billing, subscription entitlements, cancellation, and webhook verification.
5. Server-side rate limits, abuse reporting, audit logs, and privacy/retention controls.
6. Automated tests, error monitoring, accessibility checks, and a deployment health check.

Never store provider secrets or streaming keys in client-side code or commit them to Git.

## Product principles

- Use original fictional characters, the user's own likeness, or likenesses with documented authorization.
- Disclose synthetic/AI-generated content where appropriate and follow each platform's current rules.
- Keep the experience fast, accessible, mobile-friendly, and transparent about which features are live versus planned.
