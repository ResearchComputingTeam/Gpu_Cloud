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
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
 
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
      // if (action) addToHistory(action, message, type);
    }
    progressUpdateTimeout = null;
  }, 100);
}

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

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Raw user input
 * @param {object} options - DOMPurify options
 * @returns {string} - Sanitized string
 */
function sanitizeInput(input, options = {}) {
  if (!input) return '';
  if (typeof input !== 'string') return String(input);
  
  const defaultOptions = {
    ALLOWED_TAGS: [],           // Strip all HTML tags
    ALLOWED_ATTR: [],           // Strip all attributes
    KEEP_CONTENT: true,         // Keep text content
    RETURN_DOM: false,          // Return string not DOM
    RETURN_DOM_FRAGMENT: false
  };
  
  const clean = DOMPurify.sanitize(input, {
    ...defaultOptions,
    ...options
  });
  
  return clean.trim();
}

/**
 * Sanitize SSH public key
 * SSH keys should only contain: alphanumeric, +, /, =, spaces, and newlines
 */
function sanitizeSSHKey(key) {
  if (!key) return '';
  if (typeof key !== 'string') return '';
  
  // Remove any HTML/script tags but keep SSH key characters
  let cleaned = DOMPurify.sanitize(key, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // SSH keys only contain: letters, numbers, +, /, =, spaces, and dashes
  // Remove anything else
  cleaned = cleaned.replace(/[^A-Za-z0-9+/=\s\-]/g, '');
  
  return cleaned.trim();
}

/**
 * Validate SSH public key format
 * Basic validation - checks for common SSH key prefixes
 */
function isValidSSHKey(key) {
  console.log('1');
  if (!key || typeof key !== 'string') return false;
  console.log('2');
  // Common SSH key types
  const validPrefixes = [
    'ssh-rsa',
    'ssh-ed25519',
    'ssh-dss',
    'ecdsa-sha2-nistp256',
    'ecdsa-sha2-nistp384',
    'ecdsa-sha2-nistp521'
  ];
  console.log('3');
  // Check if key starts with a valid prefix
  const hasValidPrefix = validPrefixes.some(prefix => key.startsWith(prefix));
  console.log('4');
  if (!hasValidPrefix) return false;
  console.log('5');
  // SSH keys should have at least 3 parts: type, key, optional comment
  const parts = key.split(/\s+/);
  if (parts.length < 2) return false;
  console.log('6');
  // The key part should be base64 (letters, numbers, +, /, =)
  const keyPart = parts[1];
  if (!/^[A-Za-z0-9+/=]+$/.test(keyPart)) return false;
  console.log('7');
  
  // Key should be reasonably long (at least 100 chars for the key part)
  if (keyPart.length < 50) return false;
  console.log('8');
  
  return true;
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
  showProgress(formatResponseData(data, 'status_update'), 'success', `Status: ${data.request_status}`);
  displayVmDetails(data);

  // Determine completion states based on action
  const isComplete = 
    (action === 'create_vm' && data.request_status === 'running') ||
    (action === 'hibernate_vm' && data.request_status === 'hibernated') ||
    (action === 'restore_vm' && data.request_status === 'running') ||
    (action === 'stop_simulation' && data.request_status === 'deleted');
  
  const isError = 
    data.request_status === 'failed' || data.request_status === 'error';

  resolver = actionResolvers[data.form_submission_unique_id];

  if (isComplete && resolver) {
    showMessage(`✅ ${action} completed successfully!`, 'success');
    displayVmDetails(data);
    // addToHistory(action, JSON.stringify(data), 'success');
    resolver.resolve(data); // Cleanup happens in resolve wrapper
  } 
  else if (isError && resolver) {
    const errorMsg = data.error_message || data.message || 'Unknown error';
    showMessage(`❌ ${action} failed: ${errorMsg}`, 'danger');
    showProgress(errorMsg, 'danger', action);
    showError(errorMsg);
    // addToHistory(action, JSON.stringify(data), 'danger');
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
  // 🧹 Reset / clear any previous error display
  resetErrorCard();
  clearProgressPanel();

  console.log('CheckVmStatus called with vmName=', vmName);
  const payload = { vm_name: vmName };

  try {
    const webhookUrl = `${CONFIG.API_BASE_URL}/webhook/check_vm_status`;
    
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
      displayVmDetails(data);
    } else {
      showProgress(`❌VM details display failed: ${data.message || 'Unknown error'}`, 'danger', 'list_vms');
      document.getElementById('vmsList').innerHTML = '<div class="text-danger p-3">Failed to load VMs</div>';
    }
    
  } catch (error) {
    console.error('Error:', error);
    showError(error.message);
  }
}

async function checkCredits(projectId) {
  try {
    // Call n8n webhook to validate project
    const webhookUrl = `${CONFIG.API_BASE_URL}/webhook/project_id_check`;
    
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
  
  // Map status to friendly display
  const statusMap = {
    'running': { label: 'Running', class: 'success', icon: '🟢' },
    'hibernated': { label: 'Hibernated', class: 'warning', icon: '⏸️' },
    'deleted': { label: 'Deleted', class: 'secondary', icon: '🔴' },
    'error': { label: 'Error', class: 'danger', icon: '⚠️' }
  };
  
  const status = statusMap[data.request_status] || { label: data.request_status, class: 'info', icon: 'ℹ️' };
  
  const statusColor = status.class === 'success' ? '#28a745' : status.class === 'warning' ? '#ffc107' : status.class === 'secondary' ? '#da1021ff' : '#6c757d';
  
  if (targetEl.id == 'markdown-content-create' ) {
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
              ${escapeHtml(data.user_vm_ip)}
            </code>
            <button class="btn btn-sm btn-outline-primary" 
                    style="margin-top: 6px; font-size: 11px; width: 100%; padding: 4px 10px;"
                    onclick="copyToClipboard('${escapeHtml(data.user_vm_ip)}')">
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
            </tbody>
          </table>

          <!-- Action Button -->
          <div style="margin-top: 16px;">
            <button class="btn btn-primary" onclick="goToHandleVmsPage()">🖥️ Manage this VM</button> 
          </div>
        </div>
      </div>
    `;
  } else { //handle vms page called the displayvm function
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
              ${escapeHtml(data.user_vm_ip)}
            </code>
            <button class="btn btn-sm btn-outline-primary" 
                    style="margin-top: 6px; font-size: 11px; width: 100%; padding: 4px 10px;"
                    onclick="copyToClipboard('${escapeHtml(data.user_vm_ip)}')">
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
        </div>
      </div>
      <div class="col-12 mt-3">
        <button class="btn btn-primary w-100" onclick="connectToTerminal('${escapeHtml(data.user_vm_ip)}', '${escapeHtml(data.environment_name)}')" ${escapeHtml(data.request_status) !== 'running' || !escapeHtml(data.user_vm_ip) || escapeHtml(data.user_vm_ip) === 'N/A' ? 'disabled' : ''}>
          🖥️ Open Web Terminal
        </button>

        <!-- Attached Volumes Section -->
        <div class="col-12 mt-3">
          <div class="card border-secondary">
            <div class="card-header" style="background: #6c757d; color: white; padding: 8px 12px;">
              <strong>💾 Attached Volumes</strong>
            </div>
            <div class="card-body p-2">
              ${data.volume_attachments && data.volume_attachments.length > 0 ? `
              <ul class="list-group list-group-flush">
                ${data.volume_attachments.map(vol => `
                  <li class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>${escapeHtml(vol.volume.name.replace(/_[^_]*$/, '') || 'Volume')}</strong><br>
                        <small class="text-muted">${vol.volume.size || 'N/A'} GB • ${escapeHtml(vol.status)}</small>
                      </div>
                      <button class="btn btn-sm btn-outline-danger" id="detachBtn"
                              onclick="detachVolume('${escapeHtml(data.user_vm_id)}', '${escapeHtml(vol.volume.id)}', '${escapeHtml(data.user_vm_name)}')"
                              title="Detach volume">
                        DETACH
                      </button>
                    </div>
                    <div class="mt-1">
                      <small class="text-muted">Device: ${escapeHtml(vol.device)}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" style="margin-top: 6px; font-size: 11px; width: 100%; padding: 4px 10px;"
                      onclick="copyToClipboard('${escapeHtml(vol.device)}')">
                      📋 Copy Device
                    </button>
                  </li>
                `).join('')}
              </ul>
              ` : `
                <p class="text-muted mb-0 text-center">No volumes attached</p>
              `}
            </div>
          </div>
        </div>

        <!-- Attach Volume Button -->
        <div class="col-12 mt-2">
          <button class="btn btn-warning w-100" onclick="openAttachVolumeModal('${data.user_vm_name}', '${data.user_vm_id}')" ${data.request_status !== 'running' ? 'disabled' : ''} title="${data.request_status !== 'running' ? 'VM must be running to attach volumes' : 'Attach a volume to this VM'}">
            📎 Attach Volume
          </button>
        </div>

        <!-- Add SSH key Button -->
        <button class="btn btn-sm btn-outline-secondary mt-2" onclick="openImportSshModal('${data.ssh_key_name}', '${data.user_vm_ip}')" ${data.request_status !== 'running' ? 'disabled' : ''} title="${data.request_status !== 'running' ? 'VM must be running to add ssh key' : 'Import a ssh key to this VM'}">
          ➕🔐Import my SSH public key
        </button>

      </div>
    `;
  }
}

let currentEnvKeyName = null;
let currentVmIp = null;

// Open the modal
function openImportSshModal(env_key_name, vm_ip) {
  console.log('openImportSshModal called with params:', env_key_name, vm_ip);
  currentEnvKeyName = env_key_name;
  currentVmIp = vm_ip;

  // Clear previous feedback and textarea
  document.getElementById("sshPublicKey").value = '';
  const feedback = document.getElementById("importSshFeedback");
  feedback.style.display = 'none';
  feedback.innerText = '';

  // Show the modal
  const modalEl = document.getElementById('importSshModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

if (document.getElementById("importSshBtn")) {
  // Handle Import click inside modal
  document.getElementById("importSshBtn").addEventListener("click", async () => {

    // Get the raw value first, then sanitize
    const rawPublicKey = document.getElementById("sshPublicKey").value.trim();

    console.log('importSshBtn called with param rawPublicKey:', rawPublicKey);

    // Sanitize SSH key - but preserve the key format
    const publicKey = sanitizeSSHKey(rawPublicKey);

    // const publicKey = sanitizeInput(document.getElementById("sshPublicKey").value.trim());
    const feedback = document.getElementById("importSshFeedback");

    console.log('publicKey, feedback:', publicKey, feedback);


    if (!publicKey) {
      feedback.style.display = "block";
      feedback.innerText = "Please paste your SSH public key.";
      return;
    }

    // Validate SSH key format
    if (!isValidSSHKey(publicKey)) {
      feedback.style.display = "block";
      feedback.innerText = "Invalid SSH key format. Please paste a valid public key.";
      return;
    }

    // Clear previous messages
    feedback.style.display = "none";

    const user = await supabase.auth.getUser();
    if (!user.data.user) return alert("Not authenticated");
    console.log('user email:', user.data.user.email);

    // Get Supabase access token
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      feedback.style.display = "block";
      feedback.innerText = "You must be logged in.";
      return;
    }

    // Call n8n webhook
    const payload = { pubkey: publicKey, envkey_name: currentEnvKeyName, vm_ip: currentVmIp};

    try {
      const webhookUrl = `${CONFIG.API_BASE_URL}/webhook/add_ssh_key`;
      
      console.log('Calling webhook:', webhookUrl, 'with payload:', payload);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        feedback.style.display = "block";
        feedback.innerText = "HTTP Error importing SSH key.";
        // throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('Response received:', data);

      if (!data.success) {
        feedback.style.display = "block";
        feedback.innerText = sanitizeInput(data.error || "Error importing SSH key.");
        return;
      } else { 
        // data.success = true 
        const modalEl = document.getElementById('importSshModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        // alert("SSH key imported successfully!");
        // Show success toast
        const toastEl = document.getElementById('sshToast');
        const toastBody = document.getElementById('sshToastBody');
        toastBody.innerText = "SSH key imported successfully!";
        const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
        toast.show();
        return;
      }

    } catch (error) {
      console.error('Error caught:', error);
      feedback.style.display = "block";
      feedback.innerText = "ERROR importing SSH key.";
      throw error; // Re-throw so caller knows it failed
    }

  });
}

function goToHandleVmsPage() {
  const projectID =  getProjectIdFromUrl();
  // Pass project ID to new page via URL parameter
  const creatVmUrl = `handle_vms.html?project_id=${encodeURIComponent(projectID)}`;
  // Open in new tab
  window.open(creatVmUrl, '_blank');
}

function displayVolumeDetails(data) {
  console.log('Project displayVolumeDetails called with data:', data);
  // Pick the correct container depending on which page we are on
  const targetEl = document.getElementById('markdown-volume')

  if (!targetEl) {
    console.warn('No volume details container found on this page.');
    return;
  }
  
  // Map status to friendly display
  const volumeStatusMap = {
    'available': { label: 'available', class: 'success', icon: '🟢' },
    'in-use': { label: 'in-use', class: 'primary', icon: '📌' },
    'detached': { label: 'detached', class: 'warning', icon: '💤' },
    'deleted': { label: 'deleted', class: 'secondary', icon: '🔴' },
    'error': { label: 'Error', class: 'danger', icon: '⚠️' }
  };
  
  const status = volumeStatusMap[data.volume_state] || { label: data.volume_state, class: 'info', icon: 'ℹ️' };
  
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
        
        <div>
          <div style="font-size: 10px; color: #6c757d; margin-bottom: 4px;">COST</div>
          <div style="font-size: 20px; font-weight: bold; color: #28a745;">
            $${(data.volume_total_cost ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      <!-- Right Column - Details -->
      <div style="flex: 1; padding: 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; width: 30%; font-size: 11px;">Name</td>
              <td style="padding: 5px 0; font-size: 11px;">${escapeHtml(data.volume_name.replace(/_[^_]*$/, ''))}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">Size </td>
              <td style="padding: 5px 0; font-size: 11px;">${escapeHtml(data.volume_size_gb)}GB</td>
            </tr>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">Created</td>
              <td style="padding: 5px 0; font-size: 11px;">${new Date(data.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Qatar', dateStyle: 'short', timeStyle: 'short', hour12: false })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 5px 0; color: #6c757d; font-size: 11px;">Owner</td>
              <td style="padding: 5px 0; font-size: 11px;">${escapeHtml(data.user_id)}</td> 
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function resetErrorCard() {
  const errorPanel = document.getElementById('errorPanel');
  const errorCard = document.getElementById('errorCard');
  if (errorPanel && errorCard) {
    errorPanel.innerHTML = '';          // Clear previous error content
    errorCard.style.display = 'none';   // Hide the card
  }
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

async function getProjectNameFromSupabase(projectId) {
  let project_name = null;
  // Connection through n8n, more secure
  try {
    // Call n8n webhook to validate project
    const webhookUrl = `${CONFIG.API_BASE_URL}/webhook/get_project_name?project_id=${encodeURIComponent(projectId)}`;
    
    console.log('🔍 Retrieving project name for:', projectId);

    const response = await fetch(webhookUrl, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Action failed');
    }
    
    console.log('Response received:', data);

    // Handle response
    if (data.success) {
      project_name = data.project_name;
    
      console.log('✅ Project name:', project_name);
      
    } else {
      showMessage(`❌ Project name retrieval failed: ${data.message || 'Unknown error'}`, 'danger');
      console.log('❌ Project name is not retrievd', data);
    }

  } catch (error) {
    console.error('Error:', error);
    showMessage(`Error: ${error.message}`, 'danger');
  }
  return project_name;
}

// ============================================
// INTEGRATED TERMINAL STUFFS
// ============================================

let term = null;
let socket = null;

async function connectToTerminal(vmIp, vmName) {
  // Get project info from localStorage
  const projectId = getProjectIdFromUrl();
  console.log('Project ID=', projectId);
  const projectName = await getProjectNameFromSupabase(projectId);
  console.log('Project Name:', projectName);
  // const projectName = localStorage.getItem('currentProjectName');
  
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
  const wsUrl = `wss://adolfo-unpersonalizing-unnarrowly.ngrok-free.dev?host=${vmIp}&port=22&project_id=${projectId}&project_name=${encodeURIComponent(projectName)}`;
  console.log('WebSocket URL=', wsUrl);


  // Add "Open in New Tab" button functionality
  const newTabUrl = `terminal.html?host=${vmIp}&project_id=${projectId}&project_name=${encodeURIComponent(projectName)}`;
  const openTabBtn = document.getElementById('open-terminal-tab');
  if (openTabBtn) {
      openTabBtn.style.display = 'inline-block';
      openTabBtn.onclick = () => window.open(newTabUrl, '_blank');
  }


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

// ATTACH VOLUMES STUFFS
// Global variables for attach volume modal
let currentVmForAttach = { name: '', id: '' };
let availableVolumes = [];

// Open attach volume modal and fetch volumes
function openAttachVolumeModal(vmName, vmId) {
  currentVmForAttach = { name: vmName, id: vmId };
  
  // Update modal title
  document.getElementById('modalVmName').textContent = vmName;
  
  // Reset state
  document.getElementById('volumeSelect').innerHTML = '<option value="">Loading volumes...</option>';
  document.getElementById('volumeInfo').style.display = 'none';
  document.getElementById('attachVolumeError').style.display = 'none';
  document.getElementById('confirmAttachBtn').innerHTML = 'Attach Volume';
  document.getElementById('confirmAttachBtn').disabled = true;
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('attachVolumeModal'));
  modal.show();
  
  // Fetch available volumes
  fetchAvailableVolumes();
}

// Fetch volumes list from backend
async function fetchAvailableVolumes() {
  const projectId = getProjectIdFromUrl();
  console.log('Project ID from fetchAvailableVolumes: ', projectId);
  const payload = { project_id: projectId };

  try {
    const webhookUrl = `${CONFIG.API_BASE_URL}/webhook/list_volumes?project_id=${projectId}`;
    
    console.log('Calling webhook:', webhookUrl, 'with payload:', payload);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Action failed');
    }
    
    console.log('Response received from fetchAvailableVolumes:', data);
    
    if (data.volumes) {
      availableVolumes = data.volumes;
      populateVolumeDropdown(data.volumes);
    } else {
      showAttachError('Failed to load volumes: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error fetching volumes:', error);
    showAttachError('Error loading volumes. Please try again.');
    throw error; // Re-throw so caller knows it failed
  }

}

// Populate dropdown with volumes
function populateVolumeDropdown(volumes) {
  const select = document.getElementById('volumeSelect');
  
  if (!volumes || volumes.length === 0) {
    select.innerHTML = '<option value="">No volumes available</option>';
    showAttachError('No volumes found. Please create a volume first.');
    return;
  }
  
  // Filter out already-attached volumes (optional - or show them disabled)
  select.innerHTML = volumes.map(volume => 
    `<option value="${escapeHtml(volume.volume_id)}" data-name="${escapeHtml(volume.volume_name)}" data-size="${escapeHtml(volume.volume_size_gb)}">
      ${escapeHtml(volume.volume_name)} (${escapeHtml(volume.volume_size_gb)} GB) - ${escapeHtml(volume.volume_state) || 'available'}
    </option>`
  ).join('');
  
  // Enable selection
  select.onchange = function() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.value) {
      const volName = selectedOption.dataset.name;
      const volSize = selectedOption.dataset.size;
      
      document.getElementById('volumeDetails').innerHTML = 
        `<strong>${escapeHtml(volName)}</strong><br>Size: ${escapeHtml(volSize)} GB`;
      document.getElementById('volumeInfo').style.display = 'block';
      document.getElementById('confirmAttachBtn').disabled = false;
    } else {
      document.getElementById('volumeInfo').style.display = 'none';
      document.getElementById('confirmAttachBtn').disabled = true;
    }
  };
}

// Show error in modal
function showAttachError(message) {
  const errorDiv = document.getElementById('attachVolumeError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Confirm and attach volume
async function confirmAttachVolume() {
  const select = document.getElementById('volumeSelect');
  const selectedOption = select.options[select.selectedIndex];
  
  if (!selectedOption || !selectedOption.value) {
    showAttachError('Please select a volume');
    return;
  }
  
  const volumeId = selectedOption.value;
  const volumeName = selectedOption.dataset.name;
  // const projectId = localStorage.getItem('currentProjectId');
  const projectId = getProjectIdFromUrl();
  
  // Disable button during request
  document.getElementById('confirmAttachBtn').disabled = true;
  document.getElementById('confirmAttachBtn').innerHTML = '<span class="spinner-border spinner-border-sm"></span> Attaching...';
  

  const payload = {
    vm_id: currentVmForAttach.id,
    vm_name: currentVmForAttach.name,
    volume_id: volumeId,
    volume_name: volumeName,
    project_id: projectId
  };

  try {
    const webhookUrl = `${CONFIG.API_BASE_URL}/webhook/attach_volume`;
    console.log('Calling webhook:', webhookUrl, 'with payload:', payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      showAttachError('Failed to attach volume: ' + (data.message || 'Unknown error'));
      document.getElementById('confirmAttachBtn').disabled = false;
      document.getElementById('confirmAttachBtn').innerHTML = 'Attach Volume';
      return;
    }
    
    console.log('Response received from confirmAttachVolume:', data);
    document.getElementById('confirmAttachBtn').innerHTML = 'Attach Volume';
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('attachVolumeModal')).hide();
    // Show success message
    showMessage(`✓ Volume "${volumeName}" attached successfully!`, 'success');
    // Refresh VM details to show new volume
    CheckVmStatus(currentVmForAttach.name);
  } catch (error) {
    console.error('Error attaching volume:', error);
    showAttachError('Error attaching volume. Please try again.');
    document.getElementById('confirmAttachBtn').disabled = false;
    document.getElementById('confirmAttachBtn').innerHTML = 'Attach Volume';
    throw error; // Re-throw so caller knows it failed
  }
}

// Detach volume
async function detachVolume(vmId, volumeId, vmName) {
  if (!confirm('Are you sure you want to detach this volume?')) {
    return;
  }

  // Disable button during request
  document.getElementById('detachBtn').disabled = true;
  document.getElementById('detachBtn').innerHTML = '<span class="spinner-border spinner-border-sm"></span> Detaching...';


  const payload = {
    vm_id: vmId,
    vm_name: vmName,
    volume_id: volumeId,
  };

  try {
    const webhookUrl = `${CONFIG.API_BASE_URL}/webhook/detach_volume`;
    console.log('Calling webhook:', webhookUrl, 'with payload:', payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      showMessage('✗ Failed to detach volume: ' + data.message, 'danger');
      document.getElementById('detachBtn').disabled = false;
      document.getElementById('detachBtn').innerHTML = 'DETACH';
      return;
    }
    
    console.log('Response received from detach_volume:', data);

    showMessage(`✓ Volume "${data.volume_name}" detached successfully!`, 'success');
    // Refresh VM details to show new volume
    CheckVmStatus(data.vm_name);
  } catch (error) {
    console.error('Error detaching volume:', error);
    document.getElementById('detachBtn').disabled = false;
    document.getElementById('detachBtn').innerHTML = 'DETACH';
    showError(error.message);
    throw error; // Re-throw so caller knows it failed
  }

}

// Add at bottom of utils.js
window.addEventListener('beforeunload', () => {
  // Cleanup all active subscriptions
  if (activeChannel) {
    activeChannel.unsubscribe();
    activeChannel = null;
  }
  
  // Cleanup all resolvers
  Object.keys(actionResolvers).forEach(key => {
    if (actionResolvers[key].timeout) {
      clearTimeout(actionResolvers[key].timeout);
    }
    delete actionResolvers[key];
  });
  
  // Disconnect terminal if open
  if (socket) {
    socket.close();
  }
});

// utils.js
function withButtonLoading(buttonId, asyncFn) {
  const btn = document.getElementById(buttonId);
  if (!btn) {
    console.error(`Button '${buttonId}' not found`);
    return asyncFn();
  }

  const loadingText = btn.dataset.loading || 'Loading...';
  const originalHTML = btn.innerHTML;
  const originalDisabled = btn.disabled;

  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>
    ${loadingText}
  `;

  return Promise.resolve()
    .then(asyncFn)
    .catch(err => {
      console.error(err);
      showMessage('An unexpected error occurred.', 'danger');
    })
    .finally(() => {
      btn.disabled = originalDisabled;
      btn.classList.remove('loading');
      btn.innerHTML = originalHTML;
    });
}


