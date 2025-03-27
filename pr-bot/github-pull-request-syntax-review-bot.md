# GitHub Pull Request Syntax Review Bot

This document outlines the detailed implementation plan for a GitHub pull request review bot that focuses on checking for TypeScript syntax errors. The bot will be triggered automatically whenever a pull request is created or updated on GitHub, and it will report any syntax errors as comments directly on the pull request.

## 1. Technology Stack

- **Edge Runtime:** Cloudflare Workers
- **API Framework:** Hono.js (TypeScript-based API framework)
- **Version Control & Webhook Source:** GitHub
- **Languages Analyzed:** TypeScript
- **Syntax Checking:** TypeScript Compiler API (using native functions or ts.transpileModule)

## 2. High-Level Architecture & Workflow

1. **Webhook Listener:**
   - Deploy a Cloudflare Worker with Hono.js to serve as a webhook endpoint. This endpoint will be registered in GitHub to receive pull request events (creation and updates).

2. **Authentication & Security:**
   - Validate incoming webhook requests using a secret token (configured in GitHub and stored as an environment variable in Cloudflare Workers).
   - Use a GitHub token (stored securely in the environment) to authenticate API calls to GitHub when posting comments.

3. **Processing a PR Event:**
   - On receiving a pull request event, extract the PR details from the payload.
   - Identify the files changed in the PR that have the `.ts` extension.
   - For each TypeScript file, fetch the file content from the repository using the GitHub API.

4. **Syntax Checking:**
   - Use the TypeScript compiler API to perform syntax checking. A lightweight approach is to use `ts.transpileModule` which can return syntax diagnostics without performing a full type-checking pass.
   - Collate any syntax errors detected for each file.

5. **Review Comment Posting:**
   - If syntax errors are found, format them into a clear, concise comment. The comment should include:
     - The file name
     - The specific syntax error(s) reported
   - Post the comment directly to the pull request using the GitHub API.

## 3. API Endpoints

The service will expose one primary endpoint to handle webhook events from GitHub:

### 3.1. POST /webhook

- **Description:** Receives and validates pull request events from GitHub
- **Authentication:** Verify the webhook token sent in headers or payload
- **Processing Flow:** 
  1. Validate the webhook signature/token
  2. Check if the event is a PR creation/update
  3. For each changed file ending with `.ts`:
     - Fetch file contents from GitHub via API
     - Run syntax check using TypeScript compiler
  4. If any file fails the syntax check, construct a comment detailing the errors
  5. Use the GitHub API (authenticated via a GitHub token) to post a comment on the PR
- **Expected Payload Example:** (refer to GitHub webhook payload for pull_request events)

## 4. Database Schema

No relational database is needed since the bot’s functionality is primarily stateless -- processing webhook events and interacting with GitHub APIs. All required state (like tokens and secrets) will be stored as environment variables.

## 5. Integrations

- **GitHub Webhooks:** For triggering the bot on pull request events
- **GitHub API:** Post comments using a valid GitHub token
- **TypeScript Compiler API:** To check file syntax in-memory

## 6. Environment Variables & Secret Management

Make sure to configure and manage the following environment variables securely:

- WEBHOOK_SECRET: Secret token to validate incoming webhook requests
- GITHUB_TOKEN: Token for authentication when making GitHub API calls to fetch file content and post comments
- (Optional) Other configuration parameters as needed

## 7. Future Considerations

- **Enhanced Analysis:** In the future, consider extending the bot to perform more advanced checks (e.g., style linting, type-checking, etc.)
- **Language Support:** Expand support to additional programming languages.
- **Configuration per Repository:** Allow repositories to customize the syntax checking rules or enable/disable the bot dynamically.
- **Rate-Limiting and Backoff:** Implement rate-limiting on posting comments to handle large pull requests gracefully.
- **Testing & Logging:** Augment the bot with extensive logging and testing, either by unit tests or integration tests within the Cloudflare Workers environment.

## 8. Deployment Notes

- Use Cloudflare Workers for deployment on the edge.
- Prior to deployment, thoroughly test webhook verification and GitHub API integrations locally or in a staging environment.
- Monitor logs after deployment to ensure events are processed correctly.

## 9. Further Reading

Refer to the project template: https://github.com/fiberplane/create-honc-app/tree/main/templates/d1
