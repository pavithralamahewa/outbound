// DOM elements
const extractBtn = document.getElementById('extractBtn');
const copyBtn = document.getElementById('copyBtn');
const counter = document.getElementById('counter');
const status = document.getElementById('status');

// State
let connections = [];
let formattedPrompt = '';

// Extract connections from LinkedIn
async function extractConnections() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if we're on LinkedIn connections page
    if (!tab.url || !tab.url.includes('linkedin.com/mynetwork/invite-connect/connections')) {
      showStatus('Please navigate to LinkedIn Connections page first', 'error');
      return;
    }

    showStatus('Extracting connections...', 'info');
    extractBtn.disabled = true;

    // Inject script to extract connections
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeConnections
    });

    if (results && results[0] && results[0].result) {
      connections = results[0].result;

      if (connections.length === 0) {
        showStatus('No connections found. Try scrolling down to load more.', 'error');
        extractBtn.disabled = false;
        return;
      }

      // Update counter
      counter.textContent = connections.length;

      // Format prompt
      formattedPrompt = formatPromptForClaude(connections);

      // Enable copy button
      copyBtn.disabled = false;

      showStatus(`Successfully extracted ${connections.length} connections!`, 'success');
    } else {
      showStatus('Failed to extract connections. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Extraction error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    extractBtn.disabled = false;
  }
}

// Scrape connections from the page (injected into LinkedIn page)
function scrapeConnections() {
  const connectionCards = document.querySelectorAll('.mn-connection-card');
  const extracted = [];

  connectionCards.forEach(card => {
    try {
      // Extract name
      const nameElement = card.querySelector('.mn-connection-card__name');
      const name = nameElement ? nameElement.textContent.trim() : '';

      // Extract title/occupation
      const occupationElement = card.querySelector('.mn-connection-card__occupation');
      const title = occupationElement ? occupationElement.textContent.trim() : '';

      // Extract profile URL
      const profileLink = card.querySelector('a[href*="/in/"]');
      const profileUrl = profileLink ? profileLink.href : '';

      // Only add if we have at least a name and URL
      if (name && profileUrl) {
        extracted.push({
          name,
          title,
          profileUrl
        });
      }
    } catch (e) {
      console.error('Error extracting connection:', e);
    }
  });

  return extracted;
}

// Format connections for Claude analysis
function formatPromptForClaude(connections) {
  const prompt = `Here's a batch of my LinkedIn connections. For each person:

1) Visit their LinkedIn profile URL
2) Visit their company website (if findable)
3) Score them 1-10 for ICP fit (premium UX agency: AI products, mobile apps, subscription platforms, EdTech)
4) Note: Product? Decision-maker? Growth signals?

Return a table: Name | Company | ICP Score | Has Product? | Decision Maker? | Growth Signals | Quick Notes

CONNECTIONS (${connections.length} total):

${connections.map((conn, index) => {
  return `${index + 1}. ${conn.name}
   Title: ${conn.title || 'Not specified'}
   Profile: ${conn.profileUrl}`;
}).join('\n\n')}

Process these and give me the scored table.`;

  return prompt;
}

// Copy to clipboard
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedPrompt);
    showStatus('Copied to clipboard! Paste into Claude.', 'success');
  } catch (error) {
    console.error('Copy error:', error);
    showStatus(`Failed to copy: ${error.message}`, 'error');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  status.textContent = message;
  status.className = `status ${type}`;
  status.classList.remove('hidden');
}

// Event listeners
extractBtn.addEventListener('click', extractConnections);
copyBtn.addEventListener('click', copyToClipboard);

// Initialize
showStatus('Click "Extract Connections" to start', 'info');
