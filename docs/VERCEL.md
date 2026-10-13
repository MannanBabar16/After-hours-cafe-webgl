# Vercel hosting

Vercel is an additional public host for the existing browser prototype: **https://after-hours-cafe-webgl.vercel.app**. The original Sites URL stays available. Source remains in the owner's personal repository: https://github.com/MannanBabar16/After-hours-cafe-webgl.

The repository root is the deployment root. Use the Vite preset, Node 22.x, `npm ci`, `npm run build`, and output directory `dist`. No runtime environment variables or backend account are needed. `vercel.json` contains this build configuration and long-lived caching only for Vite's hashed assets. The linked `.vercel` folder is local and ignored.

Use the stable production alias in public posts. Deployment-specific preview URLs can be protected even when the production site is public. Check the production alias in a fresh signed-out browser without a bypass token. It must open the game and allow starting a shift without a Vercel account.

The HTML includes social title/description and `social-preview.jpg`, an actual in-engine screenshot with the main game UI. The Open Graph image URL is absolute for the production host. Check LinkedIn's [Post Inspector](https://www.linkedin.com/post-inspector/) if LinkedIn keeps an older link preview.

The existing project `prj_TCg3dnxeeIfiFs7rEYK347V3SFCl` was reused. The 13 October 2026 production deployment `dpl_HEj9L7cAR3tUVWA4z5p652xnsDmK` reached READY from commit `fa48f130ba65d2a0f35405137ac4983ecfbef783`. Login protection is disabled. A fresh unsigned-in browser loaded the production alias and started a shift; all game requests and the social image succeeded. See [the launch check](qa/vercel-public-launch.json).

Google Forms setup and the feedback question source are in [docs/feedback/SETUP.md](feedback/SETUP.md). A respondent URL should be published and checked without sign-in before being inserted into the LinkedIn caption.

Browser saves are local to an origin. Existing saves on the Sites domain do not automatically appear on the Vercel domain.
