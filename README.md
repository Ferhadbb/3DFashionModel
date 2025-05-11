# AI Fashion Advisor Web Application

## Project Overview

This project is a web application that acts as a personal AI fashion advisor. It helps users choose clothes by providing features like 3D body modeling (based on user measurements), personalized style suggestions, and virtual try-on capabilities. The application features a modern, dark-themed UI with a sidebar for navigation.

## Current Features Implemented

*   **User Authentication**:
    *   User registration with username and hashed password storage.
    *   User login and session management.
    *   Logout functionality.
    *   Protected routes that require login (e.g., main page, profile, and feature pages).
*   **Dynamic UI based on Login State**:
    *   Sidebar links and profile icon visibility adapt based on whether a user is logged in.
    *   Sidebar links correctly highlight the active page.
*   **User Profile & Measurements**:
    *   Users can input detailed body measurements on the main page (height, weight, chest, waist, etc.).
    *   Users can select their gender (Man/Woman) on the main page.
    *   Measurements and gender preference are saved to their profile.
    *   Saved measurements and gender are automatically loaded into the input form and toggle on the main page.
    *   A dedicated profile page displays the user's saved measurements and gender preference.
*   **Basic 3D Avatar Display**:
    *   Renders a 3D avatar model (`.glb`) on the main page using Three.js.
    *   Avatar scales based on user-inputted height and waist measurements.
    *   Loads different base models (`LowPolyMan.glb`, `LowPolyWoman.glb`) based on selected gender.
    *   Includes camera controls (orbit, zoom, pan) and basic scene lighting.
*   **Basic Frontend Structure**:
    *   Main application page (`index.html`) with a two-column layout for avatar customization and 3D display.
    *   Registration (`register.html`), Login (`login.html`), and Profile (`profile.html`) pages.
    *   Placeholder pages for Wardrobe (`wardrobe.html`), Recommendations (`recommendations.html`), Virtual Try-On (`virtual_try_on.html`), Shop (`shop.html`), and Settings (`settings.html`).
    *   Consistent header, toggleable sidebar, and dark theme across all pages.
*   **Flask Backend**:
    *   Serves all HTML pages (static and placeholder feature pages).
    *   Serves static assets like CSS, JavaScript, and 3D models.
    *   Provides API endpoints for:
        *   User registration (`/register` POST)
        *   User login (`/login` POST)
        *   User logout (`/logout` GET)
        *   Authentication status (`/api/auth/status` GET)
        *   Saving user measurements and gender (`/api/user/measurements` POST)
        *   Retrieving user measurements and gender (`/api/user/measurements` GET)
    *   Uses SQLite for the database (`users.db`) with a `users` table including measurement and gender columns.

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
    *   With the virtual environment active, run: `pip install -r requirements.txt` (Ensure `requirements.txt` is up-to-date, typically `Flask` and `Werkzeug`).

4.  **Database Initialization**:
    *   The first time you run the application (`python app.py`), the SQLite database (`users.db`) and the necessary tables (including columns for measurements and gender) will be created or altered automatically.
    *   If you manually make further significant changes to the table structure in `app.py`, you might need to delete the existing `users.db` file to allow it to be recreated fresh.

5.  **Run the Application**:
    *   Execute the Flask app: `python app.py`
    *   Open your web browser and navigate to: `http://localhost:5000/`

## File Structure Overview (Simplified)

*   `app.py`: The main Flask backend application logic.
*   `index.html`: Main application page.
*   `login.html`: User login page.
*   `register.html`: User registration page.
*   `profile.html`: User profile page.
*   `wardrobe.html`: Placeholder for Wardrobe feature.
*   `recommendations.html`: Placeholder for Recommendations feature.
*   `virtual_try_on.html`: Placeholder for Virtual Try-On feature.
*   `shop.html`: Placeholder for Shop feature.
*   `settings.html`: Placeholder for Settings feature.
*   `style.css`: Contains all the CSS styling.
*   `script.js`: Frontend JavaScript logic for 3D model rendering (Three.js), dynamic UI updates, and measurement/gender handling.
*   `users.db`: SQLite database file (created automatically).
*   `requirements.txt`: Lists Python package dependencies.
*   `README.md`: This file.
*   `models/`: Directory containing 3D model files (e.g., `LowPolyMan.glb`, `LowPolyWoman.glb`).

## Next Steps & Future Enhancements

*   Advanced 3D body model morphing using detailed measurements (e.g., via blend shapes added to the `.glb` models).
*   Integration of 3D clothing models for virtual try-on.
*   Development of actual features for Wardrobe, Recommendations, Shop, and Settings pages.
*   AI-driven style recommendations.
*   Curated shopping and filtering.
*   And more as detailed in the original project vision. 
