# News Portal Full-Stack App

## Tech Stack
- **Backend:** Python Flask, SQLAlchemy, JWT
- **Frontend:** React (Vite), Tailwind CSS
- **Database:** MySQL (XAMPP)

## Backend Setup
1. Create a virtual environment and activate it.
2. Install dependencies:
   ```bash
   pip install Flask Flask-JWT-Extended Flask-SQLAlchemy PyMySQL Werkzeug
   ```
3. Set up MySQL via XAMPP and create a database named `news_portal`.
4. Run the Flask app:
   ```bash
   python app.py
   ```

## Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```

## Features
- Public users can browse news
- Reporters can register, login (with license key), and post news
- Admin can approve/reject reporters and assign license keys

## Folder Structure
- `backend/` - Flask app (modular blueprints, models, config)
- `frontend/` - React app (pages, components, auth context)
