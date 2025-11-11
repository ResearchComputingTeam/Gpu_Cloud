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

function showError(data) {
  const errorPanel = document.getElementById('errorPanel');
  const errorCard = document.getElementById('errorCard'); 
  
  if (!errorPanel || !errorCard) return;
  
  try {
    // Try to parse and pretty-print if it's JSON
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    errorPanel.innerHTML = `<pre>${JSON.stringify(parsed, null, 2)}</pre>`;
  } catch (e) {
    // If not JSON, just display as-is
    errorPanel.textContent = data;
  }

  // Make both visible
  errorCard.style.display = 'block';
  errorPanel.style.display = 'block';
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
    'create_vm': '▶️ VM is Creating',
    'hibernate_vm': '⏸️ VM is Hibernating',
    'restore_vm': '🔁 VM is Restoring',
    'delete_vm': '🛑 VM is getting deleted',
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
  // showDetails(JSON.stringify(data));
  // CheckVmStatus(data.user_vm_name);
  displayVmDetails(data);

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
    // displayVmDetailsFromSupabaseUpdate(data);
    displayVmDetails(data);
    addToHistory(action, JSON.stringify(data), 'success');
    resolver.resolve(data); // Cleanup happens in resolve wrapper
  } 
  else if (isError && resolver) {
    const errorMsg = data.error_message || data.message || 'Unknown error';
    showMessage(`❌ ${action} failed: ${errorMsg}`, 'danger');
    showProgress(errorMsg, 'danger', action);
    showError(errorMsg);
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

async function CheckVmStatus(vmName) {
  console.log('Test', vmName);
  const payload = { vm_name: vmName };

  // Show loading state
  // document.getElementById('progress-content').innerHTML = 
  //   `<strong>Checking status for ${escapeHtml(vmName)}...</strong>`;
  // document.getElementById('loading-spinner').style.display = 'block';

  try {
    const webhookUrl = `https://nonserially-unpent-jin.ngrok-free.dev/webhook/check_vm_status`;
    
    console.log('Calling webhook:', webhookUrl, 'with payload:', payload);
    // showProgress("VMs listing", 'info', 'list_vms');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('Response received:', data);
    
    if (data.success) {
      //Display the VM details
      // updateHelpBasedOnStatus(data.vm_status);
      // showDetails(JSON.stringify(data));
      displayVmDetails(data);
      // document.getElementById('loading-spinner').style.display = 'none';
    } else {
      // showProgress(`❌VM listing failed: ${data.message || 'Unknown error'}`, 'danger', 'list_vms');
      // document.getElementById('vmsList').innerHTML = '<div class="text-danger p-3">Failed to load VMs</div>';
    }
    
  } catch (error) {
    console.error('Error:', error);
    showError(error.message);
  }
}

async function checkCredits(projectId) {
  try {
    // Call n8n webhook to validate project
    const webhookUrl = `https://nonserially-unpent-jin.ngrok-free.dev/webhook/project_id_check`;
    
    console.log('🔍 Checking project status for:', projectId);

    const response = await fetch(webhookUrl, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId })
    });

   if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle response
    if (data.out_of_credits) {
      showOutOfCreditsState();
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
    showProgress(`Error: ${error.message}`, 'danger', 'delete_vm');
    showError(error.message);
    throw error; // Re-throw so caller knows it failed
  }
}

function displayVmDetails(data) {
  // Pick the correct container depending on which page we are on
  const targetEl = 
    document.getElementById('markdown-content-create') || 
    document.getElementById('markdown-content-manage');

  if (!targetEl) {
    console.warn('No VM details container found on this page.');
    return;
  }
  
  // Store IP for commands
  currentVmIp = data.user_vm_ip;
  
  // Map status to friendly display
  const statusMap = {
    'running': { label: 'Running', class: 'success', icon: '🟢' },
    'hibernated': { label: 'Hibernated', class: 'warning', icon: '⏸️' },
    'deleted': { label: 'Deleted', class: 'secondary', icon: '🔴' },
    'error': { label: 'Error', class: 'danger', icon: '⚠️' }
  };
  
  const status = statusMap[data.request_status] || { label: data.request_status, class: 'info', icon: 'ℹ️' };
  
  const statusColor = status.class === 'success' ? '#28a745' : status.class === 'warning' ? '#ffc107' : status.class === 'secondary' ? '#da1021ff' : '#6c757d';
  
  targetEl.innerHTML = `
    <div style="display: flex; font-size: 12px;">
      <!-- Left Sidebar - Key Info -->
      <div style="flex: 0 0 140px; padding: 12px; background: #f8f9fa; border-right: 1px solid #dee2e6;">
        <div style="margin-bottom: 12px;">
          <div style="font-size: 10px; color: #6c757d; margin-bottom: 4px;">STATUS</div>
          <div style="font-size: 12px; font-weight: 600; color: ${statusColor};">
            ${status.icon} ${status.label}
          </div>
        </div>
        
        <div style="margin-bottom: 8px;">
          <div style="font-size: 10px; color: #6c757d; margin-bottom: 4px;">IP ADDRESS</div>
          <code style="font-size: 16px; display: block; word-break: break-all;">
            ${data.user_vm_ip}
          </code>
          <button class="btn btn-sm btn-outline-primary" 
                  style="margin-top: 6px; font-size: 11px; width: 100%; padding: 4px 10px;"
                  onclick="copyCommand('${data.user_vm_ip}')">
            📋 Copy IP
          </button>
        </div>
        
        <div>
          <div style="font-size: 10px; color: #6c757d; margin-bottom: 4px;">COST</div>
          <div style="font-size: 20px; font-weight: bold; color: #28a745;">
            $${(data.total_cost ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      <!-- Right Column - Details -->
      <div style="flex: 1; padding: 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; width: 30%; font-size: 11px;">Name</td>
              <td style="padding: 5px 0; font-size: 11px;">${escapeHtml(data.user_vm_name.replace(/_[^_]*$/, ''))}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">Hardware</td>
              <td style="padding: 5px 0; font-size: 11px;">${escapeHtml(data.hardware_flavor)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">Image</td>
              <td style="padding: 5px 0; font-size: 11px;">${escapeHtml(data.base_image)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">Environment</td>
              <td style="padding: 5px 0; font-size: 11px;"><code style="font-size: 11px;">${escapeHtml(data.environment_name)}</code></td>
            </tr>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">Created</td>
              <td style="padding: 5px 0; font-size: 11px;">${new Date(data.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Qatar', dateStyle: 'short', timeStyle: 'short', hour12: false })}</td>
            </tr>
            <tr${data.total_paused_time > 0 ? ' style="border-bottom: 1px solid #e9ecef;"' : ''}>
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">User</td>
              <td style="padding: 5px 0; font-size: 11px;">${escapeHtml(data.user_id)}</td>
            </tr>
            ${data.total_paused_time > 0 ? `
            <tr>
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">Paused Time</td>
              <td style="padding: 5px 0; font-size: 11px;">${formatTime(data.total_paused_time)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        <div class="col-12">
          <button class="btn btn-primary w-100" onclick="connectToTerminal('${data.user_vm_ip}', '${escapeHtml(data.environment_name)}')" ${data.request_status !== 'running' || !data.user_vm_ip || data.user_vm_ip === 'N/A' ? 'disabled' : ''}>
            🖥️ Open Web Terminal
          </button>
      </div>
      </div>
    </div>
  `;
}

// Check if project has credits (using cached status)
function checkCreditsFromCache() {
  const hasCredits = localStorage.getItem('hasCredits') === 'true';
  
  if (!hasCredits) {
    showOutOfCreditsState();
    return false;
  }
  
  return true;
}

// Show "out of credits" banner
function showOutOfCreditsState() {
  // Create banner
  const existingBanner = document.getElementById('credits-banner');
  if (existingBanner) return; // Already showing
  
  const banner = document.createElement('div');
  banner.id = 'credits-banner';
  banner.className = 'alert alert-danger';
  banner.style.cssText = `
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    min-width: 400px;
    max-width: 90%;
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
  `;
  banner.innerHTML = `
    <div class="d-flex align-items-center">
      <span style="font-size: 2rem; margin-right: 15px;">💰❌</span>
      <div>
        <strong>Project Out of Credits</strong><br>
        <small>Please contact your administrator to add more credits.</small>
      </div>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Disable all actions
  disableAllActions();
}

// Disable all interactive elements
function disableAllActions() {
  // Disable all buttons except back button
  const buttons = document.querySelectorAll('button:not([onclick*="goBack"])');
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    btn.title = 'Project is out of credits';
  });
  
  // Disable all inputs
  const inputs = document.querySelectorAll('input:not([readonly]), select, textarea');
  inputs.forEach(input => {
    input.disabled = true;
    input.style.opacity = '0.5';
  });
  
  // Disable radio buttons
  const radios = document.querySelectorAll('input[type="radio"]');
  radios.forEach(radio => {
    radio.disabled = true;
  });
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

// ============================================
// INTEGRATED TERMINAL STUFFS
// ============================================

let term = null;
let socket = null;

function connectToTerminal(vmIp, vmName) {
  // Get project info from localStorage
  const projectId = localStorage.getItem('currentProjectId');
  const projectName = localStorage.getItem('currentProjectName');
  
  if (!projectId) {
    alert('Error: Project ID not found. Please refresh and try again.');
    return;
  }
  
  if (!projectName) {
    alert('Error: Project Name not found. Please refresh and try again.');
    return;
  }
  
  // Show terminal card
  document.getElementById('terminal-card').style.display = 'block';
  document.getElementById('terminal-vm-name').textContent = vmName || vmIp;
  
  if (term) {
    term.dispose();
  }
  
  term = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#f0f0f0',
      cursor: '#ffffff'
    }
  });
  
  fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  
  const terminalContainer = document.getElementById('terminal');
  terminalContainer.innerHTML = '';
  term.open(terminalContainer);
  fitAddon.fit();
  
  term.writeln('\x1b[33m⏳ Connecting to ' + vmIp + '...\x1b[0m\r');

  // Add project_id to WebSocket URL
  // const wsUrl = `wss://51.20.114.36/ssh?host=${vmIp}&port=22&project_id=${projectId}`;
  // const wsUrl = `wss:nonserially-unpent-jin.ngrok-free.dev?host=${vmIp}&port=22&project_id=${projectId}`;
  const wsUrl = `wss://adolfo-unpersonalizing-unnarrowly.ngrok-free.dev?host=${vmIp}&port=22&project_id=${projectId}&project_name=${encodeURIComponent(projectName)}`;
 
  console.log('WebSocket URL=', wsUrl);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connected for project:', projectName, '(' + projectId + ')');
    term.writeln('\x1b[32m✅ Connected to ' + vmIp + '\x1b[0m\r');
  };
  
  socket.onmessage = (event) => {
    term.write(event.data);
  };
  
  socket.onerror = (error) => {
    term.writeln('\r\n\x1b[31m❌ Connection error\x1b[0m\r\n');
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = () => {
    term.writeln('\r\n\r\n\x1b[33m🔌 Connection closed\x1b[0m');
  };
  
  term.onData((data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  });
}

function disconnectTerminal() {
  if (socket) {
    socket.close();
  }
  if (term) {
    term.dispose();
  }
  document.getElementById('terminal-card').style.display = 'none';
}


