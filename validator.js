/* NBA 2K27 Build Lab — Validateur de cohérence
   Extrait d'app.js (phase 1). Contrôle le gabarit, les caps et les données
   embarquées de badges et d'animations.

   Chargé AVANT app.js : update() appelle renderValidation() dès le premier
   rendu, qui a lieu pendant l'exécution d'app.js elle-même.
*/
// V9 — Build Validator: explicit consistency checks without claiming undocumented 2K internals.
function validateBuild(r,caps){
  const errors=[]; const warnings=[];
  const h=heightInches(), w=+document.getElementById('weight').value, wing=+document.getElementById('wing').value;
  const wingEl=document.getElementById('wing'), wingSliderMax=+wingEl.max, wingSliderMin=+wingEl.min;
  const minWing=Math.max(wingSliderMin,h+2), maxWing=Math.min(wingSliderMax,h+6);
  if(wing<minWing||wing>maxWing) errors.push(`Envergure invalide pour ${heightText(h)} : ${heightText(minWing)} à ${heightText(maxWing)}.`);
  inputs.forEach(x=>{const v=+x.value, cap=+(caps[x.dataset.name]??99); if(v>cap) errors.push(`${x.dataset.name} ${v} dépasse le cap calculé de ${cap}.`);});
  const animFailures=ANIMATIONS.filter(a=>!animationAccessible(a,r,h));
  // Badge engine itself is the source of truth for the embedded badge table: no impossible tier is displayed.
  // renderBadges() vient de parcourir les 53 badges pour le même r : on relit son
  // total plutôt que de refaire la boucle badgeTier().
  const badgeCount=unlockedBadgeCount(r);
  // Plus de verdict « budget dépassé » : le budget de 1000 points était une
  // invention du site, et il déclarait hors limites des builds réels du jeu.
  warnings.push('Les caps sont indicatifs tant que les tables internes complètes de 2K27 ne sont pas publiées.');
  return {errors,warnings,animFailures,badgeCount};
}
function renderValidation(r,caps){if(!document.getElementById("validationStatus"))return; /* section absente de cette page */
  const v=validateBuild(r,caps), status=document.getElementById('validationStatus'), head=document.getElementById('validationHeadline'), list=document.getElementById('validationErrors');
  const valid=v.errors.length===0; const hasWarn=v.warnings.length>0;
  status.className='validation-status '+(valid?'valid': 'invalid'); status.textContent=valid?'BUILD COHÉRENT':'BUILD À CORRIGER';
  head.className='validation-headline '+(valid?'valid':'invalid'); head.textContent=valid?'🟢 Build cohérent avec les règles intégrées':'🔴 Build non valide selon les règles intégrées';
  document.getElementById('validationText').textContent=valid?'Aucune contradiction détectée entre le gabarit, les caps calculés et les données de badges/animations embarquées.':'Le site a détecté au moins une contradiction. Corrige les points ci-dessous avant de considérer le build comme reproductible.';
  document.getElementById('checkBody').textContent=(v.errors.some(e=>e.includes('Envergure'))?'✕':'✓');
  document.getElementById('checkCaps').textContent=(v.errors.some(e=>e.includes('dépasse le cap'))?'✕':'✓');
  document.getElementById('checkBadges').textContent=`✓ ${v.badgeCount} accessibles`;
  document.getElementById('checkAnimations').textContent=`✓ ${ANIMATIONS.length-v.animFailures.length}/${ANIMATIONS.length}`;
  ['checkBody','checkCaps','checkBadges','checkAnimations'].forEach(id=>{const el=document.getElementById(id);el.className=(el.textContent.includes('✕')?'fail':(el.textContent.includes('✓')?'pass':'warn'))});
  let html=v.errors.map(e=>`<div class="validation-error">❌ ${e}</div>`).join(''); if(!html) html='<div class="validation-ok">✅ Aucun conflit détecté avec les règles actuellement intégrées.</div>'; list.innerHTML=html;
  if(v.warnings.length) list.insertAdjacentHTML('beforeend',`<div class="validation-error" style="background:rgba(255,190,50,.07);border-color:rgba(255,190,50,.18)">⚠️ ${v.warnings[0]}</div>`);
}
