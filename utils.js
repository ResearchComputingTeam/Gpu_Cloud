// utils.js
function showMessage(message, type = 'info') {
  const statusDiv = document.getElementById('status-message');
  statusDiv.innerHTML = `<div class="alert alert-${type} mt-3" role="alert">${message}</div>`;
  setTimeout(() => { statusDiv.innerHTML = ''; }, 5000);
}

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// HELPERS
// Helper function to copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showMessage('✅ Copied to clipboard!', 'success');
  }).catch(err => {
    showMessage('❌ Failed to copy', 'danger');
  });
}

// Initialize Supabase client
const supabaseUrl = 'https://dgttklfdlwaxvxjubcxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndHRrbGZkbHdheHZ4anViY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTkzNTAsImV4cCI6MjA3NDI5NTM1MH0.ZggUBEE_GN0e_-b4TQL8yaXfe5ckoD6AglORC7NdYwQ';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// HISTORY STUFFS
let responseHistory = [];

function addToHistory(action, message, type) {
  const timestamp = new Date().toLocaleString();
  
  // Extract clean summary for history
  let summary = 'Action completed';
  try {
    let data = typeof message === 'string' ? JSON.parse(message) : message;
    if (data.message) {
      summary = data.message;
    } else if (data.status) {
      summary = `Status: ${data.status}`;
    }
  } catch (e) {
    summary = typeof message === 'string' ? message : 'Action completed';
  }
  
  responseHistory.unshift({ 
    action: getActionLabel(action), 
    message: summary, 
    fullData: message, // Store full data
    type, 
    timestamp 
  });
  
  if (responseHistory.length > 20) {
    responseHistory = responseHistory.slice(0, 20);
  }
  
  renderHistory();
}

function renderHistory() {
  const historyDiv = document.getElementById('responseHistoryList');
  
  if (responseHistory.length === 0) {
    historyDiv.innerHTML = '<div class="text-muted p-3 text-center">No requests yet</div>';
    return;
  }
  
  historyDiv.innerHTML = responseHistory.map((item, idx) => {
    // Get icon based on type
    const icon = item.type === 'success' || item.type === 'primary' ? '✅' : 
                 item.type === 'danger' ? '❌' : 
                 item.type === 'warning' ? '⚠️' : 'ℹ️';
    
    // Truncate message if too long
    let displayMsg = item.message;
    if (displayMsg.length > 60) {
      displayMsg = displayMsg.substring(0, 60) + '...';
    }
    
    return `
    <div class="list-group-item list-group-item-${item.type} d-flex justify-content-between align-items-center">
      <div>
        <div><strong>${icon} ${item.action}</strong></div>
        <small class="text-muted">${displayMsg}</small>
      </div>
      <span class="badge bg-secondary">${item.timestamp}</span>
    </div>
  `;
  }).join('');
}


function showMessage(message, type = 'info') {
  const statusDiv = document.getElementById('status-message');
  statusDiv.innerHTML = `<div class="alert alert-${type} mt-3" role="alert">${message}</div>`;
  setTimeout(() => { statusDiv.innerHTML = ''; }, 5000);
}

function clearMessage() {
  const progressDiv = document.getElementById('progress-content');
  progressDiv.innerHTML = '';
  const detailsDiv = document.getElementById('markdown-content');
  detailsDiv.innerHTML = '';
}


function showProgress(message, type = 'info', action = '') {
  const progressDiv = document.getElementById('progress-content');
  progressDiv.className = `alert alert-${type}`;
  progressDiv.innerHTML = message;
  if (action) addToHistory(action, message, type);
}

function showDetails(msg) {
  const markdownDiv = document.getElementById('markdown-content');
  let markdownText = '';

  try {
    // Try to parse as JSON and extract 'message' field
    const data = typeof msg === 'string' ? JSON.parse(msg) : msg;
    if (data.message) {
      markdownText = data.message;
    } else {
      // If no 'message' field, fallback to stringified object
      markdownText = JSON.stringify(data, null, 2);
    }
  } catch (e) {
    // If not JSON, treat msg as markdown/text
    markdownText = msg;
  }

  // Parse markdown and display
  markdownDiv.innerHTML = marked.parse(markdownText);
}

function getActionLabel(action) {
  const labels = {
    'run_simulation': '▶️ Starting Simulation',
    'pause_simulation': '⏸️ Pausing Simulation',
    'resume_simulation': '🔁 Resuming Simulation',
    'stop_simulation': '🛑 Stopping Simulation',
    'get_workflow_status': '🔍 Checking Status',
    'show_credits': '💰 Credit Information'
  };
  return labels[action] || action;
}



function showSpinner() {
  document.getElementById('loading-spinner').style.display = 'block';
}

function hideSpinner() {
  document.getElementById('loading-spinner').style.display = 'none';
}

async function trigger(action) {
  clearMessage();
  showSpinner(); // Show spinner when request starts
  const projectId = document.getElementById('project_id').value.trim();
  if (!projectId) {
    showProgress('Please enter a Project ID', 'warning');
    hideSpinner();
    return;
  }

  //Initial check of Project ID
  const initialRequestIDCheck = `https://nonserially-unpent-jin.ngrok-free.dev/webhook/project_id_check?project_id=${encodeURIComponent(project_id)}`;
  console.log('Attempting to process Project ID:', projectId);
  try {
    const response = await fetch(initialRequestIDCheck, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId })
    });
    const check_msg = await response.text();
    try {
      data = JSON.parse(check_msg);
    } catch (e) {
      console.error('Response is not valid JSON:', e);
      return;
    }
    if (data.success === true) {
      console.log('Poject ID is valid');
      //proceed with the rest of the code
      info.textContent = `✅ Project ID: ${projectId}`;
      actions.classList.remove("d-none");

      // Wire buttons
      document.getElementById("handleBtn").onclick = () =>
      window.location.href = `handle_vms.html?project_id=${projectId}`;
      document.getElementById("createBtn").onclick = () =>
      window.location.href = `create_vm.html?project_id=${projectId}`;
    } else {
      hideSpinner();
      console.log('Project ID is not valid');
      info.textContent = `❌ Invalid Project ID`;
      // showProgress(`Error: ${err.message}`, 'danger');
      showProgress(`Error: Request ID is not valid`, 'danger');
      return;
    }
  } catch (err) {
    console.error('Check status error:', err);
    showProgress(`Error: ${err.message}`, 'danger');
    return;
  }

  // 🔥 Start listening for real-time updates
  if (action === 'run_simulation_simple' || action === 'pause_simulation' || action === 'stop_simulation') {
    subscribeToStatusUpdates(requestId, action);
  }

  const webhookUrl = `https://nonserially-unpent-jin.ngrok-free.dev/webhook/${action}?request_id=${encodeURIComponent(requestId)}`;
  console.log('Attempting to process Request ID:', requestId);

  if (action === 'check_status') {
    try {
      const response = await fetch(webhookUrl, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId })
      });
      const check_msg = await response.text();
      const data = JSON.parse(check_msg);
      const check_message = `STATUS = ${data.request_status} started by ${data.user_name} at ${new Date(data.first_time_start).toLocaleString('en-US')}`;

      showProgress(`STATUS = ${data.request_status}`, 'info');
      const showProgressDiv = document.getElementById('markdown-content');
      showProgressDiv.innerHTML = check_message;
      addToHistory(action, check_message, 'info');
      hideSpinner();
    } catch (err) {
      console.error('Check status error:', err);
      showProgress(`Error: ${err.message}`, 'danger');
    }
  } else { //Trigger is not Check Status
    // Fire and forget - don't await this
    fetch(webhookUrl, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId })
    })
      .then(response => response.text())
      .then(msg => {
        console.log('Webhook initial response:', msg);
        showDetails(msg);
      })
      .catch(err => {
        console.error('Webhook error:', err);
        hideSpinner();
      })
  }
}

// Real-time updates via Supabase
let activeChannel = null; // Track active subscription

function subscribeToStatusUpdates(requestId, action) {
  // Unsubscribe from any previous channel
  if (activeChannel) {
    activeChannel.unsubscribe();
  }
  
  console.log('Subscribing to updates for Request ID:', requestId);
  
  // Create new channel
  activeChannel = supabase
    .channel(`status-updates-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vm_creation_requests',
        filter: `form_submission_unique_id=eq.${requestId}`
      },
      (payload) => {
        console.log('✨ Real-time update received:', payload.new);
        handleRealtimeUpdate(payload.new, action);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to real-time updates');
        // showMessage('📡 Monitoring status in real-time...', 'info');
        showProgress('📡 Monitoring status in real-time...', 'info');
      }
    });
    
  // Auto-unsubscribe after 30 minutes (optional cleanup)
  setTimeout(() => {
    if (activeChannel) {
      activeChannel.unsubscribe();
      hideSpinner();
      console.log('Unsubscribed after timeout');
    }
  }, 1800000); // 30 minutes
}

// function handleRealtimeUpdate(data, action) {
//   // Format the update as a nice message
//   const statusMessage = formatStatusUpdate(data);
  
//   // Update feedback panel with new status
//   // showFeedbackPanel(JSON.stringify(data), 'success', `Status: ${data.request_status}`);
//   // showFeedback(JSON.stringify(data), 'success', `Status: ${data.request_status}`);
//   showProgress(formatResponseData(data, 'status_update'), 'success', `Status: ${data.request_status}`);

//   // // Show toast notification
//   // showMessage(statusMessage, 'success');
  
//   // Check if workflow is complete
//   if (action === 'run_simulation_simple' && data.request_status === 'simulation_running') {
//     showMessage('✅ Workflow completed!', 'success');
//     // showProgress('✅ Workflow completed!', 'success');
//     hideSpinner();
//     // Unsubscribe since workflow is done
//     if (activeChannel) {
//       activeChannel.unsubscribe();
//       activeChannel = null;
//     } 
//   } else if (action === 'stop_simulation' && data.request_status === 'finalized') {
//     showMessage('✅ Workflow completed!', 'success');
//     // showProgress('✅ Workflow completed!', 'success');
//     hideSpinner();
//     // Unsubscribe since workflow is done
//     if (activeChannel) {
//       activeChannel.unsubscribe();
//       activeChannel = null;
//     }  
//   } else if (data.request_status === 'failed') {
//     showMessage('❌ Failed to copy', 'failed');
//     // showProgress('✅ Workflow completed!', 'success');
//     hideSpinner();
//     // Unsubscribe since workflow is done
//     if (activeChannel) {
//       activeChannel.unsubscribe();
//       activeChannel = null;
//     }
//   }
// }

function handleRealtimeUpdate(data, action) {
  console.log('Real-time update received:', data, 'Action:', action);
  
  // Update progress and details panels
  showProgress(formatStatusUpdate(data), 'info');
  showDetails(JSON.stringify(data));
  
  // Determine completion states based on action
  const isComplete = 
    (action === 'create_vm' && (data.STATUS === 'vm_ready' || data.workflow_status === 'vm_ready')) ||
    (action === 'run_simulation_simple' && data.request_status === 'simulation_running') ||
    (action === 'stop_simulation' && data.request_status === 'finalized');
  
  const isError = 
    data.STATUS === 'error' || 
    data.workflow_status === 'error' || 
    data.request_status === 'failed';
  
  // Handle completion
  if (isComplete) {
    showMessage(`✅ ${action} completed successfully!`, 'success');
    addToHistory(action, JSON.stringify(data), 'success');
    
    if (activeChannel) {
      activeChannel.unsubscribe();
      activeChannel = null;
    }
  }
  // Handle errors
  else if (isError) {
    const errorMsg = data.error_message || data.message || 'Unknown error';
    showMessage(`❌ ${action} failed: ${errorMsg}`, 'danger');
    showProgress(errorMsg, 'danger', action);
    addToHistory(action, JSON.stringify(data), 'danger');
    
    if (activeChannel) {
      activeChannel.unsubscribe();
      activeChannel = null;
    }
  }
  // Still processing
  else {
    console.log(`${action} in progress:`, data.STATUS || data.workflow_status || data.request_status);
  }
}

function formatStatusUpdate(data) {
  const statusMessages = {
    'processing': '⏳ Processing your request...',
    'provisioning_vm': '🔄 Creating your VM...',
    'vm_ready': '✅ VM is ready!',
    'uploading_data': '📤 Uploading your data...',
    'simulation_running': '🚀 Simulation is running!',
    'simulation_paused': '⏸️ Simulation paused',
    'simulation_complete': '✅ Simulation complete!',
    'finalized': '💰 Processing finalized'
  };
  
  return statusMessages[data.request_status] || `Status: ${data.request_status}`;
}

// ============================================
// URL PARAMETER UTILITIES
// ============================================

function getProjectIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('project_id');
}

function getRequestIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('request_id');
}

