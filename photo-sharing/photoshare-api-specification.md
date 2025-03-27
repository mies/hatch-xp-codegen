# PhotoShare API Specification

This document outlines the design and step-by-step implementation plan for a photo-sharing API reminiscent of Instagram. The system supports social login for authentication and provides endpoints to upload photos, view user photos, comment on photos, and like photos.


## 1. Technology Stack

- **Edge Runtime:** Cloudflare Workers
- **API Framework:** Hono.js (TypeScript-based API framework with syntax similar to Express.js)
- **Database:** Cloudflare D1 (Serverless SQLite Edge Database) with Drizzle ORM for type-safe SQL queries
- **Authentication:** Clerk (enables social login and user management)
- **Blob Storage:** Cloudflare R2 (for storing photo files)


## 2. Database Schema Design

This schema is designed to capture user data, photos, comments, and likes while maintaining relational integrity.

### 2.1. Users Table

- id (INTEGER, Primary Key, Auto Increment)
- clerkId (TEXT, Unique, references Clerk user id)
- username (TEXT, Indexed)
- profileImageUrl (TEXT, Optional: link to user's profile picture on R2)
- createdAt (TIMESTAMP, default to current timestamp)

### 2.2. Photos Table

- id (INTEGER, Primary Key, Auto Increment)
- userId (INTEGER, Foreign Key references Users.id)
- imageUrl (TEXT, URL of the photo stored on Cloudflare R2)
- caption (TEXT, Optional)
- createdAt (TIMESTAMP, default to current timestamp)

### 2.3. Comments Table

- id (INTEGER, Primary Key, Auto Increment)
- photoId (INTEGER, Foreign Key references Photos.id)
- userId (INTEGER, Foreign Key references Users.id)
- comment (TEXT, Required)
- createdAt (TIMESTAMP, default to current timestamp)

### 2.4. Likes Table

- id (INTEGER, Primary Key, Auto Increment)
- photoId (INTEGER, Foreign Key references Photos.id)
- userId (INTEGER, Foreign Key references Users.id)
- createdAt (TIMESTAMP, default to current timestamp)


## 3. API Endpoints

The API will be organized into logical groups based on functionality.

### 3.1. Authentication Endpoints

Note: Authentication is handled by Clerk. The API will rely on Clerk's session management and social login capabilities. Ensure routes that require authentication enforce a Clerk session or token verification.

### 3.2. Photo Endpoints

#### 3.2.1. Upload Photo

- **Endpoint:** POST /photos
- **Description:** Authenticated users can upload a new photo. The request will include the image file (or a reference to the uploaded file in Cloudflare R2) and an optional caption.
- **Payload:**
  {
    "imageFile": "<binary-or-base64-image-data>",
    "caption": "Optional caption text"
  }
- **Flow:**
  1. Validate the authenticated user using Clerk's session.
  2. Process and store the image to Cloudflare R2, obtaining a secure URL.
  3. Insert a new record into the Photos table with the returned imageUrl and the caption.
  4. Return the created photo metadata.

#### 3.2.2. View Photo by ID

- **Endpoint:** GET /photos/:photoId
- **Description:** Retrieve details of a single photo including its image URL, caption, owner, creation time, and associated metrics if needed.
- **Response:** Photo metadata (including URL, caption, owner information) along with comments and likes summary.

#### 3.2.3. List Photos for a User

- **Endpoint:** GET /users/:userId/photos
- **Description:** Retrieves all photos uploaded by a specific user. Optionally support pagination.
- **Query Params:** `limit`, `offset` for pagination support.

### 3.3. Comment Endpoints

#### 3.3.1. Post a Comment

- **Endpoint:** POST /photos/:photoId/comments
- **Description:** Allows an authenticated user to add a comment to a photo.
- **Payload:**
  {
    "comment": "This is a comment text"
  }
- **Flow:**
  1. Validate user session using Clerk.
  2. Insert the comment into the Comments table linking photoId and userId.
  3. Respond with the created comment metadata.

#### 3.3.2. List Comments for a Photo

- **Endpoint:** GET /photos/:photoId/comments
- **Description:** Retrieves list of comments for a specific photo.
- **Query Params:** `limit`, `offset` (optional for pagination).

### 3.4. Like Endpoints

#### 3.4.1. Like a Photo

- **Endpoint:** POST /photos/:photoId/like
- **Description:** Allows an authenticated user to like a photo. Prevent duplicate likes by the same user per photo.
- **Flow:**
  1. Validate user session using Clerk.
  2. Check if a like by the user for the photo already exists. If not, insert a new record into the Likes table.
  3. Return the updated like count or confirmation.

#### 3.4.2. Unlike a Photo

- **Endpoint:** DELETE /photos/:photoId/like
- **Description:** Allows an authenticated user to remove their like from a photo.
- **Flow:**
  1. Validate user session.
  2. Remove the record from the Likes table where photoId and userId match.
  3. Return a success message.

#### 3.4.3. List Likes for a Photo

- **Endpoint:** GET /photos/:photoId/likes
- **Description:** Provides a list of users who have liked a given photo or simply a like count.


## 4. Additional Integrations

- **Authentication:** Utilize Clerk to facilitate social login and session management.
- **Blob Storage:** Use Cloudflare R2 to store and serve photo images. Ensure that images are properly secured and accessible via a CDN.
- **Email Notifications (Optional):** While not a core requirement, Resend can be integrated in the future for notifying users about interactions (e.g., comments, likes) on their photos.


## 5. Additional Notes

- Ensure that file uploads are validated for type and size limits.
- Use Drizzle ORM to write type-safe queries and define migrations / schema definitions for Cloudflare D1.
- Consider using middleware in Hono.js for common tasks like authentication verification via Clerk and error handling.
- Pay attention to security best practices, e.g., sanitizing user input for comments or captions.


## 6. Future Considerations

- Implement pagination, sorting, and filtering for photo feeds and comments.
- Add real-time updates for likes and comments using Cloudflare Durable Objects if needed.
- Enhance user profiles by allowing users to edit their profile details and upload profile images.
- Support additional social interactions such as following users and direct messaging.
- Consider rate limiting on endpoints to prevent abuse.


## 7. Further Reading

For comprehensive documentation on Hono.js, Cloudflare Workers, Clerk, and other associated technologies, refer to the official docs:
- Hono.js: https://github.com/honojs/hono
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Drizzle ORM: [Documentation Link]
- Clerk: https://clerk.dev/docs
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Resend: https://resend.com/docs

This completes the high-level design and implementation plan for the PhotoShare API. The developer is encouraged to iterate on design details and adjust the schema and endpoints based on evolving requirements and edge scenarios.