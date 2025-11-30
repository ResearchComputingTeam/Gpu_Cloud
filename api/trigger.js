<script src="js/config.js"></script>
export default async function handler(req, res) {
  // Enable CORS - allows requests from your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Extract parameters
    const { request_id, action } = req.query;
    
    if (!request_id) {
      return res.status(400).json({ error: 'request_id is required' });
    }
    
    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }
    
    // Map actions to n8n webhook paths
    const webhookPaths = {
      'run_simulation': '/webhook/run_simulation',
      'pause_simulation': '/webhook/pause_simulation',
      'resume_simulation': '/webhook/resume_simulation',
      'stop_simulation': '/webhook/stop_simulation',
      'show_credits': '/webhook/show_credits'
    };
    
    const webhookPath = webhookPaths[action];
    
    if (!webhookPath) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Build n8n URL
    const n8nUrl = `${CONFIG.API_BASE_URL}${webhookPath}?request_id=${request_id}`;
    
    console.log('Calling n8n:', n8nUrl);
    
    // Forward request to n8n
    const n8nResponse = await fetch(n8nUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify({ request_id }) : undefined
    });
    
    // Get response from n8n
    const data = await n8nResponse.json();
    
    // Return n8n's response to the frontend
    return res.status(n8nResponse.status).json(data);
    
  } catch (error) {
    console.error('Error calling n8n:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger workflow',
      message: error.message 
    });
  }
}
