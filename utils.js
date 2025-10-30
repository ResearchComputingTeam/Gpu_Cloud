// utils.js

const actionResolvers = {}; // { request_id: resolveFunction }

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

// Show status message
function showMessage(message, type = 'info') {
  const statusDiv = document.getElementById('status-message');
  statusDiv.innerHTML = `<div class="alert alert-${type} mt-3 mb-0" role="alert">${message}</div>`;
  setTimeout(() => { statusDiv.innerHTML = ''; }, 5000);
}

function clearMessage() {
  const progressDiv = document.getElementById('progress-content');
  progressDiv.innerHTML = '';
  const detailsDiv = document.getElementById('markdown-content');
  detailsDiv.innerHTML = '';
}

let progressUpdateTimeout = null;

function showProgress(message, type = 'info', action = '') {
  // Clear any pending update
  if (progressUpdateTimeout) {
    clearTimeout(progressUpdateTimeout);
  }

  // Debounce: wait 100ms before actually updating
  progressUpdateTimeout = setTimeout(() => {
    const progressDiv = document.getElementById('progress-content');
    if (progressDiv) {
      progressDiv.className = `alert alert-${type}`;
      progressDiv.innerHTML = message;
      if (action) addToHistory(action, message, type);
    }
    progressUpdateTimeout = null;
  }, 100);
}

// function showDetails(msg) {
//   const markdownDiv = document.getElementById('markdown-content');
//   let markdownText = '';

//   try {
//     // Try to parse as JSON and extract 'message' field
//     const data = typeof msg === 'string' ? JSON.parse(msg) : msg;
//     if (data.message) {
//       markdownText = data.message;
//     } else {
//       // If no 'message' field, fallback to stringified object
//       markdownText = JSON.stringify(data, null, 2);
//     }
//   } catch (e) {
//     // If not JSON, treat msg as markdown/text
//     markdownText = msg;
//   }

//   // Parse markdown and display
//   markdownDiv.innerHTML = marked.parse(markdownText);
// }

function showDetails(data) {
  const detailsPanel = document.getElementById('detailsPanel');
  if (!detailsPanel) return;
  
  try {
    // Try to parse and pretty-print if it's JSON
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    detailsPanel.innerHTML = `<pre>${JSON.stringify(parsed, null, 2)}</pre>`;
  } catch (e) {
    // If not JSON, just display as-is
    detailsPanel.textContent = data;
  }
  
  detailsPanel.style.display = 'block';
}


function showDetailsMarkdown(data) {
  const detailsPanel = document.getElementById('detailsPanel');
  if (!detailsPanel) return;
  
  try {
    // Try to parse and pretty-print if it's JSON
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    detailsPanel.innerHTML = `<pre>${JSON.stringify(parsed, null, 2)}</pre>`;
  } catch (e) {
    // If not JSON, just display as-is
    detailsPanel.textContent = data;
  }
  
  detailsPanel.style.display = 'block';
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

// Real-time updates via Supabase
let activeChannel = null; // Track active subscription

function subscribeToStatusUpdates(requestId, action) {
  return new Promise((resolve, reject) => {
    try {
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
            filter: `form_submission_unique_id=eq.${requestId}`},
            (payload) => {
              console.log('Update payload:', payload);
              handleRealtimeUpdate(payload.new, action);
            }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to real-time updates');
            // showProgress('📡 Monitoring status in real-time...', 'info');
            resolve(true);
          }
        });
        
      // Auto-unsubscribe after 30 minutes (optional cleanup)
      setTimeout(() => {
        if (activeChannel) {
          activeChannel.unsubscribe();
          activeChannel = null;
          hideSpinner();
          console.log('Unsubscribed after timeout');
          reject(new Error('Subscription timed out'));
        }
      }, 1800000); // 30 minutes
    } catch (err) {
        reject(err);
      }
    });
}

function handleRealtimeUpdate(data, action) {
  console.log('✨ Real-time update received:', data);
  
  // Update progress and details panels
  // requestAnimationFrame(() => {
  showProgress(formatResponseData(data, 'status_update'), 'success', `Status: ${data.request_status}`);
  showDetails(JSON.stringify(data));
  // });
  
  // Determine completion states based on action
  const isComplete = 
    (action === 'create_vm' && data.request_status === 'running') ||
    (action === 'hibernate_vm' && data.request_status === 'hibernated') ||
    (action === 'restore_vm' && data.request_status === 'running') ||
    (action === 'stop_simulation' && data.request_status === 'deleted');
  
  const isError = 
    data.request_status === 'failed' || data.request_status === 'error';

  const resolver = actionResolvers[data.form_submission_unique_id];

  if (isComplete && resolver) {
    showMessage(`✅ ${action} completed successfully!`, 'success');
    displayVmDetailsFromSupabaseUpdate(data);
    addToHistory(action, JSON.stringify(data), 'success');
    resolver.resolve(data); // Cleanup happens in resolve wrapper
  } 
  else if (isError && resolver) {
    const errorMsg = data.error_message || data.message || 'Unknown error';
    showMessage(`❌ ${action} failed: ${errorMsg}`, 'danger');
    showProgress(errorMsg, 'danger', action);
    addToHistory(action, JSON.stringify(data), 'danger');
    resolver.reject(new Error(errorMsg)); // Cleanup happens in reject wrapper
  }
}

// function to poll current status
async function pollCurrentStatus(requestId) {
  try {
    const { data, error } = await supabase
      .from('vm_creation_requests')
      .select('*')
      .eq('form_submission_unique_id', requestId)
      .single();
    
    if (error) {
      console.error('Error polling status:', error);
      return null;
    }
    
    console.log('📊 Current status:', data);
    return data;
  } catch (err) {
    console.error('Failed to poll status:', err);
    return null;
  }
}

// Display VM details nicely
function displayVmDetails(data) {
  if (!data || !data.success) {
    document.getElementById('markdown-content').innerHTML = `
      <div class="alert alert-danger">
        <strong>Error:</strong> ${data?.message || 'Failed to retrieve VM details'}
      </div>
    `;
    return;
  }
  
  // Store IP for commands
  currentVmIp = data.public_ip;
  
  // Map status to friendly display
  const statusMap = {
    'simulation_running': { label: 'Running', class: 'success', icon: '✓' },
    'simulation_paused': { label: 'Hibernated', class: 'warning', icon: '⏸️' },
    'simulation_complete': { label: 'Stopped', class: 'secondary', icon: '■' },
    'error': { label: 'Error', class: 'danger', icon: '⚠️' }
  };
  
  const status = statusMap[data.vm_status] || { label: data.vm_status, class: 'info', icon: 'ℹ️' };
  
  document.getElementById('markdown-content').innerHTML = `
    <div class="row g-0">
      <!-- Status Badge -->
      <div class="col-12">
        <div class="alert alert-${status.class} mb-0" role="alert">
          <h5 class="mb-0">${status.icon} Status: ${status.label}</h5>
        </div>
      </div>

      <!-- Connection Info -->
      <div class="col-sm-6">
        <div class="card border-primary">
          <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted">Connection</h6>
            <p class="mb-1"><strong>IP Address:</strong></p>
            <code style="font-size: 1.1rem;">${data.public_ip}</code>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="copyCommand('${data.public_ip}')">
              📋 Copy IP
            </button>
          </div>
        </div>
      </div>
      
      <!-- Cost Info -->
      <div class="col-sm-6">
        <div class="card border-success">
          <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted">Billing</h6>
            <p class="mb-1"><strong>Total Cost :</strong></p>
            <span style="font-size: 1.5rem; font-weight: bold; color: #28a745;">
              $${data.total_cost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
       
      <!-- Configuration -->
      <div class="col-12">
        <table class="table table-sm table-hover">
          <tbody>
            <tr>
              <td class="text-muted" style="width: 40%;"><strong>Hardware</strong></td>
              <td>${escapeHtml(data.hardware_flavor)}</td>
            </tr>
            <tr>
              <td class="text-muted"><strong>Base Image</strong></td>
              <td>${escapeHtml(data.base_image)}</td>
            </tr>
            <tr>
              <td class="text-muted"><strong>Environment</strong></td>
              <td><code>${escapeHtml(data.environment)}</code></td>
            </tr>
            <tr>
              <td class="text-muted"><strong>Created</strong></td>
              <td>${escapeHtml(data.created_at)}</td>
            </tr>
            <tr>
              <td class="text-muted"><strong>User</strong></td>
              <td>${escapeHtml(data.user_id)}</td>
            </tr>
            ${data.total_paused_time > 0 ? `
            <tr>
              <td class="text-muted"><strong>Paused Time</strong></td>
              <td>${formatTime(data.total_paused_time)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
      
      <!-- Quick Actions -->
      <div class="col-12">
        <div class="alert alert-info" role="alert">
          <strong>💡 Quick Tip:</strong> Click actions in the sidebar for copy-ready commands
        </div>
      </div>
    </div>
  `;
}

// Display VM details nicely
function displayVmDetailsFromSupabaseUpdate(data) {
  // if (!data || !data.request_status == running) {
  //   document.getElementById('markdown-content-create').innerHTML = `
  //     <div class="alert alert-danger">
  //       <strong>Error:</strong> ${data?.message || 'Failed to retrieve VM details'}
  //     </div>
  //   `;
  //   return;
  // }
  
  // Store IP for commands
  currentVmIp = data.user_vm_ip;
  
  // Map status to friendly display
  const statusMap = {
    'running': { label: 'Running', class: 'success', icon: '✓' },
    'hibernated': { label: 'Hibernated', class: 'warning', icon: '⏸️' },
    'deleted': { label: 'Deleted', class: 'secondary', icon: '■' },
    'error': { label: 'Error', class: 'danger', icon: '⚠️' }
  };
  
  const status = statusMap[data.request_status] || { label: data.request_status, class: 'info', icon: 'ℹ️' };
  
  document.getElementById('markdown-content-create').innerHTML = `
    <div class="row g-0">
      <!-- Status Badge -->
      <div class="col-12">
        <div class="alert alert-${status.class} mb-0" role="alert">
          <h5 class="mb-0">${status.icon} Status: ${status.label}</h5>
        </div>
      </div>

      <!-- Connection Info -->
      <div class="col-sm-6">
        <div class="card border-primary">
          <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted">Connection</h6>
            <p class="mb-1"><strong>IP Address:</strong></p>
            <code style="font-size: 1.1rem;">${data.user_vm_ip}</code>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="copyCommand('${data.user_vm_ip}')">
              📋 Copy IP
            </button>
          </div>
        </div>
      </div>
       
      <!-- Configuration -->
      <div class="col-12">
        <table class="table table-sm table-hover">
          <tbody>
            <tr>
              <td class="text-muted" style="width: 40%;"><strong>Name</strong></td>
              <td>${escapeHtml(data.user_vm_name.replace(/_[^_]*$/, ''))}</td>
            </tr>
            <tr>
              <td class="text-muted" style="width: 40%;"><strong>Hardware</strong></td>
              <td>${escapeHtml(data.hardware_flavor)}</td>
            </tr>
            <tr>
              <td class="text-muted"><strong>Base Image</strong></td>
              <td>${escapeHtml(data.base_image)}</td>
            </tr>
            <tr>
              <td class="text-muted"><strong>Environment</strong></td>
              <td><code>${escapeHtml(data.environment_name)}</code></td>
            </tr>
            <tr>
              <td class="text-muted"><strong>Created</strong></td>
              <td>${new Date(data.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Qatar', dateStyle: 'medium', timeStyle: 'short', hour12: false })}</td>
            </tr>
            <tr>
              <td class="text-muted"><strong>User</strong></td>
              <td>${escapeHtml(data.user_id)}</td>
            </tr>
            ${data.total_paused_time > 0 ? `
            <tr>
              <td class="text-muted"><strong>Paused Time</strong></td>
              <td>${formatTime(data.total_paused_time)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
      
      <!-- Quick Actions -->
      <div class="col-12">
        <div class="alert alert-info" role="alert">
          <strong>💡 Quick Tip:</strong> Click actions in the sidebar for copy-ready commands
        </div>
      </div>
    </div>
  `;
}

// Format time helper
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatResponseData(data, action) {
  let html = '';
  
  // Main message (if exists)
  if (data.message) {
  // Parse markdown to HTML
  const htmlContent = marked.parse(data.message);
  html += `<div class="alert mb-3" style="background-color: #d1ecf1; border-left: 4px solid #0c5460; color: #0c5460;">
    ${htmlContent}
  </div>`;
  }
  
  // Build details list
  const details = [];
  
  // Common fields
  if (data.status) {
    details.push({
      label: 'Status',
      value: `<span class="badge bg-primary">${escapeHtml(data.status)}</span>`
    });
  }
  
  if (data.request_id) {
    details.push({
      label: 'Request ID',
      value: `<code>${escapeHtml(data.request_id)}</code>`
    });
  }
  
  if (data.vm_id) {
    details.push({
      label: 'VM ID',
      value: `<code>${escapeHtml(data.vm_id)}</code>`
    });
  }
  
  if (data.vm_ip) {
    details.push({
      label: 'VM IP Address',
      value: `<code>${escapeHtml(data.vm_ip)}</code> 
              <button class="btn btn-sm btn-outline-secondary ms-2" onclick="copyToClipboard('${data.vm_ip}')">
                📋 Copy
              </button>`
    });
  }
  
  if (data.ssh_command) {
    details.push({
      label: 'SSH Command',
      value: `<code>${escapeHtml(data.ssh_command)}</code>
              <button class="btn btn-sm btn-outline-secondary ms-2" onclick="copyToClipboard('${data.ssh_command}')">
                📋 Copy
              </button>`
    });
  }
  
  if (data.credits_used !== undefined) {
    details.push({
      label: 'Credits Used',
      value: `<strong>$${parseFloat(data.credits_used).toFixed(2)}</strong>`
    });
  }
  
  if (data.credits_remaining !== undefined) {
    details.push({
      label: 'Credits Remaining',
      value: `<strong>$${parseFloat(data.credits_remaining).toFixed(2)}</strong>`
    });
  }
  
  if (data.estimated_time) {
    details.push({
      label: 'Estimated Time',
      value: `<span class="text-muted">${escapeHtml(data.estimated_time)}</span>`
    });
  }
  
  if (data.runtime) {
    details.push({
      label: 'Runtime',
      value: `<span class="text-muted">${escapeHtml(data.runtime)}</span>`
    });
  }
  
  if (data.gpu_type) {
    details.push({
      label: 'GPU Type',
      value: `<span class="badge bg-success">${escapeHtml(data.gpu_type)}</span>`
    });
  }
  
  if (data.timestamp) {
    details.push({
      label: 'Timestamp',
      value: `<small class="text-muted">${escapeHtml(data.timestamp)}</small>`
    });
  }

  // if (data.request_status) {
  // details.push({
  //   label: 'GPU VM Status',
  //   value: `<span class="badge bg-info">${escapeHtml(data.request_status)}</span>`
  // });
  // }

  if (data.request_status) {
  details.push({
    label: 'GPU VM Status',
    value: `<span class="alert alert-primary">${escapeHtml(data.request_status)}</span>`
  });
  }
  
  // Render details as a table
  if (details.length > 0) {
    html += '<table class="table table-sm table-borderless mb-0" style="background-color: transparent;">';
    details.forEach(detail => {
      html += `
        <tr>
          <td class="text-muted" style="width: 40%;">${detail.label}:</td>
          <td>${detail.value}</td>
        </tr>
      `;
    });
    html += '</table>';
  }
  
  // If no specific fields matched, show a generic success message
  if (!html) {
    html = '<p class="text-success mb-0">✅ Action completed successfully</p>';
  }
  
  return html;
}

function formatStatusUpdate(data) {
  const statusMessages = {
    'processing': '⏳ Processing your request...',
    'provisioning_vm': '🔄 Creating your VM...',
    'vm_ready': '✅ VM is ready!',
    'uploading_data': '📤 Uploading your data...',
    'running': '🚀 VM is running!',
    'simulation_paused': '⏸️ Simulation paused',
    'simulation_complete': '✅ Simulation complete!',
    'deleted': '❌ Deleting VM'
  };
  
  return statusMessages[data.request_status] || `Status: ${data.request_status}`;
}

function clearProgressPanel() {
  const progressContent = document.getElementById('progress-content');
  progressContent.innerHTML = ''; 
  progressContent.innerHTML = 'Ready, waiting for user action.';

  // Optional: Reset the alert class for a neutral look if needed
  progressContent.className = 'alert alert-light';
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

