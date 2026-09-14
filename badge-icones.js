/* NBA 2K27 Build Lab — Icônes des badges
   Créations originales du site, dans l'esprit du jeu pour s'y retrouver :
   un écusson à la couleur de la catégorie (comme dans NBA 2K27), un contour
   à la couleur du palier atteint, et un pictogramme propre à chaque badge,
   tiré de son effet. Les icônes du jeu ne sont pas reproduites (droits 2K).

   iconeBadge(nom, categorie, palier) → chaîne SVG
     nom        nom officiel anglais (clé de badgeDefs)
     categorie  Finition | Tir | Création | Défense | Rebond | Physique
     palier     0 non débloqué · 1 bronze · 2 argent · 3 or · 4 Hall of Fame
*/
(function(){
  // Couleurs des catégories, reprises de l'écran des insignes du jeu.
  const COULEURS={
    Finition:['#1D5FD6','#3F8CFF'], Tir:['#138A45','#27C265'], 'Création':['#C8561A','#FF8A3D'],
    'Défense':['#B3203F','#F2456B'], Rebond:['#5530C4','#8B64FF'], Physique:['#B98A12','#F2C230']
  };
  const PALIERS=['#4A4F58','#C9803F','#C5CCD6','#F2C94C','#B36BFF'];

  // Pictogrammes 24×24, tracés au trait blanc. Un par badge.
  const T=(d,extra)=>`<path d="${d}"${extra||''}/>`;
  const C=(cx,cy,r,extra)=>`<circle cx="${cx}" cy="${cy}" r="${r}"${extra||''}/>`;
  const plein=' fill="#fff" stroke="none"';
  const P={
    // Tir
    'Arc Cadence':      T('M3 18C6 8 18 8 21 18')+T('M17 6l4 1-1 4')+T('M7 6L3 7l1 4'),
    'Deadeye':          T('M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7z')+C(12,12,3,plein),
    'Limitless Range':  T('M12 12c-2-3-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1 6-4zm0 0c2 3 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1-6 4z'),
    'Mini Marksman':    C(12,14,7)+C(12,14,3)+T('M12 2v6M9 5l3-3 3 3'),
    'Post Fade Phenom': T('M6 20h12')+T('M14 18L8 6')+T('M6 9l2-3 3 1')+C(17,6,2),
    'Quick Trigger':    C(12,13,8)+T('M12 13V8M10 2h4M18 6l1.5-1.5'),
    'Set and Fire':     T('M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-6 1-9z'),
    'Smooth Operator':  T('M2 12c3-4 5-4 7 0s4 4 7 0 4-4 6-2')+T('M2 17c3-4 5-4 7 0s4 4 7 0 4-4 6-2'),
    'Static Middy':     T('M8 21h8L13 3h-2z')+T('M12 16l5-8')+C(17,7,1.5,plein),
    // Création
    'Ankle Assassin':   T('M9 3v9l-4 4h8')+T('M14 9l3 3-3 3 3 3'),
    'Bail Out':         C(12,12,8)+C(12,12,3.5)+T('M6.5 6.5l3 3M17.5 6.5l-3 3M6.5 17.5l3-3M17.5 17.5l-3-3'),
    'Break Starter':    T('M3 19L20 5')+T('M13 5h7v7')+T('M3 13v6h6'),
    'Dimer':            T('M4 18c4-10 10-12 14-12')+T('M14 3l4 3-3 4')+T('M18 15l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L14 17.3l2-.3z',plein),
    'Handles for Days': C(12,15,5)+T('M12 10v10M7 15h10')+T('M4 6c2-3 5-3 8 0s6 3 8 0'),
    'Lightning Launch': T('M13 2L5 14h6l-2 8 9-12h-6z',plein),
    'Pace':             T('M3 17a9 9 0 0 1 18 0')+T('M12 17l5-6')+C(12,17,1.5,plein),
    'Strong Handle':    T('M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z')+C(12,12,3.5),
    'Unpluckable':      T('M7 11V8a5 5 0 0 1 10 0v3')+T('M5 11h14v10H5z')+C(12,16,1.8,plein),
    'Versatile Visionary': T('M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7z')+T('M12 8l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.5-2.5 1.5.6-2.8L8 10.9l2.8-.3z',plein),
    // Finition
    'Aerial Wizard':    T('M12 14c-4-1-8-4-9-9 3 1 6 1 9 4 3-3 6-3 9-4-1 5-5 8-9 9z')+C(12,19,2.5),
    'Float Game':       T('M3 20C5 8 15 4 21 8')+C(20,8,2,plein)+T('M3 20h4'),
    'Ghost Stepper':    T('M6 21V10a6 6 0 0 1 12 0v11l-2-2-2 2-2-2-2 2-2-2z')+C(10,11,1,plein)+C(14,11,1,plein),
    'Hook Specialist':  T('M16 3v10a5 5 0 0 1-10 0v-1')+T('M4 14l2-2 2 2'),
    'Layup Mixmaster':  T('M12 12m-2 0a2 2 0 1 0 4 0 4 4 0 1 0-8 0 6 6 0 1 0 12 0 8 8 0 1 0-16 0'),
    'Paint Prodigy':    T('M6 3h12v18H6z')+T('M6 13h12')+C(12,13,3),
    'Physical Finisher':T('M12 2l2 6 6-2-4 5 5 3-6 1 1 6-4-4-4 4 1-6-6-1 5-3-4-5 6 2z'),
    'Post Powerhouse':  T('M7 11V6a2 2 0 0 1 4 0v4M11 9V5a2 2 0 0 1 4 0v5M15 10V7a2 2 0 0 1 4 0v6c0 5-3 8-7 8-3 0-6-2-7-6l-1-3a2 2 0 0 1 3-1z'),
    'Post Spin Catalyst': T('M4 12a8 8 0 0 1 14-5')+T('M18 3v4h-4')+T('M20 12a8 8 0 0 1-14 5')+T('M6 21v-4h4'),
    'Posterizer':       T('M4 8h16')+T('M6 8l2 6h8l2-6')+T('M12 22V13')+T('M9 16l3-3 3 3'),
    'Rise Up':          T('M12 21V6')+T('M6 11l6-6 6 6')+T('M4 3h16'),
    // Défense
    'Ankle Braces':     T('M9 2v11l-4 4v4h10v-4l-2-2V2')+T('M8 9h6M8 12h6'),
    'Challenger':       T('M8 21v-8l-2-5a1.5 1.5 0 0 1 3-1l1 3V4a1.5 1.5 0 0 1 3 0v6V3a1.5 1.5 0 0 1 3 0v8l1-2a1.5 1.5 0 0 1 3 1l-2 7-3 4z'),
    'Glove':            T('M6 21v-9L4 7a1.5 1.5 0 0 1 3-1l1 3V3.5a1.5 1.5 0 0 1 3 0V9V3a1.5 1.5 0 0 1 3 0v6-4a1.5 1.5 0 0 1 3 0v10c0 3-2 6-6 6z')+T('M6 17h11'),
    'High-Flying Denier': T('M12 3l7 3v6c0 4-3 8-7 9-4-1-7-5-7-9V6z')+T('M2 9l4 2M22 9l-4 2')+T('M12 8v8M9 11l3-3 3 3'),
    'Immovable Enforcer': T('M12 3v18')+C(12,5,2)+T('M4 13c0 5 4 8 8 8s8-3 8-8')+T('M4 13h3M17 13h3'),
    'Interceptor':      T('M3 16C8 8 16 8 21 16')+T('M12 4v16')+T('M9 7l3-3 3 3'),
    'Off-Ball Pest':    C(12,13,4)+T('M12 9V5M9 6l-2-2M15 6l2-2M8 13H3M21 13h-5M9 17l-3 3M15 17l3 3'),
    'Paint Patroller':  C(12,12,9)+C(12,12,4)+T('M12 12l6-6'),
    'Pick Dodger':      T('M11 3v18')+T('M4 18c0-6 3-9 8-9s8 3 8 9')+T('M17 15l3 3 3-3'),
    'Post Lockdown':    T('M8 10V7a4 4 0 0 1 8 0v3')+T('M4 10h16v11H4z')+T('M9 15.5l2 2 4-4'),
    'Seatbelt':         T('M4 4l16 16')+T('M9 11h6v6H9z')+T('M12 13v2'),
    'Wall Up':          T('M5 21V9l-1-5M19 21V9l1-5')+T('M5 12h14')+T('M9 21v-6h6v6'),
    // Rebond
    'Boxout Boss':      T('M3 7l9-4 9 4-9 4z')+T('M3 7v10l9 4 9-4V7')+T('M12 11v10'),
    'Breaker':          T('M4 4h16v16H4z')+T('M12 4l-2 5 4 3-3 3 2 5'),
    'Crasher':          T('M5 6h14')+T('M7 6l2 5h6l2-5')+C(12,18,3.5)+T('M12 14.5V12'),
    'Possession Closer':T('M5 13V8a1.5 1.5 0 0 1 3 0v3V5a1.5 1.5 0 0 1 3 0v6V6a1.5 1.5 0 0 1 3 0v6c0 5-3 9-7 9')+C(17,8,4),
    'Sync Snatcher':    C(12,13,8)+T('M12 13V8l3 2')+T('M9 2h6'),
    // Physique
    'Brick Wall':       T('M3 5h18v14H3z')+T('M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19'),
    'Bruiser':          T('M4 15c0-4 2-6 5-6 1-3 4-4 6-2 3 0 5 3 5 6 0 4-3 7-8 7s-8-2-8-5z')+T('M9 9c1 2 3 3 6 2'),
    'Flash':            T('M3 8h7M2 12h6M3 16h7')+T('M16 3l-4 9h4l-2 9 7-11h-4l2-7z',plein),
    'Pogo Stick':       T('M12 2v4')+T('M7 6h10l-10 3h10L7 12h10L7 15h10')+T('M12 15v7')+T('M9 22h6'),
    'Slippery Off-Ball':T('M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z')+T('M9 15a3 3 0 0 0 3 3'),
    'Work Horse':       T('M6 3v9a6 6 0 0 0 12 0V3')+T('M6 6h3M15 6h3M6 10h3M15 10h3')
  };
  // Repli pour un badge absent de la liste (nouveau badge de saison).
  const REPLI=C(12,12,8)+T('M12 4v16M4 12h16');

  function iconeBadge(nom,categorie,palier){
    const [fonce,clair]=COULEURS[categorie]||['#3A3F48','#6B7280'];
    const niveau=Math.max(0,Math.min(4,palier|0));
    const verrou=niveau===0;
    return `<svg class="badge-icone${verrou?' verrouille':''}" viewBox="0 0 32 34" role="img" aria-hidden="true" focusable="false">`+
      `<path d="M16 1.5 29.5 6.5V17c0 8.2-5.6 13.6-13.5 15.8C8.1 30.6 2.5 25.2 2.5 17V6.5z" fill="${fonce}" stroke="${PALIERS[niveau]}" stroke-width="2.2" stroke-linejoin="round"/>`+
      `<path d="M16 4.3 27 8.4V17c0 6.6-4.4 11.1-11 13.1C9.4 28.1 5 23.6 5 17V8.4z" fill="${clair}" opacity=".55"/>`+
      `<g transform="translate(6.4 7.4) scale(.8)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${P[nom]||REPLI}</g>`+
      `</svg>`;
  }

  window.iconeBadge=iconeBadge;
  window.BADGE_PICTOS=Object.keys(P);
})();
