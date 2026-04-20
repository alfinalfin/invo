import fs from 'fs';

const target = 'Newcastle Logistics Ltd';
fetch('https://html.duckduckgo.com/html/?q=site:linkedin.com/in/+"Newcastle Logistics Ltd"', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' }
})
.then(r=>r.text())
.then(html => {
  fs.writeFileSync('ddg.html', html);
  console.log('Saved length:', html.length);
});
