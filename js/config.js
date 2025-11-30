// js/config.js
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5678'  // Dev
    : 'https://nonserially-unpent-jin.ngrok-free.dev',  // PROD - CHANGE THIS!
  
  SUPABASE_URL: 'https://dgttklfdlwaxvxjubcxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndHRrbGZkbHdheHZ4anViY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTkzNTAsImV4cCI6MjA3NDI5NTM1MH0.ZggUBEE_GN0e_-b4TQL8yaXfe5ckoD6AglORC7NdYwQ'
};

Object.freeze(CONFIG);