// auth.js - Shared authentication utilities
const SUPABASE_URL = 'https://dgttklfdlwaxvxjubcxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndHRrbGZkbHdheHZ4anViY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTkzNTAsImV4cCI6MjA3NDI5NTM1MH0.ZggUBEE_GN0e_-b4TQL8yaXfe5ckoD6AglORC7NdYwQ';

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