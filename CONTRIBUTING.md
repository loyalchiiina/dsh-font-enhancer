# Contributing to dsh-font-enhancer

Thanks for taking the time to contribute! This is a small, focused plugin that
helps people **DIY the fonts and colors of their DSH interface**. The plugin is
deliberately **client-only**: all UI lives in `lib/client.js` as a
`__ModuleLoader__` bundle, with no host services.

## Development

1. Clone the repo and copy the folder (or link) into a DSH profile's
   `node_modules`:
   ```bash
   cp -r dsh-font-enhancer ~/.dsh/profiles/desktop/node_modules/
   ```
2. Add `dsh-font-enhancer` to the profile `bundles`, then restart DSH.
3. The live client bundle is served at the dev port; edit `lib/client.js` and
   copy it over:
   ```bash
   Copy-Item lib/client.js $profile/node_modules/dsh-font-enhancer/lib/client.js
   node --check $profile/node_modules/dsh-font-enhancer/lib/client.js
   ```

## Guidelines

- **Keep it a pure client-side plugin.** No host dependencies, no build step.
- **Run `node --check` before committing** — syntax check passes ≠ logic correct,
  so also manually verify the panel still works after your change.
- **Never regress the cascade rules** — region selectors and their order in
  `DEFAULT_REGIONS()` are what prevent colours from bleeding into each other.
- Add a `CHANGELOG` entry for user-visible changes.

## Reporting issues

Please open an issue with:
- Your DSH version.
- What you expected vs what happened.
- A screenshot if it's visual.

## License

By contributing you agree that your contributions will be licensed under the
same MIT License as the project.