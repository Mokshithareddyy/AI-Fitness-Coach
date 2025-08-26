# backend/app.py

from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import (LoginManager, UserMixin, login_user, logout_user,
                         login_required, current_user)
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import pandas as pd
import os
import random
from datetime import date, datetime, timedelta
import logging

# --- App Configuration ---
app = Flask(__name__)

# --- CORS Configuration ---
CORS(app,
     resources={r"/api/*": {"origins": ["http://localhost:8000", "http://127.0.0.1:8000"]}},
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     supports_credentials=True,
     expose_headers=["Content-Length", "X-CSRFToken"])
app.logger.info("CORS initialized for API routes, allowing http://localhost:8000 and http://127.0.0.1:8000")

app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your_fallback_SPA_secret_key_v13_ADMIN_AUTH_FINAL') # CHANGE THIS IN PRODUCTION
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
try:
    os.makedirs(instance_path, exist_ok=True)
except OSError: pass
db_path = os.path.join(instance_path, 'app.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.init_app(app)
login_manager.session_protection = "strong" # For session security

logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

# --- Middleware for logging requests ---
@app.before_request
def log_request_info():
    app.logger.debug(f"--- Incoming Request ---")
    app.logger.debug(f"Path: {request.path}")
    app.logger.debug(f"Method: {request.method}")
    app.logger.debug(f"Origin Header: {request.headers.get('Origin')}")
    # app.logger.debug(f"Cookies: {request.cookies}") # Be careful logging cookies in production
    if request.method == 'OPTIONS':
        app.logger.debug('Identified as an OPTIONS preflight request.')

@app.after_request
def log_response_info(response):
    app.logger.debug(f"--- Outgoing Response for {request.path} (Status: {response.status_code}) ---")
    app.logger.debug(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
    app.logger.debug(f"Access-Control-Allow-Credentials: {response.headers.get('Access-Control-Allow-Credentials')}")
    return response

# --- Dataset Loading ---
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DIET_DATASET_PATH = os.path.join(base_dir, 'datasets', 'diet_dataset_1000.csv')
FITNESS_DATASET_PATH = os.path.join(base_dir, 'datasets', 'fitness_dataset_1000.csv') # Not actively used in current logic
diet_df = None
# fitness_df = None # Not used, can be commented out or removed if not planned
try:
    diet_df = pd.read_csv(DIET_DATASET_PATH)
    if diet_df is not None: app.logger.info(f"Diet dataset loaded. Shape: {diet_df.shape}. Columns: {diet_df.columns.tolist()}")
    else: app.logger.warning("Diet dataset: pd.read_csv returned None. Using empty DataFrame."); diet_df = pd.DataFrame()
except FileNotFoundError: app.logger.error(f"CRITICAL ERROR: Diet dataset not found at {DIET_DATASET_PATH}"); diet_df = pd.DataFrame()
except Exception as e: app.logger.error(f"CRITICAL ERROR loading diet dataset from {DIET_DATASET_PATH}: {e}"); diet_df = pd.DataFrame()
# try:
#     fitness_df = pd.read_csv(FITNESS_DATASET_PATH)
#     if fitness_df is not None: app.logger.info(f"Fitness dataset loaded. Shape: {fitness_df.shape}.")
#     else: app.logger.warning("Fitness dataset: pd.read_csv returned None. Using empty DataFrame."); fitness_df = pd.DataFrame()
# except FileNotFoundError: app.logger.error(f"ERROR: Fitness dataset not found at {FITNESS_DATASET_PATH}"); fitness_df = pd.DataFrame()
# except Exception as e: app.logger.error(f"Error loading fitness dataset from {FITNESS_DATASET_PATH}: {e}"); fitness_df = pd.DataFrame()


# --- Database Models ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False, index=True) # Added index
    password_hash = db.Column(db.String(128), nullable=False)
    gender = db.Column(db.String(10))
    age = db.Column(db.Integer)
    height_cm = db.Column(db.Float)
    weight_kg = db.Column(db.Float)
    diet_preference = db.Column(db.String(50))
    activity_level = db.Column(db.String(50))
    goals = db.Column(db.String(100))
    preferred_cuisines = db.Column(db.String(200), nullable=True)
    is_admin_user = db.Column(db.Boolean, default=False, nullable=False) # New field for admin status

    def set_password(self, password): self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    def check_password(self, password): return bcrypt.check_password_hash(self.password_hash, password)

class WorkoutLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', name='fk_workoutlog_user_id'), nullable=False, index=True) # Added index and explicit FK name
    log_date = db.Column(db.Date, nullable=False, default=date.today)
    exercise_name = db.Column(db.String(100), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    calories_burned = db.Column(db.Integer, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    user = db.relationship('User', backref=db.backref('workout_logs', lazy='dynamic'))

class DietLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', name='fk_dietlog_user_id'), nullable=False, index=True)
    log_date = db.Column(db.Date, nullable=False, default=date.today)
    meal_type = db.Column(db.String(50))
    food_items = db.Column(db.Text) # Consider JSON or separate table for structured items
    total_calories = db.Column(db.Integer)
    user = db.relationship('User', backref=db.backref('diet_logs', lazy='dynamic'))

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', name='fk_todo_user_id'), nullable=False, index=True)
    task = db.Column(db.String(250), nullable=False)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref=db.backref('todos', lazy='dynamic'))

@login_manager.user_loader
def load_user(user_id): return User.query.get(int(user_id))

# --- Helper Functions (BMI, BMR, TDEE, Target Calories) ---
def calculate_bmi(weight_kg, height_cm):
    if not weight_kg or not height_cm or height_cm == 0: return 0.0
    height_m = height_cm / 100; bmi = weight_kg / (height_m ** 2); return round(bmi, 1)
def get_bmi_category(bmi):
    if bmi == 0: return "N/A"
    if bmi < 18.5: return "Underweight"
    elif 18.5 <= bmi < 24.9: return "Normal weight"
    elif 25 <= bmi < 29.9: return "Overweight"
    else: return "Obesity"
def calculate_bmr(weight_kg, height_cm, age, gender):
    if not all([weight_kg, height_cm, age, gender]): return 0
    gender_l = gender.lower() if gender else ""
    if gender_l == 'male': bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    elif gender_l == 'female': bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
    else: bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 78 # Average for 'other'
    return round(bmr)
def calculate_tdee(bmr, activity_level):
    if bmr == 0: return 0
    activity_multipliers = {'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'active': 1.725, 'very_active': 1.9}
    multiplier = activity_multipliers.get(activity_level.lower() if activity_level else 'sedentary', 1.2)
    return round(bmr * multiplier)
def get_target_calories(tdee, goal):
    if tdee == 0: return 0
    goal_lower = goal.lower() if goal else 'maintenance'
    if goal_lower == 'weight_loss': return tdee - 500
    elif goal_lower == 'muscle_gain': return tdee + 300
    return tdee

# --- Diet Recommendation Logic ---
def _generate_single_day_diet(user_profile_data, available_recipes_df, used_recipes_for_week_set, num_options_per_meal=1):
    target_calories_total = user_profile_data.get('target_calories', 2000)
    calorie_dist = {'breakfast': 0.25, 'lunch': 0.40, 'dinner': 0.35}
    daily_meals_options = {meal: [] for meal in calorie_dist}
    recipes_used_this_day = set()
    recipe_name_column = 'Recipe_name' # Ensure this column exists in your CSV

    for meal_type, proportion in calorie_dist.items():
        target_meal_calories = target_calories_total * proportion
        tolerance_percentage = 0.35

        # Filter candidates: not used this day AND not used recently in the week (more strictly)
        candidates = available_recipes_df[
            ~available_recipes_df[recipe_name_column].isin(recipes_used_this_day) &
            ~available_recipes_df[recipe_name_column].isin(used_recipes_for_week_set)
        ].copy()
        if candidates.empty: # Fallback 1: Not used this day
            candidates = available_recipes_df[~available_recipes_df[recipe_name_column].isin(recipes_used_this_day)].copy()
        if candidates.empty: # Fallback 2: Any available (may repeat from week)
            candidates = available_recipes_df.copy()

        for _ in range(num_options_per_meal):
            if candidates.empty: break

            # Filter out already selected options for this meal type
            current_selection_pool = candidates[~candidates[recipe_name_column].isin(
                [opt['name'] for opt in daily_meals_options[meal_type]]
            )].copy()
            if current_selection_pool.empty: break

            current_selection_pool['calorie_diff'] = abs(current_selection_pool['Calories'] - target_meal_calories)

            # Prioritize dishes within tolerance
            potential_dishes = current_selection_pool[current_selection_pool['calorie_diff'] <= (target_meal_calories * tolerance_percentage)]

            chosen_dish_series = None
            if not potential_dishes.empty:
                chosen_dish_series = potential_dishes.sort_values(by='calorie_diff').sample(n=1, replace=False, random_state=random.randint(1,10000)).iloc[0]
            elif not current_selection_pool.empty: # If no dish within tolerance, pick the closest one
                chosen_dish_series = current_selection_pool.sort_values(by='calorie_diff').sample(n=1, replace=False, random_state=random.randint(1,10000)).iloc[0]

            if chosen_dish_series is not None:
                actual_recipe_name = chosen_dish_series[recipe_name_column]
                recipes_used_this_day.add(actual_recipe_name)
                daily_meals_options[meal_type].append({
                    "name": str(actual_recipe_name),
                    "calories": int(chosen_dish_series.get('Calories', 0)),
                    "protein": int(chosen_dish_series.get('Protein', 0)),
                    "carbs": int(chosen_dish_series.get('Carbs', 0)),
                    "fat": int(chosen_dish_series.get('Fat', 0)),
                    "cuisine": str(chosen_dish_series.get('Cuisine', 'N/A'))
                })
            else: break # No suitable dish found

        if not daily_meals_options[meal_type]: # Fallback if no options found
            daily_meals_options[meal_type] = [{"name": "N/A - More variety needed", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "cuisine": "N/A"}]

    day_total_calories = sum(meal_options[0]['calories'] for meal_options in daily_meals_options.values() if meal_options and meal_options[0]['calories'] > 0)
    return {"meals": daily_meals_options, "total_calories_for_day": day_total_calories}, recipes_used_this_day

def generate_weekly_diet_plan(user_profile_data, num_options_per_meal_per_day=1):
    global diet_df
    if diet_df is None or diet_df.empty: app.logger.error("Diet DataFrame is None or empty for weekly plan."); return {"error": "Diet data not available."}

    base_df = diet_df.copy()
    recipe_name_column = 'Recipe_name'
    required_cols = [recipe_name_column, 'Calories', 'Protein', 'Carbs', 'Fat', 'Cuisine', 'Diet_type']
    if not all(col in base_df.columns for col in required_cols):
        missing = [col for col in required_cols if col not in base_df.columns]
        return {"error": f"Diet data incomplete (missing: {', '.join(missing)})."}

    base_df.dropna(subset=required_cols, inplace=True)
    for col in ['Calories', 'Protein', 'Carbs', 'Fat']:
        base_df[col] = pd.to_numeric(base_df[col], errors='coerce').fillna(0).astype(int)
    base_df = base_df[base_df['Calories'] > 50]
    if base_df.empty: return {"error": "No suitable food items after cleaning."}

    diet_pref = user_profile_data.get('diet_preference', 'any').lower()
    preferred_cuisines_str = user_profile_data.get('preferred_cuisines', "")
    preferred_cuisines_list = [c.strip().lower() for c in preferred_cuisines_str.split(',') if c.strip()] if preferred_cuisines_str else []

    filtered_df = base_df.copy()
    if diet_pref != 'any':
        if diet_pref == 'vegetarian': filtered_df = filtered_df[filtered_df['Diet_type'].str.lower().isin(['vegetarian', 'vegan'])]
        elif diet_pref == 'vegan': filtered_df = filtered_df[filtered_df['Diet_type'].str.lower() == 'vegan']
        elif diet_pref == 'non-vegetarian': filtered_df = filtered_df[~filtered_df['Diet_type'].str.lower().isin(['vegetarian', 'vegan'])]

    if filtered_df.empty: app.logger.warning(f"No items for diet_pref '{diet_pref}', using base pool."); filtered_df = base_df.copy()

    if preferred_cuisines_list:
        cuisine_filtered = filtered_df[filtered_df['Cuisine'].notna() & filtered_df['Cuisine'].astype(str).str.lower().isin(preferred_cuisines_list)]
        if not cuisine_filtered.empty: available_recipes_df = cuisine_filtered.copy()
        else: app.logger.warning("No items for preferred cuisines, using diet_pref pool."); available_recipes_df = filtered_df.copy()
    else: available_recipes_df = filtered_df.copy()

    if available_recipes_df.empty or len(available_recipes_df) < 7: # Need some variety
        return {"error": "Not enough diverse food items for your preferences."}

    app.logger.info(f"Generating weekly plan with {len(available_recipes_df)} recipes.")
    weekly_plan = []; used_recipes_overall = set()
    for day_num in range(7):
        app.logger.debug(f"Generating for Day {day_num + 1}")
        # Shuffle available recipes daily for more variety if the pool is small
        shuffled_df = available_recipes_df.sample(frac=1, random_state=day_num).reset_index(drop=True)
        daily_diet, recipes_this_day = _generate_single_day_diet(
            user_profile_data, shuffled_df, used_recipes_overall, num_options_per_meal_per_day
        )
        weekly_plan.append({"day": day_num + 1, "daily_summary": daily_diet})
        used_recipes_overall.update(recipes_this_day)

    if not weekly_plan or all(not day_data["daily_summary"]["meals"] for day_data in weekly_plan):
        return {"error": "Could not generate any valid daily plans."}
    return {"weekly_diet_plan": weekly_plan}

# --- Workout Recommendation Logic ---
def recommend_workouts_logic(user_goal, bmi_category):
    # Expanded list of workouts
    all_workouts_full = [
        {"name": "Push-ups", "type": "strength", "target": "Chest, Shoulders, Triceps", "duration_suggestion": "3 sets of AMRAP", "difficulty": "Intermediate"},
        {"name": "Squats (Bodyweight)", "type": "strength", "target": "Quads, Glutes, Hamstrings", "duration_suggestion": "3 sets of 12-15 reps", "difficulty": "Beginner"},
        {"name": "Plank", "type": "core", "target": "Core", "duration_suggestion": "3 sets, hold 30-60s", "difficulty": "Beginner"},
        {"name": "Lunges (Bodyweight)", "type": "strength", "target": "Quads, Glutes", "duration_suggestion": "3 sets of 10-12 reps per leg", "difficulty": "Beginner"},
        {"name": "Burpees", "type": "cardio", "target": "Full Body", "duration_suggestion": "3 sets of 8-12 reps", "difficulty": "Intermediate"},
        {"name": "Jumping Jacks", "type": "cardio", "target": "Full Body", "duration_suggestion": "3-5 minutes", "difficulty": "Beginner"},
        {"name": "Running/Jogging (Moderate Pace)", "type": "cardio", "target": "Cardiovascular, Legs", "duration_suggestion": "20-30 minutes", "difficulty": "Beginner-Intermediate"},
        {"name": "Cycling (Moderate Intensity)", "type": "cardio", "target": "Legs, Cardiovascular", "duration_suggestion": "30-45 minutes", "difficulty": "Beginner-Intermediate"},
        {"name": "Bicep Curls (Dumbbells/Resistance Band)", "type": "strength", "target": "Biceps", "duration_suggestion": "3 sets of 10-15 reps", "difficulty": "Beginner"},
        {"name": "Overhead Press (Dumbbells/Resistance Band)", "type": "strength", "target": "Shoulders, Triceps", "duration_suggestion": "3 sets of 10-15 reps", "difficulty": "Beginner"},
        {"name": "Bent-Over Rows (Dumbbells/Resistance Band)", "type": "strength", "target": "Back, Biceps", "duration_suggestion": "3 sets of 10-15 reps", "difficulty": "Beginner"},
        {"name": "Crunches", "type": "core", "target": "Upper Abs", "duration_suggestion": "3 sets of 15-20 reps", "difficulty": "Beginner"},
        {"name": "Leg Raises (Lying)", "type": "core", "target": "Lower Abs", "duration_suggestion": "3 sets of 15-20 reps", "difficulty": "Beginner"},
        {"name": "Bird-Dog", "type": "core", "target": "Core Stability, Back", "duration_suggestion": "3 sets of 10-12 reps per side", "difficulty": "Beginner"},
        {"name": "Glute Bridges", "type": "strength", "target": "Glutes, Hamstrings", "duration_suggestion": "3 sets of 15-20 reps", "difficulty": "Beginner"},
        {"name": "Yoga Flow (Beginner)", "type": "flexibility", "target": "Full Body", "duration_suggestion": "20-30 minutes", "difficulty": "Beginner"},
        {"name": "Stretching Routine", "type": "flexibility", "target": "Major Muscle Groups", "duration_suggestion": "10-15 minutes post-workout", "difficulty": "Beginner"},
        {"name": "High-Intensity Interval Training (HIIT) - Bodyweight", "type": "cardio", "target": "Full Body, Fat Loss", "duration_suggestion": "15-20 mins (e.g., 30s work, 30s rest)", "difficulty": "Intermediate"},
        {"name": "Walking (Brisk)", "type": "cardio", "target": "General Fitness", "duration_suggestion": "30-60 minutes", "difficulty": "Beginner"},
    ]
    recommendations = []; goal_lower = user_goal.lower() if user_goal else "maintenance"

    # Simplified selection logic for brevity, can be made more sophisticated
    if goal_lower == 'muscle_gain':
        strength_workouts = [w for w in all_workouts_full if w['type'] == 'strength']
        core_workouts = [w for w in all_workouts_full if w['type'] == 'core']
        if strength_workouts: recommendations.extend(random.sample(strength_workouts, k=min(3, len(strength_workouts))))
        if core_workouts: recommendations.extend(random.sample(core_workouts, k=min(2, len(core_workouts))))
    elif goal_lower == 'weight_loss':
        cardio_workouts = [w for w in all_workouts_full if w['type'] == 'cardio']
        strength_core_workouts = [w for w in all_workouts_full if w['type'] in ['strength', 'core']]
        if cardio_workouts: recommendations.extend(random.sample(cardio_workouts, k=min(2, len(cardio_workouts))))
        if strength_core_workouts: recommendations.extend(random.sample(strength_core_workouts, k=min(3, len(strength_core_workouts))))
    elif goal_lower == 'endurance':
        cardio_workouts = [w for w in all_workouts_full if w['type'] == 'cardio']
        if cardio_workouts: recommendations.extend(random.sample(cardio_workouts, k=min(4, len(cardio_workouts))))
        # Add a core workout for endurance
        core_w = next((w for w in all_workouts_full if w['type'] == 'core'), None)
        if core_w and len(recommendations) < 5 : recommendations.append(core_w)
    else: # Maintenance or other
        if all_workouts_full: recommendations = random.sample(all_workouts_full, k=min(5, len(all_workouts_full)))

    # Ensure uniqueness and limit to 5
    seen_names = set(); unique_recs = []
    for rec in recommendations:
        if rec['name'] not in seen_names:
            unique_recs.append(rec)
            seen_names.add(rec['name'])

    final_recs = unique_recs[:5] # Take up to 5 unique recommendations

    # If less than 3, try to add some general ones to reach at least 3 if possible
    if len(final_recs) < 3 and len(all_workouts_full) >=3:
        general_fill = [w for w in all_workouts_full if w['name'] not in seen_names]
        if general_fill:
            final_recs.extend(random.sample(general_fill, k=min(3 - len(final_recs), len(general_fill))))

    return final_recs


# --- API Routes ---
@app.route('/')
def api_root_info(): return jsonify({"message": "Welcome to the AI Gym Trainer API! Backend is running."})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data: return jsonify({"message": "No input data provided"}), 400

    required_fields = ['username', 'password', 'gender', 'age', 'height', 'weight', 'diet_preference', 'activity_level', 'goals']
    missing = [field for field in required_fields if not data.get(field)]
    if missing: return jsonify({"message": f"Missing required fields: {', '.join(missing)}"}), 400

    username = data['username'].strip()
    if not username: return jsonify({"message": "Username cannot be empty"}), 400
    if User.query.filter_by(username=username).first(): return jsonify({"message": "Username already exists"}), 409

    try:
        age = int(data['age']); height = float(data['height']); weight = float(data['weight'])
        if not (12 <= age <= 120): raise ValueError("Age must be between 12 and 120.")
        if not (50 <= height <= 300): raise ValueError("Height must be between 50 and 300 cm.")
        if not (20 <= weight <= 500): raise ValueError("Weight must be between 20 and 500 kg.")
    except (ValueError, TypeError) as e: return jsonify({"message": f"Invalid data for age, height, or weight: {str(e)}"}), 400

    if len(data['password']) < 6:
        return jsonify({"message": "Password must be at least 6 characters long."}), 400

    preferred_cuisines_value = data.get('preferred_cuisines', "").strip()

    new_user = User(
        username=username, gender=data['gender'], age=age,
        height_cm=height, weight_kg=weight, diet_preference=data['diet_preference'],
        activity_level=data['activity_level'], goals=data['goals'],
        preferred_cuisines=preferred_cuisines_value,
        is_admin_user=False # Regular users are not admin by default
    )
    new_user.set_password(data['password'])

    try:
        db.session.add(new_user); db.session.commit()
        app.logger.info(f"User '{username}' registered successfully.")
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Database error during registration for {username}: {e}", exc_info=True)
        return jsonify({"message": "Registration failed due to a server error."}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data: return jsonify({"message": "No input data provided"}), 400
    username = data.get('username')
    password = data.get('password')
    if not username or not password: return jsonify({"message": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()

    # Hardcoded Admin Check (should ideally be based on a flag in the DB)
    if username == "Mokshitha" and password == "123456":
        # Check if admin user exists, create if not (for first-time setup)
        admin_user = User.query.filter_by(username="Mokshitha").first()
        if not admin_user:
            admin_user = User(username="Mokshitha", is_admin_user=True)
            admin_user.set_password("123456") # Set password
            # Fill other fields with placeholder or make them nullable
            admin_user.gender = "other"
            admin_user.age = 30
            admin_user.height_cm = 160
            admin_user.weight_kg = 60
            admin_user.diet_preference = "any"
            admin_user.activity_level = "moderate"
            admin_user.goals = "maintenance"
            try:
                db.session.add(admin_user)
                db.session.commit()
                app.logger.info("Admin user 'Mokshitha' created.")
                user = admin_user # Use this newly created/fetched user for login
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Could not create admin user 'Mokshitha': {e}")
                return jsonify({"message": "Admin setup error."}), 500
        elif not admin_user.check_password("123456"): # If admin exists but pass is wrong
             app.logger.warning(f"Failed admin login attempt for username: {username} (password mismatch)")
             return jsonify({"message": "Invalid admin credentials"}), 401

        # If admin exists and password matches the hardcoded one
        if not admin_user.is_admin_user: # Ensure the DB flag is also set
            admin_user.is_admin_user = True
            db.session.commit()

        login_user(admin_user, remember=True, duration=timedelta(days=7))
        app.logger.info(f"Admin User '{admin_user.username}' logged in successfully.")
        return jsonify({
            "message": "Admin login successful!",
            "user": {"id": admin_user.id, "username": admin_user.username, "is_admin": True }
        }), 200

    # Regular user login
    if user and user.check_password(password):
        login_user(user, remember=True, duration=timedelta(days=7))
        app.logger.info(f"User '{user.username}' logged in successfully.")
        return jsonify({
            "message": "Login successful!",
            "user": {"id": user.id, "username": user.username, "is_admin": user.is_admin_user}
        }), 200

    app.logger.warning(f"Failed login attempt for username: {username}")
    return jsonify({"message": "Invalid username or password"}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    user_name = current_user.username
    logout_user()
    app.logger.info(f"User '{user_name}' logged out successfully.")
    session.clear() # Explicitly clear session for good measure
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/user_profile', methods=['GET', 'PUT'])
@login_required
def user_profile():
    user = current_user

    if request.method == 'PUT':
        data = request.get_json()
        if not data: return jsonify({"message": "No input data provided for update"}), 400

        try:
            # Validate and update fields
            if 'age' in data:
                age = int(data['age'])
                if not (12 <= age <= 120): raise ValueError("Age must be between 12 and 120.")
                user.age = age
            if 'gender' in data and data['gender'] in ['male', 'female', 'other']:
                user.gender = data['gender']
            if 'height' in data:
                height = float(data['height'])
                if not (50 <= height <= 300): raise ValueError("Height must be between 50 and 300 cm.")
                user.height_cm = height
            if 'weight' in data:
                weight = float(data['weight'])
                if not (20 <= weight <= 500): raise ValueError("Weight must be between 20 and 500 kg.")
                user.weight_kg = weight
            if 'diet_preference' in data: user.diet_preference = data['diet_preference']
            if 'activity_level' in data: user.activity_level = data['activity_level']
            if 'goals' in data: user.goals = data['goals']
            if 'preferred_cuisines' in data: user.preferred_cuisines = data.get('preferred_cuisines', '').strip()

            db.session.commit()
            app.logger.info(f"User profile updated for {user.username}")

            # Return the full updated profile including calculated values
            bmi = calculate_bmi(user.weight_kg, user.height_cm); bmi_category = get_bmi_category(bmi)
            bmr = calculate_bmr(user.weight_kg, user.height_cm, user.age, user.gender); tdee = calculate_tdee(bmr, user.activity_level)
            target_calories = get_target_calories(tdee, user.goals)
            return jsonify({
                "message": "Profile updated successfully!",
                "user_profile": {
                    "username": user.username, "age": user.age, "gender": user.gender,
                    "height_cm": user.height_cm, "weight_kg": user.weight_kg,
                    "diet_preference": user.diet_preference, "activity_level": user.activity_level,
                    "goals": user.goals, "preferred_cuisines": user.preferred_cuisines or "",
                    "bmi": bmi, "bmi_category": bmi_category, "bmr": bmr, "tdee": tdee,
                    "target_daily_calories": target_calories, "is_admin": user.is_admin_user
                }
            }), 200
        except ValueError as e:
            db.session.rollback()
            return jsonify({"message": f"Invalid data: {str(e)}"}), 400
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating profile for {user.username}: {e}", exc_info=True)
            return jsonify({"message": "Profile update failed due to a server error."}), 500

    # GET request
    bmi = calculate_bmi(user.weight_kg, user.height_cm); bmi_category = get_bmi_category(bmi)
    bmr = calculate_bmr(user.weight_kg, user.height_cm, user.age, user.gender); tdee = calculate_tdee(bmr, user.activity_level)
    target_calories = get_target_calories(tdee, user.goals)
    return jsonify({
        "username": user.username, "age": user.age, "gender": user.gender,
        "height_cm": user.height_cm, "weight_kg": user.weight_kg,
        "diet_preference": user.diet_preference, "activity_level": user.activity_level,
        "goals": user.goals, "bmi": bmi, "bmi_category": bmi_category,
        "bmr": bmr, "tdee": tdee, "target_daily_calories": target_calories,
        "preferred_cuisines": user.preferred_cuisines or "",
        "is_admin": user.is_admin_user # Include admin status in profile GET
    }), 200

@app.route('/api/weekly_diet_plan', methods=['GET'])
@login_required
def get_weekly_diet_plan():
    user = current_user
    # Recalculate BMR/TDEE/Target based on current profile for diet generation
    bmr = calculate_bmr(user.weight_kg, user.height_cm, user.age, user.gender)
    tdee = calculate_tdee(bmr, user.activity_level)
    target_calories = get_target_calories(tdee, user.goals)

    user_profile_for_diet = {
        'target_calories': target_calories,
        'diet_preference': user.diet_preference,
        'preferred_cuisines': user.preferred_cuisines
    }
    weekly_diet_plan_data = generate_weekly_diet_plan(user_profile_for_diet, num_options_per_meal_per_day=1) # Can increase num_options
    if "error" in weekly_diet_plan_data: return jsonify(weekly_diet_plan_data), 400
    return jsonify(weekly_diet_plan_data), 200

@app.route('/api/workout_recommendations', methods=['GET'])
@login_required
def get_workout_recommendations():
    user = current_user
    bmi = calculate_bmi(user.weight_kg, user.height_cm); bmi_category = get_bmi_category(bmi)
    workouts = recommend_workouts_logic(user.goals, bmi_category)
    return jsonify({"goal": user.goals, "workouts": workouts}), 200

# --- Workout Log API Endpoints ---
@app.route('/api/workout_logs', methods=['POST'])
@login_required
def log_workout():
    data = request.get_json()
    if not data: return jsonify({"message": "No data provided for workout log"}), 400

    exercise_name = data.get('exercise_name')
    duration_minutes_str = data.get('duration_minutes')
    calories_burned_str = data.get('calories_burned')
    log_date_str = data.get('log_date') # Expect YYYY-MM-DD from frontend
    feedback = data.get('feedback')

    if not exercise_name or not exercise_name.strip() or duration_minutes_str is None:
        return jsonify({"message": "Exercise name and duration are required"}), 400

    try:
        duration_minutes = int(duration_minutes_str)
        calories_burned = int(calories_burned_str) if calories_burned_str is not None else None

        log_date_to_save = date.today() # Default
        if log_date_str:
            try: log_date_to_save = datetime.strptime(log_date_str, '%Y-%m-%d').date()
            except ValueError: app.logger.warning(f"Invalid date format '{log_date_str}' for workout log. Defaulting to today.")

        if duration_minutes <= 0: return jsonify({"message": "Duration must be a positive number."}), 400
        if calories_burned is not None and calories_burned < 0: return jsonify({"message": "Calories burned cannot be negative."}), 400

        new_log = WorkoutLog(
            user_id=current_user.id, exercise_name=exercise_name.strip(),
            duration_minutes=duration_minutes, calories_burned=calories_burned,
            log_date=log_date_to_save, feedback=feedback.strip() if feedback else None
        )
        db.session.add(new_log); db.session.commit()
        app.logger.info(f"Workout logged for user {current_user.username}: {exercise_name}")
        return jsonify({
            "message": "Workout logged successfully!",
            "log": {
                "id": new_log.id, "exercise_name": new_log.exercise_name,
                "duration_minutes": new_log.duration_minutes, "calories_burned": new_log.calories_burned,
                "log_date": new_log.log_date.isoformat(), "feedback": new_log.feedback
            }
        }), 201
    except ValueError: return jsonify({"message": "Invalid data type for duration or calories (must be numbers)."}), 400
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error logging workout for user {current_user.username}: {e}", exc_info=True)
        return jsonify({"message": "Failed to log workout due to a server error."}), 500

@app.route('/api/workout_logs', methods=['GET'])
@login_required
def get_workout_logs():
    try:
        year = request.args.get('year', type=int); month = request.args.get('month', type=int); day = request.args.get('day', type=int)
        query = WorkoutLog.query.filter_by(user_id=current_user.id)
        if year and month and day:
            if not (1 <= month <= 12 and 1 <= day <= 31): return jsonify({"message": "Invalid month or day parameter."}), 400
            try: specific_date = date(year, month, day); query = query.filter(WorkoutLog.log_date == specific_date)
            except ValueError: return jsonify({"message": "Invalid date constructed from year, month, day."}), 400
        elif year and month:
            if not (1 <= month <= 12): return jsonify({"message": "Invalid month parameter."}), 400
            query = query.filter(db.extract('year', WorkoutLog.log_date) == year, db.extract('month', WorkoutLog.log_date) == month)

        user_logs = query.order_by(WorkoutLog.log_date.desc(), WorkoutLog.id.desc()).all()
        logs_data = [{
            "id": log.id, "exercise_name": log.exercise_name,
            "duration_minutes": log.duration_minutes, "calories_burned": log.calories_burned,
            "log_date": log.log_date.isoformat(), "feedback": log.feedback
        } for log in user_logs]
        return jsonify(logs_data), 200
    except Exception as e:
        app.logger.error(f"Error fetching workout logs for user {current_user.username}: {e}", exc_info=True)
        return jsonify({"message": "Failed to fetch workout logs due to a server error."}), 500

# --- To-Do List API Endpoints ---
@app.route('/api/todos', methods=['GET'])
@login_required
def get_todos():
    user_todos = Todo.query.filter_by(user_id=current_user.id).order_by(Todo.created_at.asc()).all()
    return jsonify([{"id": todo.id, "task": todo.task, "completed": todo.completed} for todo in user_todos]), 200

@app.route('/api/todos', methods=['POST'])
@login_required
def add_todo():
    data = request.get_json()
    if not data or not data.get('task') or not data.get('task').strip():
        return jsonify({"message": "Task content is required and cannot be empty"}), 400
    new_todo = Todo(user_id=current_user.id, task=data['task'].strip(), completed=False)
    try:
        db.session.add(new_todo); db.session.commit()
        app.logger.info(f"Todo '{new_todo.task}' added for user {current_user.username}")
        return jsonify({"id": new_todo.id, "task": new_todo.task, "completed": new_todo.completed}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error adding todo for user {current_user.username}: {e}", exc_info=True)
        return jsonify({"message": "Failed to add todo due to server error."}), 500

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
@login_required
def update_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id) # Returns 404 if not found
    if todo.user_id != current_user.id: return jsonify({"message": "Unauthorized to modify this todo"}), 403

    data = request.get_json()
    if data is None: return jsonify({"message": "No data provided for update"}), 400

    updated = False
    if 'task' in data:
        task_content = data['task']
        if task_content is None or not task_content.strip():
            return jsonify({"message": "Task content cannot be empty if provided"}), 400
        if todo.task != task_content.strip():
            todo.task = task_content.strip()
            updated = True

    if 'completed' in data and isinstance(data['completed'], bool):
        if todo.completed != data['completed']:
            todo.completed = data['completed']
            updated = True

    if updated:
        try:
            db.session.commit()
            app.logger.info(f"Todo ID {todo_id} updated for user {current_user.username}")
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating todo ID {todo_id} for user {current_user.username}: {e}", exc_info=True)
            return jsonify({"message": "Failed to update todo due to server error."}), 500

    return jsonify({"id": todo.id, "task": todo.task, "completed": todo.completed}), 200

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
@login_required
def delete_todo_item(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    if todo.user_id != current_user.id: return jsonify({"message": "Unauthorized to delete this todo"}), 403
    try:
        db.session.delete(todo); db.session.commit()
        app.logger.info(f"Todo ID {todo_id} deleted for user {current_user.username}")
        return jsonify({"message": "Todo deleted successfully"}), 200 # 200 with message is fine
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting todo ID {todo_id} for user {current_user.username}: {e}", exc_info=True)
        return jsonify({"message": "Failed to delete todo due to server error."}), 500

# --- Error Handlers ---
@app.errorhandler(404) # For general 404s not caught by get_or_404
def not_found_error(error):
    app.logger.warning(f"Resource not found: {request.path} - Error: {error}")
    return jsonify({"message": "API Resource not found."}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback() # Rollback in case of DB error
    app.logger.error(f"API Server Error: {error}", exc_info=True)
    return jsonify({"message": "An internal server error occurred."}), 500

@login_manager.unauthorized_handler
def unauthorized_api_access():
    app.logger.warning(f"Unauthorized API access: {request.path} (Origin: {request.headers.get('Origin')})")
    return jsonify(message="Unauthorized: Authentication is required."), 401

@app.errorhandler(403)
def forbidden_api_error(error):
    app.logger.warning(f"Forbidden access: {request.path} by user {current_user.username if current_user.is_authenticated else 'Anonymous'} (Origin: {request.headers.get('Origin')})")
    return jsonify({"message": "Forbidden: You don't have permission to access this."}), 403

@app.errorhandler(400) # For general bad requests
def bad_request_api_error(error):
    message = error.description if hasattr(error, 'description') and error.description else "Bad API request. Please check your input."
    app.logger.warning(f"Bad request: {request.path} - Message: {message} - Error: {error}")
    return jsonify({"message": message}), 400

# --- Main Execution ---
if __name__ == '__main__':
    with app.app_context():
        app.logger.info(f"Checking database at: {db_path}")
        db.create_all() # Creates tables if they don't exist

        # Ensure admin user "Mokshitha" exists
        admin_username = "Mokshitha"
        admin_password = "123456"
        admin = User.query.filter_by(username=admin_username).first()
        if not admin:
            admin = User(
                username=admin_username,
                gender="other", age=30, height_cm=160, weight_kg=60, # Example defaults
                diet_preference="any", activity_level="moderate", goals="maintenance",
                is_admin_user=True
            )
            admin.set_password(admin_password)
            db.session.add(admin)
            db.session.commit()
            app.logger.info(f"Admin user '{admin_username}' created with default password.")
        elif not admin.is_admin_user: # If user exists but isn't admin, make them admin
            admin.is_admin_user = True
            db.session.commit()
            app.logger.info(f"User '{admin_username}' found and ensured admin status.")


        app.logger.info("Database tables ensured.")
    app.logger.info("Starting AI Gym Trainer API Backend Server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
