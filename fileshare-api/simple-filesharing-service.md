# Simple Filesharing Service Specification

This document outlines the design and step-by-step implementation plan for a minimalistic filesharing service. Individual users can upload a file without the need to login, and receive a unique link back to access the file. The service will run on Cloudflare Workers using Hono.js for the API layer.

## 1. Project Description

This project is a simple filesharing service similar to Dropbox, tailored for individual users who can upload files without signing up. Upon upload, the user receives a unique link that can be shared for file download. Files and metadata will be stored with Cloudflare services.

## 2. Technology Stack

- **Edge Runtime:** Cloudflare Workers
- **API Framework:** Hono.js
- **Blob Storage:** Cloudflare R2 for storing file contents
- **Relational Database:** Cloudflare D1 (SQLite based) with Drizzle ORM for metadata storage
- **Authentication:** Not required

## 3. Database Schema Design

The metadata for uploaded files will be stored in Cloudflare D1 using Drizzle ORM. The schema is designed as follows:

### 3.1. Files Table

- id: STRING (Primary Key) - a unique identifier for the file (e.g., a random alphanumeric string)
- file_name: STRING - the original name of the file
- content_type: STRING - MIME type of the file
- size: INTEGER - size of the file in bytes
- uploaded_at: DATETIME - timestamp of when the file was uploaded
- r2_key: STRING - the key or path used to store and retrieve the file from R2

## 4. API Endpoints

The API will expose two primary endpoints: one for file uploads and another for file downloads.

### 4.1. File Upload Endpoint

- **Route:** POST /upload
- **Description:** Accepts a file upload from the user using multipart/form-data, stores the file on Cloudflare R2, stores metadata in the Cloudflare D1 database, and returns a unique link to access the file.

**Pseudocode Implementation:**
// Parse multipart/form-data to extract file
// Validate file size and type (optional validations)
// Generate a unique ID (e.g., random alphanumeric string)
// Upload file stream to R2 with the key using the generated unique ID as part of the path
// Insert file metadata (id, file_name, content_type, size, uploaded_at, r2_key) into Cloudflare D1
// Return a JSON response with { "link": "https://<your-domain>/files/<id>" }

### 4.2. File Download Endpoint

- **Route:** GET /files/:id
- **Description:** Retrieves the file using the unique identifier provided in the link. The service fetches metadata from the database to locate the file in R2 and streams it back to the user.

**Pseudocode Implementation:**
// Extract file id from route parameter
// Query Cloudflare D1 for file metadata by id
// If metadata not found, return 404
// Fetch file from R2 using the stored key
// Set appropriate response headers (Content-Type, Content-Disposition) and stream the file content

## 5. Additional Integrations

- **Cloudflare R2:** Used for storing large binary file data
- **Cloudflare D1 with Drizzle ORM:** Used to store and manage file metadata

## 6. Future Considerations

- Implement file expiration or automatic cleanup for files after a certain period
- Add rate-limiting to prevent abuse of file uploads
- File size limits and content scanning for malicious uploads
- Provide options for users to delete their uploaded files using a secret token generated at upload
- Improve error handling and logging for production readiness
- Optionally, enable analytics to track file downloads

## 7. Deployment and Configuration Notes

- Ensure that your Cloudflare R2 bucket is properly configured and that the API has the required permissions to perform file operations
- The D1 database should be provisioned and configured with the correct connection string in your environment
- Configure your Cloudflare Workers (wrangler.toml) for proper binding of R2 and D1 namespaces
- Utilize environment variables for sensitive configurations

This plan serves as a handoff document. An experienced developer should be able to follow this specification to implement and deploy the simple filesharing service. Happy coding!