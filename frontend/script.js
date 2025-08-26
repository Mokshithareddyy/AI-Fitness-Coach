// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';

    // --- DOM Elements ---
    const authChoiceView = document.getElementById('authChoiceView');
    const loginView = document.getElementById('loginView');
    const registerView = document.getElementById('registerView');
    const dashboardSection = document.getElementById('dashboardSection');
    const allMainViews = [authChoiceView, loginView, registerView, dashboardSection].filter(Boolean);

    const showLoginBtnFromChoice = document.getElementById('showLoginBtnFromChoice');
    const showRegisterBtnFromChoice = document.getElementById('showRegisterBtnFromChoice');
    const switchToRegisterBtn = document.getElementById('switchToRegisterBtn');
    const switchToLoginBtn = document.getElementById('switchToLoginBtn');
    const backToLoginFromRegister = document.getElementById('backToLoginFromRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authChoiceMessage = document.getElementById('authChoiceMessage');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');

    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardHeader = document.getElementById('dashboardHeader');
    const dashboardWelcomeMessage = document.getElementById('dashboardWelcomeMessage');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const dashboardOverviewPage = document.getElementById('dashboardOverviewPage');
    const dashboardNavItems = document.querySelectorAll('.dashboard-nav-item'); // Will re-query if admin card is added
    const dashboardDetailContent = document.getElementById('dashboardDetailContent');
    const backToDashboardOverviewBtn = document.getElementById('backToDashboardOverviewBtn');
    let allDashboardDetailPages = document.querySelectorAll('#dashboardDetailContent > .dashboard-page'); // Will re-query
    const dashboardApiMessage = document.getElementById('dashboardApiMessage');
    const adminPanelCard = document.getElementById('adminPanelCard'); // For admin link


    const headerTitle = document.getElementById('headerTitle');
    const currentYearSpan = document.getElementById('currentYear');

    // Registration Cuisines
    const regPreferredCuisinesContainer = document.getElementById('regPreferredCuisinesContainer');

    // Profile Display Elements
    const profileUsername = document.getElementById('profileUsername');
    const profileAge = document.getElementById('profileAge');
    const profileGender = document.getElementById('profileGender');
    const profileHeight = document.getElementById('profileHeight');
    const profileWeight = document.getElementById('profileWeight');
    const profileDietPref = document.getElementById('profileDietPref');
    const profileCuisines = document.getElementById('profileCuisines');
    const profileActivityLevel = document.getElementById('profileActivityLevel');
    const profileGoals = document.getElementById('profileGoals');
    const profileBmiValue = document.getElementById('profileBmiValue');
    const profileBmiCategory = document.getElementById('profileBmiCategory');
    const profileBmr = document.getElementById('profileBmr');
    const profileTdee = document.getElementById('profileTdee');
    const profileTargetCalories = document.getElementById('profileTargetCalories');

    // Profile Edit Elements
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');
    const cancelProfileEditBtn = document.getElementById('cancelProfileEditBtn');
    const editProfileForm = document.getElementById('editProfileForm');
    const profileDisplayView = document.getElementById('profileDisplayView');
    const profileUsernameDisplay = document.getElementById('profileUsernameDisplay');

    const editProfileAgeInput = document.getElementById('editProfileAge');
    const editProfileGenderSelect = document.getElementById('editProfileGender');
    const editProfileHeightInput = document.getElementById('editProfileHeight');
    const editProfileWeightInput = document.getElementById('editProfileWeight');
    const editProfileDietPrefSelect = document.getElementById('editProfileDietPref');
    const editProfileActivityLevelSelect = document.getElementById('editProfileActivityLevel');
    const editProfileGoalsSelect = document.getElementById('editProfileGoals');
    const editProfileCuisinesContainer = document.getElementById('editProfileCuisinesContainer');
    const editProfileMessage = document.getElementById('editProfileMessage');


    // Diet Detail Elements
    const weeklyDietPlanTabsContainer = document.getElementById('weeklyDietPlanTabs');
    const dietChartContainer = document.getElementById('dietChartContainer');
    const regenerateWeeklyDietBtn = document.getElementById('regenerateWeeklyDietBtn');

    // Workout Detail Elements
    const workoutListContainer = document.getElementById('workoutListContainer');
    const workoutTimerDiv = document.getElementById('workoutTimer');
    const currentWorkoutNameTimerElement = document.getElementById('currentWorkoutNameTimer');
    const timerDisplay = document.getElementById('timerDisplay');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const pauseTimerBtn = document.getElementById('pauseTimerBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');
    const logThisWorkoutBtn = document.getElementById('logThisWorkoutBtn');
    const workoutTimerMessage = document.getElementById('workoutTimerMessage');


    // Pose Detection Elements
    const exerciseSelectForPose = document.getElementById('exerciseSelectForPose');
    const startPoseBtn = document.getElementById('startPoseBtn');
    const webcamFeed = document.getElementById('webcamFeed');
    const poseCanvas = document.getElementById('poseCanvas');
    const poseCanvasCtx = poseCanvas ? poseCanvas.getContext('2d') : null;
    const poseFeedback = document.getElementById('poseFeedback');

    // Logs Elements
    const logsList = document.getElementById('logsList');

    // To-Do List Elements
    const todoForm = document.getElementById('todoForm');
    const todoInput = document.getElementById('todoInput');
    const todoListUl = document.getElementById('todoList');

    // --- State Variables ---
    let currentUserData = null; // Will store { id, username, is_admin (bool), ... other profile details }
    let currentRawProfileData = null;
    let currentWeeklyDietPlan = null;
    let todos = [];
    let poseDetectionActive = false;
    let currentPoseInstance = null;
    let camera = null;
    let timerInterval;
    let timerSeconds = 0;
    let timerRunning = false;
    let currentWorkoutNameForTimer = "";
    let currentWorkoutDurationSuggestion = "0";
    let currentTimerSessionDetails = { name: null, startTime: null, durationSeconds: 0 };

    const TRANSITION_DURATION_CARD = 400;
    const TRANSITION_DURATION_DASHBOARD_SECTION = 500;
    const TRANSITION_DURATION_DETAIL_PAGE = 350;

    // Available Cuisines
    const availableCuisines = [
        "Italian", "Indian", "Mexican", "Chinese", "American", "Mediterranean",
        "Thai", "Japanese", "French", "Spanish", "Greek", "Vietnamese", "Korean", "Other"
    ];

    function populateCuisineCheckboxes(containerElement, selectedCuisinesString = "") {
        if (!containerElement) return;
        containerElement.innerHTML = '';
        const selectedArray = selectedCuisinesString ? selectedCuisinesString.split(',').map(c => c.trim().toLowerCase()) : [];
        const selectedSet = new Set(selectedArray);

        availableCuisines.forEach(cuisine => {
            const checkboxId = `cuisine-${cuisine.replace(/\s+/g, '-')}-${containerElement.id.replace('Container', '') || 'reg'}`;
            const label = document.createElement('label');
            label.htmlFor = checkboxId;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.name = 'preferredCuisines';
            checkbox.value = cuisine;
            if (selectedSet.has(cuisine.toLowerCase())) {
                checkbox.checked = true;
            }

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${cuisine}`));
            containerElement.appendChild(label);
        });
    }

    if (regPreferredCuisinesContainer) {
        populateCuisineCheckboxes(regPreferredCuisinesContainer);
    }

    function showUserMessage(element, message, isError = false, autoClear = true) {
        let targetElement = element;
        if (!element && dashboardSection.classList.contains('view-active') && dashboardApiMessage) {
            targetElement = dashboardApiMessage;
        }

        if (targetElement) {
            targetElement.textContent = message;
            targetElement.className = isError ? 'message error' : 'message success';
            if (targetElement === dashboardApiMessage) {
                 targetElement.style.backgroundColor = isError ? 'rgba(248, 215, 218, 0.9)' : 'rgba(212, 237, 218, 0.9)';
                 targetElement.style.color = isError ? '#721c24' : '#155724';
                 targetElement.style.padding = '10px';
                 targetElement.style.borderRadius = '5px';
                 targetElement.style.border = `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`;
            }
            targetElement.style.display = 'block';
            if (autoClear) { setTimeout(() => { if (targetElement && targetElement.textContent === message) { clearUserMessage(targetElement); }}, 5000); }
        } else { console.warn("Message element not found for:", message); }
    }
    function clearUserMessage(element) {
        if (element) {
            element.textContent = ''; element.className = 'message'; element.style.display = 'none';
            if (element === dashboardApiMessage) {
                element.style.backgroundColor = 'transparent'; element.style.color = 'white';
                element.style.padding = '0'; element.style.border = 'none';
            }
        }
    }

    function showMainView(viewIdToShow) {
        allMainViews.forEach(view => {
            if (view) {
                if (view.id === viewIdToShow) {
                    view.style.display = 'block'; setTimeout(() => view.classList.add('view-active'), 10);
                } else {
                    view.classList.remove('view-active');
                    const duration = view.id === 'dashboardSection' ? TRANSITION_DURATION_DASHBOARD_SECTION : TRANSITION_DURATION_CARD;
                    setTimeout(() => { if (view && !view.classList.contains('view-active')) view.style.display = 'none'; }, duration + 50);
                }
            }
        });
        if(logoutBtn) logoutBtn.style.display = (viewIdToShow === 'dashboardSection') ? 'inline-block' : 'none';
        document.body.scrollTop = 0; document.documentElement.scrollTop = 0;

        // Admin Panel Card visibility
        if (adminPanelCard) {
            adminPanelCard.style.display = (currentUserData && currentUserData.is_admin && viewIdToShow === 'dashboardSection') ? 'block' : 'none';
        }
    }

    function showDashboardPage(pageIdToShow) {
        if (dashboardOverviewPage) dashboardOverviewPage.style.display = 'none';
        if (dashboardDetailContent) dashboardDetailContent.style.display = 'block';

        allDashboardDetailPages = document.querySelectorAll('#dashboardDetailContent > .dashboard-page'); // Re-query in case admin page was added

        allDashboardDetailPages.forEach(page => {
            if (page) {
                if (page.id === pageIdToShow) {
                    page.style.display = 'block'; setTimeout(() => page.classList.add('active-detail-page'), 10);
                } else {
                    page.classList.remove('active-detail-page');
                    setTimeout(() => { if (page && !page.classList.contains('active-detail-page')) page.style.display = 'none'; }, TRANSITION_DURATION_DETAIL_PAGE + 50);
                }
            }
        });
        const targetPageElement = document.getElementById(pageIdToShow);
        if (targetPageElement) targetPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (pageIdToShow === 'logsPage') fetchAndDisplayWorkoutLogs();
        if (pageIdToShow === 'profilePage') {
            if (editProfileForm) editProfileForm.style.display = 'none';
            if (profileDisplayView) profileDisplayView.style.display = 'block';
            if (editProfileBtn) editProfileBtn.style.display = 'inline-block';
        }
    }

    function showDashboardOverview() {
        if (dashboardDetailContent) {
            allDashboardDetailPages.forEach(page => { if(page) { page.classList.remove('active-detail-page'); page.style.display = 'none'; }});
            dashboardDetailContent.style.display = 'none';
        }
        if (dashboardOverviewPage) {
            dashboardOverviewPage.style.display = 'block';
            dashboardOverviewPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Ensure admin card is visible on overview if user is admin
        if (adminPanelCard) {
             adminPanelCard.style.display = (currentUserData && currentUserData.is_admin) ? 'block' : 'none';
        }
    }

    const routes = {
        'login': 'loginView', 'register': 'registerView', 'auth-choice': 'authChoiceView',
        'dashboard/profile': 'profilePage', 'dashboard/diet': 'dietPage',
        'dashboard/workouts': 'workoutsPage', 'dashboard/pose': 'posePage',
        'dashboard/logs': 'logsPage', 'dashboard': 'dashboardOverviewPage',
        'dashboard/admin': 'adminPage' // Admin route
    };
    const defaultInitialView = 'loginView'; const defaultDashboardRoute = 'dashboard';

    function router() {
        const hash = window.location.hash.substring(1);
        if (currentUserData) {
            showMainView('dashboardSection'); // This also handles admin card visibility
            const targetPageKey = hash || defaultDashboardRoute;
            const targetPageId = routes[targetPageKey];

            // Special check for admin page access
            if (targetPageId === 'adminPage' && (!currentUserData || !currentUserData.is_admin)) {
                showUserMessage(dashboardApiMessage, "Access Denied: Admin privileges required.", true);
                navigateTo(defaultDashboardRoute); // Redirect non-admins
                return;
            }

            if (targetPageId === 'dashboardOverviewPage') showDashboardOverview();
            else if (targetPageId && document.getElementById(targetPageId)) showDashboardPage(targetPageId);
            else showDashboardOverview();
        } else {
            const targetAuthViewId = routes[hash] || defaultInitialView;
            if (document.getElementById(targetAuthViewId)) showMainView(targetAuthViewId);
            else { showMainView(defaultInitialView); if(window.location.hash && hash !== 'login') window.location.hash = 'login'; }
        }
    }
    function navigateTo(routeKey) { window.location.hash = routeKey; }

    async function apiCall(endpoint, method = 'GET', body = null) {
        const options = { method, headers: {}, credentials: 'include' };
        if (method !== 'GET' && method !== 'HEAD') { options.headers['Content-Type'] = 'application/json';}
        if (body && (method === 'POST' || method === 'PUT')) { options.body = JSON.stringify(body);}
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            let responseData = {}; const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) { responseData = await response.json(); }
            else if (response.ok && response.status === 204) { return { message: "Operation successful (No Content)" }; }
            else if (!response.ok && response.status !== 204) {
                 const errorText = await response.text();
                 throw new Error(responseData.message || errorText || `HTTP error ${response.status}`);
            }
            if (!response.ok) {
                const errorMessage = responseData.message || response.statusText || `HTTP error ${response.status}`;
                throw new Error(errorMessage);
            }
            return responseData;
        } catch (error) {
            console.error(`API call to ${endpoint} (${method}) failed:`, error);
            const currentHash = window.location.hash.substring(1);
            let messageElement;
            if (currentHash === 'register' && registerMessage) messageElement = registerMessage;
            else if (currentHash === 'login' && loginMessage) messageElement = loginMessage;
            else if (currentHash === 'auth-choice' && authChoiceMessage) messageElement = authChoiceMessage;
            else if (editProfileForm && editProfileForm.style.display !== 'none' && editProfileMessage) messageElement = editProfileMessage;
            else if (workoutTimerDiv && workoutTimerDiv.style.display !== 'none' && workoutTimerMessage) messageElement = workoutTimerMessage;
            else if (dashboardSection && dashboardSection.classList.contains('view-active') && dashboardApiMessage) messageElement = dashboardApiMessage;
            else messageElement = loginMessage;

            if (messageElement) {
                showUserMessage(messageElement, `API Error: ${error.message}`, true, (messageElement !== dashboardApiMessage && messageElement !== editProfileMessage));
            }
            throw error;
        }
    }

    if(showLoginBtnFromChoice) showLoginBtnFromChoice.addEventListener('click', () => navigateTo('login'));
    if(showRegisterBtnFromChoice) showRegisterBtnFromChoice.addEventListener('click', () => navigateTo('register'));
    if(switchToRegisterBtn) switchToRegisterBtn.addEventListener('click', () => navigateTo('register'));
    if(switchToLoginBtn) switchToLoginBtn.addEventListener('click', () => navigateTo('login'));
    if(backToLoginFromRegister) backToLoginFromRegister.addEventListener('click', () => navigateTo('login'));

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); clearUserMessage(loginMessage);
            const username = loginForm.loginUsername.value; const password = loginForm.loginPassword.value;
            if (!username || !password) { showUserMessage(loginMessage, 'Username and password are required.', true); return; }
            try {
                const data = await apiCall('/login', 'POST', { username, password });
                currentUserData = data.user; // data.user is { id, username, is_admin }
                localStorage.setItem('aiGymTrainerUser', JSON.stringify(currentUserData));

                if (currentUserData && currentUserData.is_admin) {
                    console.log("Admin user logged in:", currentUserData.username);
                    showUserMessage(dashboardApiMessage || loginMessage, "Admin login successful. Welcome, Mokshitha!", false, true);
                     if(adminPanelCard) adminPanelCard.style.display = 'block'; // Show admin card on overview
                } else if (currentUserData) {
                    console.log("Regular user logged in:", currentUserData.username);
                     if(adminPanelCard) adminPanelCard.style.display = 'none'; // Hide admin card
                }

                await fetchDashboardData(); // Fetches full profile including is_admin from backend
                navigateTo(defaultDashboardRoute);
            } catch (error) { /* error displayed by apiCall */ }
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); clearUserMessage(registerMessage);
            const selectedCuisines = [];
            if (regPreferredCuisinesContainer) {
                regPreferredCuisinesContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                    selectedCuisines.push(checkbox.value);
                });
            }
            const userData = {
                username: registerForm.regUsername.value, password: registerForm.regPassword.value,
                gender: registerForm.regGender.value, age: registerForm.regAge.value,
                height: registerForm.regHeight.value, weight: registerForm.regWeight.value,
                diet_preference: registerForm.regDietPreference.value,
                preferred_cuisines: selectedCuisines.join(','),
                activity_level: registerForm.regActivityLevel.value, goals: registerForm.regGoals.value,
            };
            for (const key in userData) {
                if (key === 'preferred_cuisines') continue;
                if (!userData[key] && key !== 'password') {
                    showUserMessage(registerMessage, `Please fill in the "${key.replace('reg', '').replace(/([A-Z])/g, ' $1').toLowerCase()}" field.`, true); return;
                }
            }
            if(userData.password.length < 6) {
                 showUserMessage(registerMessage, `Password must be at least 6 characters.`, true); return;
            }
            try {
                const data = await apiCall('/register', 'POST', userData);
                showUserMessage(loginMessage, data.message + " Please login.", false);
                registerForm.reset();
                populateCuisineCheckboxes(regPreferredCuisinesContainer);
                navigateTo('login');
            } catch (error) { /* error displayed by apiCall */ }
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try { await apiCall('/logout', 'POST');} catch (error) { console.error("Logout API call failed:", error); }
            finally {
                currentUserData = null; localStorage.removeItem('aiGymTrainerUser');
                currentRawProfileData = null; currentWeeklyDietPlan = null; todos = [];
                if(adminPanelCard) adminPanelCard.style.display = 'none'; // Hide admin card on logout
                navigateTo('login');
                showUserMessage(loginMessage, 'Logged out successfully.', false);
            }
        });
    }

    // Re-initialize dashboardNavItems after potential admin card addition
    function initializeDashboardNavItems() {
        document.querySelectorAll('.dashboard-nav-item').forEach(item => {
            // Remove any existing listeners to prevent duplicates if this is called multiple times
            item.replaceWith(item.cloneNode(true)); // Simple way to remove listeners
        });
        // Add new listeners
        document.querySelectorAll('.dashboard-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const targetPageId = item.dataset.targetPage;
                if (targetPageId) {
                    if (targetPageId === 'adminPage' && (!currentUserData || !currentUserData.is_admin)) {
                        showUserMessage(dashboardApiMessage, "Access Denied.", true);
                        return; // Don't navigate
                    }
                    navigateTo(`dashboard/${targetPageId.replace('Page', '').toLowerCase()}`);
                }
            });
        });
    }


    if (backToDashboardOverviewBtn) { backToDashboardOverviewBtn.addEventListener('click', () => navigateTo(defaultDashboardRoute));}
    if(headerTitle) { headerTitle.addEventListener('click', () => { if (currentUserData) navigateTo(defaultDashboardRoute); else navigateTo('login'); });}

    async function fetchDashboardData() {
        if (!currentUserData || !currentUserData.id) { // Check for ID as well
            navigateTo('login'); return;
        }
        try {
            const userProfile = await apiCall('/user_profile');
            currentRawProfileData = userProfile;

            // Preserve client-side knowledge of admin status if backend doesn't explicitly send it in /user_profile
            // But prefer backend's is_admin if available
            const isAdmin = userProfile.is_admin !== undefined ? userProfile.is_admin : (currentUserData.is_admin || false);
            currentUserData = { ...userProfile, id: currentUserData.id, username: userProfile.username, is_admin: isAdmin };
            localStorage.setItem('aiGymTrainerUser', JSON.stringify(currentUserData));

            updateProfileDisplay(userProfile);

            const [weeklyDiet, workoutData, todosData] = await Promise.all([
                apiCall('/weekly_diet_plan'),
                apiCall('/workout_recommendations'),
                apiCall('/todos')
            ]);

            currentWeeklyDietPlan = weeklyDiet.weekly_diet_plan; displayWeeklyDietPlan(0); setupDayTabsForDietPlan();
            displayWorkouts(workoutData.workouts);
            todos = todosData || []; renderTodos();
            if (window.location.hash === '#dashboard/logs') fetchAndDisplayWorkoutLogs();

            // Update admin card visibility after fetching data
            if (adminPanelCard) {
                adminPanelCard.style.display = (currentUserData && currentUserData.is_admin) ? 'block' : 'none';
            }
            initializeDashboardNavItems(); // Re-attach nav item listeners

        } catch (error) {
            console.error("Critical error fetching dashboard data:", error);
            if (String(error.message).toLowerCase().includes("unauthorized") || String(error.message).includes("401")) {
                showUserMessage(loginMessage, "Your session may have expired. Please login again.", true);
                currentUserData = null; localStorage.removeItem('aiGymTrainerUser'); navigateTo('login');
            }
            else { showUserMessage(dashboardApiMessage || loginMessage, `Error loading dashboard: ${error.message}`, true, false); }
        }
    }
    function updateProfileDisplay(profile) {
        if (!profile || Object.keys(profile).length === 0) { console.warn("UpdateProfileDisplay: Profile data is empty/null."); return; }
        currentRawProfileData = profile;

        if(usernameDisplay) usernameDisplay.textContent = profile.username || 'User';
        if(profileUsername) profileUsername.textContent = profile.username || '-';
        if(profileAge) profileAge.textContent = profile.age || '-';
        if(profileGender) profileGender.textContent = profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '-';
        if(profileHeight) profileHeight.textContent = profile.height_cm ? `${profile.height_cm}` : '-';
        if(profileWeight) profileWeight.textContent = profile.weight_kg ? `${profile.weight_kg}` : '-';
        if(profileDietPref) profileDietPref.textContent = profile.diet_preference ? profile.diet_preference.charAt(0).toUpperCase() + profile.diet_preference.slice(1) : '-';
        if(profileActivityLevel) profileActivityLevel.textContent = profile.activity_level ? profile.activity_level.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '-';
        if(profileGoals) profileGoals.textContent = profile.goals ? profile.goals.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '-';
        if(profileCuisines) profileCuisines.textContent = profile.preferred_cuisines || 'Not set';

        if(profileBmiValue) profileBmiValue.textContent = profile.bmi !== undefined && profile.bmi !== null ? profile.bmi.toFixed(1) : '-';
        if(profileBmiCategory) profileBmiCategory.textContent = profile.bmi_category || '-';
        if(profileBmr) profileBmr.textContent = profile.bmr ? `${Math.round(profile.bmr)}` : '-';
        if(profileTdee) profileTdee.textContent = profile.tdee ? `${Math.round(profile.tdee)}` : '-';
        if(profileTargetCalories) profileTargetCalories.textContent = profile.target_daily_calories ? `${Math.round(profile.target_daily_calories)}` : '-';

        const bmiValueCard = document.getElementById('bmiValue');
        const bmiCategoryCard = document.getElementById('bmiCategory');
        const targetCaloriesDisplayCard = document.getElementById('targetCaloriesDisplay');
        if(bmiValueCard) bmiValueCard.textContent = profile.bmi !== undefined && profile.bmi !== null ? profile.bmi.toFixed(1) : '-';
        if(bmiCategoryCard) bmiCategoryCard.textContent = profile.bmi_category || '-';
        if(targetCaloriesDisplayCard) targetCaloriesDisplayCard.textContent = profile.target_daily_calories ? `${Math.round(profile.target_daily_calories)}` : '-';
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            if (!currentRawProfileData) { showUserMessage(editProfileMessage, "Profile data not loaded.", true); return; }
            if (profileUsernameDisplay) profileUsernameDisplay.textContent = currentRawProfileData.username;
            if (editProfileAgeInput) editProfileAgeInput.value = currentRawProfileData.age || '';
            if (editProfileGenderSelect) editProfileGenderSelect.value = currentRawProfileData.gender || 'male';
            if (editProfileHeightInput) editProfileHeightInput.value = currentRawProfileData.height_cm || '';
            if (editProfileWeightInput) editProfileWeightInput.value = currentRawProfileData.weight_kg || '';
            if (editProfileDietPrefSelect) editProfileDietPrefSelect.value = currentRawProfileData.diet_preference || 'any';
            if (editProfileActivityLevelSelect) editProfileActivityLevelSelect.value = currentRawProfileData.activity_level || 'sedentary';
            if (editProfileGoalsSelect) editProfileGoalsSelect.value = currentRawProfileData.goals || 'maintenance';
            populateCuisineCheckboxes(editProfileCuisinesContainer, currentRawProfileData.preferred_cuisines || "");
            if (profileDisplayView) profileDisplayView.style.display = 'none';
            if (editProfileForm) editProfileForm.style.display = 'block';
            editProfileBtn.style.display = 'none';
            clearUserMessage(editProfileMessage);
        });
    }
    if (cancelProfileEditBtn) {
        cancelProfileEditBtn.addEventListener('click', () => {
            if (profileDisplayView) profileDisplayView.style.display = 'block';
            if (editProfileForm) editProfileForm.style.display = 'none';
            if (editProfileBtn) editProfileBtn.style.display = 'inline-block';
            clearUserMessage(editProfileMessage);
        });
    }
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault(); clearUserMessage(editProfileMessage);
            const selectedCuisines = [];
            if (editProfileCuisinesContainer) {
                editProfileCuisinesContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                    selectedCuisines.push(checkbox.value);
                });
            }
            const updatedData = {
                age: parseInt(editProfileAgeInput.value), gender: editProfileGenderSelect.value,
                height: parseFloat(editProfileHeightInput.value), weight: parseFloat(editProfileWeightInput.value),
                diet_preference: editProfileDietPrefSelect.value, activity_level: editProfileActivityLevelSelect.value,
                goals: editProfileGoalsSelect.value, preferred_cuisines: selectedCuisines.join(','),
            };
            // Basic Frontend Validation
            if (isNaN(updatedData.age) || updatedData.age < 12 || updatedData.age > 120) { showUserMessage(editProfileMessage, "Valid age (12-120) is required.", true); return; }
            if (isNaN(updatedData.height) || updatedData.height < 50 || updatedData.height > 300) { showUserMessage(editProfileMessage, "Valid height (50-300cm) is required.", true); return; }
            if (isNaN(updatedData.weight) || updatedData.weight < 20 || updatedData.weight > 500) { showUserMessage(editProfileMessage, "Valid weight (20-500kg) is required.", true); return; }

            try {
                if(saveProfileChangesBtn) { saveProfileChangesBtn.textContent = 'Saving...'; saveProfileChangesBtn.disabled = true; }
                const response = await apiCall('/user_profile', 'PUT', updatedData);

                currentRawProfileData = response.user_profile;
                const isAdminStatus = currentUserData.is_admin; // Preserve admin status
                currentUserData = { ...response.user_profile, is_admin: isAdminStatus };
                localStorage.setItem('aiGymTrainerUser', JSON.stringify(currentUserData));

                updateProfileDisplay(response.user_profile);
                showUserMessage(editProfileMessage, response.message || "Profile updated successfully!", false);
                if (profileDisplayView) profileDisplayView.style.display = 'block';
                if (editProfileForm) editProfileForm.style.display = 'none';
                if (editProfileBtn) editProfileBtn.style.display = 'inline-block';
            } catch (error) { /* apiCall handles message */ }
            finally { if(saveProfileChangesBtn) { saveProfileChangesBtn.textContent = 'Save Changes'; saveProfileChangesBtn.disabled = false; }}
        });
    }

    function setupDayTabsForDietPlan() { /* ... (same as before) ... */ if (!weeklyDietPlanTabsContainer || !currentWeeklyDietPlan || currentWeeklyDietPlan.length === 0) return; weeklyDietPlanTabsContainer.innerHTML = ''; currentWeeklyDietPlan.forEach((dayData, index) => { const dayButton = document.createElement('button'); dayButton.textContent = `Day ${dayData.day}`; dayButton.classList.add('day-tab'); if (index === 0) dayButton.classList.add('active'); dayButton.addEventListener('click', () => { displayWeeklyDietPlan(index); weeklyDietPlanTabsContainer.querySelectorAll('.day-tab').forEach(btn => btn.classList.remove('active')); dayButton.classList.add('active'); }); weeklyDietPlanTabsContainer.appendChild(dayButton);});}
    function displayWeeklyDietPlan(dayIndexToShow) { /* ... (same as before, ensure meal types include 'snacks' if your data has it) ... */ if (!dietChartContainer || !currentWeeklyDietPlan || !currentWeeklyDietPlan[dayIndexToShow]) { if(dietChartContainer) dietChartContainer.innerHTML = '<p>No diet plan data for this day.</p>'; return;} dietChartContainer.innerHTML = ''; const dayData = currentWeeklyDietPlan[dayIndexToShow]; const { meals, total_calories_for_day } = dayData.daily_summary; if (!meals || Object.keys(meals).length === 0) { dietChartContainer.innerHTML = `<p>No meal details for Day ${dayData.day}.</p>`; return; } let html = `<h4 style="text-align:center; margin-bottom: 15px;">Day ${dayData.day}: Approx. ${total_calories_for_day ? Math.round(total_calories_for_day) : 0} kcal</h4>`; const mealOrder = ['breakfast', 'lunch', 'dinner', 'snacks']; mealOrder.forEach(mealType => { if (meals[mealType]) { const optionsList = meals[mealType]; html += `<div class="meal-type-section"><h5>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h5>`; if (optionsList && optionsList.length > 0 && !(optionsList.length === 1 && String(optionsList[0].name).startsWith("N/A"))) { html += '<ul>'; optionsList.forEach((meal, index) => { html += `<li><strong>${optionsList.length > 1 ? `Option ${index + 1}: ` : ''}${meal.name || 'N/A'}</strong> (${meal.calories ? Math.round(meal.calories) : 0} kcal) <br><small>Cuisine: ${meal.cuisine || 'N/A'} | P: ${meal.protein ? Math.round(meal.protein) : 0}g, C: ${meal.carbs ? Math.round(meal.carbs) : 0}g, F: ${meal.fat ? Math.round(meal.fat) : 0}g</small></li>`; }); html += '</ul>'; } else { html += '<p>No specific options found for this meal.</p>';} html += `</div>`; }}); dietChartContainer.innerHTML = html;}
    if (regenerateWeeklyDietBtn) { /* ... (same as before) ... */ regenerateWeeklyDietBtn.addEventListener('click', async () => { regenerateWeeklyDietBtn.textContent = 'Generating...'; regenerateWeeklyDietBtn.disabled = true; if (dietChartContainer) dietChartContainer.innerHTML = '<p>Generating new diet plan...</p>'; if (weeklyDietPlanTabsContainer) weeklyDietPlanTabsContainer.innerHTML = ''; try { const newWeeklyDiet = await apiCall('/weekly_diet_plan'); currentWeeklyDietPlan = newWeeklyDiet.weekly_diet_plan; displayWeeklyDietPlan(0); setupDayTabsForDietPlan(); } catch (error) { if (dietChartContainer) dietChartContainer.innerHTML = `<p class="message error">Could not regenerate diet plan: ${error.message}</p>`; } finally { regenerateWeeklyDietBtn.textContent = 'Regenerate Full Week Plan'; regenerateWeeklyDietBtn.disabled = false; }});}

    function displayWorkouts(workouts) { /* ... (same as before, ensure commonExercises list is good) ... */ if (!workoutListContainer || !exerciseSelectForPose) return; workoutListContainer.innerHTML = ''; exerciseSelectForPose.innerHTML = '<option value="">-- Select Exercise for Pose Check --</option>'; if (workouts && workouts.length > 0) { let html = '<ul>'; workouts.forEach(workout => { html += `<li><strong>${workout.name}</strong> (${workout.type || 'N/A'}) <br><small>Target: ${workout.target || 'N/A'} | Suggestion: ${workout.duration_suggestion || 'N/A'}</small><button class="start-workout-btn" data-duration-suggestion="${workout.duration_suggestion || '15 min'}" data-name="${workout.name}">Start Timer</button></li>`; const commonExercises = ['squat', 'push-up', 'lunge', 'plank', 'bicep curl', 'overhead press', 'burpee', 'jumping jack', 'row', 'crunch', 'leg raise']; if (commonExercises.some(ex => workout.name.toLowerCase().includes(ex))) { const option = document.createElement('option'); option.value = workout.name.toLowerCase(); option.textContent = workout.name; exerciseSelectForPose.appendChild(option);}}); html += '</ul>'; workoutListContainer.innerHTML = html; document.querySelectorAll('#workoutListContainer .start-workout-btn').forEach(button => { button.addEventListener('click', (e) => { currentWorkoutDurationSuggestion = e.target.dataset.durationSuggestion; currentWorkoutNameForTimer = e.target.dataset.name; currentTimerSessionDetails = { name: currentWorkoutNameForTimer, startTime: Date.now(), durationSeconds: 0}; if(currentWorkoutNameTimerElement) currentWorkoutNameTimerElement.textContent = currentWorkoutNameForTimer; const match = currentWorkoutDurationSuggestion.match(/(\d+)\s*min/); const durationMinutes = match ? parseInt(match[1]) : 15; resetTimer(durationMinutes * 60); if (workoutTimerDiv) workoutTimerDiv.style.display = 'block'; if (logThisWorkoutBtn) logThisWorkoutBtn.style.display = 'none'; clearUserMessage(workoutTimerMessage); });});} else { workoutListContainer.innerHTML = '<li>No specific workout recommendations found. Please check back later or ensure your profile goals are set.</li>';} if(startPoseBtn) startPoseBtn.disabled = (exerciseSelectForPose.options.length <= 1);}
    function formatTime(totalSeconds) { /* ... (same) ... */ const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60; return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; }
    function updateTimerDisplay() { /* ... (same) ... */ if(timerDisplay) timerDisplay.textContent = formatTime(timerSeconds); }
    if(startTimerBtn) startTimerBtn.addEventListener('click', () => { /* ... (same) ... */ if (!timerRunning) { timerRunning = true; startTimerBtn.style.display = 'none'; if(pauseTimerBtn) pauseTimerBtn.style.display = 'inline-block'; timerInterval = setInterval(() => { timerSeconds++; if(currentTimerSessionDetails) currentTimerSessionDetails.durationSeconds = timerSeconds; updateTimerDisplay(); }, 1000); clearUserMessage(workoutTimerMessage);}});
    if(pauseTimerBtn) pauseTimerBtn.addEventListener('click', () => { /* ... (same) ... */ if (timerRunning) { timerRunning = false; clearInterval(timerInterval); if(startTimerBtn) { startTimerBtn.style.display = 'inline-block'; startTimerBtn.textContent = 'Resume';} if(pauseTimerBtn) pauseTimerBtn.style.display = 'none';}});
    function resetTimer(initialSeconds = 0) { /* ... (same) ... */ timerRunning = false; clearInterval(timerInterval); timerSeconds = initialSeconds; updateTimerDisplay(); if(startTimerBtn) { startTimerBtn.style.display = 'inline-block'; startTimerBtn.textContent = 'Start';} if(pauseTimerBtn) pauseTimerBtn.style.display = 'none'; if (logThisWorkoutBtn) { if (initialSeconds > 0 || (currentTimerSessionDetails && currentTimerSessionDetails.durationSeconds > 0)) { logThisWorkoutBtn.style.display = 'inline-block'; } else { logThisWorkoutBtn.style.display = 'none'; }} clearUserMessage(workoutTimerMessage);}
    if(resetTimerBtn) resetTimerBtn.addEventListener('click', () => { /* ... (same) ... */ const match = currentWorkoutDurationSuggestion.match(/(\d+)\s*min/); const durationMinutes = match ? parseInt(match[1]) : 0; currentTimerSessionDetails = { name: currentWorkoutNameForTimer, startTime: Date.now(), durationSeconds: 0 }; resetTimer(durationMinutes * 60); if(logThisWorkoutBtn) logThisWorkoutBtn.style.display = 'none';});

    function onPoseResults(results) { /* ... (same, check Pose.POSE_LANDMARKS) ... */ if(!poseCanvasCtx || !poseCanvas) return; poseCanvasCtx.save(); poseCanvasCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height); if (results.poseLandmarks) { if (window.drawConnectors && window.POSE_CONNECTIONS && window.drawLandmarks) { drawConnectors(poseCanvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 2}); drawLandmarks(poseCanvasCtx, results.poseLandmarks, {color: '#FF0000', lineWidth: 1, radius: 3});} analyzePose(results.poseLandmarks);} poseCanvasCtx.restore();}
    function analyzePose(landmarks) { /* ... (same, ensure comprehensive logic for selected exercises) ... */ if(!poseFeedback || !exerciseSelectForPose) return; const selectedExercise = exerciseSelectForPose.value; let feedbackMsg = "Position yourself for feedback."; let correctPosture = false; if (typeof Pose === 'undefined' || !Pose.POSE_LANDMARKS) { if (poseFeedback) poseFeedback.textContent = "Pose landmarks not loaded."; return; } if (selectedExercise.includes('squat')) { const hip = landmarks[Pose.POSE_LANDMARKS.LEFT_HIP]; const knee = landmarks[Pose.POSE_LANDMARKS.LEFT_KNEE]; const ankle = landmarks[Pose.POSE_LANDMARKS.LEFT_ANKLE]; if (hip && knee && ankle && hip.visibility > 0.5 && knee.visibility > 0.5 && ankle.visibility > 0.5) { const hipKneeAngle = Math.abs(Math.atan2(ankle.y - knee.y, ankle.x - knee.x) - Math.atan2(hip.y - knee.y, hip.x - knee.x)) * (180 / Math.PI); if (hip.y > knee.y - 0.05 * (poseCanvas?poseCanvas.height:480) && knee.y > ankle.y - 0.1 * (poseCanvas?poseCanvas.height:480) ) { feedbackMsg = "Good squat depth!"; correctPosture = true; } else if (hip.y <= knee.y) { feedbackMsg = "Go deeper with your hips."; } else { feedbackMsg = "Keep chest up, back straight."; } } else { feedbackMsg = "Squat landmarks not clear. Ensure side view."; }} else if (selectedExercise.includes('plank')) { const shoulderL = landmarks[Pose.POSE_LANDMARKS.LEFT_SHOULDER]; const hipL = landmarks[Pose.POSE_LANDMARKS.LEFT_HIP]; const ankleL = landmarks[Pose.POSE_LANDMARKS.LEFT_ANKLE]; if (shoulderL && hipL && ankleL && shoulderL.visibility > 0.5 && hipL.visibility > 0.5 && ankleL.visibility > 0.5) { const yThreshold = 0.08 * (poseCanvas?poseCanvas.height:480); if (Math.abs(shoulderL.y - hipL.y) < yThreshold && Math.abs(hipL.y - ankleL.y) < yThreshold) { feedbackMsg = "Good plank form! Core tight."; correctPosture = true; } else if (hipL.y < Math.min(shoulderL.y, ankleL.y) - yThreshold * 0.7) { feedbackMsg = "Hips too high! Lower them."; } else if (hipL.y > Math.max(shoulderL.y, ankleL.y) + yThreshold * 0.7) { feedbackMsg = "Hips sagging! Lift them."; } else { feedbackMsg = "Straighten your back."; }} else { feedbackMsg = "Plank landmarks not clear. Side view needed."; }} else if (selectedExercise.includes('bicep curl')) { const shoulder = landmarks[Pose.POSE_LANDMARKS.LEFT_SHOULDER]; const elbow = landmarks[Pose.POSE_LANDMARKS.LEFT_ELBOW]; const wrist = landmarks[Pose.POSE_LANDMARKS.LEFT_WRIST]; if(shoulder && elbow && wrist && elbow.visibility > 0.6 && wrist.visibility > 0.6 && shoulder.visibility > 0.5){ const angle = Math.abs(Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) - Math.atan2(shoulder.y - elbow.y, shoulder.x - elbow.x)) * (180 / Math.PI); if(angle < 45) { feedbackMsg = "Full curl! Good contraction."; correctPosture = true; } else if (angle > 160 && angle < 190) { feedbackMsg = "Arm extended. Ready to curl.";} else if (angle >= 45 && angle <=160){ feedbackMsg = "Curling... good range of motion.";} else {feedbackMsg="Keep elbow stable.";} } else { feedbackMsg = "Bicep curl landmarks not clear.";}} else if (selectedExercise) { feedbackMsg = `Pose analysis for ${selectedExercise} not implemented yet.`;} if (poseFeedback) { poseFeedback.textContent = feedbackMsg; poseFeedback.className = correctPosture ? 'message success' : 'message error'; if(poseFeedback.style.display !== 'block') poseFeedback.style.display = 'block';}}
    if(startPoseBtn) startPoseBtn.addEventListener('click', () => { /* ... (same, ensure Camera and Pose objects are newed up) ... */ if (!poseDetectionActive) { if (!exerciseSelectForPose || !exerciseSelectForPose.value) { alert("Please select an exercise first!"); return; } if (typeof Pose === 'undefined' || typeof Camera === 'undefined' || !webcamFeed || !poseCanvas) { alert("MediaPipe components not fully loaded or HTML elements missing."); return; } poseDetectionActive = true; startPoseBtn.textContent = 'Stop Pose Detection'; webcamFeed.style.display = 'block'; poseCanvas.style.display = 'block'; webcamFeed.onloadedmetadata = () => { if(poseCanvas) { poseCanvas.width = webcamFeed.videoWidth; poseCanvas.height = webcamFeed.videoHeight; }}; currentPoseInstance = new Pose({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`}); currentPoseInstance.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 }); currentPoseInstance.onResults(onPoseResults); camera = new Camera(webcamFeed, { onFrame: async () => { if (webcamFeed.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && currentPoseInstance) { try { await currentPoseInstance.send({image: webcamFeed}); } catch(err){console.error("Error sending frame to MediaPipe", err);}}}, width: 640, height: 480 }); camera.start().then(() => { if(poseFeedback) { poseFeedback.textContent = "Pose detection started. Position yourself."; poseFeedback.className = 'message';} }).catch(err => { console.error("Error starting camera:", err); if(poseFeedback) {poseFeedback.textContent = "Error starting camera. Check permissions."; poseFeedback.className = 'message error';} stopPoseDetectionInternal(); }); } else { stopPoseDetectionInternal(); }});
    function stopPoseDetectionInternal() { /* ... (same) ... */ poseDetectionActive = false; if(startPoseBtn) startPoseBtn.textContent = 'Start Pose Detection'; if (camera) { camera.stop(); camera = null; } if (currentPoseInstance) { currentPoseInstance.close(); currentPoseInstance = null; } if (webcamFeed) { webcamFeed.style.display = 'none'; if (webcamFeed.srcObject) { webcamFeed.srcObject.getTracks().forEach(track => track.stop()); webcamFeed.srcObject = null; }} if (poseCanvas) poseCanvas.style.display = 'none'; if (poseFeedback) { poseFeedback.textContent = "Pose detection stopped."; poseFeedback.className = 'message';}}

    async function renderTodos() { /* ... (same) ... */ if (!todoListUl) return; todoListUl.innerHTML = ''; if (todos.length === 0) { todoListUl.innerHTML = '<li>No tasks yet. Add one!</li>'; return; } todos.forEach((todo) => { const li = document.createElement('li'); const taskSpan = document.createElement('span'); taskSpan.textContent = todo.task; taskSpan.className = 'task-text'; if (todo.completed) li.classList.add('completed'); const actionsDiv = document.createElement('div'); actionsDiv.className = 'todo-actions'; const completeBtn = document.createElement('button'); completeBtn.textContent = todo.completed ? 'Undo' : 'Done'; completeBtn.classList.add('complete-btn'); completeBtn.addEventListener('click', () => toggleTodoItem(todo.id)); const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.classList.add('delete-btn'); deleteBtn.addEventListener('click', () => deleteTodoItem(todo.id)); actionsDiv.appendChild(completeBtn); actionsDiv.appendChild(deleteBtn); li.appendChild(taskSpan); li.appendChild(actionsDiv); todoListUl.appendChild(li); });}
    if (todoForm) { todoForm.addEventListener('submit', async (e) => { /* ... (same) ... */ e.preventDefault(); if (!todoInput) return; const taskText = todoInput.value.trim(); if (taskText && currentUserData) { try { const newTodo = await apiCall('/todos', 'POST', { task: taskText }); todos.push(newTodo); todoInput.value = ''; renderTodos(); } catch (error) { /* Handled */}} else if (!taskText) { alert("Task cannot be empty."); }});}
    async function toggleTodoItem(todoId) { /* ... (same) ... */ const todo = todos.find(t => t.id === todoId); if (todo && currentUserData) { try { const updatedTodo = await apiCall(`/todos/${todoId}`, 'PUT', { completed: !todo.completed, task: todo.task }); const todoIndex = todos.findIndex(t => t.id === todoId); if (todoIndex > -1) todos[todoIndex] = updatedTodo; renderTodos(); } catch (error) { /* Handled */ }}}
    async function deleteTodoItem(todoId) { /* ... (same) ... */ if (confirm("Are you sure you want to delete this task?") && currentUserData) { try { await apiCall(`/todos/${todoId}`, 'DELETE'); todos = todos.filter(t => t.id !== todoId); renderTodos(); } catch (error) { /* Handled */ }}}

    if (logThisWorkoutBtn) { /* ... (same, ensure workoutTimerMessage is used) ... */ logThisWorkoutBtn.addEventListener('click', async () => { if (!currentUserData) { showUserMessage(workoutTimerMessage, "Please login to log workouts.", true); navigateTo('login'); return; } const workoutNameToLog = currentTimerSessionDetails ? currentTimerSessionDetails.name : ""; const elapsedSeconds = currentTimerSessionDetails ? currentTimerSessionDetails.durationSeconds : 0; if (!workoutNameToLog || elapsedSeconds <= 5) { showUserMessage(workoutTimerMessage, "Workout too short or no name. Not logged.", true); return; } const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60)); let estimatedCaloriesBurned = durationMinutes * 7; const logData = { exercise_name: workoutNameToLog, duration_minutes: durationMinutes, calories_burned: estimatedCaloriesBurned, feedback: "" }; try { logThisWorkoutBtn.textContent = "Logging..."; logThisWorkoutBtn.disabled = true; const response = await apiCall('/workout_logs', 'POST', logData); showUserMessage(workoutTimerMessage, response.message || "Workout logged!", false); resetTimer(0); if (workoutTimerDiv) workoutTimerDiv.style.display = 'none'; currentTimerSessionDetails = { name: null, startTime: null, durationSeconds: 0 }; currentWorkoutNameForTimer = ""; if (window.location.hash.includes('logs')) fetchAndDisplayWorkoutLogs(); } catch (error) { showUserMessage(workoutTimerMessage, `Log failed: ${error.message}`, true, false); } finally { if(logThisWorkoutBtn) { logThisWorkoutBtn.textContent = "Log This Workout"; logThisWorkoutBtn.disabled = false; logThisWorkoutBtn.style.display = 'none'; } }});}
    async function fetchAndDisplayWorkoutLogs() { /* ... (same, ensure date parsing is correct) ... */ if (!logsList || !currentUserData) { if(logsList) logsList.innerHTML = '<li>Please login to view workout logs.</li>'; return; } logsList.innerHTML = '<li><p>Loading your workout logs...</p></li>'; try { const fetchedLogs = await apiCall('/workout_logs'); logsList.innerHTML = ''; if (!fetchedLogs || fetchedLogs.length === 0) { logsList.innerHTML = '<li>You have no workout logs recorded yet.</li>'; return; } fetchedLogs.forEach(log => { const li = document.createElement('li'); const logDate = new Date(log.log_date + 'T00:00:00Z'); const formattedDate = logDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); li.innerHTML = `<strong>${log.exercise_name || 'Workout'}</strong> - ${formattedDate}<br> <small>Duration: ${log.duration_minutes !== null ? log.duration_minutes : '-'} min | Calories: ${log.calories_burned !== null ? Math.round(log.calories_burned) : '-'} kcal${log.feedback ? `<br><em>Feedback: ${log.feedback}</em>` : ''}</small>`; logsList.appendChild(li); }); } catch (error) { console.error("Failed to fetch workout logs:", error); if (logsList) logsList.innerHTML = '<li><p class="message error">Error loading workout logs. Please try again.</p></li>';}}

    async function initializeApp() {
        if(currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        const storedUserString = localStorage.getItem('aiGymTrainerUser');
        let initialRoute = defaultInitialView;
        if (storedUserString) {
            try {
                const storedUserData = JSON.parse(storedUserString);
                // Set a temporary currentUserData to allow /user_profile call
                currentUserData = storedUserData;

                const profileData = await apiCall('/user_profile');

                // Combine stored admin status with fresh profile data from backend
                // The backend's /user_profile now returns is_admin flag.
                currentUserData = {
                    ...profileData, // This contains the full fresh profile from backend
                    id: storedUserData.id, // Ensure ID from storage is kept if not in profileData
                    username: profileData.username || storedUserData.username, // Prefer backend username
                    is_admin: profileData.is_admin !== undefined ? profileData.is_admin : (storedUserData.is_admin || false)
                };
                localStorage.setItem('aiGymTrainerUser', JSON.stringify(currentUserData));

                if (currentUserData.is_admin) {
                    console.log("Admin session restored:", currentUserData.username);
                    if(adminPanelCard) adminPanelCard.style.display = 'block';
                } else {
                     if(adminPanelCard) adminPanelCard.style.display = 'none';
                }
                initializeDashboardNavItems(); // Initialize nav after admin status is known

                await fetchDashboardData();
                initialRoute = window.location.hash.substring(1) || defaultDashboardRoute;

            } catch (error) {
                console.warn("Session validation/initial data fetch error:", error.message);
                currentUserData = null; localStorage.removeItem('aiGymTrainerUser');
                currentRawProfileData = null;
                if(adminPanelCard) adminPanelCard.style.display = 'none';
                initialRoute = defaultInitialView;
                if (!window.location.hash.includes('login') && !window.location.hash.includes('register')) {
                    navigateTo('login');
                }
            }
        } else {
            if(adminPanelCard) adminPanelCard.style.display = 'none'; // Ensure hidden if no stored user
        }

        // Final navigation decision
        if (!window.location.hash || window.location.hash === "#" ||
            (initialRoute === defaultInitialView && !currentUserData && window.location.hash.includes('dashboard'))) {
             navigateTo(initialRoute);
        } else {
            router();
        }
    }
    window.addEventListener('hashchange', router);
    initializeApp();

});
