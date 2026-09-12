/* NBA 2K27 Build Lab — Encodeur QR minimal
   Mode octet, correction L, versions 1 à 6 (jusqu'à 134 octets).
   Suffisant pour une URL de build compacte (~45 caractères).
   Aucune dépendance externe.
*/
(function(){
  'use strict';

  /* Version -> [octets de données, octets EC par bloc, nombre de blocs] (niveau L) */
  var CAP={
    1:[19,7,1], 2:[34,10,1], 3:[55,15,1],
    4:[80,20,1], 5:[108,26,1], 6:[136,18,2]
  };
  var ALIGN={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34]};

  /* Informations de format pré-calculées pour le niveau L, masques 0 à 7. */
  var FORMAT=[
    '111011111000100','111001011110011','111110110101010','111100010011101',
    '110011000101111','110001100011000','110110001000001','110100101110110'
  ];

  /* ---- Arithmétique GF(256) ---- */
  var EXP=new Array(512),LOG=new Array(256);
  (function(){
    var x=1;
    for(var i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&0x100)x^=0x11D}
    for(var j=255;j<512;j++)EXP[j]=EXP[j-255];
  })();
  function gmul(a,b){return (a===0||b===0)?0:EXP[LOG[a]+LOG[b]]}

  function generatorPoly(n){
    var g=[1];
    for(var i=0;i<n;i++){
      var ng=new Array(g.length+1).fill(0);
      for(var j=0;j<g.length;j++){
        ng[j]^=gmul(g[j],1);
        ng[j+1]^=gmul(g[j],EXP[i]);
      }
      g=ng;
    }
    return g;
  }

  function ecBytes(data,n){
    var g=generatorPoly(n);
    var res=data.slice().concat(new Array(n).fill(0));
    for(var i=0;i<data.length;i++){
      var coef=res[i];
      if(coef===0)continue;
      for(var j=0;j<g.length;j++)res[i+j]^=gmul(g[j],coef);
    }
    return res.slice(data.length);
  }

  /* ---- Encodage des données ---- */
  function toBytes(str){
    var out=[],i,c;
    var enc=unescape(encodeURIComponent(str));
    for(i=0;i<enc.length;i++){c=enc.charCodeAt(i)&0xFF;out.push(c)}
    return out;
  }

  function pickVersion(len){
    for(var v=1;v<=6;v++){
      var dataCw=CAP[v][0];
      // 4 bits mode + 8 bits compteur + 8*len bits de données
      if(Math.ceil((4+8+8*len)/8)<=dataCw)return v;
    }
    return 0;
  }

  function buildCodewords(bytes,version){
    var dataCw=CAP[version][0],ecPer=CAP[version][1],blocks=CAP[version][2];
    var bits=[];
    function push(val,n){for(var i=n-1;i>=0;i--)bits.push((val>>i)&1)}
    push(4,4);            // mode octet
    push(bytes.length,8); // compteur (versions 1-9)
    bytes.forEach(function(b){push(b,8)});
    var cap=dataCw*8;
    for(var t=0;t<4&&bits.length<cap;t++)bits.push(0);      // terminateur
    while(bits.length%8)bits.push(0);                        // alignement octet
    var pads=[0xEC,0x11],pi=0;
    var cw=[];
    for(var i=0;i<bits.length;i+=8){
      var b=0;
      for(var j=0;j<8;j++)b=(b<<1)|bits[i+j];
      cw.push(b);
    }
    while(cw.length<dataCw){cw.push(pads[pi%2]);pi++}

    // Découpage en blocs
    var per=Math.floor(dataCw/blocks),extra=dataCw%blocks;
    var dataBlocks=[],ecBlocks=[],pos=0;
    for(var b2=0;b2<blocks;b2++){
      var size=per+(b2>=blocks-extra?1:0);
      var blk=cw.slice(pos,pos+size);pos+=size;
      dataBlocks.push(blk);
      ecBlocks.push(ecBytes(blk,ecPer));
    }
    // Entrelacement
    var out=[],maxLen=Math.max.apply(null,dataBlocks.map(function(d){return d.length}));
    for(var k=0;k<maxLen;k++)
      for(var b3=0;b3<blocks;b3++)
        if(k<dataBlocks[b3].length)out.push(dataBlocks[b3][k]);
    for(var k2=0;k2<ecPer;k2++)
      for(var b4=0;b4<blocks;b4++)out.push(ecBlocks[b4][k2]);
    return out;
  }

  /* ---- Construction de la matrice ---- */
  function newMatrix(size){
    var m=[],r;
    for(r=0;r<size;r++)m.push(new Array(size).fill(null));
    return m;
  }

  function placeFinder(m,row,col){
    for(var r=-1;r<=7;r++)for(var c=-1;c<=7;c++){
      var rr=row+r,cc=col+c;
      if(rr<0||cc<0||rr>=m.length||cc>=m.length)continue;
      var on=(r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4);
      m[rr][cc]=on?1:0;
    }
  }

  function placeAlignment(m,version){
    var centers=ALIGN[version];
    for(var i=0;i<centers.length;i++)for(var j=0;j<centers.length;j++){
      var row=centers[i],col=centers[j];
      if(m[row][col]!==null)continue; // chevauche un motif de détection
      for(var r=-2;r<=2;r++)for(var c=-2;c<=2;c++){
        var on=(Math.abs(r)===2||Math.abs(c)===2||(r===0&&c===0));
        m[row+r][col+c]=on?1:0;
      }
    }
  }

  function reserveFormat(m){
    var size=m.length,i;
    for(i=0;i<9;i++){
      if(m[8][i]===null)m[8][i]=0;
      if(m[i][8]===null)m[i][8]=0;
    }
    for(i=0;i<8;i++){
      if(m[8][size-1-i]===null)m[8][size-1-i]=0;
      if(m[size-1-i][8]===null)m[size-1-i][8]=0;
    }
  }

  function buildBase(version){
    var size=17+4*version;
    var m=newMatrix(size);
    placeFinder(m,0,0);
    placeFinder(m,0,size-7);
    placeFinder(m,size-7,0);
    placeAlignment(m,version);
    for(var i=8;i<size-8;i++){       // motifs de synchronisation
      var v=(i%2===0)?1:0;
      if(m[6][i]===null)m[6][i]=v;
      if(m[i][6]===null)m[i][6]=v;
    }
    m[size-8][8]=1;                  // module sombre
    return m;
  }

  function placeData(m,cw){
    var size=m.length,bitIdx=0;
    var total=cw.length*8;
    function bitAt(i){return i<total?((cw[i>>3]>>(7-(i&7)))&1):0}
    var col=size-1,rowDir=-1,row=size-1;
    while(col>0){
      if(col===6)col--;
      for(;;){
        for(var i=0;i<2;i++){
          var c=col-i;
          if(m[row][c]===null){
            m[row][c]=bitAt(bitIdx);
            bitIdx++;
          }
        }
        row+=rowDir;
        if(row<0||row>=size){row-=rowDir;rowDir=-rowDir;break}
      }
      col-=2;
    }
  }

  var MASKS=[
    function(r,c){return (r+c)%2===0},
    function(r){return r%2===0},
    function(r,c){return c%3===0},
    function(r,c){return (r+c)%3===0},
    function(r,c){return (Math.floor(r/2)+Math.floor(c/3))%2===0},
    function(r,c){return ((r*c)%2)+((r*c)%3)===0},
    function(r,c){return (((r*c)%2)+((r*c)%3))%2===0},
    function(r,c){return (((r+c)%2)+((r*c)%3))%2===0}
  ];

  function isFunction(version,r,c){
    var size=17+4*version;
    if(r<9&&c<9)return true;
    if(r<9&&c>=size-8)return true;
    if(r>=size-8&&c<9)return true;
    if(r===6||c===6)return true;
    var centers=ALIGN[version];
    for(var i=0;i<centers.length;i++)for(var j=0;j<centers.length;j++){
      var ar=centers[i],ac=centers[j];
      if(ar<9&&ac<9)continue;
      if(ar<9&&ac>=size-8)continue;
      if(ar>=size-8&&ac<9)continue;
      if(Math.abs(r-ar)<=2&&Math.abs(c-ac)<=2)return true;
    }
    return false;
  }

  function applyMask(m,version,mask){
    var size=m.length,out=[];
    for(var r=0;r<size;r++){
      out.push(m[r].slice());
      for(var c=0;c<size;c++){
        if(isFunction(version,r,c))continue;
        if(MASKS[mask](r,c))out[r][c]^=1;
      }
    }
    return out;
  }

  function placeFormat(m,mask){
    var bits=FORMAT[mask],size=m.length,i;
    for(i=0;i<=5;i++)m[8][i]=+bits[i];
    m[8][7]=+bits[6];
    m[8][8]=+bits[7];
    m[7][8]=+bits[8];
    for(i=9;i<=14;i++)m[14-i][8]=+bits[i];
    for(i=0;i<=6;i++)m[size-1-i][8]=+bits[i];
    for(i=8;i<=14;i++)m[8][size-15+i]=+bits[i];
    m[size-8][8]=1;
  }

  function penalty(m){
    var size=m.length,score=0,r,c,i;
    // Règle 1 : séries de 5 modules identiques ou plus
    function runs(get){
      var s=0;
      for(var a=0;a<size;a++){
        var run=1;
        for(var b=1;b<size;b++){
          if(get(a,b)===get(a,b-1))run++;
          else{if(run>=5)s+=3+(run-5);run=1}
        }
        if(run>=5)s+=3+(run-5);
      }
      return s;
    }
    score+=runs(function(a,b){return m[a][b]});
    score+=runs(function(a,b){return m[b][a]});
    // Règle 2 : blocs 2x2
    for(r=0;r<size-1;r++)for(c=0;c<size-1;c++){
      var v=m[r][c];
      if(v===m[r][c+1]&&v===m[r+1][c]&&v===m[r+1][c+1])score+=3;
    }
    // Règle 3 : motif 1011101 encadré de 4 modules clairs
    var p1=[1,0,1,1,1,0,1,0,0,0,0],p2=[0,0,0,0,1,0,1,1,1,0,1];
    function seqAt(get,a,b,pat){
      for(var k=0;k<pat.length;k++)if(get(a,b+k)!==pat[k])return false;
      return true;
    }
    for(r=0;r<size;r++)for(c=0;c+11<=size;c++){
      if(seqAt(function(x,y){return m[x][y]},r,c,p1))score+=40;
      if(seqAt(function(x,y){return m[x][y]},r,c,p2))score+=40;
      if(seqAt(function(x,y){return m[y][x]},r,c,p1))score+=40;
      if(seqAt(function(x,y){return m[y][x]},r,c,p2))score+=40;
    }
    // Règle 4 : équilibre clair/sombre
    var dark=0;
    for(r=0;r<size;r++)for(c=0;c<size;c++)dark+=m[r][c];
    var pct=dark*100/(size*size);
    score+=Math.floor(Math.abs(pct-50)/5)*10;
    return score;
  }

  /* ---- API ---- */
  // encode() est pur (même texte → même matrice) mais coûteux (8 masques testés,
  // pénalité calculée sur toute la matrice à chaque fois). La modale de partage
  // l'appelle 2-3 fois de suite pour le même build (SVG, carte PNG, QR PNG) :
  // un cache à une entrée évite de le refaire tant que le texte n'a pas changé.
  var lastEncodeText=null,lastEncodeResult=null;
  function encode(text){
    if(text===lastEncodeText)return lastEncodeResult;
    var result=encodeUncached(text);
    lastEncodeText=text;lastEncodeResult=result;
    return result;
  }
  function encodeUncached(text){
    var bytes=toBytes(text);
    var version=pickVersion(bytes.length);
    if(!version)throw new Error('Texte trop long pour ce générateur QR ('+bytes.length+' octets).');
    var cw=buildCodewords(bytes,version);
    var base=buildBase(version);
    reserveFormat(base);
    // Les modules de format réservés doivent rester hors du flux de données.
    var withData=base.map(function(row){return row.slice()});
    placeData(withData,cw);

    var best=null,bestScore=Infinity;
    for(var mask=0;mask<8;mask++){
      var m=applyMask(withData,version,mask);
      placeFormat(m,mask);
      var s=penalty(m);
      if(s<bestScore){bestScore=s;best=m}
    }
    return {version:version,size:best.length,modules:best};
  }

  function toSVG(text,opts){
    opts=opts||{};
    var quiet=opts.quiet==null?4:opts.quiet;
    var dark=opts.dark||'#050A12';
    var light=opts.light||'#FFFFFF';
    var qr=encode(text);
    var n=qr.size,total=n+quiet*2;
    var path='';
    for(var r=0;r<n;r++)for(var c=0;c<n;c++)
      if(qr.modules[r][c])path+='M'+(c+quiet)+' '+(r+quiet)+'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+total+' '+total+'" '+
           'shape-rendering="crispEdges" role="img" aria-label="QR code du build">'+
           '<rect width="'+total+'" height="'+total+'" fill="'+light+'"/>'+
           '<path d="'+path+'" fill="'+dark+'"/></svg>';
  }

  function drawOnCanvas(ctx,text,x,y,size,opts){
    opts=opts||{};
    var quiet=opts.quiet==null?4:opts.quiet;
    var qr=encode(text);
    var n=qr.size,total=n+quiet*2,px=size/total;
    ctx.fillStyle=opts.light||'#FFFFFF';
    ctx.fillRect(x,y,size,size);
    ctx.fillStyle=opts.dark||'#050A12';
    for(var r=0;r<n;r++)for(var c=0;c<n;c++)
      if(qr.modules[r][c])
        ctx.fillRect(x+(c+quiet)*px,y+(r+quiet)*px,Math.ceil(px),Math.ceil(px));
    return qr;
  }

  window.NBABL_QR={encode:encode,toSVG:toSVG,drawOnCanvas:drawOnCanvas,maxBytes:CAP[6][0]-2};
})();
