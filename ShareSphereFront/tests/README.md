Playwright tests

- Run `npm run test:e2e:install` to install browsers required by Playwright.
- Run `npm run test:e2e` to execute tests (ensure frontend and backend are running).

Environment variables
- `PLAYWRIGHT_BASE_URL` to override base URL (defaults to http://localhost:5173)
- `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` to provide credentials for login test

Notes
- Tests use placeholders to find login inputs. If you prefer stable selectors, add `id` or `data-testid` to inputs in `src/components/Login.tsx`.
