# Ølmonopolet Extension

Browser extension for Ølmonopolet - adds Untappd ratings and Ølmonopolet data to Vinmonopolet's web store.

Built with TypeScript, Vite and [@crxjs](https://crxjs.dev/).

## Setup

```bash
git clone https://github.com/haavardnk/olmonopolet-chrome.git
cd olmonopolet-chrome
npm install
```

## Run

```bash
npm run dev      # watch build into dist/
npm run build    # production build into dist/
```

Load the unpacked `dist/` folder in `chrome://extensions` (Developer mode) to test locally.

## Development

```bash
npm run test       # unit tests (vitest)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run format     # prettier
```

## License

LGPL-3.0 License - See [LICENSE](LICENSE) file for details.
