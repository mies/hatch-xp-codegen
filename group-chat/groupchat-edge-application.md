# GroupChat Edge Application Specification

This document outlines the implementation plan for a group chat application that supports chat groups of two or more people. The application leverages an invitation system for group joining and uses third-party social authentication along with email-based invitations. Messages within groups are ephemeral and will be deleted automatically 24 hours after creation.

## 1. Technology Stack

- **Edge Runtime:** Cloudflare Workers
- **API Framework:** Hono.js (TypeScript)
- **Database:** Cloudflare D1 (SQLite edge database) with Drizzle ORM as the type-safe SQL query builder
- **Authentication:** Clerk (leveraging third-party social authentication providers)
- **Email Integration:** Resend (for sending group invitations)
- **Job Scheduling / Message Cleanup:** Cloudflare Workers scheduled events (cron triggers) for deleting expired messages

## 2. Database Schema Design

The system requires managing users, groups, group memberships, messages, and invitation tokens. Below is an outline of the tables and their relationship.

### 2.1. Users Table

- id (INTEGER, Primary Key, Auto Increment)
- clerkId (STRING, unique identifier provided by Clerk)
- email (STRING, unique)
- name (STRING)
- profilePhotoUrl (STRING)  // URL for the user's profile photo
- createdAt (DATETIME)

### 2.2. Groups Table

- id (INTEGER, Primary Key, Auto Increment)
- name (STRING)  // Group name
- ownerId (INTEGER)  // reference to the Users table indicating the creator/owner
- createdAt (DATETIME)

### 2.3. GroupMembers Table

- id (INTEGER, Primary Key, Auto Increment)
- groupId (INTEGER, foreign key to Groups id)
- userId (INTEGER, foreign key to Users id)
- joinedAt (DATETIME)

### 2.4. Invitations Table

This table manages pending invitations so users can join groups via email link.

- id (INTEGER, Primary Key, Auto Increment)
- groupId (INTEGER, foreign key to Groups id)
- email (STRING)  // the email address the invitation was sent to
- token (STRING, unique)  // secure token for accepting the invitation
- status (STRING, e.g., 'pending', 'accepted', 'expired')
- createdAt (DATETIME)
- expiresAt (DATETIME)  // time after which the invitation is no longer valid

### 2.5. Messages Table

- id (INTEGER, Primary Key, Auto Increment)
- groupId (INTEGER, foreign key to Groups id)
- senderId (INTEGER, foreign key to Users id)
- content (TEXT)  // the body of the message
- createdAt (DATETIME)  // timestamp of the message

Note: A scheduled worker will periodically execute a cleanup job to delete messages whose createdAt timestamp is older than 24 hours.

## 3. API Endpoints

The API endpoints will be grouped into categories based on functionality, such as groups, invitations, and messaging.

### 3.1. Group Endpoints

- **POST /groups**
  - Description: Create a new group chat. The authenticated user becomes the group owner and an initial member.
  - Expected Payload:
    {
      "name": "Group Name"
    }

- **GET /groups**
  - Description: Retrieve a list of groups the authenticated user is a member of.

- **GET /groups/:groupId**
  - Description: Retrieve details for a specific group, including list of group members.

### 3.2. Invitation Endpoints

- **POST /groups/:groupId/invite**
  - Description: Send an invitation to an email address to join a specific group. This endpoint creates an invitation record with a secure token and triggers an email via Resend.
  - Expected Payload:
    {
      "email": "invitee@example.com"
    }

- **POST /invitations/accept**
  - Description: Accept an invitation using a token provided in the email link. On acceptance, the user is added to the group; update the invitation status to 'accepted'.
  - Expected Payload:
    {
      "token": "secure-invite-token"
    }

### 3.3. Messaging Endpoints

- **POST /groups/:groupId/messages**
  - Description: Post a new message to a group. The endpoint will verify the sender's membership in the group.
  - Expected Payload:
    {
      "content": "Message content text"
    }

- **GET /groups/:groupId/messages**
  - Description: Retrieve messages for a group. Only messages from the last 24 hours should be returned.
  - Query Params (optional): May include pagination or a timestamp filter if needed

## 4. Additional Integrations

- Clerk for handling third-party social authentication. This service manages login, session management, and user identification.
- Resend for email notifications to send out group invitation emails. The invitation email should contain a link that includes the invitation token.
- Cloudflare Workers scheduled triggers to clean up old messages (every hour or as needed), ensuring messages older than 24 hours are purged.

## 5. Additional Notes

- Authentication and authorization should be enforced for all endpoints. The system should confirm that the authenticated user is a member of a group before allowing access to group-specific endpoints.
- Better error handling and logging to be considered during implementation.
- Ensure secure generation and validation of invitation tokens to prevent unauthorized access to groups.
- Use environment variables or secrets for configuration details such as API keys for Clerk and Resend.

## 6. Future Considerations

- Real-time functionality: Consider utilizing Cloudflare Durable Objects or WebSocket alternatives for real-time group chat updates.
- Enhanced message retention strategies: Allow configurable message retention policies or archiving messages for groups who may want persistence beyond 24 hours.
- User profile enhancements: Allow users to update their profile photos and other information.
- Group management features: Additional endpoints for group admins to remove users or change group settings.
- Rate limiting and security enhancements to avoid abuse.

## 7. Further Reading

- Cloudflare Workers documentation
- Hono.js documentation
- Cloudflare D1 & Drizzle ORM documentation
- Clerk documentation for third-party authentication
- Resend documentation for email integrations

This implementation plan provides the necessary high-level guidance and architectural considerations needed to develop the GroupChat Edge Application using the HONC stack.