from flask import Flask, request, jsonify, g, send_from_directory, session, redirect
import sqlite3
import os # For checking if DB exists
from werkzeug.security import generate_password_hash, check_password_hash # For password hashing
from functools import wraps # For creating decorators

app = Flask(__name__)
# It's crucial to set a secret key for session management.
# In a real application, this should be a complex, random string and kept secret.
# For development, a simple string is okay, but change it for production.
app.secret_key = 'dev_secret_key' # CHANGE THIS FOR PRODUCTION

DATABASE = 'users.db'

# Ensure the root directory is correctly identified for send_from_directory
# For simple cases, an empty string or '.' refers to the directory where app.py is run.
# If your HTML files are in the same directory as app.py, this should work.
HTML_FILE_DIRECTORY = '.' 

# --- Login Required Decorator ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect('/login') # Redirect to login if user_id not in session
        return f(*args, **kwargs)
    return decorated_function

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row # Allows accessing columns by name
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    db_exists = os.path.exists(DATABASE)
    with app.app_context():
        db = sqlite3.connect(DATABASE)
        cursor = db.cursor()
        # Check if the table needs alteration or creation
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]

        # Check if db exists OR if new columns (height, gender) are missing
        if not db_exists or 'height' not in columns or 'gender' not in columns: 
            print("Re-creating or Altering users table for measurements and gender...")
            # For simplicity in dev, we might just drop and recreate if schema changes significantly.
            # For production, you'd use migration tools (e.g., Alembic for SQLAlchemy).
            # Here, if 'height' (one of the new columns) is missing, we assume old schema.
            if ('height' not in columns or 'gender' not in columns) and db_exists:
                print("Attempting to ALTER TABLE to add missing columns...")
                measurement_cols = {
                    'height': 'REAL', 'weight': 'REAL', 'chest': 'REAL', 'underbust': 'REAL',
                    'waist': 'REAL', 'hips': 'REAL', 'sleeve': 'REAL', 'thigh': 'REAL',
                    'inseam': 'REAL', 'outseam': 'REAL',
                    'gender': 'TEXT' # Added gender column
                }
                for col_name, col_type in measurement_cols.items():
                    if col_name not in columns:
                        try:
                            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                            print(f"Added column: {col_name}")
                        except sqlite3.OperationalError as e:
                            print(f"Could not add column {col_name}: {e}. May already exist or other issue.")
            else:
                # Create table if it doesn't exist at all
                cursor.execute("DROP TABLE IF EXISTS users") # Drop if exists for a clean slate in dev
                cursor.execute('''
                    CREATE TABLE users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        height REAL, weight REAL, chest REAL, underbust REAL,
                        waist REAL, hips REAL, sleeve REAL, thigh REAL,
                        inseam REAL, outseam REAL,
                        gender TEXT 
                    )
                ''')
            db.commit()
            print("Users table (re)created/altered with measurement and gender columns.")
        else:
            print("Users table already includes measurement and gender columns or database is new.")
        db.close()

# --- Static Page Serving Routes (Apply Decorator) ---
@app.route('/')
@login_required # Protect the index route
def serve_index():
    return send_from_directory(HTML_FILE_DIRECTORY, 'index.html')

@app.route('/login', methods=['GET'])
def serve_login_page():
    # If user is already logged in, perhaps redirect them to index?
    if 'user_id' in session:
        return redirect('/')
    return send_from_directory(HTML_FILE_DIRECTORY, 'login.html')

@app.route('/register', methods=['GET'])
def serve_register_page():
    # If user is already logged in, perhaps redirect them to index?
    if 'user_id' in session:
        return redirect('/')
    return send_from_directory(HTML_FILE_DIRECTORY, 'register.html')

@app.route('/profile')
@login_required # Protect the profile route
def serve_profile_page():
    return send_from_directory(HTML_FILE_DIRECTORY, 'profile.html')

@app.route('/wardrobe')
@login_required
def serve_wardrobe_page():
    return send_from_directory(HTML_FILE_DIRECTORY, 'wardrobe.html')

@app.route('/recommendations')
@login_required
def serve_recommendations_page():
    return send_from_directory(HTML_FILE_DIRECTORY, 'recommendations.html')

@app.route('/virtual-try-on')
@login_required
def serve_virtual_try_on_page():
    return send_from_directory(HTML_FILE_DIRECTORY, 'virtual_try_on.html')

@app.route('/shop')
@login_required
def serve_shop_page():
    return send_from_directory(HTML_FILE_DIRECTORY, 'shop.html')

@app.route('/settings')
@login_required
def serve_settings_page():
    return send_from_directory(HTML_FILE_DIRECTORY, 'settings.html')

# --- Route for serving style.css ---
@app.route('/style.css')
def serve_css():
    return send_from_directory(HTML_FILE_DIRECTORY, 'style.css')

# --- Route for serving script.js (if it's also in the root) ---
@app.route('/script.js')
def serve_js():
    return send_from_directory(HTML_FILE_DIRECTORY, 'script.js')

# --- Route for serving 3D models ---
@app.route('/models/<path:filename>')
def serve_model(filename):
    return send_from_directory('models', filename)

# --- API Routes ---
@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    hashed_password = generate_password_hash(password)

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        db.commit()
        # Include redirect_url to guide the frontend
        return jsonify({'message': f'User {username} registered successfully! Please login.', 'redirect_url': '/login'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists. Please choose a different one.'}), 409
    except Exception as e:
        # Log the exception e if you have a logging setup
        print(f"Database error during registration: {e}")
        return jsonify({'error': 'An internal error occurred during registration.'}), 500

@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone() # Use fetchone() as username should be unique

    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id'] # Store user ID in session
        session['username'] = user['username'] # Optional: store username too
        return jsonify({'message': 'Login successful!', 'redirect_url': '/'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401 # 401 Unauthorized

@app.route('/logout')
def logout_user():
    session.pop('user_id', None) # Remove user_id from session
    session.pop('username', None) # Remove username from session
    # You can also use session.clear() to remove all items if that's preferred
    return redirect('/login') # Redirect to login page

@app.route('/api/auth/status')
def auth_status():
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'username': session.get('username', 'User') # Default to 'User' if username not in session for some reason
        }), 200
    else:
        return jsonify({'logged_in': False}), 200 # Still 200 OK, just indicates not logged in

@app.route('/api/user/measurements', methods=['POST'])
@login_required
def save_user_measurements():
    data = request.get_json()
    user_id = session['user_id']

    # Define which columns are expected/allowed for measurements and gender
    allowed_fields = [
        'height', 'weight', 'chest', 'underbust', 'waist', 
        'hips', 'sleeve', 'thigh', 'inseam', 'outseam',
        'gender' # Added gender
    ]
    
    # Prepare for SQL update
    fields_to_update = []
    values_to_update = []

    for key in allowed_fields:
        if key in data and data[key] is not None:
            if key == 'gender': # Gender is TEXT
                value = str(data[key])
                # Basic validation for gender string, could be more robust
                if value not in ['man', 'woman']:
                    return jsonify({'error': f'Invalid value for gender. Must be \'man\' or \'woman\'.'}), 400
            else: # Other fields are REAL
                try:
                    value = float(data[key])
                except ValueError:
                    return jsonify({'error': f'Invalid value for {key}. Must be a number.'}), 400
            
            fields_to_update.append(f"{key} = ?")
            values_to_update.append(value)

        elif key in data and data[key] is None and key != 'gender': # Allow explicitly setting numeric fields to null
            fields_to_update.append(f"{key} = ?")
            values_to_update.append(None)
        # Not allowing gender to be None via this path, it should be 'man' or 'woman' if provided

    if not fields_to_update:
        return jsonify({'message': 'No measurement data provided to update.'}), 200 # Or 400 if you require data

    sql = f"UPDATE users SET {', '.join(fields_to_update)} WHERE id = ?"
    values_to_update.append(user_id)

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(sql, tuple(values_to_update))
        db.commit()
        return jsonify({'message': 'Measurements saved successfully!'}), 200
    except Exception as e:
        print(f"Database error saving measurements: {e}")
        return jsonify({'error': 'An internal error occurred while saving measurements.'}), 500

@app.route('/api/user/measurements', methods=['GET'])
@login_required
def get_user_measurements():
    user_id = session['user_id']
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT height, weight, chest, underbust, waist, hips, sleeve, thigh, inseam, outseam, gender FROM users WHERE id = ?", (user_id,))
    measurements_row = cursor.fetchone()

    if measurements_row:
        # Convert sqlite3.Row to a dictionary
        measurements_dict = dict(measurements_row)
        return jsonify(measurements_dict), 200
    else:
        # This case should ideally not happen if user_id is valid from session
        return jsonify({'error': 'User not found or no measurements available'}), 404

if __name__ == '__main__':
    # g is already imported at the top, ensure it is available in this scope if not already
    with app.app_context(): # Ensure g is available by using app_context if init_db uses g
        init_db() # Initialize the database when the app starts
    app.run(debug=True, port=5000)  # Using port 5000 for the backend 