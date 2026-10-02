# StudyFlo quiz server

This small server sits between the website and the AI, so your API key stays secret.

## Set up (about 10 minutes)

1. Get an API key from https://console.anthropic.com (it needs a few dollars of credit).
2. Make a free Cloudflare account at https://dash.cloudflare.com.
3. In this `server` folder, run:
   - `npm install -g wrangler`
   - `wrangler login`
   - `wrangler init studyflo-ai` (choose "Hello World" Worker), then replace its code with `worker.js`
   - `wrangler secret put ANTHROPIC_API_KEY` and paste your key
   - `wrangler deploy`
4. Wrangler prints an address like `https://studyflo-ai.yourname.workers.dev`.
5. Paste that address into `js/config.js` as `AI_ENDPOINT`.

## Before you share the site

- Set `ALLOWED_ORIGIN` to your site's address (in the Worker's settings) so other sites can't use your server.
- Add a rate limit in Cloudflare (Security > WAF > Rate limiting) so nobody can run up your bill.
- To use a different model, change `MODEL` at the top of `worker.js`.
