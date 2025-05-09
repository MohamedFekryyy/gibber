// Auth UI and Logic for Gibber-as-a-Service
// This file creates a login/signup modal and handles authentication with Supabase

// DOM Elements for Authentication UI
let authModal;
let authOverlay;
let loginForm;
let signupForm;
let authTab;
let currentUser = null;
let isAuthReady = false;

// Initialize authentication UI and logic
function initAuth() {
  if (!window.GibberSaaS) {
    console.error('GibberSaaS utilities not found. Make sure to load supabase.js first.');
    return;
  }

  // Create auth UI elements
  createAuthUI();
  
  // Initialize Supabase client
  window.GibberSaaS.initSupabase();
  
  // Check if user is already logged in
  window.GibberSaaS.getCurrentUser()
    .then(user => {
      currentUser = user;
      updateAuthState();
      isAuthReady = true;
    })
    .catch(error => {
      console.error('Error checking authentication state:', error);
      isAuthReady = true;
    });
}

// Create authentication UI elements
function createAuthUI() {
  // Create modal overlay
  authOverlay = document.createElement('div');
  authOverlay.id = 'gibber-auth-overlay';
  authOverlay.style.display = 'none';
  authOverlay.style.position = 'fixed';
  authOverlay.style.top = '0';
  authOverlay.style.left = '0';
  authOverlay.style.width = '100%';
  authOverlay.style.height = '100%';
  authOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  authOverlay.style.zIndex = '1000';
  authOverlay.style.justifyContent = 'center';
  authOverlay.style.alignItems = 'center';
  
  // Create auth modal
  authModal = document.createElement('div');
  authModal.id = 'gibber-auth-modal';
  authModal.style.backgroundColor = 'var(--b-high, #333)';
  authModal.style.color = 'var(--f-high, #fff)';
  authModal.style.padding = '20px';
  authModal.style.borderRadius = '4px';
  authModal.style.width = '320px';
  authModal.style.maxWidth = '90%';
  authModal.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
  
  // Create tabs
  authTab = document.createElement('div');
  authTab.style.display = 'flex';
  authTab.style.marginBottom = '20px';
  
  const loginTab = document.createElement('div');
  loginTab.textContent = 'Login';
  loginTab.style.padding = '10px';
  loginTab.style.cursor = 'pointer';
  loginTab.style.flex = '1';
  loginTab.style.textAlign = 'center';
  loginTab.style.borderBottom = '2px solid var(--f-high, #fff)';
  loginTab.dataset.tab = 'login';
  
  const signupTab = document.createElement('div');
  signupTab.textContent = 'Sign Up';
  signupTab.style.padding = '10px';
  signupTab.style.cursor = 'pointer';
  signupTab.style.flex = '1';
  signupTab.style.textAlign = 'center';
  signupTab.style.borderBottom = '2px solid var(--f-low, #666)';
  signupTab.dataset.tab = 'signup';
  
  authTab.appendChild(loginTab);
  authTab.appendChild(signupTab);
  
  // Add tab switching functionality
  loginTab.addEventListener('click', () => switchAuthTab('login'));
  signupTab.addEventListener('click', () => switchAuthTab('signup'));
  
  // Create login form
  loginForm = document.createElement('form');
  loginForm.id = 'gibber-login-form';
  
  const loginEmailInput = createInput('email', 'Email', 'login-email', true);
  const loginPasswordInput = createInput('password', 'Password', 'login-password', true);
  const loginButton = createButton('Login', 'login-button');
  
  loginForm.appendChild(loginEmailInput);
  loginForm.appendChild(loginPasswordInput);
  loginForm.appendChild(loginButton);
  
  // Create signup form
  signupForm = document.createElement('form');
  signupForm.id = 'gibber-signup-form';
  signupForm.style.display = 'none';
  
  const signupEmailInput = createInput('email', 'Email', 'signup-email', true);
  const signupPasswordInput = createInput('password', 'Password', 'signup-password', true);
  const signupPasswordConfirmInput = createInput('password', 'Confirm Password', 'signup-password-confirm', true);
  const signupButton = createButton('Sign Up', 'signup-button');
  
  signupForm.appendChild(signupEmailInput);
  signupForm.appendChild(signupPasswordInput);
  signupForm.appendChild(signupPasswordConfirmInput);
  signupForm.appendChild(signupButton);
  
  // Add form submission handlers
  loginForm.addEventListener('submit', handleLogin);
  signupForm.addEventListener('submit', handleSignup);
  
  // Assemble the modal
  authModal.appendChild(authTab);
  authModal.appendChild(loginForm);
  authModal.appendChild(signupForm);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '15px';
  closeButton.style.border = 'none';
  closeButton.style.background = 'transparent';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = 'var(--f-med, #ccc)';
  closeButton.addEventListener('click', hideAuthModal);
  
  authModal.appendChild(closeButton);
  
  // Add to overlay
  authOverlay.appendChild(authModal);
  
  // Add to document
  document.body.appendChild(authOverlay);
  
  // Add user menu to the header
  createUserMenu();
}

// Create an input field
function createInput(type, placeholder, id, required = false) {
  const container = document.createElement('div');
  container.style.marginBottom = '15px';
  
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.placeholder = placeholder;
  input.required = required;
  input.style.width = '100%';
  input.style.padding = '8px';
  input.style.boxSizing = 'border-box';
  input.style.backgroundColor = 'var(--b-med, #222)';
  input.style.border = '1px solid var(--f-low, #666)';
  input.style.color = 'var(--f-high, #fff)';
  
  container.appendChild(input);
  return container;
}

// Create a button
function createButton(text, id) {
  const container = document.createElement('div');
  container.style.marginTop = '20px';
  
  const button = document.createElement('button');
  button.textContent = text;
  button.id = id;
  button.type = 'submit';
  button.style.width = '100%';
  button.style.padding = '10px';
  button.style.boxSizing = 'border-box';
  button.style.backgroundColor = 'var(--f-med, #ccc)';
  button.style.color = 'var(--b-high, #333)';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  
  container.appendChild(button);
  return container;
}

// Switch between login and signup tabs
function switchAuthTab(tab) {
  const loginTab = authTab.querySelector('[data-tab="login"]');
  const signupTab = authTab.querySelector('[data-tab="signup"]');
  
  if (tab === 'login') {
    loginTab.style.borderBottom = '2px solid var(--f-high, #fff)';
    signupTab.style.borderBottom = '2px solid var(--f-low, #666)';
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  } else {
    loginTab.style.borderBottom = '2px solid var(--f-low, #666)';
    signupTab.style.borderBottom = '2px solid var(--f-high, #fff)';
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const data = await window.GibberSaaS.signIn(email, password);
    currentUser = data.user;
    updateAuthState();
    hideAuthModal();
    
    // Notify environment about the user
    if (window.Gibber && window.Gibber.Environment) {
      window.Gibber.Environment.user = currentUser;
    }
  } catch (error) {
    alert(`Login failed: ${error.message}`);
  }
}

// Handle signup form submission
async function handleSignup(event) {
  event.preventDefault();
  
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-password-confirm').value;
  
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  try {
    const data = await window.GibberSaaS.signUp(email, password);
    alert(`Please check your email to confirm your account.`);
    switchAuthTab('login');
  } catch (error) {
    alert(`Sign up failed: ${error.message}`);
  }
}

// Show the auth modal
function showAuthModal() {
  authOverlay.style.display = 'flex';
}

// Hide the auth modal
function hideAuthModal() {
  authOverlay.style.display = 'none';
}

// Create user menu in the header
function createUserMenu() {
  const header = document.querySelector('header');
  if (!header) return;
  
  const userMenu = document.createElement('div');
  userMenu.id = 'gibber-user-menu';
  userMenu.style.position = 'absolute';
  userMenu.style.right = '10px';
  userMenu.style.top = '50%';
  userMenu.style.transform = 'translateY(-50%)';
  
  const loginButton = document.createElement('button');
  loginButton.id = 'gibber-login-button';
  loginButton.textContent = 'Login';
  loginButton.addEventListener('click', showAuthModal);
  
  const userInfo = document.createElement('div');
  userInfo.id = 'gibber-user-info';
  userInfo.style.display = 'none';
  
  const userEmail = document.createElement('span');
  userEmail.id = 'gibber-user-email';
  
  const logoutButton = document.createElement('button');
  logoutButton.id = 'gibber-logout-button';
  logoutButton.textContent = 'Logout';
  logoutButton.style.marginLeft = '10px';
  logoutButton.addEventListener('click', handleLogout);
  
  userInfo.appendChild(userEmail);
  userInfo.appendChild(logoutButton);
  
  userMenu.appendChild(loginButton);
  userMenu.appendChild(userInfo);
  
  header.appendChild(userMenu);
}

// Handle logout
async function handleLogout() {
  try {
    await window.GibberSaaS.signOut();
    currentUser = null;
    updateAuthState();
    
    // Notify environment about logout
    if (window.Gibber && window.Gibber.Environment) {
      window.Gibber.Environment.user = null;
    }
  } catch (error) {
    alert(`Logout failed: ${error.message}`);
  }
}

// Update UI based on authentication state
function updateAuthState() {
  const loginButton = document.getElementById('gibber-login-button');
  const userInfo = document.getElementById('gibber-user-info');
  const userEmail = document.getElementById('gibber-user-email');
  
  if (currentUser) {
    loginButton.style.display = 'none';
    userInfo.style.display = 'inline-block';
    userEmail.textContent = currentUser.email;
  } else {
    loginButton.style.display = 'inline-block';
    userInfo.style.display = 'none';
  }
}

// Check if user is logged in
function isLoggedIn() {
  return currentUser !== null;
}

// Get current user
function getUser() {
  return currentUser;
}

// Check if auth is ready (initialization complete)
function isReady() {
  return isAuthReady;
}

// Export auth functions
window.GibberAuth = {
  init: initAuth,
  showModal: showAuthModal,
  hideModal: hideAuthModal,
  isLoggedIn,
  getUser,
  isReady
}; 