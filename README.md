# AI-sthetica Backend

This is the FastAPI/Django backend service for the AI-sthetica platform. It handles user authentication, patient data management, log tracking, and other critical business logic endpoints.

## Prerequisites
- Python 3.9+
- Pip and Virtual Environments (venv)

## Quick Start
To set up and run the application locally:

1. **Activate the Virtual Environment**
   ```bash
   .\venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Apply Migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start the Development Server**
   ```bash
   python manage.py runserver
   ```
   The backend server will run natively giving you API endpoints mapped correctly.

## Project Structure
- **/APIs**: Application logic for user authentication, patient views, token handling, and log tracking.
- **/backend**: Core Django/deployment settings and project-level configurations.
- **test_auth.py**: Useful scripting test cases evaluating token generation, sign up, and sign in.
