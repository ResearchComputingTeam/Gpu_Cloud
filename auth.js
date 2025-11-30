<script src="js/config.js"></script>

// auth.js - Shared authentication utilities

// CORRECT initialization
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is authenticated
async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  
  return session.user;
}

// Get current user
async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

// Logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Get user's projects
async function getUserProjects(userId) {
  const { data, error } = await supabaseClient
    .from('project_members')
    .select('project_id, role')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  
  return data;
}

// Add this function to auth.js
async function isSystemAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const { data } = await supabaseClient
    .from('user_profiles')
    .select('is_system_admin')
    .eq('id', user.id)
    .single();
  
  return data?.is_system_admin || false;
}