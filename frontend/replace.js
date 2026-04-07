const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace hex colors with CSS variables
    content = content.replace(/#e2e8f0/ig, 'var(--border-color)');
    content = content.replace(/#f1f5f9/ig, 'var(--border-color)');
    content = content.replace(/#f8fafc/ig, 'var(--bg-secondary)');
    content = content.replace(/#eff6ff/ig, 'var(--primary-light)');
    content = content.replace(/#fff5f5/ig, 'var(--danger-light)');
    content = content.replace(/#fee2e2/ig, 'var(--danger-light)');
    content = content.replace(/#e0f2fe/ig, 'var(--primary-light)');
    
    // Replace hardcoded white background
    content = content.replace(/backgroundColor:\s*["']#fff["']/ig, 'backgroundColor: "var(--card-bg)"');
    content = content.replace(/background:\s*["']#fff["']/ig, 'background: "var(--card-bg)"');
    
    // Replace hardcoded text colors 
    content = content.replace(/color:\s*["']#0f172a["']/ig, 'color: "var(--text-main)"');
    content = content.replace(/backgroundColor:\s*["']#0f172a["']/ig, 'backgroundColor: "var(--bg-secondary)"');

    fs.writeFileSync(file, content);
});
console.log(`Replaced colors in ${files.length} files.`);
