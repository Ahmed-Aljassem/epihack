const fs = require('fs');

let code = fs.readFileSync('utils/i18n.ts', 'utf8');
code = code.replace(/map_stats: 'State Stats'/, "map_stats: 'State Stats', map_nearby: 'Nearby'");
code = code.replace(/map_stats: 'Estadísticas'/, "map_stats: 'Estadísticas', map_nearby: 'Cercano'");
code = code.replace(/map_stats: 'Stats'/, "map_stats: 'Stats', map_nearby: 'M-we:hejed'");
fs.writeFileSync('utils/i18n.ts', code);
