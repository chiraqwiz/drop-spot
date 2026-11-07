var buildings = (function(){
  var rnd = seededRand(1994), arr=[], x=-10;
  while(x < W+20){ var w=34+rnd()*44, h=60+rnd()*95, wins=[];
    for(var wy=0; wy<Math.floor(h/16); wy++) for(var wx=0; wx<Math.floor(w/14); wx++)
      if(rnd()<0.42) wins.push([wx*14+4, wy*16+5]);
    arr.push({x:x,w:w,h:h,wins:wins,lit: rnd()<0.5}); x += w + 4 + rnd()*10; }
  return arr;
})();
var crowd = (function(){
  var rnd = seededRand(77), arr=[];
  for(var i=0;i<26;i++) arr.push({x: 14+i*24, skin:["#8a5a38","#6e4530","#c98d64","#4a2e1c"][i%4], shirt:["#ff2e2e","#ffd23f","#35e0e6","#ff4fa3","#37e05a","#ffffff"][i%6], ph: rnd()*6.28});
  return arr;
})();
function drawRooftopBase(g, t){
  var sky = g.createLinearGradient(0,0,0,GROUND);
  sky.addColorStop(0,"#05051a"); sky.addColorStop(0.45,"#17173e"); sky.addColorStop(0.78,"#4a2158"); sky.addColorStop(1,"#8a3a4a");
  g.fillStyle = sky; g.fillRect(0,0,W,GROUND+2);
  // twinkling stars
  for(var i=0;i<48;i++){
    var sx=(i*97)%W, sy=(i*53)%90;
    g.globalAlpha = 0.35 + 0.65*Math.abs(Math.sin(t*1.7 + i*1.3));
    g.fillStyle = (i%5===0) ? "#ffd76a" : "#ffffff";
    g.fillRect(sx,sy,2,2);
  }
  g.globalAlpha = 1;
  // moon + halo
  g.fillStyle = "rgba(245,237,208,.14)"; g.beginPath(); g.arc(520,52,44,0,6.283); g.fill();
  g.fillStyle = "rgba(245,237,208,.10)"; g.beginPath(); g.arc(520,52,58,0,6.283); g.fill();
  g.fillStyle = "#f5edd0"; g.beginPath(); g.arc(520,52,26,0,6.283); g.fill();
  g.fillStyle = "#e2d8b4"; g.fillRect(512,42,8,8); g.fillRect(528,58,6,6); g.fillRect(518,62,5,5);
  // sweeping searchlights over the skyline
  g.save();
  [[110, "#35e0e6"], [530, "#ff4fa3"]].forEach(function(beam, bi){
    var sway = Math.sin(t*0.7 + bi*2.4) * 0.55;
    g.save();
    g.translate(beam[0], GROUND-118);
    g.rotate(sway);
    g.fillStyle = beam[1]; g.globalAlpha = 0.10;
    g.beginPath(); g.moveTo(0,0); g.lineTo(-34,-150); g.lineTo(34,-150); g.closePath(); g.fill();
    g.restore();
  });
  g.restore(); g.globalAlpha = 1;
  // skyline
  buildings.forEach(function(b){
    R(g,b.x, GROUND-118-b.h, b.w, b.h+118, "#0d0d22");
    R(g,b.x, GROUND-118-b.h, b.w, 3, "#1d1d3a");
    b.wins.forEach(function(wn){ R(g, b.x+wn[0], GROUND-118-b.h+wn[1], 6, 8, "#ffd76a"); });
    if(b.lit) R(g, b.x+4, GROUND-118-b.h+6, b.w-8, 4, "#ff2e2e");
  });
  // water tower silhouette
  R(g, 96, 118, 6, 46, "#0d0d22"); R(g, 132, 118, 6, 46, "#0d0d22");
  R(g, 86, 92, 62, 30, "#0d0d22"); R(g, 86, 92, 62, 4, "#1d1d3a");
  // neon sign — flickers like a real rooftop sign
  var flick = Math.sin(t*13) > -0.85 ? 1 : 0.35;
  g.save(); g.font = "10px 'Press Start 2P', monospace"; g.textAlign = "left";
  g.globalAlpha = flick;
  g.shadowColor = "#ff2e2e"; g.shadowBlur = 12;
  g.fillStyle = "#ff2e2e"; g.fillText("CHI-TOWN", 402, 118);
  g.shadowColor = "#35e0e6";
  g.fillStyle = "#35e0e6"; g.fillText("ROOFTOP", 402, 134);
  g.restore(); g.globalAlpha = 1;
  // rooftop props: vent box + antenna with a blinking beacon
  R(g, 36, 214, 46, 40, "#1a1424"); R(g, 36, 214, 46, 4, "#3a2f4a");
  R(g, 586, 178, 3, 76, "#1a1424");
  R(g, 574, 168, 27, 3, "#1a1424"); R(g, 586, 158, 3, 12, "#1a1424");
  if(Math.sin(t*4) > -0.2){ g.fillStyle = "#ff2e2e"; g.beginPath(); g.arc(588, 156, 4, 0, 6.283); g.fill(); }
  // back wall / fence
  R(g, 0, 196, W, 58, "#2b2030"); R(g, 0, 196, W, 3, "#4a3a52");
  for(var bx=0; bx<W; bx+=32){ R(g, bx, 196, 1, 58, "#17111c"); }
  R(g, 0, 248, W, 6, "#ffd23f"); R(g, 0, 251, W, 2, "#7a5b00");
  // crowd heads bobbing behind the fence line — every third fan
  // throws an arm up, and the whole row bounces harder on the beat
  crowd.forEach(function(c, i){
    var bob = Math.round(Math.sin(t*2.4 + c.ph) * 3);
    var cy = 236 + bob;
    if(i % 3 === 0){ R(g, c.x-10, cy-6, 3, 12, c.skin); R(g, c.x+7, cy-6, 3, 12, c.skin); }
    R(g, c.x-7, cy+8, 14, 12, c.shirt);
    R(g, c.x-5, cy, 10, 10, c.skin);
    R(g, c.x-5, cy, 10, 3, "#101018");
  });
  // floor
  R(g, 0, 254, W, H-254, "#4a4450");
  R(g, 0, 254, W, 4, "#6a6474");
  for(var tx=0; tx<W; tx+=64){ R(g, tx, 254, 2, H-254, "#38333e"); }
  for(var ty=278; ty<H; ty+=24){ R(g, 0, ty, W, 2, "#38333e"); }
  // neon wash reflected on the floor
  var wash = g.createLinearGradient(0, 254, 0, H);
  wash.addColorStop(0, "rgba(255,47,46,.14)"); wash.addColorStop(0.5, "rgba(53,224,230,.08)"); wash.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = wash; g.fillRect(0, 254, W, H-254);
  // floor sheen + front edge
  R(g, 0, H-14, W, 14, "#221e28"); R(g, 0, H-14, W, 2, "#ffd23f");
}
var STAGES = [
  { id: "rooftop", name: "CHI-TOWN ROOFTOP", draw: drawRooftop },
  { id: "ltrain", name: "THE L TRAIN", draw: drawLTrain },
  { id: "lakefront", name: "LAKEFRONT", draw: drawLakefront },
  { id: "club", name: "CLUB SEQUIN", draw: drawClub },
  { id: "street", name: "SOUTH SIDE STREET", draw: drawStreet },
];
var stageSel = -1; 
var stageIdx = 0;
function resolveStage(){
  if(stageSel >= 0) return stageSel;
  return Math.floor(Math.random() * STAGES.length);
}
function drawStage(g, t){ STAGES[stageIdx].draw(g, t); }
var stageImgs = {};
function loadStageImg(id){
  if(stageImgs[id]) return stageImgs[id];
  var im = new Image();
  im.src = "retro-fighter/img/stage-" + id + ".webp";
  stageImgs[id] = im;
  return im;
}
function stageImgReady(id){
  var im = stageImgs[id];
  return !!(im && im.complete && im.naturalWidth);
}
STAGES.forEach(function(s){ loadStageImg(s.id); });
function drawRooftop(g, t){
  if(stageImgReady("rooftop")){ g.drawImage(stageImgs["rooftop"], 0, 0, W, H); drawRooftopFx(g, t); return; }
  drawRooftopBase(g, t);
}
function drawLTrain(g, t){
  if(stageImgReady("ltrain")){ g.drawImage(stageImgs["ltrain"], 0, 0, W, H); drawLTrainFx(g, t); return; }
  drawLTrainBase(g, t);
}
function drawLakefront(g, t){
  if(stageImgReady("lakefront")){ g.drawImage(stageImgs["lakefront"], 0, 0, W, H); drawLakefrontFx(g, t); return; }
  drawLakefrontBase(g, t);
}
function drawClub(g, t){
  if(stageImgReady("club")){ g.drawImage(stageImgs["club"], 0, 0, W, H); drawClubFx(g, t); return; }
  drawClubBase(g, t);
}
function drawStreet(g, t){
  if(stageImgReady("street")){ g.drawImage(stageImgs["street"], 0, 0, W, H); drawStreetFx(g, t); return; }
  drawStreetBase(g, t);
}
function drawRooftopFx(g, t){
  g.save();
  [[110, "#35e0e6", 0.45, "#d8fbff"], [530, "#ff4fa3", 0.45, "#ffd6ec"]].forEach(function(beam, bi){
    var sway = Math.sin(t*0.7 + bi*2.4) * 0.55;
    g.save();
    g.translate(beam[0], GROUND-118);
    g.rotate(sway);
    g.fillStyle = beam[1]; g.globalAlpha = beam[2];
    g.beginPath(); g.moveTo(0,0); g.lineTo(-42,-150); g.lineTo(42,-150); g.closePath(); g.fill();
    g.fillStyle = beam[3]; g.globalAlpha = 0.8;
    g.beginPath(); g.moveTo(0,0); g.lineTo(-14,-150); g.lineTo(14,-150); g.closePath(); g.fill();
    g.restore();
    var glow = g.createRadialGradient(beam[0], GROUND-118, 0, beam[0], GROUND-118, 26);
    glow.addColorStop(0, beam[1]); glow.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 0.85; g.fillStyle = glow;
    g.beginPath(); g.arc(beam[0], GROUND-118, 26, 0, 6.283); g.fill();
  });
  g.restore(); g.globalAlpha = 1;
  var flick = Math.sin(t*13) > -0.85 ? 1 : 0.35;
  g.save(); g.font = "10px 'Press Start 2P', monospace"; g.textAlign = "left";
  g.globalAlpha = flick;
  g.shadowColor = "#ff2e2e"; g.shadowBlur = 12;
  g.fillStyle = "#ff2e2e"; g.fillText("CHI-TOWN", 402, 118);
  g.shadowColor = "#35e0e6";
  g.fillStyle = "#35e0e6"; g.fillText("ROOFTOP", 402, 134);
  g.restore(); g.globalAlpha = 1;
  if(Math.sin(t*4) > -0.2){ g.fillStyle = "#ff2e2e"; g.beginPath(); g.arc(488, 121, 4, 0, 6.283); g.fill(); }
  crowd.forEach(function(c, i){
    var bob = Math.round(Math.sin(t*2.4 + c.ph) * 3);
    var cy = 236 + bob;
    if(i % 3 === 0){ R(g, c.x-10, cy-6, 3, 12, c.skin); R(g, c.x+7, cy-6, 3, 12, c.skin); }
    R(g, c.x-7, cy+8, 14, 12, c.shirt);
    R(g, c.x-5, cy, 10, 10, c.skin);
    R(g, c.x-5, cy, 10, 3, "#101018");
  });
}
function drawLTrainFx(g, t){
  var tx = ((t*46) % 900) - 130;
  for(var c=0;c<3;c++){
    var cx = tx + c*86;
    R(g, cx, 52, 82, 34, "#23233a"); R(g, cx, 52, 82, 3, "#45455f");
    for(var wxi=0; wxi<4; wxi++) R(g, cx+8+wxi*19, 60, 13, 14, "#ffd76a");
    R(g, cx, 82, 82, 4, "#101018");
  }
  g.save(); g.font = "bold 20px monospace"; g.textAlign = "center"; g.fillStyle = "#fff"; g.fillText("L", 62, 140); g.restore();
}
function drawLakefrontFx(g, t){
  for(var i=0;i<26;i++){
    var wx=(i*53)%W, wy=192+((i*29)%28);
    g.globalAlpha = 0.25 + 0.45*Math.abs(Math.sin(t*2 + i*1.7));
    g.fillStyle = "#7fb0d8"; g.fillRect(wx, wy, 18+(i%3)*8, 2);
  }
  g.globalAlpha = 1;
  lakeProps.gulls.forEach(function(gl){
    var gx = (gl.x + t*12*gl.s) % (W+40) - 20, gy = gl.y + Math.sin(t + gl.ph)*6;
    g.strokeStyle = "#101018"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(gx-7, gy); g.quadraticCurveTo(gx, gy-5, gx+7, gy); g.stroke();
  });
  var ba = Math.sin(t*0.8)*0.9;
  g.save(); g.translate(573, 65); g.rotate(ba);
  g.fillStyle = "rgba(255,240,180,.32)"; g.beginPath(); g.moveTo(0,0); g.lineTo(-160,-26); g.lineTo(-160,26); g.closePath(); g.fill(); g.restore();
}
function drawClubFx(g, t){
  for(var b=0;b<4;b++){
    var ang = Math.sin(t*1.1 + b*1.7)*0.8 + (b-1.5)*0.5;
    g.save(); g.translate(320, 70); g.rotate(ang);
    g.fillStyle = ["rgba(255,79,163,.13)","rgba(53,224,230,.13)","rgba(255,210,63,.13)","rgba(55,224,90,.13)"][b];
    g.beginPath(); g.moveTo(0,0); g.lineTo(-26,170); g.lineTo(26,170); g.closePath(); g.fill(); g.restore();
  }
  var flick = Math.sin(t*11) > -0.8 ? 1 : 0.4;
  g.save(); g.font = "10px 'Press Start 2P', monospace"; g.textAlign = "center"; g.globalAlpha = flick;
  g.shadowColor = "#ff4fa3"; g.shadowBlur = 14; g.fillStyle = "#ff4fa3"; g.fillText("CLUB SEQUIN", 320, 130); g.restore(); g.globalAlpha = 1;
  [14, 586].forEach(function(sx){
    var pulse = 1 + Math.sin(t*6)*0.03;
    g.save(); g.translate(sx+20, 210); g.scale(pulse, pulse);
    g.fillStyle = "#23233a"; g.beginPath(); g.arc(0,0,13,0,6.283); g.fill();
    g.fillStyle = "#101018"; g.beginPath(); g.arc(0,0,6,0,6.283); g.fill(); g.restore();
  });
  clubProps.dancers.forEach(function(d, i){
    var bob = Math.round(Math.sin(t*3.2 + d.ph)*5);
    var cy = 236 + bob;
    if(i % 2 === 0){ R(g, d.x-9, cy-8, 3, 12, "#1a1a28"); R(g, d.x+6, cy-8, 3, 12, "#1a1a28"); }
    R(g, d.x-7, cy+6, 14, 14, d.c); R(g, d.x-5, cy-2, 10, 10, "#1a1a28");
  });
  var beat = 0.5 + 0.5*Math.sin(t*4);
  for(var tx=0; tx<W; tx+=64){
    for(var ty=254; ty<H; ty+=26){
      var on = (((tx/64) + (ty/26)) % 2 === 0);
      var col = on ? "rgba(255,79,163,"+(0.25+0.45*beat).toFixed(2)+")" : "rgba(53,224,230,"+(0.2+0.35*(1-beat)).toFixed(2)+")";
      R(g, tx, ty, 62, 24, col);
    }
  }
}
function drawStreetFx(g, t){
  var flick2 = Math.sin(t*13) > -0.85 ? 1 : 0.35;
  g.save(); g.font = "10px 'Press Start 2P', monospace"; g.textAlign = "left"; g.globalAlpha = flick2;
  g.shadowColor = "#35e0e6"; g.shadowBlur = 12; g.fillStyle = "#35e0e6"; g.fillText("SOUTH", 552, 96); g.fillText("SIDE", 552, 112); g.restore(); g.globalAlpha = 1;
  for(var col=0; col<2; col++){
    var cx = col ? 570 : 70;
    for(var st=0; st<5; st++){
      var prog = ((t*10 + st*14 + col*7) % 70) / 70;
      var sy2 = 268 - prog*70;
      var px = cx + Math.sin(t+st+col*3)*5;
      var pr = 12 + prog*12;
      var pa = 0.65 * (1 - prog*0.5);
      var grad = g.createRadialGradient(px, sy2, 0, px, sy2, pr);
      grad.addColorStop(0, "rgba(232,232,240," + pa.toFixed(2) + ")");
      grad.addColorStop(1, "rgba(232,232,240,0)");
      g.fillStyle = grad;
      g.beginPath(); g.arc(px, sy2, pr, 0, 6.283); g.fill();
    }
  }
  g.globalAlpha = 1;
}
var ltrainProps = (function(){
  var rnd = seededRand(5150), wins = [];
  for(var i=0;i<40;i++) wins.push({x: rnd()*W, y: 152+rnd()*70, w: 2+rnd()*3, c: rnd()<0.5 ? "#ffd76a" : "#35e0e6"});
  return { wins: wins };
})();
function drawLTrainBase(g, t){
  var sky = g.createLinearGradient(0,0,0,GROUND);
  sky.addColorStop(0,"#07071f"); sky.addColorStop(0.6,"#14143a"); sky.addColorStop(1,"#232350");
  g.fillStyle = sky; g.fillRect(0,0,W,GROUND+2);
  for(var i=0;i<40;i++){
    var sx=(i*113)%W, sy=(i*37)%70;
    g.globalAlpha = 0.3 + 0.6*Math.abs(Math.sin(t*1.4 + i));
    g.fillStyle = "#ffffff"; g.fillRect(sx,sy,2,2);
  }
  g.globalAlpha = 1;
  g.fillStyle = "#0d0d22";
  for(var bx=0; bx<W; bx+=46){ var bh=40+((bx*7)%60); g.fillRect(bx, 150-bh, 42, bh+40); }
  ltrainProps.wins.forEach(function(wn){ R(g, wn.x, wn.y, wn.w, 3, wn.c); });
  R(g, 0, 82, W, 10, "#1a1a28"); R(g, 0, 82, W, 2, "#3a3a52");
  R(g, 0, 106, W, 8, "#14141f"); R(g, 0, 106, W, 2, "#2a2a3a");
  [70, 320, 570].forEach(function(px){ R(g, px, 114, 14, 140, "#1a1a28"); R(g, px, 114, 14, 3, "#3a3a52"); });
  var tx = ((t*46) % 900) - 130;
  for(var c=0;c<3;c++){
    var cx = tx + c*86;
    R(g, cx, 52, 82, 34, "#23233a"); R(g, cx, 52, 82, 3, "#45455f");
    for(var wxi=0; wxi<4; wxi++) R(g, cx+8+wxi*19, 60, 13, 14, "#ffd76a");
    R(g, cx, 82, 82, 4, "#101018");
  }
  R(g, 0, 254, W, H-254, "#3a3a44"); R(g, 0, 254, W, 4, "#55555f");
  R(g, 0, 258, W, 3, "#ffd23f");
  for(var px2=0; px2<W; px2+=18){ R(g, px2, 264, 8, 3, "#4a4a54"); }
  R(g, 292, 118, 3, 22, "#1a1a28"); R(g, 268, 140, 52, 34, "#1d4fa3"); R(g, 268, 140, 52, 3, "#5a8fd8");
  g.save(); g.font = "bold 20px monospace"; g.textAlign = "center"; g.fillStyle = "#fff"; g.fillText("L", 294, 164); g.restore();
  R(g, 0, H-14, W, 14, "#221e28"); R(g, 0, H-14, W, 2, "#ffd23f");
}
var lakeProps = (function(){
  var rnd = seededRand(77), gulls = [];
  for(var i=0;i<3;i++) gulls.push({x: rnd()*W, y: 30+rnd()*50, s: 0.6+rnd()*0.7, ph: rnd()*6.28});
  return { gulls: gulls };
})();
function drawLakefrontBase(g, t){
  var sky = g.createLinearGradient(0,0,0,210);
  sky.addColorStop(0,"#1a1440"); sky.addColorStop(0.45,"#6a2a5a"); sky.addColorStop(0.8,"#c95a3a"); sky.addColorStop(1,"#e07840");
  g.fillStyle = sky; g.fillRect(0,0,W,212);
  g.fillStyle = "rgba(255,179,71,.25)"; g.beginPath(); g.arc(430,196,52,0,6.283); g.fill();
  g.fillStyle = "#ffb347"; g.beginPath(); g.arc(430,196,30,0,6.283); g.fill();
  g.fillStyle = "#241a33";
  for(var bx=0; bx<W; bx+=52){ var bh=26+((bx*11)%46); g.fillRect(bx, 200-bh, 48, bh); }
  var wat = g.createLinearGradient(0,200,0,256);
  wat.addColorStop(0,"#2a4a66"); wat.addColorStop(1,"#12283e");
  g.fillStyle = wat; g.fillRect(0,200,W,56);
  for(var i=0;i<26;i++){
    var wx=(i*53)%W, wy=206+((i*29)%44);
    g.globalAlpha = 0.25 + 0.45*Math.abs(Math.sin(t*2 + i*1.7));
    g.fillStyle = "#7fb0d8"; g.fillRect(wx, wy, 18+(i%3)*8, 2);
  }
  g.globalAlpha = 1;
  for(var ry=0; ry<7; ry++){
    g.globalAlpha = 0.35 - ry*0.04;
    g.fillStyle = "#ffb347"; g.fillRect(412+((ry%2)?8:-6), 204+ry*7, 36, 3);
  }
  g.globalAlpha = 1;
  lakeProps.gulls.forEach(function(gl){
    var gx = (gl.x + t*12*gl.s) % (W+40) - 20, gy = gl.y + Math.sin(t + gl.ph)*6;
    g.strokeStyle = "#101018"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(gx-7, gy); g.quadraticCurveTo(gx, gy-5, gx+7, gy); g.stroke();
  });
  R(g, 592, 150, 16, 106, "#e8e4d2"); R(g, 592, 150, 16, 5, "#ff2e2e"); R(g, 590, 138, 20, 12, "#1a1a28");
  var ba = Math.sin(t*0.8)*0.9;
  g.save(); g.translate(600, 144); g.rotate(ba);
  g.fillStyle = "rgba(255,240,180,.32)"; g.beginPath(); g.moveTo(0,0); g.lineTo(-160,-26); g.lineTo(-160,26); g.closePath(); g.fill(); g.restore();
  R(g, 0, 254, W, H-254, "#5a4030"); R(g, 0, 254, W, 4, "#7a5a40");
  for(var py=268; py<H; py+=22){ R(g, 0, py, W, 2, "#3a2818"); }
  for(var px3=0; px3<W; px3+=72){ R(g, px3, 254, 2, H-254, "#3a2818"); }
  R(g, 0, H-14, W, 14, "#221e28"); R(g, 0, H-14, W, 2, "#ffd23f");
}
var clubProps = (function(){
  var rnd = seededRand(96), dancers = [];
  for(var i=0;i<14;i++) dancers.push({x: 30+i*44, ph: rnd()*6.28, c: ["#ff4fa3","#35e0e6","#ffd23f","#37e05a","#ff2e2e"][i%5]});
  return { dancers: dancers };
})();
function drawClubBase(g, t){
  var bg = g.createLinearGradient(0,0,0,GROUND);
  bg.addColorStop(0,"#0d0a14"); bg.addColorStop(1,"#241433");
  g.fillStyle = bg; g.fillRect(0,0,W,GROUND+2);
  g.fillStyle = "#c8c8d8"; g.beginPath(); g.arc(320,44,26,0,6.283); g.fill();
  g.fillStyle = "#8a8aa0";
  for(var fy=0; fy<4; fy++) for(var fx=0; fx<5; fx++) g.fillRect(320-20+fx*9, 44-20+fy*11, 6, 8);
  R(g, 318, 10, 4, 10, "#45455f");
  for(var b=0;b<4;b++){
    var ang = Math.sin(t*1.1 + b*1.7)*0.8 + (b-1.5)*0.5;
    g.save(); g.translate(320, 70); g.rotate(ang);
    g.fillStyle = ["rgba(255,79,163,.13)","rgba(53,224,230,.13)","rgba(255,210,63,.13)","rgba(55,224,90,.13)"][b];
    g.beginPath(); g.moveTo(0,0); g.lineTo(-26,170); g.lineTo(26,170); g.closePath(); g.fill(); g.restore();
  }
  var flick = Math.sin(t*11) > -0.8 ? 1 : 0.4;
  g.save(); g.font = "10px 'Press Start 2P', monospace"; g.textAlign = "center"; g.globalAlpha = flick;
  g.shadowColor = "#ff4fa3"; g.shadowBlur = 14; g.fillStyle = "#ff4fa3"; g.fillText("CLUB SEQUIN", 320, 130); g.restore(); g.globalAlpha = 1;
  [14, 586].forEach(function(sx){
    var pulse = 1 + Math.sin(t*6)*0.03;
    R(g, sx, 150, 40, 104, "#101018"); R(g, sx, 150, 40, 4, "#33334a");
    g.save(); g.translate(sx+20, 210); g.scale(pulse, pulse);
    g.fillStyle = "#23233a"; g.beginPath(); g.arc(0,0,13,0,6.283); g.fill();
    g.fillStyle = "#101018"; g.beginPath(); g.arc(0,0,6,0,6.283); g.fill(); g.restore();
  });
  clubProps.dancers.forEach(function(d, i){
    var bob = Math.round(Math.sin(t*3.2 + d.ph)*5);
    var cy = 236 + bob;
    if(i % 2 === 0){ R(g, d.x-9, cy-8, 3, 12, "#1a1a28"); R(g, d.x+6, cy-8, 3, 12, "#1a1a28"); }
    R(g, d.x-7, cy+6, 14, 14, d.c); R(g, d.x-5, cy-2, 10, 10, "#1a1a28");
  });
  R(g, 0, 254, W, H-254, "#14141f"); R(g, 0, 254, W, 4, "#33334a");
  var beat = 0.5 + 0.5*Math.sin(t*4);
  for(var tx=0; tx<W; tx+=64){
    for(var ty=254; ty<H; ty+=26){
      var on = (((tx/64) + (ty/26)) % 2 === 0);
      var col = on ? "rgba(255,79,163,"+(0.25+0.45*beat).toFixed(2)+")" : "rgba(53,224,230,"+(0.2+0.35*(1-beat)).toFixed(2)+")";
      R(g, tx, ty, 62, 24, col);
    }
  }
  R(g, 0, H-14, W, 14, "#0d0a14"); R(g, 0, H-14, W, 2, "#ff4fa3");
}
var streetProps = (function(){
  var rnd = seededRand(312), wins = [];
  for(var i=0;i<8;i++) wins.push({x: 10+rnd()*70, y: 76+rnd()*120, c: rnd()<0.6 ? "#ffd76a" : "#7fb0d8"});
  for(var i=0;i<8;i++) wins.push({x: 556+rnd()*70, y: 56+rnd()*130, c: rnd()<0.6 ? "#ffd76a" : "#7fb0d8"});
  return { wins: wins };
})();
function drawStreetBase(g, t){
  var sky = g.createLinearGradient(0,0,0,GROUND);
  sky.addColorStop(0,"#06061a"); sky.addColorStop(0.6,"#1a1a3a"); sky.addColorStop(1,"#3a2a4a");
  g.fillStyle = sky; g.fillRect(0,0,W,GROUND+2);
  for(var i=0;i<30;i++){
    var sx=(i*151)%W, sy=(i*41)%80;
    g.globalAlpha = 0.3 + 0.5*Math.abs(Math.sin(t*1.2 + i));
    g.fillStyle = "#fff"; g.fillRect(sx,sy,2,2);
  }
  g.globalAlpha = 1;
  g.fillStyle = "#f5edd0"; g.beginPath(); g.arc(560,48,20,0,6.283); g.fill();
  g.fillStyle = "#331d1d"; g.fillRect(0, 60, 96, 194); g.fillRect(544, 40, 96, 214);
  g.fillStyle = "#241414";
  for(var by=70; by<240; by+=24){ g.fillRect(0, by, 96, 2); g.fillRect(544, by, 96, 2); }
  streetProps.wins.forEach(function(wn){ R(g, wn.x, wn.y, 10, 12, wn.c); });
  R(g, 0, 120, 96, 3, "#1a1a28"); R(g, 0, 150, 96, 3, "#1a1a28"); R(g, 0, 180, 96, 3, "#1a1a28");
  R(g, 8, 120, 3, 60, "#1a1a28"); R(g, 88, 120, 3, 60, "#1a1a28");
  var flick2 = Math.sin(t*13) > -0.85 ? 1 : 0.35;
  g.save(); g.font = "10px 'Press Start 2P', monospace"; g.textAlign = "left"; g.globalAlpha = flick2;
  g.shadowColor = "#35e0e6"; g.shadowBlur = 12; g.fillStyle = "#35e0e6"; g.fillText("SOUTH", 552, 96); g.fillText("SIDE", 552, 112); g.restore(); g.globalAlpha = 1;
  R(g, 118, 120, 5, 134, "#1a1a28");
  R(g, 96, 112, 44, 4, "#1a1a28"); R(g, 132, 116, 10, 10, "#ffd76a");
  g.save(); g.fillStyle = "rgba(255,215,106,.10)";
  g.beginPath(); g.moveTo(137, 122); g.lineTo(90, 254); g.lineTo(190, 254); g.closePath(); g.fill(); g.restore();
  R(g, 560, 214, 66, 40, "#14141f"); R(g, 566, 218, 20, 14, "#23233a"); R(g, 590, 218, 20, 14, "#23233a");
  g.fillStyle = "#14141f"; g.beginPath(); g.arc(576, 254, 9, 0, 6.283); g.fill(); g.beginPath(); g.arc(610, 254, 9, 0, 6.283); g.fill();
  R(g, 40, 232, 14, 22, "#ff2e2e"); R(g, 44, 226, 6, 8, "#ff2e2e");
  R(g, 0, 196, W, 58, "#241c26"); R(g, 0, 196, W, 3, "#4a3a52");
  for(var bx2=0; bx2<W; bx2+=32){ R(g, bx2, 196, 1, 58, "#14101a"); }
  R(g, 0, 254, W, H-254, "#2a2a30"); R(g, 0, 254, W, 4, "#4a4a54");
  for(var rx=0; rx<W; rx+=96){ R(g, rx, 254, 2, H-254, "#1e1e24"); }
  g.fillStyle = "rgba(255,215,106,.12)"; g.fillRect(118, 258, 44, 90);
  g.fillStyle = "rgba(53,224,230,.10)"; g.fillRect(540, 258, 60, 90);
  for(var col=0; col<2; col++){
    var cx = col ? 570 : 70;
    for(var st=0; st<5; st++){
      var prog = ((t*10 + st*14 + col*7) % 70) / 70;
      var sy2 = 268 - prog*70;
      var px = cx + Math.sin(t+st+col*3)*5;
      var pr = 12 + prog*12;
      var pa = 0.65 * (1 - prog*0.5);
      var grad = g.createRadialGradient(px, sy2, 0, px, sy2, pr);
      grad.addColorStop(0, "rgba(232,232,240," + pa.toFixed(2) + ")");
      grad.addColorStop(1, "rgba(232,232,240,0)");
      g.fillStyle = grad;
      g.beginPath(); g.arc(px, sy2, pr, 0, 6.283); g.fill();
    }
  }
  g.globalAlpha = 1;
  R(g, 0, H-14, W, 14, "#1c1820"); R(g, 0, H-14, W, 2, "#35e0e6");
}
function animFrame(f, t){
  var set = frameImgs[f.def.id];
  if(!set) return null;
  function ready(im){ return im && im.complete && im.naturalWidth > 0 ? im : null; }
  if(f.state === "walk" && set.walk.length === 4){
    var idx = Math.floor((f.walkPhase || 0) / (Math.PI / 2)) % 4;
    return ready(set.walk[idx]);
  }
  if(f.state === "idle"){
    if(Math.floor(t * 1.8 + f.bobPhase) % 2 === 1) return ready(set.idleB);
    return null;
  }
  if(f.state === "punch" && f.attack && f.attack.t >= ATTACKS.punch.startup){
    return ready(set.punch);
  }
  return null;
}
function drawToonSprite(g, f, t){
  var def = f.def, d = f.dir, spr = animFrame(f, t) || spriteImgs[def.id];
  var isBase = (spr === spriteImgs[def.id]);
  var h = 138, w = h * (spr.naturalWidth / spr.naturalHeight);
  // Special-ready aura: a warm glow under a charged fighter.
  if(f.meter >= 50 && f.state !== "ko"){
    g.fillStyle = "rgba(255,210,63,.18)";
    g.beginPath(); g.ellipse(f.x, f.y - 62, 44, 58, 0, 0, 6.283); g.fill();
  }
  g.fillStyle = "rgba(0,0,0,.45)";
  g.beginPath(); g.ellipse(f.x, GROUND+6, 33, 6, 0, 0, 6.283); g.fill();
  // Footwork: the plant-foot dust is drawn as big soft clouds, not just
  // tiny particles, so it reads at normal size.
  if(f.state === "kick" && f.attack){
    var dka = ATTACKS.kick, dkt = f.attack.t, dDur = dka.startup + 0.5;
    if(dkt < dDur){
      var dp = dkt / dDur, dAlpha = 0.65 - 0.45 * dp;
      var dX = f.x - f.dir * 28, dY = GROUND - 4;
      g.fillStyle = "rgba(201,177,138," + dAlpha.toFixed(2) + ")";
      g.beginPath(); g.arc(dX, dY, 10 + 14 * dp, 0, 6.283); g.fill();
      g.beginPath(); g.arc(dX - f.dir * 10, dY - 3, 8 + 12 * dp, 0, 6.283); g.fill();
      g.fillStyle = "rgba(232,220,192," + (dAlpha * 0.8).toFixed(2) + ")";
      g.beginPath(); g.arc(dX + f.dir * 6, dY - 5, 6 + 10 * dp, 0, 6.283); g.fill();
    }
  }
  g.save();
  g.translate(Math.round(f.x), Math.round(f.y));
  // Face the foe: the artwork's natural punch direction is flipped
  // onto the fighter's facing direction (see spriteFace above).
  g.scale(d * (def.spriteFace || 1), 1);
  var rot = 0, tx = 0, ty = 0, sx = 1, sy = 1;
  if(f.state === "ko"){ rot = -1.25; ty = 4; }
  else if(f.state === "hit"){ rot = -0.08; tx = -4; }
  else if(f.state === "win"){ ty = Math.round(Math.sin(t*5)*3); }
  else if(f.state === "crouch" || f.crouching){ sy = 0.84; sx = 1.06; }
  else if(f.state === "punch"){ tx = 8; sx = 1.06; }
  else if(f.state === "kick"){
    tx = 12; sx = 1.08; rot = 0.10;
    // Footwork: step in during the windup, rise onto the plant foot as the kick extends.
    if(f.attack){ var kprog = Math.min(1, f.attack.t / ATTACKS.kick.startup); tx = 6 + 6 * kprog; ty = -3 * kprog; }
    // Roundhouse: Wiz twists his body into the spin, unwinding as the kick retracts.
    if(f.attack && f.def.id === "wiz"){ var rkA = ATTACKS.kick, rkT = f.attack.t;
      var rkSpin = rkT < rkA.startup + rkA.active ? rkT / (rkA.startup + rkA.active) : Math.max(0, 1 - (rkT - rkA.startup - rkA.active) / rkA.recover);
      rot = 0.35 * rkSpin; }
  }
  else if(f.state === "special" && def.specialKind === "slam"){
    if(f.y < GROUND - 2){ rot = -0.15; ty = -4; } else { sy = 0.88; sx = 1.08; }
  }
  else if(f.state === "special" && def.specialKind === "spin"){
    rot = Math.sin((f.attack ? f.attack.t : 0) * 28) * 0.18;
  }
  else if(f.state === "special" && def.specialKind === "tackle"){ tx = 10; rot = 0.10; }
  else if(f.state === "special" && def.specialKind === "barrage"){ tx = 6; }
  else if(f.state === "special" && def.specialKind === "lightning"){
    // Hands raised toward the sky: lean back, rise onto the balls of
    // his feet, arms reaching up as the charge gathers above him.
    tx = 4; ty = -7; rot = -0.09; sy = 1.04;
  }
  else if(f.state === "special"){ tx = 8; }
  else if(f.state === "block"){ rot = 0.12; tx = -6; }
  else if(f.state === "walk"){ ty = -Math.abs(Math.round(Math.sin(f.walkPhase || 0)*2)); rot = Math.sin(f.walkPhase || 0)*0.03; }
  else if(f.state === "idle"){ ty = Math.round(Math.sin(t*5 + f.bobPhase)*1.5); }
  g.translate(tx, ty); g.rotate(rot); g.scale(sx, sy);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  if(f.state === "special" && (def.specialKind === "projectile" || def.specialKind === "barrage")){
    g.fillStyle = def.accent; g.globalAlpha = 0.85; g.beginPath(); g.arc(w*0.38, -h*0.80, 13, 0, 6.283); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = "#fff7cc"; g.beginPath(); g.arc(w*0.38, -h*0.80, 6, 0, 6.283); g.fill();
  }
  g.drawImage(spr, -w/2, -h, w, h);
  if(f.state === "kick" && f.attack){
    var ka = ATTACKS.kick, kt = f.attack.t;
    // Footwork: the kicking leg is drawn in world space by drawKickLeg
    // (called from drawFighter after the sprite), so it stays readable
    // even while the body spins through a roundhouse.
    if(kt >= ka.startup && kt <= ka.startup + ka.active){
      if(f.def.id === "wiz"){
        g.strokeStyle = "#ffffff"; g.lineWidth = 6; g.globalAlpha = 0.9;
        g.beginPath(); g.arc(w*0.10, -h*0.45, 58, -1.5, 1.5); g.stroke();
        g.strokeStyle = f.def.accent; g.lineWidth = 3;
        g.beginPath(); g.arc(w*0.10, -h*0.45, 48, -1.5, 1.5); g.stroke();
        g.globalAlpha = 1;
      } else {
        g.strokeStyle = "#ffffff"; g.lineWidth = 5; g.globalAlpha = 0.85;
        g.beginPath(); g.arc(w*0.42, -h*0.28, 34, -0.9, 0.9); g.stroke();
        g.strokeStyle = f.def.accent; g.lineWidth = 2.5;
        g.beginPath(); g.arc(w*0.42, -h*0.28, 26, -0.9, 0.9); g.stroke();
        g.globalAlpha = 1;
      }
    }
  }
  if(f.state === "block"){
    g.strokeStyle = "#35e0e6"; g.lineWidth = 3; g.globalAlpha = 0.75;
    g.beginPath(); g.arc(w*0.30, -h*0.55, 46, -1.2, 1.2); g.stroke();
    g.fillStyle = "rgba(53,224,230,.12)";
    g.beginPath(); g.arc(w*0.30, -h*0.55, 46, -1.2, 1.2); g.lineTo(w*0.30, -h*0.55); g.closePath(); g.fill();
    g.globalAlpha = 1;
  }
  if(f.state === "special" && def.specialKind === "lightning" && f.attack){
    // Crackling charge rising from his raised hands toward the sky.
    // Fists sit near the top of the sprite; arcs climb from both of
    // them and converge overhead while the strike is being called.
    var charge = Math.max(0, 1 - (f.attack.t / Math.max(0.01, f.attack.dur)));
    var fistX = w*0.34, fistY = -h*0.88, chinX = -w*0.12, chinY = -h*0.84;
    g.save();
    g.fillStyle = "rgba(255,210,63," + (0.35 + 0.4*charge).toFixed(2) + ")";
    g.beginPath(); g.arc(fistX, fistY, 9 + 4*charge, 0, 6.283); g.fill();
    g.beginPath(); g.arc(chinX, chinY, 6 + 3*charge, 0, 6.283); g.fill();
    g.strokeStyle = "#fff7cc"; g.lineWidth = 2;
    [[fistX, fistY], [chinX, chinY]].forEach(function(pt){
      for(var a=0; a<2; a++){
        var ax = pt[0], ay = pt[1];
        g.beginPath(); g.moveTo(ax, ay);
        for(var s=0; s<4; s++){ ax += (Math.random()-0.5)*14; ay -= 16 + Math.random()*10; g.lineTo(ax, ay); }
        g.stroke();
      }
    });
    g.strokeStyle = "#ffd23f"; g.lineWidth = 1;
    g.beginPath(); g.moveTo((fistX+chinX)/2, chinY-6); g.lineTo((fistX+chinX)/2 + (Math.random()-0.5)*8, -h*1.18); g.stroke();
    g.restore();
  }
  if(isBase && f.hitFlash > 0 && spriteFlash[def.id]){
    g.globalAlpha = 0.75;
    g.drawImage(spriteFlash[def.id], -w/2, -h, w, h);
    g.globalAlpha = 1;
  }
  g.imageSmoothingEnabled = false;
  g.restore();
}
function drawKickLeg(g, f){
  // The kicking leg, drawn in world space (unrotated) so it reads as
  // a leg even while the body spins through a roundhouse. Two
  // segments — a thicker thigh and a thinner shin — with a white
  // knee ball, and a big white shoe. Wiz's roundhouse leg reaches
  // further and higher (chest height) than a normal kick.
  if(f.state !== "kick" || !f.attack) return;
  var ka = ATTACKS.kick, kt = f.attack.t;
  var kext = 0;
  if(kt < ka.startup) kext = kt / ka.startup;
  else if(kt <= ka.startup + ka.active) kext = 1;
  else kext = Math.max(0, 1 - (kt - ka.startup - ka.active) / ka.recover);
  if(kext <= 0.05) return;
  var isWiz = f.def.id === "wiz";
  var hipX = f.x + f.dir * 12, hipY = f.y - 58;
  var footX = f.x + f.dir * (12 + (isWiz ? 78 : 62) * kext);
  var footY = f.y - (isWiz ? 62 : 33);
  var kneeX = (hipX + footX) / 2, kneeY = (hipY + footY) / 2 - 20;
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = "#14141f"; g.lineWidth = 19;
  g.beginPath(); g.moveTo(hipX, hipY); g.lineTo(kneeX, kneeY); g.lineTo(footX, footY); g.stroke();
  g.strokeStyle = f.def.accent; g.lineWidth = 13;
  g.beginPath(); g.moveTo(hipX, hipY); g.lineTo(kneeX, kneeY); g.stroke();
  g.strokeStyle = "#14141f"; g.lineWidth = 16;
  g.beginPath(); g.moveTo(kneeX, kneeY); g.lineTo(footX, footY); g.stroke();
  g.strokeStyle = f.def.accent; g.lineWidth = 10;
  g.beginPath(); g.moveTo(kneeX, kneeY); g.lineTo(footX, footY); g.stroke();
  g.fillStyle = "#ffffff";
  g.beginPath(); g.arc(kneeX, kneeY, 6.5, 0, 6.283); g.fill();
  g.strokeStyle = "#14141f"; g.lineWidth = 2;
  g.beginPath(); g.arc(kneeX, kneeY, 6.5, 0, 6.283); g.stroke();
  g.fillStyle = "#ffffff";
  g.beginPath(); g.ellipse(footX + f.dir * 6, footY + 1, 12, 7, 0.12, 0, 6.283); g.fill();
  g.strokeStyle = "#14141f"; g.lineWidth = 2;
  g.beginPath(); g.ellipse(footX + f.dir * 6, footY + 1, 12, 7, 0.12, 0, 6.283); g.stroke();
}
function drawFreeze(g, f){
  if(!f.freezeT || f.freezeT <= 0 || f.state === "ko") return;
  g.save();
  g.globalAlpha = 0.45; g.fillStyle = "#bfe6ff";
  g.beginPath(); g.ellipse(f.x, f.y - 62, 34, 62, 0, 0, 6.283); g.fill();
  g.globalAlpha = 0.9; g.strokeStyle = "#ffffff"; g.lineWidth = 2;
  g.beginPath(); g.ellipse(f.x, f.y - 62, 34, 62, 0, 0, 6.283); g.stroke();
  g.restore();
}
function drawFighter(g, f, t){
  if(f.attack && f.attack.type === "teleport" && !f.attack.teleDone){ return; }
  var def = f.def, d = f.dir;
  if(def.sprite && spriteReady[def.id]){ drawToonSprite(g, f, t); drawKickLeg(g, f); drawFreeze(g, f); return; }
  var flash = f.hitFlash > 0;
  var skin = flash ? "#ffffff" : def.skin, skinD = flash ? "#ffffff" : def.skinDark;
  var top = flash ? "#ffffff" : def.top, topD = flash ? "#dddddd" : def.topDark;
  var pants = flash ? "#ffffff" : def.pants, pantsD = flash ? "#dddddd" : def.pantsDark;
  var hair = flash ? "#ffffff" : def.hair, hairD = flash ? "#dddddd" : def.hairDark;
  var acc = def.accent, shoe = flash ? "#ffffff" : def.shoe;
  // special-ready aura in the fighter's own accent colour
  if(f.meter >= 50 && f.state !== "ko"){
    g.fillStyle = acc; g.globalAlpha = 0.16;
    g.beginPath(); g.ellipse(f.x, f.y - 55, 38, 52, 0, 0, 6.283); g.fill();
    g.globalAlpha = 1;
  }
  // shadow
  g.fillStyle = "rgba(0,0,0,.45)";
  g.beginPath(); g.ellipse(f.x, GROUND+6, 30, 6, 0, 0, 6.283); g.fill();
  g.save();
  g.translate(Math.round(f.x), Math.round(f.y));
  g.scale(d, 1);
  if(f.state === "ko"){ g.rotate(-1.35); g.translate(0, 4); }
  else if(f.state === "hit"){ g.rotate(-0.1); }
  else if(f.state === "win"){ g.translate(0, Math.round(Math.sin(t*5)*2)); }
  var crouch = (f.state === "crouch" || f.crouching) && f.state !== "ko";
  var drop = crouch ? 14 : 0;
  var bob = (f.state === "idle") ? Math.round(Math.sin(t*5 + f.bobPhase)*1.5) : 0;
  var air = f.y < GROUND - 2;
  var walkPh = Math.sin(f.walkPhase || 0);
  // ---- legs ----
  var legH = crouch ? 26 : 40, legY = -legH + drop;
  if(f.state === "kick"){
    // back leg planted, front leg extended
    R(g,-14, legY, 10, 40, pants); R(g,-15, -4, 12, 5, shoe);
    R(g, 2, -34+drop, 30, 9, pants); R(g, 30, -34+drop, 9, 9, shoe);
  } else if(air){
    R(g,-14, -30+drop, 10, 26, pants); R(g,-15, -6+drop, 12, 5, shoe);
    R(g, 4, -26+drop, 10, 22, pants); R(g, 3, -6+drop, 12, 5, shoe);
  } else if(f.state === "walk"){
    var o1 = Math.round(walkPh*6), o2 = Math.round(-walkPh*6);
    R(g,-14+o1, legY, 10, legH, pants); R(g,-15+o1, -4+drop, 12, 5, shoe);
    R(g, 4+o2, legY, 10, legH, pants); R(g, 3+o2, -4+drop, 12, 5, shoe);
  } else {
    R(g,-14, legY, 10, legH, pants); R(g,-15, -4+drop, 12, 5, shoe);
    R(g, 4, legY, 10, legH, pants); R(g, 3, -4+drop, 12, 5, shoe);
  }
  // ---- torso ----
  var torsoY = -66 + drop + bob, torsoH = crouch ? 22 : 28;
  R(g,-11, torsoY, 22, torsoH, top);
  R(g,-11, torsoY+torsoH-5, 22, 5, topD);
  if(def.id === "wiz"){
    // open hoodie: white panels + gold chain
    R(g,-11, torsoY, 6, torsoH, "#ffffff"); R(g, 5, torsoY, 6, torsoH, "#ffffff");
    R(g,-3, torsoY+4, 3, 3, acc); R(g, 0, torsoY+8, 3, 3, acc); R(g,-3, torsoY+12, 3, 3, acc); R(g, 0, torsoY+16, 3, 3, acc);
    R(g,-2, torsoY+torsoH-2, 5, 4, "#b98a00");
  } else if(def.id === "toon"){
    // white button-up: collar, buttons, chest pocket, gold chain + pendant
    R(g,-8, torsoY, 5, 5, "#ffffff"); R(g, 3, torsoY, 5, 5, "#ffffff");
    R(g,-8, torsoY+4, 5, 1, topD); R(g, 3, torsoY+4, 5, 1, topD);
    R(g,-1, torsoY+5, 2, 2, "#9a958a"); R(g,-1, torsoY+19, 2, 2, "#9a958a");
    R(g, 4, torsoY+8, 6, 7, topD); R(g, 5, torsoY+9, 4, 5, top);
    R(g,-5, torsoY+3, 2, 2, acc); R(g,-3, torsoY+6, 2, 2, acc); R(g,-1, torsoY+9, 2, 2, acc);
    R(g, 1, torsoY+6, 2, 2, acc); R(g, 3, torsoY+3, 2, 2, acc);
    R(g,-2, torsoY+11, 5, 6, "#b98a00"); R(g,-1, torsoY+12, 3, 4, acc);
  } else if(def.id === "crimson"){
    // white tee + plaid leggings read: pink/black grid ticks on the legs
    R(g,-11, torsoY, 22, 3, "#ffffff");
    R(g,-11, torsoY+torsoH-4, 22, 4, topD);
    R(g,-4, torsoY+8, 8, 2, "#ff8fa3");
  } else if(def.id === "babes"){
    // white club tee, red lettering band, chain at the neck
    R(g,-11, torsoY, 22, 3, "#ffffff");
    R(g,-8, torsoY+8, 16, 7, "#ff2e2e");
    R(g,-5, torsoY+10, 10, 3, "#ffffff");
    R(g,-6, torsoY-2, 12, 3, "#d8d8d8");
  } else if(def.id === "denim"){
    // open denim jacket over a black top, silver buttons
    R(g,-11, torsoY, 6, torsoH, "#7fb0d8"); R(g, 5, torsoY, 6, torsoH, "#7fb0d8");
    R(g,-11, torsoY+2, 22, 2, "#a8cbe8");
    R(g,-9, torsoY+8, 2, 2, "#e8e8e8"); R(g, 7, torsoY+8, 2, 2, "#e8e8e8");
    R(g,-9, torsoY+18, 2, 2, "#e8e8e8"); R(g, 7, torsoY+18, 2, 2, "#e8e8e8");
  } else if(def.id === "wrap"){
    // white tank, patterned shorts read in the leg colour
    R(g,-11, torsoY, 22, 3, "#ffffff");
    R(g,-11, torsoY+torsoH-4, 22, 4, topD);
    R(g,-8, torsoY+6, 3, 3, "#ff8f3f"); R(g, 4, torsoY+10, 3, 3, "#35a0e0");
  } else {
    // pink jersey: white trim + 96 on chest
    R(g,-11, torsoY, 22, 3, "#ffffff");
    g.fillStyle = "#ffffff"; g.font = "8px monospace"; g.textAlign = "center";
    g.fillText("96", 0, torsoY+17);
    R(g,-11, torsoY+torsoH-4, 22, 4, topD);
    // sequin sparkles
    R(g,-7, torsoY+6, 2, 2, "#ffffff"); R(g, 5, torsoY+11, 2, 2, "#ffffff"); R(g,-2, torsoY+9, 2, 2, "#ffd9ec");
  }
  // ---- head ----
  var headY = -86 + drop + bob;
  R(g,-8, headY, 16, 18, skin);
  R(g,-8, headY+13, 16, 5, skinD);
  // eyes
  R(g, 2, headY+7, 3, 3, "#101018"); R(g, 7, headY+7, 2, 3, "#101018");
  if(def.id === "wiz"){
    // durag + tied tail
    R(g,-9, headY-3, 18, 7, hair); R(g,-9, headY-3, 18, 2, "#ffffff");
    R(g,-13, headY+2, 4, 10, hairD);
    // gold chain at neck
    R(g,-6, torsoY-2, 12, 3, acc);
  } else if(def.id === "toon"){
    // cornrows: cap with row lines, short tails, mustache + goatee
    R(g,-9, headY-3, 18, 7, hair);
    R(g,-5, headY-3, 1, 7, "#4a3524"); R(g, 0, headY-3, 1, 7, "#4a3524"); R(g, 5, headY-3, 1, 7, "#4a3524");
    R(g,-12, headY+3, 3, 10, hair); R(g, 9, headY+3, 3, 10, hair);
    R(g, 1, headY+5, 4, 1, hair); R(g, 7, headY+5, 2, 1, hair);
    R(g, 0, headY+11, 7, 2, hair);
    R(g, 3, headY+15, 3, 3, "#241811");
    R(g,-6, torsoY-2, 12, 3, acc);
  } else if(def.id === "crimson"){
    // shaved sides, big red curls swept back over one shoulder
    R(g,-9, headY-3, 18, 6, hair);
    R(g, 6, headY-6, 10, 22, hair); R(g, 10, headY-10, 6, 8, hair);
    R(g,-9, headY+2, 3, 3, "#ffd23f");
  } else if(def.id === "babes"){
    // slicked-back bun, chain earring glint
    R(g,-9, headY-3, 18, 6, hair);
    R(g,-2, headY-8, 5, 5, hair);
    R(g,-11, headY+6, 2, 2, "#e8e8e8");
    R(g,-6, torsoY-2, 12, 3, "#d8d8d8");
  } else if(def.id === "denim"){
    // long straight brown hair falling past the shoulders
    R(g,-9, headY-3, 18, 6, hair);
    R(g,-11, headY+2, 4, 24, hair); R(g, 7, headY+2, 4, 24, hair);
  } else if(def.id === "wrap"){
    // patterned headwrap: cream band with a dark zig-zag + top knot
    R(g,-9, headY-4, 18, 8, hair);
    R(g,-9, headY-1, 18, 2, "#2a2a2a");
    R(g,-2, headY-9, 5, 5, hair);
    R(g,-4, headY-4, 2, 2, "#2a2a2a"); R(g, 2, headY-4, 2, 2, "#2a2a2a");
  } else {
    // braids: crown + long braids both sides
    R(g,-9, headY-3, 18, 6, hair);
    R(g,-11, headY+2, 4, 26, hair); R(g, 7, headY+2, 4, 26, hair);
    R(g,-11, headY+24, 4, 3, acc); R(g, 7, headY+24, 4, 3, acc);
    R(g,-8, headY+15, 16, 3, skinD);
  }
  // ---- arms ----
  var shY = torsoY + 5;
  if(f.state === "win"){
    R(g,-13, shY-20, 6, 22, top); R(g,-13, shY-24, 6, 6, skin);
    R(g, 7, shY-20, 6, 22, top); R(g, 7, shY-24, 6, 6, skin);
  } else if(f.state === "punch"){
    R(g,-14, shY, 6, 20, topD); R(g,-15, shY+18, 7, 6, skin); // back arm guard
    R(g, 6, shY+2, 26, 7, top); R(g, 30, shY+1, 8, 9, skin); // extended fist
  } else if(f.state === "special" && def.specialKind === "lightning"){
    // Fallback pose while the cartoon sprite loads: both arms up,
    // sparks crackling above his hands.
    R(g,-14, shY-22, 6, 24, top); R(g,-14, shY-26, 6, 6, skin);
    R(g, 8, shY-22, 6, 24, top); R(g, 8, shY-26, 6, 6, skin);
    g.fillStyle = acc; g.fillRect(-2, shY-34, 3, 3); g.fillRect(6, shY-38, 3, 3); g.fillRect(-6, shY-30, 3, 3);
  } else if(f.state === "special" && def.specialKind === "projectile"){
    R(g,-14, shY, 6, 20, topD); R(g,-15, shY+18, 7, 6, skin);
    R(g, 6, shY+2, 22, 7, top); R(g, 26, shY+1, 8, 9, skin);
    g.fillStyle = acc; g.beginPath(); g.arc(42, shY+6, 7, 0, 6.283); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(42, shY+6, 3, 0, 6.283); g.fill();
  } else if(f.state === "special" && def.specialKind === "dash"){
    // cyclone: arms out wide, motion ticks
    R(g,-24, shY+2, 14, 6, top); R(g,-26, shY+1, 6, 8, skin);
    R(g, 10, shY+2, 14, 6, top); R(g, 22, shY+1, 6, 8, skin);
    g.strokeStyle = acc; g.lineWidth = 2;
    g.beginPath(); g.arc(0, -40+drop, 26, 0.4, 2.2); g.stroke();
    g.beginPath(); g.arc(0, -40+drop, 32, 3.5, 5.2); g.stroke();
  } else if(f.state === "special" && def.specialKind === "slam"){
    if(f.y < GROUND - 2){
      // mid-leap: both arms thrown up, fists clenched for the slam
      R(g,-14, shY-22, 6, 24, top); R(g,-14, shY-26, 6, 6, skin);
      R(g, 8, shY-22, 6, 24, top); R(g, 8, shY-26, 6, 6, skin);
    } else {
      // landing: arms slammed down wide, shockwave pose
      R(g,-22, shY+8, 14, 6, top); R(g,-24, shY+7, 6, 8, skin);
      R(g, 8, shY+8, 14, 6, top); R(g, 20, shY+7, 6, 8, skin);
    }
  } else if(f.state === "special" && def.specialKind === "spin"){
    // whirlwind: arms out wide, arcs whipping around the body
    R(g,-24, shY+2, 14, 6, top); R(g,-26, shY+1, 6, 8, skin);
    R(g, 10, shY+2, 14, 6, top); R(g, 22, shY+1, 6, 8, skin);
    g.strokeStyle = acc; g.lineWidth = 2;
    g.beginPath(); g.arc(0, -40+drop, 26, 0.4, 2.2); g.stroke();
    g.beginPath(); g.arc(0, -40+drop, 32, 3.5, 5.2); g.stroke();
    g.beginPath(); g.arc(0, -40+drop, 38, 1.8, 3.4); g.stroke();
  } else if(f.state === "special" && def.specialKind === "tackle"){
    // shoulder charge: lead shoulder low and forward, rear arm back
    R(g,-16, shY+6, 10, 18, topD); R(g,-17, shY+22, 7, 6, skin);
    R(g, 4, shY+2, 26, 8, top); R(g, 28, shY+1, 8, 9, skin);
    g.fillStyle = acc; g.fillRect(34, shY+2, 4, 8);
  } else if(f.state === "special" && def.specialKind === "barrage"){
    R(g,-14, shY, 6, 20, topD); R(g,-15, shY+18, 7, 6, skin);
    R(g, 6, shY+2, 22, 7, top); R(g, 26, shY+1, 8, 9, skin);
    R(g, 6, shY+12, 22, 6, topD); R(g, 26, shY+11, 8, 8, skin);
    g.fillStyle = acc; g.beginPath(); g.arc(40, shY+6, 6, 0, 6.283); g.fill();
  } else if(f.state === "block"){
    R(g,-12, shY+2, 9, 20, topD); R(g, 3, shY+2, 9, 20, top);
    R(g,-12, shY+2, 21, 6, top);
  } else if(crouch){
    R(g,-14, shY+6, 6, 16, topD); R(g,-15, shY+20, 7, 6, skin);
    R(g, 8, shY+6, 6, 16, top); R(g, 7, shY+20, 7, 6, skin);
  } else {
    // guard stance, front fist bobbing
    var gb = Math.round(Math.sin(t*5 + f.bobPhase)*2);
    R(g,-14, shY, 6, 20, topD); R(g,-15, shY+18, 7, 6, skin);
    R(g, 6, shY+4+gb, 7, 16, top); R(g, 7, shY+18+gb, 7, 6, skin);
    if(def.id === "toon"){ R(g, 6, shY+16+gb, 7, 3, acc); } // gold watch on the front wrist
  }
  g.restore();
}
var photoImgs = {};
function getPhoto(def){
  if(!def.photo) return null;
  if(!photoImgs[def.id]){
    var im = new Image();
    im.onload = function(){
      // Repaint any portrait showing now, so a VS/winner card that
      // rendered the pixel fallback swaps to the cartoon on load.
      try{
        drawPortrait(document.getElementById("vsP1"), ROSTER[p1Sel]);
        drawPortrait(document.getElementById("vsP2"), ROSTER[p2Sel]);
        if(fighters.length === 2){
          var wi = wins[0] > wins[1] ? 0 : 1;
          drawPortrait(document.getElementById("winPortrait"), fighters[wi].def);
        }
      }catch(e){}
    };
    im.src = def.photo;
    photoImgs[def.id] = im;
  }
  return photoImgs[def.id];
}
function drawPortrait(cv, def){
  var g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
  var w = cv.width, h = cv.height;
  var bg = g.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#2b2b4a"); bg.addColorStop(1,"#14141f");
  g.fillStyle = bg; g.fillRect(0,0,w,h);
  g.fillStyle = "rgba(255,210,63,.16)"; for(var i=0;i<w;i+=14) g.fillRect(i,0,4,h);
  if(def.photo && !def.sprite){
    // New cartoon fighters: top crop of the full-body cartoon, so
    // the head and outfit read on the card (the select grid's <img>
    // crops the same way). Falls through to the pixel portrait
    // until the image has actually loaded.
    var pim = getPhoto(def);
    if(pim && pim.complete && pim.naturalWidth){
      var sw = pim.naturalWidth, sh = Math.round(sw * h / w);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
      g.drawImage(pim, 0, 0, sw, Math.min(sh, pim.naturalHeight), 0, 0, w, h);
      g.imageSmoothingEnabled = false;
      g.strokeStyle = "#000"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w-3, h-3);
      return;
    }
  }
  if(def.sprite && spriteReady[def.id]){
    // Cartoon portrait: upper-body crop of the fighting-stance sprite.
    var spr = spriteImgs[def.id];
    var sw = spr.naturalWidth, sh = Math.round(sw * h / w);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(spr, 0, 0, sw, Math.min(sh, spr.naturalHeight), 0, 0, w, h);
    g.imageSmoothingEnabled = false;
    g.strokeStyle = "#000"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w-3, h-3);
    return;
  }
  var cx = w/2;
  // shoulders / top
  R(g, cx-42, 96, 84, 44, def.top); R(g, cx-42, 96, 84, 5, "#ffffff");
  if(def.id === "wiz"){
    R(g, cx-42, 96, 18, 44, "#ffffff"); R(g, cx+24, 96, 18, 44, "#ffffff");
    R(g, cx-8, 100, 4, 4, def.accent); R(g, cx+2, 106, 4, 4, def.accent);
    R(g, cx-8, 112, 4, 4, def.accent); R(g, cx+2, 118, 4, 4, def.accent);
  } else if(def.id === "toon"){
    // collared button-up: collar flaps, buttons, pocket, gold chain + pendant
    R(g, cx-13, 96, 12, 11, "#ffffff"); R(g, cx+1, 96, 12, 11, "#ffffff");
    R(g, cx-13, 105, 12, 2, def.topDark); R(g, cx+1, 105, 12, 2, def.topDark);
    R(g, cx-1, 112, 3, 3, "#9a958a"); R(g, cx-1, 124, 3, 3, "#9a958a");
    R(g, cx+13, 106, 14, 12, def.topDark); R(g, cx+14, 107, 12, 10, def.top);
    R(g, cx-7, 99, 3, 3, def.accent); R(g, cx+4, 99, 3, 3, def.accent);
    R(g, cx-3, 104, 7, 9, "#b98a00"); R(g, cx-2, 105, 5, 7, def.accent);
  } else if(def.id === "crimson"){
    R(g, cx-42, 96, 84, 5, "#ffffff");
    R(g, cx-10, 104, 20, 3, "#ff8fa3");
  } else if(def.id === "babes"){
    R(g, cx-30, 104, 60, 12, "#ff2e2e");
    R(g, cx-18, 107, 36, 5, "#ffffff");
    R(g, cx-18, 92, 36, 4, "#d8d8d8");
  } else if(def.id === "denim"){
    R(g, cx-42, 96, 18, 44, "#7fb0d8"); R(g, cx+24, 96, 18, 44, "#7fb0d8");
    R(g, cx-40, 104, 4, 4, "#e8e8e8"); R(g, cx+36, 104, 4, 4, "#e8e8e8");
  } else if(def.id === "wrap"){
    R(g, cx-42, 96, 84, 5, "#ffffff");
    R(g, cx-16, 106, 8, 8, "#ff8f3f"); R(g, cx+8, 106, 8, 8, "#35a0e0");
  } else {
    g.fillStyle = "#ffffff"; g.font = "bold 20px monospace"; g.textAlign = "center";
    g.fillText("96", cx, 128);
    R(g, cx-46, 104, 6, 30, def.topDark); R(g, cx+40, 104, 6, 30, def.topDark);
  }
  // neck + head
  R(g, cx-10, 74, 20, 24, def.skinDark);
  R(g, cx-24, 26, 48, 54, def.skin);
  R(g, cx-24, 66, 48, 8, def.skinDark);
  R(g, cx-14, 48, 7, 5, "#101018"); R(g, cx+7, 48, 7, 5, "#101018");
  R(g, cx-12, 66, 24, 3, "#3a2417");
  if(def.id === "wiz"){
    R(g, cx-27, 18, 54, 16, def.hair); R(g, cx-27, 18, 54, 4, "#ffffff");
    R(g, cx-32, 26, 7, 26, def.hairDark);
    R(g, cx-18, 92, 36, 6, def.accent); R(g, cx-3, 98, 7, 7, "#b98a00");
  } else if(def.id === "toon"){
    // cornrows + short tails, gold chain, mustache + goatee
    R(g, cx-27, 18, 54, 16, def.hair);
    R(g, cx-17, 18, 2, 16, "#4a3524"); R(g, cx-1, 18, 2, 16, "#4a3524"); R(g, cx+15, 18, 2, 16, "#4a3524");
    R(g, cx-32, 28, 7, 18, def.hair); R(g, cx+25, 28, 7, 18, def.hair);
    R(g, cx-18, 90, 36, 4, def.accent);
    R(g, cx-8, 62, 16, 3, def.hair);
    R(g, cx-4, 69, 8, 5, "#241811");
  } else if(def.id === "crimson"){
    R(g, cx-27, 18, 54, 12, def.hair);
    R(g, cx+18, 14, 22, 42, def.hair); R(g, cx+30, 10, 12, 14, def.hair);
    R(g, cx-28, 42, 4, 4, "#ffd23f");
  } else if(def.id === "babes"){
    R(g, cx-27, 18, 54, 12, def.hair);
    R(g, cx-2, 10, 6, 8, def.hair);
    R(g, cx-28, 42, 3, 3, "#e8e8e8");
  } else if(def.id === "denim"){
    R(g, cx-27, 18, 54, 12, def.hair);
    R(g, cx-30, 26, 8, 56, def.hair); R(g, cx+22, 26, 8, 56, def.hair);
  } else if(def.id === "wrap"){
    R(g, cx-27, 16, 54, 16, def.hair);
    R(g, cx-27, 22, 54, 3, "#2a2a2a");
    R(g, cx-4, 8, 8, 10, def.hair);
  } else {
    R(g, cx-27, 18, 54, 14, def.hair);
    R(g, cx-30, 28, 8, 58, def.hair); R(g, cx+22, 28, 8, 58, def.hair);
    R(g, cx-30, 80, 8, 5, def.accent); R(g, cx+22, 80, 8, 5, def.accent);
    R(g, cx-24, 26, 48, 4, def.hair);
  }
  g.strokeStyle = "#000"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w-3, h-3);
}
var particles = [], projectiles = [], strikes = [], rings = [], skyFlash = 0;
function ring(x, y, color, maxR){
  rings.push({ x: x, y: y, t: 0, dur: 0.35, color: color, maxR: maxR || 70 });
}
function burst(x, y, color, n, power){
  for(var i=0;i<(n||10);i++){
    var a = Math.random()*6.283, sp = (power||90)*(0.4+Math.random());
    particles.push({x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-40, life:0.35+Math.random()*0.25, max:0.6, color:color, size:2+Math.random()*3});
  }
}
function makeBolt(x){
  var pts = [{x:x, y:-6}], y = -6, cx = x;
  while(y < GROUND){
    y += 26 + Math.random()*32;
    cx += (Math.random()-0.5)*38;
    cx = Math.max(x-30, Math.min(x+30, cx));
    pts.push({x:cx, y:Math.min(y, GROUND)});
  }
  var branches = [];
  for(var b=0; b<2; b++){
    var bi = 2 + Math.floor(Math.random()*3);
    if(pts[bi]) branches.push({x:pts[bi].x, y:pts[bi].y, dx:(Math.random()<0.5?-1:1)*(18+Math.random()*22), dy:14+Math.random()*16});
  }
  return { pts: pts, branches: branches };
}
function callLightning(f){
  var opp = fighters[1 - f.side];
  var tx = opp ? opp.x : f.x + f.dir*120;
  tx = Math.max(30, Math.min(W-30, tx));
  strikes.push({ x: tx, t: 0, delay: 0.35, dur: 0.68, owner: f.side, bolt: makeBolt(tx), struck: false });
}
function updateFx(dt){
  skyFlash = Math.max(0, skyFlash - dt);
  for(var ri=rings.length-1;ri>=0;ri--){ rings[ri].t+=dt; if(rings[ri].t>=rings[ri].dur) rings.splice(ri,1); }
  for(var i=particles.length-1;i>=0;i--){ var p=particles[i]; p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=300*dt; if(p.life<=0) particles.splice(i,1); }
  for(var j=projectiles.length-1;j>=0;j--){ var pr=projectiles[j]; pr.x+=pr.vx*dt; pr.life-=dt;
    if(Math.random()<0.6) particles.push({x:pr.x, y:pr.y, vx:-pr.vx*0.08, vy:(Math.random()-0.5)*30, life:0.25, max:0.25, color: pr.color || "#ffd23f", size:3});
    if(pr.life<=0 || pr.x<-20 || pr.x>W+20) projectiles.splice(j,1); }
  for(var k=strikes.length-1;k>=0;k--){ var s=strikes[k]; s.t+=dt;
    if(!s.struck && s.t>=s.delay){
      s.struck = true;
      skyFlash = reduceMotion ? 0.08 : 0.22;
      sfx("thunder");
      shake = reduceMotion ? 0 : Math.max(shake, 9);
      burst(s.x, GROUND-8, "#fff7cc", 14, 150);
      burst(s.x, GROUND-30, "#ffd23f", 10, 110);
      // The bolt only lands if the foe is still under it: stepping
      // clear during the warning beats it, exactly as dodging or
      // blocking beats the other fighters' specials.
      // In a friend match the host owns damage: the guest only
      // shows the bolt, and the host's snapshot corrects health.
      var netGuestNoDamage = (typeof mode !== "undefined" && mode === "online" && typeof net !== "undefined" && net.connected && !net.isHost);
      if(!netGuestNoDamage && phase === "fight" && screen === "fight" && fighters.length === 2){
        var vic = fighters[1 - s.owner], atk = fighters[s.owner];
        if(vic && vic.state !== "ko" && Math.abs(vic.x - s.x) < 60){
          applyHit(atk, vic, 12, 0.38, 220, true, vic.x, vic.y - 55);
        } else {
          burst(s.x, GROUND-4, "#8a8494", 6, 60);
        }
      }
    }
    if(s.t>=s.dur) strikes.splice(k,1);
  }
}
function drawFx(g){
  if(skyFlash > 0){ g.fillStyle = "rgba(255,244,180," + skyFlash.toFixed(3) + ")"; g.fillRect(0, 0, W, H); }
  strikes.forEach(function(s){
    if(!s.struck){
      // Warning: a pulsing target glow where the bolt will fall.
      var pulse = 0.5 + 0.5*Math.sin(s.t*28);
      g.fillStyle = "rgba(255,210,63," + (0.25 + 0.35*pulse).toFixed(2) + ")";
      g.beginPath(); g.ellipse(s.x, GROUND+4, 22 + 4*pulse, 6, 0, 0, 6.283); g.fill();
      g.fillStyle = "#fff7cc";
      g.fillRect(s.x-2, GROUND-14-pulse*4, 4, 4);
      g.fillRect(s.x-8, GROUND-8, 3, 3); g.fillRect(s.x+5, GROUND-10-pulse*3, 3, 3);
    } else if(s.t - s.delay < 0.2){
      var age = s.t - s.delay, fade = 1 - age/0.2;
      g.save();
      g.strokeStyle = "rgba(255,210,63," + (0.55*fade).toFixed(2) + ")"; g.lineWidth = 7;
      g.beginPath(); s.bolt.pts.forEach(function(pt, idx){ if(idx===0) g.moveTo(pt.x, pt.y); else g.lineTo(pt.x, pt.y); }); g.stroke();
      g.strokeStyle = "rgba(255,247,204," + fade.toFixed(2) + ")"; g.lineWidth = 3;
      g.beginPath(); s.bolt.pts.forEach(function(pt, idx){ if(idx===0) g.moveTo(pt.x, pt.y); else g.lineTo(pt.x, pt.y); }); g.stroke();
      s.bolt.branches.forEach(function(br){
        g.strokeStyle = "rgba(255,247,204," + (0.8*fade).toFixed(2) + ")"; g.lineWidth = 2;
        g.beginPath(); g.moveTo(br.x, br.y); g.lineTo(br.x+br.dx, br.y+br.dy); g.stroke();
      });
      g.fillStyle = "rgba(255,247,204," + (0.7*fade).toFixed(2) + ")";
      g.beginPath(); g.ellipse(s.x, GROUND+2, 30, 7, 0, 0, 6.283); g.fill();
      g.restore();
    }
  });
  rings.forEach(function(r){
    var pr2 = r.t / r.dur;
    g.globalAlpha = 1 - pr2;
    g.strokeStyle = r.color; g.lineWidth = 4;
    g.beginPath(); g.ellipse(r.x, r.y, r.maxR * pr2, r.maxR * pr2 * 0.28, 0, 0, 6.283); g.stroke();
  });
  g.globalAlpha = 1;
  particles.forEach(function(p){ g.globalAlpha = Math.max(0, p.life/p.max); R(g, p.x-p.size/2, p.y-p.size/2, p.size, p.size, p.color); });
  g.globalAlpha = 1;
  projectiles.forEach(function(pr){
    if(pr.kind === "spear"){
      var ow = fighters[pr.owner];
      g.strokeStyle = "#c9c9c9"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(ow.x + ow.dir*30, ow.y - 58); g.lineTo(pr.x, pr.y); g.stroke();
      g.fillStyle = "#e8e8e8";
      g.beginPath(); g.moveTo(pr.x + (pr.vx > 0 ? 14 : -14), pr.y);
      g.lineTo(pr.x - (pr.vx > 0 ? 8 : -8), pr.y - 6);
      g.lineTo(pr.x - (pr.vx > 0 ? 8 : -8), pr.y + 6); g.closePath(); g.fill();
      g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(pr.x, pr.y, 4, 0, 6.283); g.fill();
      return;
    }
    if(pr.visual === "fan"){
      var fa = pr.x * 0.06;
      g.save(); g.translate(pr.x, pr.y); g.rotate(fa);
      g.fillStyle = pr.color || "#ff8fc4";
      for(var fi = 0; fi < 3; fi++){ g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 13, fi * 2.094 - 0.5, fi * 2.094 + 0.5); g.closePath(); g.fill(); }
      g.restore();
      g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(pr.x, pr.y, 3, 0, 6.283); g.fill();
      return;
    }
    if(pr.visual === "scream"){
      g.strokeStyle = pr.color || "#c04df0"; g.lineWidth = 3;
      var sa = (pr.x % 24) / 24;
      g.globalAlpha = 0.9 - sa * 0.6;
      g.beginPath(); g.arc(pr.x, pr.y, 6 + sa * 12, 0, 6.283); g.stroke();
      g.beginPath(); g.arc(pr.x, pr.y, 3 + sa * 8, 0, 6.283); g.stroke();
      g.globalAlpha = 1;
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(pr.x, pr.y, 4, 0, 6.283); g.fill();
      return;
    }
    if(pr.visual === "ring"){
      g.strokeStyle = pr.color || "#ff8fc4"; g.lineWidth = 4;
      g.beginPath(); g.arc(pr.x, pr.y, 10, 0, 6.283); g.stroke();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(pr.x, pr.y, 4, 0, 6.283); g.fill();
      return;
    }
    if(pr.visual === "hat"){
      var ha = pr.x * 0.08;
      g.save(); g.translate(pr.x, pr.y); g.rotate(ha);
      g.fillStyle = "#f2f2f2"; g.beginPath(); g.arc(0, -3, 8, 3.14159, 0); g.fill();
      g.fillStyle = "#2b6fd6"; g.fillRect(-11, -4, 22, 4);
      g.fillStyle = "#ffd23f"; g.font = "bold 9px sans-serif"; g.textAlign = "center"; g.fillText("23", 0, 2);
      g.restore();
      return;
    }
    if(pr.visual === "lure"){
      var la = pr.x * 0.07;
      g.save(); g.translate(pr.x, pr.y); g.rotate(la);
      g.strokeStyle = "#e8e8e8"; g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, 7, 0.3, 4.4); g.stroke();
      g.fillStyle = "#ff2e2e"; g.beginPath(); g.arc(5, 5, 3, 0, 6.283); g.fill();
      g.restore();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(pr.x, pr.y, 2, 0, 6.283); g.fill();
      return;
    }
    if(pr.visual === "freeze"){
      g.fillStyle = "#bfe6ff"; g.beginPath(); g.arc(pr.x, pr.y, 11, 0, 6.283); g.fill();
      g.strokeStyle = "#ffffff"; g.lineWidth = 2;
      for(var fi = 0; fi < 4; fi++){ var an = fi * 1.5708 + pr.x * 0.05; g.beginPath(); g.moveTo(pr.x + Math.cos(an) * 6, pr.y + Math.sin(an) * 6); g.lineTo(pr.x + Math.cos(an) * 13, pr.y + Math.sin(an) * 13); g.stroke(); }
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(pr.x, pr.y, 4, 0, 6.283); g.fill();
      return;
    }
    g.fillStyle = pr.color || "#ffd23f"; g.beginPath(); g.arc(pr.x, pr.y, 9, 0, 6.283); g.fill();
    g.fillStyle = "#fff7cc"; g.beginPath(); g.arc(pr.x, pr.y, 5, 0, 6.283); g.fill();
    g.fillStyle = "#b98a00"; g.fillRect(pr.x-12, pr.y-2, 4, 4); g.fillRect(pr.x+8, pr.y-2, 4, 4);
  });
}
