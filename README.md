# The Birthday Arcade

A responsive, 8-bit birthday clicker for Julia made with **React, TypeScript, and Vite**. Tap the coin, buy upgrades, and fill the party meter. A hidden heart appears after 15 taps, and the birthday celebration is always available. The final birthday note and sender are editable in the config.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Make a production build with `npm run build`, then preview it with `npm run preview`.

## GitHub Pages

The Vite base path is configured for the project site at `https://sfire2.github.io/a_little_something/`. The workflow in `.github/workflows/deploy.yml` builds the project and deploys `dist/` when changes are pushed to `main` or `master`.

Put this project at the repository root, then in **Settings → Pages**, choose **GitHub Actions** as the publishing source. Once the workflow is in the repository, the next push to either configured branch will publish the site.

## Personalize

Edit `src/config/birthday.ts` to change the recipient and sender, entrance subtitle, mission, secret and bonus messages, birthday note, sound toggle, or optional clicker and secret.

Procedural chiptune music plays during the clicker and a short fanfare plays on the victory screen. Music and sound effects are always enabled; playback begins with the visitor's first click on **START GAME**. The celebration message is immediately available to screen readers, and reduced-motion preferences simplify the effects.
