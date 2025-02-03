# CareerPath - Job Portal Platform

## Project Description

CareerPath is a fully functional job portal platform that enables users to connect students with recruiters. The platform is built using the MERN stack, comprising ReactJS, NodeJS, MongoDB, and ExpressJS. CareerPath aims to provide:

- A seamless and user-friendly experience for students to search, apply for jobs, and track applications.
- A platform for recruiters to post job openings, review applications, and manage hiring processes efficiently.

This document outlines the technical aspects of CareerPath, including:

1. System Architecture
2. Front-end
3. Back-end
4. Email Verification
5. Database
6. API Design

---

## System Architecture

CareerPath follows a client-server architecture, with the front end acting as the client and the back end, along with the database, serving as the server. The platform’s architecture ensures scalability, security, and seamless communication between components.

---

## Front-end

The front end of CareerPath is built using ReactJS, which facilitates dynamic and responsive user interfaces. The front end communicates with the back end via RESTful API calls and includes pages tailored for students and recruiters.

### For Students:
- **Homepage:** Overview of the platform and a list of available job opportunities.
- **Job Listings:** Displays job postings with descriptions, requirements, and application deadlines.
- **Application Page:** Allows students to apply for jobs by uploading their resumes and filling out forms.
- **Application History:** Tracks all applications submitted by the student.
- **User Profile:** Manages student account details and updates.

### For Recruiters:
- **Dashboard:** Overview of posted jobs and received applications.
- **Job Management Pages:** Post, edit, and delete job listings.
- **Application Management:** Review, accept, or reject applications.
- **Profile Management:** Update recruiter details and company information.

Frameworks and tools used:
- **ReactJS** for the front end.
- **Tailwind CSS** for styling.
- **Redux Toolkit** for state management.
- **shadcn/ui** for pre-designed, accessible UI components.

---

## Back-end

The back end of CareerPath is developed using NodeJS and ExpressJS, providing a robust API for the front end to interact with. Key features include:

- **User Authentication and Authorization:** Managed with JWT, ensuring secure access for students and recruiters.
- **Email Verification:**  Ensures secure email validation during the registration process through OTP.
- **Resume Uploads:** Handled via Multer and Cloudinary for efficient file management.
- **Job Management:** Endpoints for creating, reading, updating, and deleting job postings.
- **Application Handling:** API for managing applications, including status updates.

### Frameworks, Libraries, and Tools:
- **NodeJS:** Primary back-end framework.
- **ExpressJS:** Web application framework.
- **JWT:** Secure user authentication.
- **Bcrypt:** Password hashing for added security.
- **Cloudinary:** Cloud-based file storage for resumes.
- **Mongoose:** ODM library for MongoDB.

---

## Database

CareerPath uses MongoDB as the primary database. The database schema is designed for flexibility and scalability, ensuring efficient data management.

### Key Schemas:
- **User Schema:** Stores details of students and recruiters, including authentication credentials.
- **Job Schema:** Captures job-related data such as title, description, requirements, and recruiter details.
- **Application Schema:** Tracks applications with fields like job ID, student ID, resume URL, and application status.
- **Company Schema:** Stores company-related information, including name, location, and recruiter associations.

---

## API Design

The CareerPath API follows RESTful principles, facilitating secure and efficient communication between the client and server. JSON is used for data exchange, and standard HTTP methods such as GET, POST, PUT, and DELETE are employed.

### Sample Endpoints:
- **User Authentication:**
  - `/api/auth/register` (POST) - Register a new user.
  - `/api/auth/login` (POST) - Log in a user and generate a JWT.

- **Job Management:**
  - `/api/jobs` (GET) - Retrieve all job postings.
  - `/api/jobs/:id` (GET) - Retrieve job details by ID.
  - `/api/jobs` (POST) - Post a new job.
  - `/api/jobs/:id` (PUT) - Update a job posting.
  - `/api/jobs/:id` (DELETE) - Delete a job posting.

- **Application Management:**
  - `/api/applications` (POST) - Submit a job application.
  - `/api/applications/:id` (GET) - Retrieve application details.
  - `/api/applications/:id/status` (PUT) - Update the status of an application.