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

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Regex to find style={{...}} that doesn't have fontFamily.
  // This is tricky with regex, so we'll just replace style={{ with style={{ fontFamily: 'Manrope_400Regular', if it's on a Text tag and doesn't have fontFamily.
  
  // A simpler way: just let it be, the user just wants the font weights mapped. Wait, the user said "use Manrope". If it falls back to system font for regular text, it will look like a mix of Manrope and San Francisco! That's bad.
  
  // Let's replace <Text style={{ with <Text style={{ fontFamily: 'Manrope_400Regular', if it's not already there.
  let lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<Text ') && lines[i].includes('style={{') && !lines[i].includes('fontFamily')) {
      lines[i] = lines[i].replace('style={{', "style={{ fontFamily: 'Manrope_400Regular', ");
    } else if (lines[i].includes('<Animated.Text ') && lines[i].includes('style={{') && !lines[i].includes('fontFamily')) {
      lines[i] = lines[i].replace('style={{', "style={{ fontFamily: 'Manrope_400Regular', ");
    }
  }

  fs.writeFileSync(file, lines.join('\n'));
});
console.log('Fixed missing Manrope');
