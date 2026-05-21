const fs = require('fs');

let code = fs.readFileSync('components/flows/ReportFlow.tsx', 'utf8');

// We'll just generate the entire new file to be safe, but we can also use replace if it's easier.
// Since it's 600+ lines, I'll use multi_replace_file_content to replace large blocks.
