const fs = require('fs');

let code = fs.readFileSync('utils/i18n.ts', 'utf8');

// Add new strings to EN
code = code.replace(/map_stats: 'State Stats', total_rep: 'Total Reports', top_iss: 'Top Issue'/, 
  "map_stats: 'State Stats', total_rep: 'Total Reports', top_iss: 'Top Issue', based_on: 'Based on 47 reports this week', respiratory: 'Respiratory anomaly in', risk: 'Elevated risk — next 5 days', start_rep: 'Start reporting weekly', rep_sub_toast: 'Report submitted!', thanks_comm: 'Thank you for protecting your community', see_all: 'See all reports'");

// Add new strings to ES
code = code.replace(/map_stats: 'Estadísticas', total_rep: 'Reportes Totales', top_iss: 'Problema Principal'/, 
  "map_stats: 'Estadísticas', total_rep: 'Reportes Totales', top_iss: 'Problema Principal', based_on: 'Basado en 47 reportes esta semana', respiratory: 'Anomalía respiratoria en', risk: 'Riesgo elevado - próximos 5 días', start_rep: 'Comienza a reportar cada semana', rep_sub_toast: '¡Reporte enviado!', thanks_comm: 'Gracias por proteger a tu comunidad', see_all: 'Ver todos los reportes'");

// Add new strings to TO
code = code.replace(/map_stats: 'Stats', total_rep: 'Total', top_iss: 'Ge\'e'/, 
  "map_stats: 'Stats', total_rep: 'Total', top_iss: 'Ge\\'e', based_on: '47 o\\'ohan i:da domig', respiratory: 'I:ho s-ko:k hebai', risk: 'Ge\\'e s-ko:k — 5 task', start_rep: 'O\\'ohan vepag domig', rep_sub_toast: 'O\\'ohan m-ap!', thanks_comm: 'M-s-ap\\'e hemaajkam', see_all: 'Ñei'");

fs.writeFileSync('utils/i18n.ts', code);
