// Supabase Client Configuration
// This file initializes the Supabase client and provides utility functions

// We'll load the Supabase JavaScript library from a CDN
// The actual keys will be replaced with environment variables in production
const SUPABASE_URL = 'https://your-supabase-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

let supabase;

// Initialize Supabase client
function initSupabase() {
  if (typeof supabaseClient !== 'undefined') {
    supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  } else {
    console.error('Supabase client not loaded. Make sure to include the Supabase script in your HTML.');
    return null;
  }
}

// Authentication functions
async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }
}

async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in:', error.message);
    throw error;
  }
}

async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}

async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error.message);
    return null;
  }
}

// Storage functions for saving/loading user projects
async function saveProject(projectName, code, userId) {
  try {
    const path = `projects/${userId}/${projectName}.js`;
    const { data, error } = await supabase.storage
      .from('gibber-projects')
      .upload(path, code, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) throw error;
    
    // Also save project metadata in the database
    await saveProjectMetadata(projectName, userId, path);
    
    return data;
  } catch (error) {
    console.error('Error saving project:', error.message);
    throw error;
  }
}

async function loadProject(projectName, userId) {
  try {
    const path = `projects/${userId}/${projectName}.js`;
    const { data, error } = await supabase.storage
      .from('gibber-projects')
      .download(path);
    
    if (error) throw error;
    
    // Convert the downloaded blob to text
    const code = await data.text();
    return code;
  } catch (error) {
    console.error('Error loading project:', error.message);
    throw error;
  }
}

async function listProjects(userId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error listing projects:', error.message);
    return [];
  }
}

// Database functions
async function saveProjectMetadata(name, userId, storagePath) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .upsert({
        name,
        user_id: userId,
        storage_path: storagePath,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'name, user_id',
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving project metadata:', error.message);
    throw error;
  }
}

// Subscription functions
async function getUserSubscription(userId) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    
    return data || { tier: 'free', status: 'active' };
  } catch (error) {
    console.error('Error getting user subscription:', error.message);
    return { tier: 'free', status: 'active' };
  }
}

// Usage tracking
async function trackUsage(userId, action, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        action,
        metadata,
        created_at: new Date().toISOString(),
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking usage:', error.message);
  }
}

// Export the utilities
window.GibberSaaS = {
  initSupabase,
  
  // Auth
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  
  // Storage
  saveProject,
  loadProject,
  listProjects,
  
  // Database
  saveProjectMetadata,
  
  // Subscription
  getUserSubscription,
  
  // Usage
  trackUsage,
}; 