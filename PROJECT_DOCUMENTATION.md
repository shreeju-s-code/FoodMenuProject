# Food Menu Project - Technical Documentation

This document provides a comprehensive explanation of the **Food Menu Project**, a full-stack web application designed to manage a restaurant menu. It details the technology stack, project structure, file roles, and the flow of data between the frontend and backend.

---

## 1. Project Overview

**Tech Stack:**

- **Backend**: Java Spring Boot (REST API, Security, Data Persistence)
- **Database**: MySQL (Stores Users and Menu Items)
- **Frontend**: HTML5, CSS3 (Custom Glassmorphism Design), JavaScript (Vanilla ES6+)
- **Authentication**: JWT (JSON Web Token)

**Core Features:**

- User Registration & Login (Secure Authentication)
- Dashboard for Menu Management (CRUD Operations)
- Image Uploading for Menu Items
- Category Filtering & Search
- Dark Mode / Light Mode Theme Toggle
- Responsive Design

---

## 2. Backend Architecture (`src/main/java/com/foodmenu/backend`)

The backend is built with **Spring Boot** and follows a standard layered architecture (Controller -> Service/Repository -> Database).

### **A. Configuration (`config` package)**

1.  **`SecurityConfig.java`**:

    - **Purpose**: The security gatekeeper of the application.
    - **Functionality**:
      - Disables CSRF (Cross-Site Request Forgery) as we use stateless JWTs.
      - Configures CORS (Cross-Origin Resource Sharing) to allow the frontend to talk to the backend.
      - Defines public endpoints (like `/api/auth/**`) vs protected endpoints.
      - Injects the `AuthTokenFilter` to check for tokens on every request.

2.  **`AuthTokenFilter.java`**:

    - **Purpose**: Intercepts every HTTP request.
    - **Functionality**: Checks the `Authorization` header for a "Bearer [token]". If found, it validates the token using `JwtUtils` and sets the User authentication in the SecurityContext, logging them in for that request.

3.  **`JwtUtils.java`**:

    - **Purpose**: Helper class for handling JSON Web Tokens.
    - **Functionality**:
      - `generateJwtToken()`: Creates a signed token containing the username using a secret key.
      - `validateJwtToken()`: Verifies that a token is authentic and hasn't expired.

4.  **`WebConfig.java`**:
    - **Purpose**: Static resource configuration.
    - **Functionality**: Maps the local `/uploads` directory to a URL path (e.g., `localhost:8080/uploads/...`) so frontend browsers can access uploaded images.

### **B. Controllers (`controller` package)**

Controllers receive HTTP requests (GET, POST, PUT, DELETE) from the frontend.

1.  **`AuthController.java`**:

    - **Purpose**: Handles authentication logic.
    - **Endpoints**:
      - `POST /api/auth/login`: Authenticates username/password and returns a JWT.
      - `POST /api/auth/register`: Creates a new user in the database.

2.  **`MenuController.java`**:
    - **Purpose**: Manages menu items.
    - **Endpoints**:
      - `GET /api/menu`: Fetches all items (with optional search query).
      - `POST /api/menu`: Creates a new menu item.
      - `PUT /api/menu/{id}`: Updates an existing item.
      - `DELETE /api/menu/{id}`: Deletes an item.
      - `POST /api/menu/upload`: Handles multipart file uploads (images) and saves them to the server's disk.

### **C. Models & Repositories (`model` & `repository` packages)**

1.  **`User.java` / `MenuItem.java`**:

    - **Purpose**: Java classes that map directly to MySQL database tables using JPA (Java Persistence API).
    - **Fields**: `id`, `username`, `password`, `name`, `price`, `imageUrl`, etc.

2.  **`UserRepository.java` / `MenuRepository.java`**:
    - **Purpose**: Interfaces that extend `JpaRepository`.
    - **Functionality**: They provide built-in methods to talk to the database (e.g., `save()`, `findAll()`, `deleteById()`) without writing raw SQL. `UserRepository` also has a custom `findByUsername()` method.

### **D. Services (`service` package)**

1.  **`UserDetailsServiceImpl.java`**:
    - **Purpose**: Connects Spring Security to our Database.
    - **Functionality**: Implements `UserDetailsService`. When a user tries to log in, this service looks up the user in `UserRepository` and converts it into a standard Spring Security `UserDetails` object.

---

## 3. Frontend Architecture (`frontend` folder)

The frontend is a **Single Page Application (SPA)-like** experience built with vanilla technologies.

### **A. Core Logic**

**`app.js`**:

- **Purpose**: The brain of the frontend. It connects the HTML UI to the Backend API.
- **Key Sections**:
  - **Authentication**: Checks for JWT in `localStorage`. Redirects to login if missing.
  - **Fetch/Render**: `fetchMenu()` calls the backend API and `renderMenu()` dynamically creates HTML cards for each food item.
  - **CRUD**: Functions like `deleteItem()` and form listeners handle creating, updating, and deleting data.
  - **UI Features**: Implements the Custom Popups (`showToast`, `showConfirm`), Theme Toggling, and Tab Filtering logic.

### **B. Design & Styling**

The styling uses a **Modular CSS** approach, split by page function but sharing a visual language.

1.  **`index.html` & `index.css`**:

    - **Purpose**: The main Dashboard.
    - **Features**: Displays the grid of food items. Includes the Navbar (with Dark Mode toggle), category tabs, and the modal for adding/editing items.
    - **Styling**: Responsive Grid Layout, Flexbox for alignment, and CSS Variables for theming.

2.  **`login.html` / `register.html` & `*.css`**:
    - **Purpose**: Entry points for the user.
    - **Styling**: Use **Glassmorphism** (frosted glass effect), mesh gradients, and floating animations to create a premium, modern feel.

### **C. Custom Features**

1.  **Dark Mode**:

    - Uses CSS Variables (`--bg`, `--text-dark`). When the "Moon" button is clicked, `app.js` adds `data-theme="dark"` to the `<body>`, which instantly swaps the color palette to dark colors defined in `index.css`.

2.  **Popups**:
    - Instead of native `alert()`, `app.js` injects a custom HTML/CSS overlay into the DOM to show beautiful Success/Error messages and Confirmation dialogs.

---

## 4. How It All Works Together (The Flow)

1.  **User Visits Page**: The browser loads `index.html`.
2.  **Auth Check**: The script in `<head>` checks `localStorage` for a token. If none, redirects to `login.html`.
3.  **Login**: User enters credentials.
    - Frontend sends `POST` to Backend (`AuthController`).
    - Backend verifies password, generates JWT.
    - Frontend saves JWT to `localStorage`.
4.  **Dashboard Load**:
    - `app.js` calls `GET /api/menu`.
    - Backend `MenuController` asks `MenuRepository` for data from MySQL.
    - Data returns as JSON.
    - `app.js` loops through JSON and generates HTML Cards.
5.  **Add Item**:
    - User fills form -> `app.js` uploads image (`POST /upload`) -> gets URL.
    - `app.js` sends `POST /api/menu` with data + image URL.
    - Backend saves to DB. Application updates grid instantly.
