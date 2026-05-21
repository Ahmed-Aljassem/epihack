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
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components')];

const map = {
  '300': 'Manrope_300Light',
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
  '800': 'Manrope_800ExtraBold',
};

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  for (let w in map) {
    let re = new RegExp(`fontWeight:\\s*['"]${w}['"]`, 'g');
    code = code.replace(re, `fontFamily: '${map[w]}'`);
  }

  code = code.replace(/fontWeight:\s*([a-zA-Z0-9_.]+(\s*\|\|\s*[a-zA-Z0-9_.]+)?)\s*\?\s*['"]700['"]\s*:\s*['"]600['"]/g, 
    "fontFamily: $1 ? 'Manrope_700Bold' : 'Manrope_600SemiBold'");
    
  code = code.replace(/fontWeight:\s*([a-zA-Z0-9_.]+(\s*\|\|\s*[a-zA-Z0-9_.]+)?)\s*\?\s*['"]700['"]\s*:\s*['"]500['"]/g, 
    "fontFamily: $1 ? 'Manrope_700Bold' : 'Manrope_500Medium'");
    
  code = code.replace(/fontWeight:\s*([a-zA-Z0-9_.]+(\s*\|\|\s*[a-zA-Z0-9_.]+)?)\s*\?\s*['"]600['"]\s*:\s*['"]500['"]/g, 
    "fontFamily: $1 ? 'Manrope_600SemiBold' : 'Manrope_500Medium'");

  fs.writeFileSync(file, code);
  console.log(`Updated ${file}`);
});
