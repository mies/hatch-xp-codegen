# Metering Service API for LLM Token & Message Usage

This document outlines the design and implementation plan for a metering service API that tracks tokens and messages per user. The API is intended to be deployed on Cloudflare Workers using Hono.js with Cloudflare D1 as the database (using Drizzle ORM for type-safe queries). The system will integrate with an existing authentication system, so no built-in auth is required at this stage.

## 1. Technology Stack

- **Edge Runtime:** Cloudflare Workers
- **API Framework:** Hono.js (TypeScript-based API framework)
- **Database:** Cloudflare D1 (SQLite edge database), with Drizzle ORM for schema definition and query building

## 2. Database Schema Design

The service will track usage events on a per-user basis. The database will have a single table to record each event or update cumulative usage per user. There are two design approaches depending on your requirements:

### Option A: Event-based Logging

Maintain a log of each usage event. This supports detailed reporting and historical tracking.

#### Table: usage_events

- id: INTEGER, Primary Key, Auto Increment
- user_id: TEXT, identifier for the user
- tokens_used: INTEGER, number of tokens in the event
- messages_count: INTEGER, number of messages in the event
- created_at: TIMESTAMP, default to current timestamp

*Advantages:* Detailed event tracking, auditability.

*Disadvantages:* Requires aggregation for summaries.

### Option B: Cumulative Usage Tracking

Maintain a single entry per user that aggregates tokens and messages.

#### Table: user_usage

- id: INTEGER, Primary Key, Auto Increment
- user_id: TEXT, unique index (identifier for the user)
- total_tokens: INTEGER, cumulative tokens
- total_messages: INTEGER, cumulative message count
- updated_at: TIMESTAMP, last updated timestamp

*Advantages:* Fast retrieval of aggregated data for each user.

*Disadvantages:* Limited historical granularity.

Choose the design based on your reporting needs. For this plan, we describe endpoints for both methods as applicable; however, the implementation can start with the cumulative model and later extend to event logs if needed.

## 3. API Endpoints

The API endpoints are grouped into two sections: Data ingestion (usage recording) and Data querying (usage retrieval). Since no authentication is built in, the user identifier is assumed to be passed in the API payload or as a URL parameter.

### 3.1. Usage Recording

#### POST /usage
- Description: Record a usage event for a user. For an event-based system, a new record is inserted. For a cumulative system, the user_usage record is updated (insert if not exists, then increment counters).
- Expected Payload (JSON):

  {
    "userId": "<user-identifier>",
    "tokensUsed": <number>,
    "messagesCount": <number>
  }

- Pseudocode Logic:
  - Parse and validate payload
  - If using event-based logging:
    - Insert a new record into the usage_events table
  - If using cumulative tracking:
    - Check for an existing record in user_usage for given userId
    - If exists, update the record by incrementing the tokens and messages counts, and update the timestamp
    - Else, create a new user_usage record
  - Return a success response

### 3.2. Usage Retrieval

#### GET /usage/:userId
- Description: Retrieve the aggregated usage data for a specific user.
- URL Parameter: userId
- Response: Aggregated data (e.g., total tokens and messages used)

- Pseudocode Logic:
  - Extract userId from the URL
  - Query the cumulative usage table (or aggregate from usage_events if using events) for the given user
  - Return the data in JSON format

#### GET /usage
- Description: (Optional) Retrieve aggregated usage data for all users. This could support additional filtering (e.g., by date range) in future if using the event logging approach.
- Query Parameters (Optional): date filters if using event logs.
- Pseudocode Logic:
  - Parse query parameters if provided
  - If using event-based logging, perform an aggregation query; for cumulative storage, list all records
  - Return the aggregated results in JSON

## 4. Additional Integrations

- **Existing Authentication System Integration:**
  - As authentication is managed externally, ensure that every request includes a valid identifier (userId) passed either in the payload or via headers.
  - Optionally, validate or sanitize the userId to match the external system’s format.

- **Logging & Monitoring:**
  - Integrate with Cloudflare Workers logging, or a third-party service if needed, to track API usage and potential anomalies.

- **Rate-limit / Throttling Mechanism:** (Future Consideration)
  - Although not required for initial release, consider implementing rate limiting to protect against abuse.

## 5. Deployment & Configuration

- Update the wrangler.toml configuration file for deployment to Cloudflare Workers.
- Use environmental variables for database connections and any integration keys if needed in the future.
- Ensure the D1 database is provisioned and configured correctly. Use migration scripts (or Drizzle ORM migrations) to create/update schema as per the design chosen (cumulative vs. event-based).

## 6. Future Considerations

- Add built-in authentication using Clerk if the API begins to serve as a standalone service.
- Extend the schema and endpoints to support detailed event logs in addition to aggregated data.
- Implement more sophisticated analytics endpoints (e.g., usage by time interval) using the event-based logging approach.
- Implement additional reporting features, such as exporting usage data or sending notifications if usage thresholds are met.
- Consider adding a DELETE endpoint to purge old events if using the event-based system, to preserve storage.
- Explore usage of Cloudflare Durable Objects for real-time updating of usage metrics if real-time reporting becomes a requirement.

## 7. Further Reading

- Cloudflare Workers documentation
- Hono.js documentation
- Cloudflare D1 & Drizzle ORM documentation

This handover document provides the high-level design and technical approach for the metering service API. An experienced developer can now proceed with creating the API endpoints, setting up the database schema, and integrating with the existing user system as needed. Enjoy building your metering service!