# Beermonopoly Chrome Extension

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/ff0ebad6bed34928930abeff3493d62a)](https://www.codacy.com/gh/haavardnk/beermonopoly-chrome/dashboard?utm_source=github.com&utm_medium=referral&utm_content=haavardnk/beermonopoly-chrome&utm_campaign=Badge_Grade)

## Introduction

![Beermonopoly Logo](https://i.imgur.com/MHce8RD.png)

The chrome extension Beermonopoly adds information gathered from Untappd to the webstore of Vinmonopolet.

## Installation

Installation of the extension is easily done through the [Chrome Web Store](https://chrome.google.com/webstore/detail/beermonopoly/dfajjomebnpadnigjockaihaofphflcj).

## Development

Built with TypeScript, Vite and [@crxjs](https://crxjs.dev/). Requires Node 20+.

```sh
npm install
npm run dev        # watch build into dist/
npm run build      # production build into dist/
npm run test       # run vitest suite
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run format     # prettier --write
```

Load the unpacked `dist/` directory in `chrome://extensions` (Developer mode) to test locally.

### Structure

```
src/
  manifest.ts          @crxjs MV3 manifest
  content/
    index.ts           entry: boot router + observer
    router.ts          detect page type, dispatch handler
    pages/             search, details, cart, wishlist handlers
    core/              observer, inject, render
    dom/               selectors, product helpers
    api/client.ts      typed batched API client with cache + retry
  shared/              types, constants, format helpers
  styles/content.css   injected styles
tests/                 unit tests + HTML fixtures
```

## License

The Beermonopoly chrome extension is licensed under the GPL-3.0 License. For more information we refer the reader to the [LICENCE file](https://github.com/haavardnk/beermonopoly-chrome/blob/main/LICENSE).
