# HabitTracker

**Live Site URL:** [https://habit-tracker-server-one.vercel.app/](https://habit-tracker-server-one.vercel.app/)

A full-stack (MERN) web application designed to help users build consistency and productivity by creating, tracking, and managing their daily habits. This repository contains the **backend server** code.

---

## 🚀 Key Features

- **Secure Authentication:** Full user authentication with Firebase (Email/Password and Google Sign-In) and secure backend routes verified with Firebase Admin SDK.
- **Full Habit CRUD:** Users can create, read, update, and delete their own personal habits.
- **Daily Tracking:** Users can mark habits as complete once per day to build their completion history.
- **Streak Calculation:** Automatically calculates and displays a user's current streak for consecutive days of completion.
- **Public vs. Private:** Users can set habits as "public" to be seen by the community or "private" for their eyes only.
- **Community Browsing:** A "Browse Public Habits" page where users can see, search, and filter all habits shared by other users.
- **Image Uploads:** Integrates with ImgBB for hosting user-uploaded profile pictures and habit images.
- **Dynamic Homepage:** The homepage features a dynamic "Featured Habits" section showing the 6 newest public habits.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using the native MongoDB Driver)
- **Authentication:** Firebase Admin SDK
- **Middleware:** CORS, Express.json

_(Frontend: This server is built to support a React.js client using React Router, Axios, Tailwind CSS, and DaisyUI.)_

---

## 🔐 API Endpoints

All API endpoints are defined in `index.js`.

### Public Routes

| Method  | Endpoint           | Description                                          |
| :------ | :----------------- | :--------------------------------------------------- |
| **GET** | `/habits/featured` | Fetches the 6 newest public habits for the homepage. |
| **GET** | `/habits/public`   | Fetches _all_ public habits for the "Browse" page.   |

### Protected Routes (Requires `verifyToken` middleware)

| Method     | Endpoint               | Description                                                                         |
| :--------- | :--------------------- | :---------------------------------------------------------------------------------- |
| **POST**   | `/habits`              | Creates a new habit for the logged-in user.                                         |
| **GET**    | `/my-habits`           | Gets _only_ the habits created by the logged-in user.                               |
| **GET**    | `/habits/:id`          | Gets a single habit. Allows access if the user is the owner OR the habit is public. |
| **PUT**    | `/habits/:id`          | Updates a habit. User must be the owner.                                            |
| **DELETE** | `/habits/:id`          | Deletes a habit. User must be the owner.                                            |
| **POST**   | `/habits/:id/complete` | Marks a habit as complete for the day. Prevents duplicate entries.                  |

---

## 📦 Installation & Setup

To run this server locally:

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/sabbir534/habit-tracker-server.git](https://github.com/sabbir534/habit-tracker-server.git)
    cd habit-tracker-server
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create `.env` file:**
    Create a `.env` file in the root directory and add your MongoDB credentials:

    ```
    DB_USERNAME=your_mongodb_username
    DB_PASSWORD=your_mongodb_password
    ```

4.  **Add Firebase Service Account Key:**

    - Go to your Firebase project settings > Service accounts.
    - Generate a new private key and download the JSON file.
    - Rename the file to `serviceAccountKey.json`.
    - Place this file in the root of the server directory.
    - **IMPORTANT:** Add `serviceAccountKey.json` and `.env` to your `.gitignore` file.

5.  **Run the server:**
    ```bash
    node index.js
    ```
    The server will be running on `http://localhost:3000`.
