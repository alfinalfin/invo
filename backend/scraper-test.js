const target = 'Newcastle Logistics Ltd';
fetch(`https://html.duckduckgo.com/html/?q=site:linkedin.com/in/+"${encodeURIComponent(target)}"`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
})
.then(r=>r.text())
.then(html => {
  const linkRegex = /<a[^>]+class="result__url"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const titleRegex = /<a[^>]+class="result__snippet[^>]*>([^<]+)<\/a>/g;
  
  // Just use a simpler split
  const blocks = html.split('result__snippet');
  console.log('Result blocks:', blocks.length);
  
  const matches = [...html.matchAll(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)/g)];
  for (const m of matches) {
      const decoded = decodeURIComponent(m[1]);
      if (decoded.includes('linkedin.com/in/')) {
          console.log('Found LinkedIn:', decoded);
          return;
      }
  }
  console.log('No matches');
});
