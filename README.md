# AI Fashion Advisor Web Application

## Project Overview

This project is a web application that acts as a personal AI fashion advisor. It helps users choose clothes by providing features like 3D body modeling (based on user measurements), personalized style suggestions, and virtual try-on capabilities. The application features a modern, dark-themed UI with a sidebar for navigation.

## Current Features Implemented

*   **User Authentication**:
    *   User registration with username and hashed password storage.
    *   User login and session management.
    *   Logout functionality.
    *   Protected routes that require login (e.g., main page, profile).
*   **Dynamic UI based on Login State**:
    *   Sidebar links and profile icon visibility adapt based on whether a user is logged in.
*   **User Profile & Measurements**:
    *   Users can input detailed body measurements on the main page (height, weight, chest, waist, etc.).
    *   These measurements are saved to their profile (linked to their user account).
    *   Saved measurements are automatically loaded into the input form when a logged-in user visits the main page.
    *   A dedicated profile page displays the user's saved measurements.
*   **Basic Frontend Structure**:
    *   Main application page (`index.html`) with a two-column layout for avatar customization and display.
    *   Registration (`register.html`), Login (`login.html`), and Profile (`profile.html`) pages.
    *   Consistent header, toggleable sidebar, and dark theme across all pages.
*   **Flask Backend**:
    *   Serves HTML pages.
    *   Provides API endpoints for:
        *   User registration (`/register` POST)
        *   User login (`/login` POST)
        *   User logout (`/logout` GET)
        *   Authentication status (`/api/auth/status` GET)
        *   Saving user measurements (`/api/user/measurements` POST)
        *   Retrieving user measurements (`/api/user/measurements` GET)
    *   Uses SQLite for the database (`users.db`).

## Setup and Running the Project

1.  **Prerequisites**:
    *   Python 3.x installed.
    *   `pip` (Python package installer) installed.

2.  **Create a Virtual Environment (Recommended)**:
    *   Open your terminal in the project root directory.
    *   Run: `python -m venv venv`
    *   Activate the virtual environment:
        *   Windows (PowerShell): `.\venv\Scripts\Activate.ps1`
        *   Windows (Command Prompt): `.\venv\Scripts\activate.bat`
        *   macOS/Linux: `source venv/bin/activate`

3.  **Install Dependencies**:
    *   With the virtual environment active, run: `pip install -r requirements.txt`

4.  **Database Initialization**:
    *   The first time you run the application, the SQLite database (`users.db`) and the necessary tables will be created automatically.
    *   If you make significant changes to the table structure in `app.py` (the `users` table schema), you might need to delete the existing `users.db` file to allow it to be recreated fresh.

5.  **Run the Application**:
    *   Execute the Flask app: `python app.py`
    *   Open your web browser and navigate to: `http://localhost:5000/`

## File Structure Overview (Simplified)

*   `app.py`: The main Flask backend application logic, including routes, API endpoints, and database interaction.
*   `index.html`: Main application page for avatar customization and viewing.
*   `login.html`: User login page.
*   `register.html`: User registration page.
*   `profile.html`: User profile page (displays saved measurements).
*   `style.css`: Contains all the CSS styling for the application.
*   `script.js`: Intended for frontend JavaScript logic, particularly 3D model rendering with Three.js (integration with saved measurements is in progress).
*   `users.db`: SQLite database file (created automatically).
*   `requirements.txt`: Lists Python package dependencies.
*   `README.md`: This file.
*   `models/`: Directory containing 3D model files (e.g., `.glb`).

## Next Steps & Future Enhancements 

*   Full integration of 3D body model rendering using measurements from `script.js`.
*   Advanced 3D modeling and texturing.
*   AI-driven style recommendations.
*   Virtual try-on capabilities.
*   Curated shopping and filtering.
*   And more as detailed in the original project vision. 
