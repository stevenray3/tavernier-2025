# Repository Guidelines

## Project Structure & Module Organization
- ot.js (single entry point) registers slash commands, menus, and wallet helpers; keep new features scoped to existing comment sections.
- 	rigger-words.json stores passive listener terms; update the list and keep it alphabetized.
- .env holds Discord credentials; keep the file local with placeholder values when documenting; never commit secrets.
- Procfile declares worker: npm run start for deployment targets that rely on process managers.

## Environment & Secrets
Create your own .env with DISCORD_TOKEN, GUILD_ID, and CLIENT_ID. Generate tokens in the Discord Developer Portal and rotate whenever they leak. Prefer .env.local for personal tweaks and verify new variables are read via process.env before use.

## Build, Test, and Development Commands
- 
pm install ? installs Discord bot dependencies; rerun after any package.json change.
- 
pm start ? runs 
ode bot.js and registers slash commands against the guild configured via environment variables.
- 
ode bot.js --trace-warnings ? helps diagnose unhandled promise rejections in Discord event handlers.

## Coding Style & Naming Conventions
Use four spaces, trailing semicolons, and const for imports and immutable values (see ot.js:1-20). Name helpers in camelCase (getWallet, ddCoins) and keep constants in SCREAMING_SNAKE_CASE (CURRENCY, TAX_RATE). Group related sections under the existing banner comments (Configuration, Command wiring, Economy helpers) and prefer descriptive embed titles over raw strings.

## Testing Guidelines
There is no automated suite yet; validate changes in a staging Discord guild before opening a PR. After 
pm start, confirm slash command registration, drinks menu responses, and wallet updates. When introducing pure functions, add inline assertions or propose a Jest harness in the PR so reviewers can run 
pm test without Discord connectivity.

## Commit & Pull Request Guidelines
Follow the current history: short French summaries in the present tense (Premiere salve de fonctionnalites). Reference issue IDs or Trello cards when available. Each PR should include a concise change log, screenshots or transcript snippets for user-visible updates, and explicit notes about secrets or migrations. Flag breaking permission changes and document rollout steps for bot redeployment.
