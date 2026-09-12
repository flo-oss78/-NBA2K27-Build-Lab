/**
 * NBA 2K27 Build Lab V18 — client-side integrity helpers.
 * No gameplay values are invented here.
 */
(function(){
  const ATTRIBUTES = [
    "Close Shot","Driving Layup","Driving Dunk","Standing Dunk","Post Control",
    "Mid-Range","Three-Point","Free Throw","Pass Accuracy","Ball Handle","Speed With Ball",
    "Interior Defense","Perimeter Defense","Steal","Block","Offensive Rebound","Defensive Rebound",
    "Speed","Agility","Strength","Vertical","Stamina"
  ];
  const POSITIONS = ["PG","SG","SF","PF","C"];

  function finiteInt(v,min,max){
    const n=Number(v);
    return Number.isFinite(n) && Number.isInteger(n) && n>=min && n<=max;
  }

  function validateBuildPayload(b){
    const errors=[];
    if(!b || typeof b!=="object"){ return {ok:false,errors:["Payload build invalide."]}; }
    if(!POSITIONS.includes(b.position)) errors.push("Position invalide.");
    if(!finiteInt(b.height,69,88)) errors.push("Taille hors plage Builder.");
    if(!finiteInt(b.weight,160,300)) errors.push("Poids hors plage Builder.");
    if(!finiteInt(b.wing,69,96)) errors.push("Envergure hors plage Builder.");
    if(typeof b.attributes!=="object" || !b.attributes) errors.push("Attributs manquants.");
    else {
      for(const name of ATTRIBUTES){
        if(!finiteInt(b.attributes[name],25,99)) errors.push(`Attribut invalide : ${name}.`);
      }
    }
    for(const key of ["score","badges","animations","capBreakers"]){
      if(b[key]!==undefined && !finiteInt(b[key],0,10000)) errors.push(`${key} invalide.`);
    }
    return {ok:errors.length===0,errors};
  }

  window.NBABL_VALIDATE_PAYLOAD = validateBuildPayload;
  window.NBABL_ATTRIBUTES = ATTRIBUTES.slice();
})();
