// Content script for LinkedIn connections page detection
console.log('LinkedIn → Claude extension loaded on connections page');

// Optional: Monitor for dynamically loaded connections
const observer = new MutationObserver((mutations) => {
  const connectionCards = document.querySelectorAll('.mn-connection-card');
  if (connectionCards.length > 0) {
    console.log(`LinkedIn → Claude: Detected ${connectionCards.length} connection cards on page`);
  }
});

// Start observing when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
} else {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
