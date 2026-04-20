import fs from 'fs';

const html = fs.readFileSync('ddg.html', 'utf8');

// A much simpler and robust approach: split by the result block class
const blocks = html.split('class="result__body links_main links_deep"');

for (const block of blocks) {
    if (block.includes('linkedin.com/in/')) {
        // Find the URL
        const urlMatch = block.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)/);
        if (urlMatch) {
            const url = decodeURIComponent(urlMatch[1]);
            // Find the title text
            const titleMatch = block.match(/<a class="result__url" href="[^"]+">([^<]+)<\/a>/);
            // Wait, result__url usually contains the URL text (e.g., linkedin.com › in › johndoe). 
            // The actual title is usually in a class="result__a"
            const titleA = block.match(/<a class="result__a"[^>]*>([^<]+)<\/a>/);
            
            console.log('Match URL:', url);
            console.log('Match Title:', titleA ? titleA[1] : 'No Title');
            break;
        }
    }
}
