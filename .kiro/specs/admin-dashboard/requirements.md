# Requirements Document

## Introduction

Sistem Admin Dashboard berbasis Next.js dengan database MySQL yang menyediakan fitur autentikasi pengguna, manajemen profil, dan manajemen konten blog dengan operasi CRUD lengkap. Dashboard dirancang dengan tampilan modern menggunakan Tailwind CSS.

## Glossary

- **System**: Aplikasi Admin Dashboard Next.js
- **User**: Pengguna yang telah terdaftar dan login ke sistem
- **Admin**: Pengguna dengan akses penuh ke dashboard
- **Blog**: Entitas konten yang memiliki judul, deskripsi, gambar, kategori, dan status publikasi
- **Auth_Service**: Layanan yang menangani autentikasi dan otorisasi
- **Blog_Service**: Layanan yang menangani operasi CRUD pada data blog
- **Profile_Service**: Layanan yang menangani pembaruan profil dan password pengguna
- **Database**: MySQL database yang menyimpan semua data aplikasi

## Requirements

### Requirement 1: Autentikasi - Login

**User Story:** As a user, I want to log in to the admin dashboard, so that I can access protected features securely.

#### Acceptance Criteria

1. WHEN a user submits a valid email and password, THE Auth_Service SHALL authenticate the user and redirect to the dashboard page
2. WHEN a user submits an invalid email or password, THE Auth_Service SHALL display an error message and keep the user on the login page
3. WHEN an unauthenticated user accesses a protected route, THE System SHALL redirect the user to the login page
4. THE System SHALL maintain the user session using JWT tokens stored in HTTP-only cookies
5. WHEN a user clicks the logout button, THE Auth_Service SHALL invalidate the session and redirect to the login page

---

### Requirement 2: Autentikasi - Register

**User Story:** As a new user, I want to register an account, so that I can access the admin dashboard.

#### Acceptance Criteria

1. WHEN a user submits a valid name, email, and password, THE Auth_Service SHALL create a new user account and redirect to the login page
2. WHEN a user submits an email that already exists, THE Auth_Service SHALL display an error message indicating the email is already registered
3. THE System SHALL require the password to be at least 8 characters long
4. WHEN a user submits a password that does not meet the minimum length requirement, THE Auth_Service SHALL display a validation error message
5. THE System SHALL hash the password before storing it in the Database

---

### Requirement 3: Autentikasi - Lupa Password

**User Story:** As a user, I want to reset my password if I forget it, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user submits a registered email on the forgot password page, THE Auth_Service SHALL send a password reset link to that email
2. WHEN a user submits an unregistered email, THE Auth_Service SHALL display an error message indicating the email is not found
3. WHEN a user clicks a valid reset link, THE System SHALL display a form to enter a new password
4. WHEN a user submits a new password via a valid reset token, THE Auth_Service SHALL update the password and redirect to the login page
5. IF a reset token has expired or is invalid, THEN THE Auth_Service SHALL display an error message and prompt the user to request a new reset link

---

### Requirement 4: Halaman Dashboard

**User Story:** As an admin, I want to see an overview of key metrics on the dashboard, so that I can monitor the system at a glance.

#### Acceptance Criteria

1. WHEN an authenticated user accesses the dashboard, THE System SHALL display summary statistics including total blogs, published blogs, and unpublished blogs
2. THE System SHALL display a navigation sidebar with links to all main sections
3. THE System SHALL display the current logged-in user's name and avatar in the header
4. WHEN a user clicks a navigation link, THE System SHALL navigate to the corresponding page without full page reload

---

### Requirement 5: Account Setting - Update Profile

**User Story:** As a user, I want to update my profile information, so that I can keep my account details current.

#### Acceptance Criteria

1. WHEN a user submits valid updated profile data (name, email), THE Profile_Service SHALL update the user record in the Database and display a success message
2. WHEN a user submits an email that is already used by another account, THE Profile_Service SHALL display an error message
3. THE System SHALL pre-fill the profile form with the current user data
4. WHEN a user uploads a new profile picture, THE Profile_Service SHALL store the image and update the user's avatar

---

### Requirement 6: Account Setting - Ubah Password

**User Story:** As a user, I want to change my password from the account settings page, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN a user submits the correct current password along with a valid new password, THE Profile_Service SHALL update the password in the Database and display a success message
2. WHEN a user submits an incorrect current password, THE Profile_Service SHALL display an error message
3. THE System SHALL require the new password to be at least 8 characters long
4. WHEN a user submits a new password that does not match the confirmation field, THE Profile_Service SHALL display a validation error

---

### Requirement 7: Halaman Blogs - Daftar Data

**User Story:** As an admin, I want to view a list of all blog posts with filtering, sorting, and pagination, so that I can manage content efficiently.

#### Acceptance Criteria

1. THE System SHALL display blog data in a table with columns: judul, kategori, status, tanggal dibuat, dan aksi
2. WHEN a user types a keyword in the search field, THE Blog_Service SHALL filter the blog list to show only entries where the title or description contains the keyword
3. WHEN a user selects a date range filter, THE Blog_Service SHALL filter the blog list to show only entries created within that date range
4. WHEN a user clicks a sortable column header, THE System SHALL sort the table by that column in ascending order; clicking again SHALL sort in descending order
5. THE System SHALL display a maximum of 10 blog entries per page
6. WHEN a user clicks a pagination control, THE System SHALL load and display the corresponding page of results
7. THE System SHALL display the total number of blog entries and the current page range

---

### Requirement 8: Halaman Blogs - Tambah Data

**User Story:** As an admin, I want to add a new blog post, so that I can publish new content.

#### Acceptance Criteria

1. WHEN a user clicks the "Tambah Blog" button, THE System SHALL display a form with fields: judul (input), deskripsi (textarea), gambar (file upload), dan kategori (select)
2. THE System SHALL provide category options: sport, art, news, education
3. WHEN a user submits a valid blog form, THE Blog_Service SHALL create a new blog record in the Database with status "unpublished" by default and display a success message
4. WHEN a user submits the form with missing required fields (judul, deskripsi, kategori), THE Blog_Service SHALL display validation error messages for each missing field
5. WHEN a user uploads an image file, THE System SHALL validate that the file is an image type (jpg, jpeg, png, gif, webp) and store it in the server

---

### Requirement 9: Halaman Blogs - Edit Data

**User Story:** As an admin, I want to edit an existing blog post, so that I can update its content.

#### Acceptance Criteria

1. WHEN a user clicks the edit action on a blog entry, THE System SHALL display the edit form pre-filled with the existing blog data
2. WHEN a user submits valid updated blog data, THE Blog_Service SHALL update the blog record in the Database and display a success message
3. WHEN a user submits the edit form with missing required fields, THE Blog_Service SHALL display validation error messages
4. WHEN a user uploads a new image during edit, THE System SHALL replace the old image with the new one

---

### Requirement 10: Halaman Blogs - Publish / Unpublish

**User Story:** As an admin, I want to toggle the publish status of a blog post, so that I can control which content is visible.

#### Acceptance Criteria

1. WHEN a user clicks the "Publish" action on an unpublished blog, THE Blog_Service SHALL update the blog status to "published" and reflect the change in the table immediately
2. WHEN a user clicks the "Unpublish" action on a published blog, THE Blog_Service SHALL update the blog status to "unpublished" and reflect the change in the table immediately
3. THE System SHALL display the current status of each blog entry clearly in the table (e.g., badge/label)

---

### Requirement 11: Halaman Blogs - Hapus Data

**User Story:** As an admin, I want to delete a blog post, so that I can remove outdated or incorrect content.

#### Acceptance Criteria

1. WHEN a user clicks the delete action on a blog entry, THE System SHALL display a confirmation dialog before proceeding
2. WHEN a user confirms the deletion, THE Blog_Service SHALL permanently delete the blog record from the Database and remove it from the table
3. WHEN a user cancels the deletion, THE System SHALL close the dialog and keep the blog record unchanged

---

### Requirement 12: Halaman Blogs - View Detail

**User Story:** As an admin, I want to view the full detail of a blog post, so that I can review its complete content.

#### Acceptance Criteria

1. WHEN a user clicks the view detail action on a blog entry, THE System SHALL navigate to a detail page displaying all blog fields: judul, deskripsi, gambar, kategori, status, dan tanggal dibuat
2. THE System SHALL display a back button on the detail page to return to the blog list

---

### Requirement 13: Data Model Blog

**User Story:** As a developer, I want a well-defined blog data model, so that the database schema is consistent and complete.

#### Acceptance Criteria

1. THE Database SHALL store blog records with the following fields: id (auto-increment), judul (varchar), deskripsi (text), gambar (varchar), kategori (enum: sport, art, news, education), status (enum: published, unpublished), created_at (timestamp), updated_at (timestamp)
2. THE Database SHALL store user records with the following fields: id (auto-increment), name (varchar), email (varchar unique), password (varchar), avatar (varchar nullable), created_at (timestamp), updated_at (timestamp)
