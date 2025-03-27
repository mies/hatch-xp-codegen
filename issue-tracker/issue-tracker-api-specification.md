# Issue Tracker API Specification

This document outlines the design and step-by-step implementation plan for an Issue Tracker API. The API supports core operations such as issue creation, assignment, status updates, and tagging with labels like 'critical', 'wontfix', and 'bug'. The system is built using Cloudflare Workers with Hono as the API framework.

## 1. Technology Stack

- **Edge Runtime:** Cloudflare Workers
- **API Framework:** Hono.js (TypeScript-based API framework)
- **Database:** Cloudflare D1 (using SQLite at the edge) 
- **ORM/Query Builder:** Drizzle (Type-safe SQL query builder and ORM)
- **Authentication:** Clerk

## 2. Database Schema Design

We will use a relational database schema to model issues and their associated tags. This design uses a many-to-many relationship for tags, allowing each issue to have multiple tags while reusing tag definitions if needed.

### 2.1. Issues Table

- id: INTEGER, primary key, auto increment
- title: TEXT, not null
- description: TEXT, optional
- status: TEXT, not null (e.g., 'open', 'in-progress', 'closed')
- assignedTo: TEXT, optional (Clerk user id for the developer to whom the issue is assigned)
- createdAt: TIMESTAMP, not null
- updatedAt: TIMESTAMP, not null

### 2.2. Issue_Tags Table

- id: INTEGER, primary key, auto increment
- issueId: INTEGER, not null (foreign key to Issues table)
- tag: TEXT, not null (e.g., 'critical', 'wontfix', 'bug')

## 3. API Endpoints

We will group our endpoints around the "issues" resource.

### 3.1. Issues Endpoints

- **POST /issues**
  - Description: Create a new issue.
  - Request Payload (JSON):
    {
      "title": "Issue title",
      "description": "Detailed description of issue",
      "assignedTo": "developer-clerk-id (optional)",
      "status": "initial status",  // e.g. 'open'
      "tags": ["bug", "critical"]
    }
  - Flow: Validate the Clerk authentication token, validate input, insert into the Issues table, then insert appropriate records in the Issue_Tags table for each tag provided.

- **GET /issues**
  - Description: Retrieve a list of issues.
  - Query Parameters (optional):
    - status: filter by status
    - assignedTo: filter by assigned developer
    - tag: filter by tag
  - Flow: Validate authentication and query the database accordingly. Consider pagination defaults.

- **GET /issues/{id}**
  - Description: Retrieve the details of a specific issue by id.
  - Flow: Validate authentication, then query the Issues table and join with Issue_Tags table to return a complete issue detail.

- **PUT /issues/{id}**
  - Description: Update an existing issue's properties such as status, assignment, and tags.
  - Request Payload (JSON):
    {
      "title": "(optional) Updated title",
      "description": "(optional) Updated description",
      "assignedTo": "(optional) Updated clerk id",
      "status": "(optional) Updated status",
      "tags": ["array of tags"]
    }
  - Flow: Authenticate developer via Clerk, update the Issues table as needed, refresh associated tags in the Issue_Tags table (delete existing associations if necessary and re-insert new ones).

## 4. Integrations

- **Authentication:** Use Clerk for developer authentication. Secure each endpoint by verifying Clerk tokens.
- **Database Access:** Use the Drizzle ORM for constructing queries against Cloudflare D1.

## 5. Additional Configuration

- Ensure Cloudflare Workers is configured properly with Hono, Drizzle, and integrations with Clerk.
- Use environment variables and secrets management in Cloudflare Workers for managing Clerk API keys and other sensitive configurations.
- Consider error handling middleware for consistent error responses.
- Use logging and monitoring as provided by Cloudflare Workers to track errors and performance.

## 6. Future Considerations

- Add pagination and sorting capabilities on the GET /issues endpoint for scalability.
- Extend API functionality with search capabilities and filtering by multiple tags.
- Consider event-based notifications or webhooks for issue status changes.
- Add more robust validation and error messaging.
- Explore real-time updates using Cloudflare Durable Objects if collaborative editing or live notifications becomes a requirement.
- Enhance security by implementing role-based permissions if additional user types are introduced.

## 7. Further Reading

- Hono documentation for routing and middleware best practices.
- Drizzle ORM documentation for schema definitions and queries.
- Clerk documentation for authentication integration.
- Cloudflare Workers and D1 guidelines for edge deployments.

This document should guide an experienced developer through the process of setting up and implementing the Issue Tracker API project using the HONC stack.
