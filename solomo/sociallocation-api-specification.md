# SocialLocation API Specification

This document outlines the design and step-by-step implementation plan for a social network API that allows users to share their locations through check-ins. The platform will resemble Foursquare or Swarm, enabling users to check into places (e.g., restaurants, parks) that are mapped to specific geolocations. Followers of a user will be able to see where that user has checked in.

The project is built on Cloudflare Workers using Hono.js as the API framework. For relational data storage, we will use Cloudflare D1 with Drizzle ORM, and authentication will be managed via Clerk.

---

## 1. Technology Stack

- **Edge Runtime:** Cloudflare Workers
- **API Framework:** Hono.js (TypeScript-based API framework similar to Express.js)
- **Relational Database:** Cloudflare D1 (Serverless SQLite Edge database)
- **ORM:** Drizzle ORM (Type-safe SQL query builder and schema management)
- **Authentication:** Clerk
- **Email Notifications:** Resend (if email notifications are needed for sign-ups or additional alerts)
- **Realtime Notifications (Future Consideration):** Cloudflare Durable Objects

---

## 2. Database Schema Design

This system will require tables for places, check-ins, follower relationships, and any additional user-related metadata that our authentication service (Clerk) may not cover. Clerk handles core authentication, so we focus on the complementary data.

### 2.1. Places Table

This table maps a given place name to its geolocation coordinates and associated metadata.

- id (INTEGER, Primary Key, Auto Increment)
- name (TEXT, Unique, Not Null)
- latitude (REAL, Not Null)
- longitude (REAL, Not Null)
- address (TEXT, Optional) 
- created_at (TIMESTAMP, Defaults to current timestamp)

### 2.2. Checkins Table

This table records user check-ins at different places.

- id (INTEGER, Primary Key, Auto Increment)
- user_id (TEXT, Not Null)  // this will be linked to the Clerk user id
- place_id (INTEGER, Not Null)  // foreign key referencing Places(id)
- checkin_time (TIMESTAMP, Defaults to current timestamp)

### 2.3. Followers Table

Stores follower relationships between users.

- id (INTEGER, Primary Key, Auto Increment)
- follower_id (TEXT, Not Null)  // Clerk user id of the follower
- followed_id (TEXT, Not Null)  // Clerk user id of the user being followed
- created_at (TIMESTAMP, Defaults to current timestamp)

---

## 3. API Endpoints

The API endpoints are grouped by resource, with necessary authentication checks using Clerk middleware integrated with Hono.

### 3.1. Check-in Endpoints

- **POST /checkin**
  - Description: Allows an authenticated user to check into a location. The payload should include the place name, geolocation (latitude and longitude), and optionally an address.
  - Expected Payload Example:
    ```json
    {
      "placeName": "The Great Restaurant",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, New York, NY"
    }
    ```
  - Pseudocode:
    // Validate request and user session via Clerk
    // Check if the place exists in the Places table
    //    If not, insert new place record
    // Insert a new record in Checkins with user_id from Clerk, place_id, and current timestamp
    // Optionally notify followers (see notification logic)

### 3.2. Follower Endpoints

- **POST /follow**
  - Description: Allows an authenticated user to follow another user.
  - Expected Payload:
    ```json
    {
      "followedUserId": "user-123"
    }
    ```
  - Pseudocode:
    // Validate the authenticated user via Clerk and extract user_id
    // Validate that the target user exists (or assume it exists via Clerk user directory)
    // Insert a new record into the Followers table

- **POST /unfollow**
  - Description: Allows an authenticated user to unfollow a previously followed user.
  - Expected Payload:
    ```json
    {
      "unfollowUserId": "user-123"
    }
    ```
  - Pseudocode:
    // Validate session via Clerk
    // Remove the follower relationship from Followers table

### 3.3. Feed / Follower Check-in Endpoints

- **GET /feed**
  - Description: Retrieves check-ins performed by users that the authenticated user follows. This can form the basis of a real-time feed.
  - Query Params (optional):
    - limit (number of records to return, default value)
    - page (pagination support)
  - Pseudocode:
    // Validate the authenticated request using Clerk
    // Retrieve list of followed user ids from Followers table using current user id as follower_id
    // Retrieve recent check-ins from the Checkins table where user_id in followed list
    // Join with the Places table to include place details
    // Return the assembled feed

### 3.4. Place Search / Lookup Endpoints

- **GET /places**
  - Description: Allows users to search for places by name or coordinates.
  - Query Params:
    - name (search string for name matching)
    - lat and lng (optional for proximity search)
  - Pseudocode:
    // Validate query parameters
    // Query the Places table using filters (name LIKE, proximity calculations etc.)
    // Return matching records

---

## 4. Additional Integrations

- Clerk for authentication. Each request requiring user validation should verify the session via Clerk.
- Resend for email notifications: Consider integrating email notifications for events such as new follower alerts or check-in confirmations. This can be activated once basic API functionality is stable.
- Optional: Cloudflare Durable Objects for realtime feed push notifications and state management (for future expansion).

---

## 5. Notes for Deployment & Configuration

- Ensure that Cloudflare Workers is configured properly with Hono.js and TypeScript.
- Set up environment variables for Clerk API keys, Cloudflare D1 connection, and Resend API keys.
- Use Drizzle ORM for migrations and enforce the above database schema. Consider adding indexes on frequently queried columns (e.g., user_id in Checkins and Followers tables).
- Integrate Clerk middleware in Hono routes to wrap endpoints that require user authentication.
- Ensure proper error handling is implemented within the endpoints, returning appropriate HTTP status codes.

---

## 6. Future Considerations

- Implement realtime notifications for follower feeds via Cloudflare Durable Objects.
- Build additional endpoints to support user profiles and location-based recommendations.
- Introduce rate limiting and caching strategies using Cloudflare Workers features.
- Consider integrating Cloudflare R2 for media storage if users later support images or videos with their check-ins.
- Enhance the Place search endpoint with geospatial indexing or third-party integrations (e.g., Google Maps or OpenStreetMap APIs) for improved searches.

---

## 7. Further Reading & Resources

- Hono.js documentation for advanced routing and middleware integration
- Cloudflare D1 and Drizzle ORM guides for schema management
- Clerk documentation for integration best practices on Cloudflare Workers
- Cloudflare Workers best practices for scalable, edge-hosted APIs

This document serves as a comprehensive guide for implementing the SocialLocation API. The developer can choose the folder structure and additional configuration details according to project needs, as long as these specifications are followed in the implementation.