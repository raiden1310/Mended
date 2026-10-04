# Mended

The Mended splash animation, published on Convex static hosting. This release
shows the existing animation once and holds the finished logo. It is not yet
the jewelry repair app described in PRODUCT.md.

## Run locally

```sh
npm ci
npm run dev
```

## Publish

With this project's Convex deployment configured in `.env.local`:

```sh
npm run deploy
```

This builds the page, deploys the Convex backend, and uploads the page to the
production `.convex.site` address. Pushing to GitHub saves code; it does not deploy.

The animation plays once on page load. Reduced motion shows the finished logo.
Local credentials and build files are excluded from GitHub.
