const fs = require('fs');
let code = fs.readFileSync('utils/i18n.ts', 'utf8');

// Add new strings to EN
code = code.replace(/see_all: 'See all reports'/, 
  "see_all: 'See all reports', p_prof: 'Profile', p_anon: 'Anonymous Reporter', p_signup: 'Sign Up', p_impact: 'Your impact', p_rec: 'Recent reports', p_no_rep: 'No reports yet', p_sent: 'Sent', p_set: 'Settings', p_lang: 'Language', p_loc: 'Location', p_notif: 'Notifications', p_app: 'Appearance', p_about: 'About', p_how: 'How OneHealth Works', p_priv: 'Privacy Policy', p_ai: 'How Our AI Works', p_feed: 'Send Feedback', p_logout: 'Log Out'");

// Add new strings to ES
code = code.replace(/see_all: 'Ver todos los reportes'/, 
  "see_all: 'Ver todos los reportes', p_prof: 'Perfil', p_anon: 'Reportador Anónimo', p_signup: 'Regístrate', p_impact: 'Tu impacto', p_rec: 'Reportes recientes', p_no_rep: 'Sin reportes', p_sent: 'Enviado', p_set: 'Ajustes', p_lang: 'Idioma', p_loc: 'Ubicación', p_notif: 'Notificaciones', p_app: 'Apariencia', p_about: 'Acerca de', p_how: 'Cómo funciona', p_priv: 'Privacidad', p_ai: 'Nuestra IA', p_feed: 'Enviar comentarios', p_logout: 'Cerrar Sesión'");

// Add new strings to TO
code = code.replace(/see_all: 'Ñei'/, 
  "see_all: 'Ñei', p_prof: 'Profile', p_anon: 'Pi-mah o\\'ohan', p_signup: 'O\\'ohan', p_impact: 'Ap s-ap', p_rec: 'O\\'ohan m-ap', p_no_rep: 'Pi o\\'ohan', p_sent: 'Sent', p_set: 'Settings', p_lang: 'Ñiok', p_loc: 'Hebai', p_notif: 'Notifs', p_app: 'Appearance', p_about: 'About', p_how: 'How OneHealth Works', p_priv: 'Privacy', p_ai: 'AI', p_feed: 'Feedback', p_logout: 'Log Out'");

fs.writeFileSync('utils/i18n.ts', code);
