# Vercel hosting

Vercel is an additional public host for the existing browser prototype. The original Sites URL stays available. Source remains in the owner's personal repository: https://github.com/MannanBabar16/After-hours-cafe-webgl.

The repository root is the deployment root. Use the Vite preset, Node 22.x, `npm ci`, `npm run build`, and output directory `dist`. No runtime environment variables or backend account are needed. `vercel.json` contains this build configuration and long-lived caching only for Vite's hashed assets. The linked `.vercel` folder is local and ignored.

Use the stable production alias in public posts. Deployment-specific preview URLs can be protected even when the production site is public. Check the production alias in a fresh signed-out browser without a bypass token. It must open the game and allow starting a shift without a Vercel account.

The HTML includes social title/description and `social-preview.jpg`, an actual in-engine screenshot with the main game UI. After deployment, make the Open Graph image URL absolute for the production host. Check LinkedIn's [Post Inspector](https://www.linkedin.com/post-inspector/) if LinkedIn keeps an older link preview.

Google Forms setup and the feedback question source are in [docs/feedback/SETUP.md](feedback/SETUP.md). A respondent URL should be published and checked without sign-in before being inserted into the LinkedIn caption.

Browser saves are local to an origin. Existing saves on the Sites domain do not automatically appear on the Vercel domain.
