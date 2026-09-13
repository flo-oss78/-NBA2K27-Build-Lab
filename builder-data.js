/* NBA 2K27 Build Lab — Tables de référence du builder
   Extrait d'app.js (phase 1) : uniquement des données, aucun effet de bord.
   Ce fichier doit être chargé AVANT app.js, qui lit ces tables dès son
   exécution pour construire les curseurs d'attributs.

   - data              attributs par discipline, avec leur valeur de départ
   - badgeDefs         les 53 badges : exigences par palier et plage de taille
   - takeoverDefs      les 11 takeovers et leur attribut déclencheur
   - COST_WEIGHT       coût simulé par point d'attribut (modèle indicatif)
   - BADGE_THRESHOLDS  paliers affichés sous chaque curseur
*/
const data={Finition:[['Close Shot',75],['Driving Layup',82],['Driving Dunk',85],['Standing Dunk',55],['Post Control',60]],Tir:[['Mid-Range',82],['Three-Point',88],['Free Throw',78]],Création:[['Pass Accuracy',78],['Ball Handle',86],['Speed With Ball',84]],Défense:[['Interior Defense',55],['Perimeter Defense',85],['Steal',80],['Block',70]],Rebond:[['Offensive Rebound',45],['Defensive Rebound',65]],Physique:[['Speed',84],['Agility',82],['Strength',72],['Vertical',80],['Stamina',94]]};
const badgeDefs=[
{name:'Arc Cadence',cat:'Tir',req:[['Three-Point',70,86,91,98]],logic:'AND',minH:69,maxH:83},
{name:'Deadeye',cat:'Tir',req:[['Mid-Range',65,85,92,99],['Three-Point',65,85,92,99]],logic:'OR',minH:69,maxH:88},
{name:'Limitless Range',cat:'Tir',req:[['Three-Point',83,89,93,99]],logic:'AND',minH:69,maxH:88},
{name:'Mini Marksman',cat:'Tir',req:[['Mid-Range',60,79,94,99],['Three-Point',60,79,94,99]],logic:'OR',minH:69,maxH:76},
{name:'Post Fade Phenom',cat:'Tir',req:[['Mid-Range',60,71,84,91],['Post Control',55,74,84,93]],logic:'AND',minH:69,maxH:88},
{name:'Quick Trigger',cat:'Tir',req:[['Mid-Range',80,88,95,99],['Three-Point',80,88,95,99]],logic:'OR',minH:69,maxH:88},
{name:'Set and Fire',cat:'Tir',req:[['Three-Point',60,78,89,97]],logic:'AND',minH:69,maxH:88},
{name:'Smooth Operator',cat:'Tir',req:[['Mid-Range',70,87,93,99]],logic:'AND',minH:69,maxH:88},
{name:'Static Middy',cat:'Tir',req:[['Mid-Range',55,75,85,95]],logic:'AND',minH:69,maxH:88},
{name:'Ankle Assassin',cat:'Création',req:[['Ball Handle',75,86,93,96]],logic:'AND',minH:69,maxH:82},
{name:'Bail Out',cat:'Création',req:[['Pass Accuracy',85,93,96,99]],logic:'AND',minH:69,maxH:88},
{name:'Break Starter',cat:'Création',req:[['Pass Accuracy',65,77,89,97]],logic:'AND',minH:69,maxH:88},
{name:'Dimer',cat:'Création',req:[['Pass Accuracy',50,70,86,95]],logic:'AND',minH:69,maxH:88},
{name:'Handles for Days',cat:'Création',req:[['Ball Handle',71,81,90,95]],logic:'AND',minH:69,maxH:84},
{name:'Lightning Launch',cat:'Création',req:[['Speed With Ball',68,75,86,91]],logic:'AND',minH:69,maxH:83},
{name:'Pace',cat:'Création',req:[['Speed With Ball',70,80,88,93]],logic:'AND',minH:69,maxH:82},
{name:'Strong Handle',cat:'Création',req:[['Ball Handle',60,67,73,78],['Strength',75,82,89,95]],logic:'AND',minH:69,maxH:83},
{name:'Unpluckable',cat:'Création',req:[['Post Control',65,86,96,null],['Ball Handle',65,80,92,97]],logic:'OR',minH:69,maxH:88},
{name:'Versatile Visionary',cat:'Création',req:[['Pass Accuracy',65,80,90,99]],logic:'AND',minH:69,maxH:88},
{name:'Aerial Wizard',cat:'Finition',req:[['Driving Dunk',60,70,80,94],['Standing Dunk',60,70,80,93]],logic:'OR',minH:69,maxH:88},
{name:'Float Game',cat:'Finition',req:[['Close Shot',65,80,90,96],['Driving Layup',65,85,93,95]],logic:'OR',minH:69,maxH:88},
{name:'Ghost Stepper',cat:'Finition',req:[['Close Shot',55,77,86,94],['Post Control',55,77,86,94]],logic:'OR',minH:69,maxH:88},
{name:'Hook Specialist',cat:'Finition',req:[['Close Shot',60,75,87,94],['Post Control',55,65,80,90]],logic:'AND',minH:69,maxH:88},
{name:'Layup Mixmaster',cat:'Finition',req:[['Driving Layup',70,83,90,99]],logic:'AND',minH:69,maxH:84},
{name:'Paint Prodigy',cat:'Finition',req:[['Close Shot',60,85,90,96]],logic:'AND',minH:75,maxH:88},
{name:'Physical Finisher',cat:'Finition',req:[['Driving Layup',60,80,90,96],['Strength',60,70,80,90]],logic:'AND',minH:69,maxH:88},
{name:'Post Powerhouse',cat:'Finition',req:[['Post Control',60,75,85,95],['Strength',65,79,86,95]],logic:'AND',minH:77,maxH:88},
{name:'Post Spin Catalyst',cat:'Finition',req:[['Post Control',65,83,91,99]],logic:'AND',minH:73,maxH:88},
{name:'Posterizer',cat:'Finition',req:[['Driving Dunk',73,87,93,99],['Vertical',65,75,80,90]],logic:'AND',minH:69,maxH:88},
{name:'Rise Up',cat:'Finition',req:[['Standing Dunk',60,81,90,99],['Vertical',55,62,66,70]],logic:'AND',minH:77,maxH:88},
{name:'Ankle Braces',cat:'Défense',req:[['Perimeter Defense',60,86,93,95],['Agility',65,82,89,92]],logic:'AND',minH:69,maxH:81},
{name:'Challenger',cat:'Défense',req:[['Perimeter Defense',71,82,92,98]],logic:'AND',minH:69,maxH:83},
{name:'Glove',cat:'Défense',req:[['Steal',70,83,93,99]],logic:'AND',minH:69,maxH:84},
{name:'High-Flying Denier',cat:'Défense',req:[['Block',68,78,88,92],['Vertical',60,74,80,83]],logic:'AND',minH:75,maxH:88},
{name:'Immovable Enforcer',cat:'Défense',req:[['Perimeter Defense',62,72,84,91],['Strength',71,82,85,92]],logic:'AND',minH:69,maxH:88},
{name:'Interceptor',cat:'Défense',req:[['Steal',60,77,90,97]],logic:'AND',minH:69,maxH:88},
{name:'Off-Ball Pest',cat:'Défense',req:[['Interior Defense',60,76,85,93],['Perimeter Defense',55,68,80,89]],logic:'OR',minH:69,maxH:88},
{name:'Paint Patroller',cat:'Défense',req:[['Interior Defense',60,71,77,84],['Block',70,84,93,99]],logic:'AND',minH:77,maxH:88},
{name:'Pick Dodger',cat:'Défense',req:[['Perimeter Defense',73,83,90,97],['Agility',71,81,88,91]],logic:'AND',minH:69,maxH:82},
{name:'Post Lockdown',cat:'Défense',req:[['Interior Defense',65,82,88,93],['Strength',65,74,80,88]],logic:'AND',minH:77,maxH:88},
{name:'Seatbelt',cat:'Défense',req:[['Perimeter Defense',75,85,91,99],['Agility',70,77,80,86]],logic:'AND',minH:69,maxH:81},
{name:'Wall Up',cat:'Défense',req:[['Interior Defense',80,85,95,99],['Strength',75,80,90,92]],logic:'AND',minH:77,maxH:88},
{name:'Boxout Boss',cat:'Rebond',req:[['Defensive Rebound',65,75,90,98],['Strength',60,76,88,94]],logic:'AND',minH:75,maxH:88},
{name:'Breaker',cat:'Rebond',req:[['Offensive Rebound',65,82,92,98],['Strength',70,79,90,96]],logic:'AND',minH:75,maxH:88},
{name:'Crasher',cat:'Rebond',req:[['Offensive Rebound',60,80,93,99],['Vertical',60,65,67,70]],logic:'AND',minH:69,maxH:88},
{name:'Possession Closer',cat:'Rebond',req:[['Defensive Rebound',67,87,95,99],['Vertical',60,65,67,70]],logic:'AND',minH:69,maxH:88},
{name:'Sync Snatcher',cat:'Rebond',req:[['Offensive Rebound',55,70,82,90],['Defensive Rebound',55,70,82,90]],logic:'OR',minH:69,maxH:88},
{name:'Brick Wall',cat:'Physique',req:[['Strength',75,83,95,99]],logic:'AND',minH:77,maxH:88},
{name:'Bruiser',cat:'Physique',req:[['Strength',71,84,93,99]],logic:'AND',minH:69,maxH:88},
{name:'Flash',cat:'Physique',req:[['Speed',70,82,87,95],['Agility',60,78,81,91]],logic:'AND',minH:69,maxH:88},
{name:'Pogo Stick',cat:'Physique',req:[['Vertical',63,70,80,90]],logic:'AND',minH:69,maxH:88},
{name:'Slippery Off-Ball',cat:'Physique',req:[['Speed',57,73,85,94],['Agility',57,65,77,90]],logic:'AND',minH:69,maxH:81},
{name:'Work Horse',cat:'Physique',req:[['Agility',60,75,85,95],['Strength',60,75,85,95]],logic:'OR',minH:69,maxH:88}
];

const takeoverDefs=[['Sharpshooter','Three-Point',88],['Shot Creator','Mid-Range',88],['Slasher','Driving Dunk',88],['Playmaker','Pass Accuracy',88],['Ball Handler','Ball Handle',88],['Perimeter Lock','Perimeter Defense',88],['Pick Pocket','Steal',88],['Rim Protector','Block',88],['Glass Cleaner','Defensive Rebound',88],['Post Scorer','Post Control',88],['Two-Way','Perimeter Defense',80]];
const COST_WEIGHT={
 'Close Shot':1.00,'Driving Layup':1.05,'Driving Dunk':1.35,'Standing Dunk':1.15,'Post Control':1.05,
 'Mid-Range':1.10,'Three-Point':1.35,'Free Throw':0.55,'Pass Accuracy':0.95,'Ball Handle':1.30,'Speed With Ball':1.20,
 'Interior Defense':0.95,'Perimeter Defense':1.15,'Steal':1.10,'Block':1.10,'Offensive Rebound':0.80,'Defensive Rebound':0.90,
 'Speed':1.15,'Agility':1.10,'Strength':0.95,'Vertical':1.00,'Stamina':0.55};
const BADGE_THRESHOLDS=[60,70,80,90,95];
