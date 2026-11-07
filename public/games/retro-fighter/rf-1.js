"use strict";
var W = 640, H = 360, GROUND = 302;
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
var ROSTER = [
  {
    id: "wiz", name: "CHI RAQ WIZ", title: "THE LYRICAL ASSASSIN",
    intro: "Chi-Town raised me. This roof is mine — come take it.",
    voice: { pitch: 0.7, rate: 0.95 },
    specialName: "SPEAR", specialKind: "spear",
    photo: "retro-fighter/img/wiz-photo.webp",
    sprite: "retro-fighter/img/wiz-sprite.webp",
    skin: "#8a5a38", skinDark: "#5f3a22", hair: "#efe9dc", hairDark: "#c9c2ae",
    top: "#f2efe6", topDark: "#c7c2b2", pants: "#efead9", pantsDark: "#c7c2b2",
    accent: "#ffd23f", accentDark: "#b98a00", shoe: "#ffffff", trim: "#ffd23f",
    speed: 205, hp: 100
  },
  {
    id: "penny", name: "PENNY K", title: "THE SEQUIN STORM",
    intro: "The spotlight loves me. You're just the opening act.",
    voice: { pitch: 1.4, rate: 1.1 },
    specialName: "FAN THROW", specialKind: "projectile", specialColor: "#ff8fc4",
    photo: "retro-fighter/img/penny-photo.webp",
    sprite: "retro-fighter/img/penny-sprite.webp",
    skin: "#7a4a2e", skinDark: "#54301c", hair: "#171210", hairDark: "#000000",
    top: "#ff4fa3", topDark: "#c42a74", pants: "#23233a", pantsDark: "#14141f",
    accent: "#ff8fc4", accentDark: "#ff4fa3", shoe: "#ff4fa3", trim: "#ffffff",
    speed: 235, hp: 100
  },
  {
    id: "toon", name: "TOON WIZ", title: "THE CARTOON ASSASSIN",
    intro: "Drawn to win, baby! You can't erase me!",
    voice: { pitch: 1.6, rate: 1.15 },
    specialName: "SHADOW KICK", specialKind: "dash", specialColor: "#37e05a",
    photo: "retro-fighter/img/toon-photo.webp",
    sprite: "retro-fighter/img/toon-sprite.webp",
    skin: "#7c4a26", skinDark: "#55301a", hair: "#171210", hairDark: "#000000",
    top: "#f7f5ee", topDark: "#cfcaba", pants: "#f2efe6", pantsDark: "#cfcaba",
    accent: "#ffd23f", accentDark: "#b98a00", shoe: "#ffffff", trim: "#ffd23f",
    speed: 220, hp: 100
  },
  {
    id: "crimson", name: "CRIMSON CURL", title: "THE PLAID PUNCHER",
    intro: "Plaid don't play. Step up and catch these hands.",
    voice: { pitch: 0.9, rate: 1.0 },
    specialName: "BANSHEE SCREAM", specialKind: "projectile", specialColor: "#c04df0",
    photo: "retro-fighter/img/crimson-photo.webp",
    sprite: "retro-fighter/img/crimson-sprite.webp", spriteFace: -1,
    portraitAlt: "Cartoon portrait of Crimson Curl, red curly hair, white shirt and plaid leggings, in a karate punch stance",
    skin: "#7a4a2e", skinDark: "#54301c", hair: "#d92b2b", hairDark: "#8f1a1a",
    top: "#f2f2f2", topDark: "#c9c9c9", pants: "#ddd6cc", pantsDark: "#a8a094",
    accent: "#ff2e2e", accentDark: "#b91c1c", shoe: "#222222", trim: "#ff2e2e",
    speed: 200, hp: 100
  },
  {
    id: "babes", name: "BABES CLUB", title: "THE CLUB CAPTAIN",
    intro: "The club runs through me. Last call, champ.",
    voice: { pitch: 1.25, rate: 1.05 },
    specialName: "RING TOSS", specialKind: "barrage", specialColor: "#ff8fc4",
    photo: "retro-fighter/img/babes-photo.webp",
    sprite: "retro-fighter/img/babes-sprite.webp",
    portraitAlt: "Cartoon portrait of Babes Club, club shirt and ripped jeans, in a fighting guard stance",
    skin: "#6e4530", skinDark: "#4a2c1c", hair: "#171210", hairDark: "#000000",
    top: "#ffffff", topDark: "#d8d8d8", pants: "#7fa3c8", pantsDark: "#54708f",
    accent: "#ff2e2e", accentDark: "#b91c1c", shoe: "#e53935", trim: "#ff2e2e",
    speed: 240, hp: 100
  },
  {
    id: "denim", name: "DOJO DENIM", title: "THE DENIM STRIKER",
    intro: "The dojo taught me one thing: finish it fast.",
    voice: { pitch: 0.8, rate: 0.95 },
    specialName: "BICYCLE KICK", specialKind: "spin", specialColor: "#ff7a1a",
    photo: "retro-fighter/img/denim-photo.webp",
    sprite: "retro-fighter/img/denim-sprite.webp", spriteFace: -1,
    portraitAlt: "Cartoon portrait of Dojo Denim, denim jacket over black, in a wide karate punch stance",
    skin: "#e8b89a", skinDark: "#c98d64", hair: "#5a3a26", hairDark: "#3a2417",
    top: "#7fb0d8", topDark: "#4f7ba3", pants: "#23232a", pantsDark: "#14141c",
    accent: "#35e0e6", accentDark: "#1a9aa0", shoe: "#f2efe6", trim: "#35e0e6",
    speed: 225, hp: 100
  },
  {
    id: "wrap", name: "WRAP WARRIOR", title: "THE CROWNED TACKLER",
    intro: "The crown stays on my head. Come try for it.",
    voice: { pitch: 0.85, rate: 1.0 },
    specialName: "HAMMER SLAM", specialKind: "slam",
    photo: "retro-fighter/img/wrap-photo.webp",
    sprite: "retro-fighter/img/wrap-sprite.webp",
    portraitAlt: "Cartoon portrait of Wrap Warrior, patterned headwrap and white tank, in a ready guard stance",
    skin: "#7a4a2e", skinDark: "#54301c", hair: "#e8ddc0", hairDark: "#8a7a52",
    top: "#f2f2f2", topDark: "#c9c9c9", pants: "#a8c8e0", pantsDark: "#6f93b0",
    accent: "#ff8f3f", accentDark: "#c25e12", shoe: "#ffffff", trim: "#ff8f3f",
    speed: 190, hp: 100
  },
  {
    id: "slick", name: "SLICK G", title: "THE SMOOTH OPERATOR",
    intro: "Number 23, baby. Smooth moves, smoother hands.",
    voice: { pitch: 0.8, rate: 1.0 },
    specialName: "HAT THROW", specialKind: "projectile", specialColor: "#ffd23f",
    photo: "retro-fighter/img/slick-photo.webp",
    sprite: "retro-fighter/img/slick-sprite.webp",
    skin: "#8a5a38", skinDark: "#5f3a22", hair: "#171210", hairDark: "#000000",
    top: "#2b6fd6", topDark: "#1d4f9e", pants: "#2b5fc7", pantsDark: "#1d448f",
    accent: "#ffd23f", accentDark: "#b98a00", shoe: "#ffffff", trim: "#ffd23f",
    speed: 215, hp: 100
  },
  {
    id: "richard", name: "RICHARD", title: "THE REEL DEAL",
    intro: "I came to fish. You are the catch.",
    voice: { pitch: 0.75, rate: 0.95 },
    specialName: "RAZOR-RANG", specialKind: "projectile", specialColor: "#7fe0c8",
    photo: "retro-fighter/img/richard-photo.webp",
    sprite: "retro-fighter/img/richard-sprite.webp",
    skin: "#d9a06b", skinDark: "#b07f4e", hair: "#6e5233", hairDark: "#4a3520",
    top: "#3a4a3a", topDark: "#263026", pants: "#c9b896", pantsDark: "#a08f6a",
    accent: "#7fe0c8", accentDark: "#3fa88f", shoe: "#222222", trim: "#7fe0c8",
    speed: 195, hp: 100
  },
  {
    id: "nonilla", name: "NO-NILLA", title: "THE GYM BRAWLER",
    intro: "No vanilla here, sweetheart. Just hands.",
    voice: { pitch: 1.1, rate: 1.05 },
    specialName: "BIONIC DASH", specialKind: "dash", specialColor: "#35e0e6",
    photo: "retro-fighter/img/nonilla-photo.webp",
    sprite: "retro-fighter/img/nonilla-sprite.webp",
    skin: "#7a4a2e", skinDark: "#54301c", hair: "#d92b2b", hairDark: "#8f1a1a",
    top: "#f2f2f2", topDark: "#c9c9c9", pants: "#ddd6cc", pantsDark: "#a8a094",
    accent: "#ff2e2e", accentDark: "#b91c1c", shoe: "#f2f2f2", trim: "#ff2e2e",
    speed: 230, hp: 100
  },
  {
    id: "dojo", name: "DOJO", title: "THE DOJO MASTER",
    intro: "The dojo is my home. Your lesson starts now.",
    voice: { pitch: 1.05, rate: 1.0 },
    specialName: "ICE BLAST", specialKind: "projectile", specialColor: "#9fd8ff",
    photo: "retro-fighter/img/dojo-photo.webp",
    sprite: "retro-fighter/img/dojo-sprite.webp",
    skin: "#e8b48c", skinDark: "#c08a5e", hair: "#4a3220", hairDark: "#2c1c10",
    top: "#2b6fd6", topDark: "#1d4f9e", pants: "#1a1a1a", pantsDark: "#000000",
    accent: "#9fd8ff", accentDark: "#4a90d9", shoe: "#f2f2f2", trim: "#9fd8ff",
    speed: 210, hp: 100
  },
  {
    id: "konfu", name: "KONFU", title: "THE BOSS IN WHITE",
    intro: "All white, all business. The B stands for boss.",
    voice: { pitch: 0.75, rate: 0.95 },
    specialName: "LIGHTNING CALL", specialKind: "lightning", specialColor: "#7fd4ff",
    photo: "retro-fighter/img/konfu-photo.webp",
    sprite: "retro-fighter/img/konfu-sprite.webp",
    skin: "#8a5a38", skinDark: "#5f3a22", hair: "#171210", hairDark: "#000000",
    top: "#f2f2f2", topDark: "#c9c9c9", pants: "#f2f2f2", pantsDark: "#c9c9c9",
    accent: "#ffd23f", accentDark: "#b98a00", shoe: "#f2f2f2", trim: "#ffd23f",
    speed: 205, hp: 100
  }
];
var LOCKED = [];
var spriteImgs = {}, spriteReady = {}, spriteFlash = {};
function loadSprite(def){
  if(!def.sprite || spriteImgs[def.id]) return spriteImgs[def.id];
  var im = new Image();
  im.onload = function(){
    spriteReady[def.id] = true;
    var c = document.createElement("canvas");
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    var cg = c.getContext("2d");
    cg.drawImage(im, 0, 0);
    cg.globalCompositeOperation = "source-in";
    cg.fillStyle = "#ffffff"; cg.fillRect(0, 0, c.width, c.height);
    spriteFlash[def.id] = c;
    // If a VS screen is showing a pixel fallback, repaint it with the cartoon.
    try{
      drawPortrait(document.getElementById("vsP1"), ROSTER[p1Sel]);
      drawPortrait(document.getElementById("vsP2"), ROSTER[p2Sel]);
    }catch(e){}
  };
  im.src = def.sprite;
  spriteImgs[def.id] = im;
  return im;
}
ROSTER.forEach(loadSprite);
var frameImgs = {};
var FRAME_FILES = { idleB: "-idle-b.webp", walk: ["-walk-1.webp", "-walk-2.webp", "-walk-3.webp", "-walk-4.webp"], punch: "-punch.webp" };
function frameURL(def, suffix){ return def.sprite.replace("-sprite.webp", suffix); }
function loadFrames(def){
  if(!def.sprite || frameImgs[def.id]) return;
  var set = { idleB: null, walk: [], punch: null };
  frameImgs[def.id] = set;
  function loadOne(suffix, slot, idx){
    var im = new Image();
    im.onload = function(){ if(idx === undefined) set[slot] = im; else set[slot][idx] = im; };
    im.src = frameURL(def, suffix);
  }
  loadOne(FRAME_FILES.idleB, "idleB");
  FRAME_FILES.walk.forEach(function(s, i){ loadOne(s, "walk", i); });
  loadOne(FRAME_FILES.punch, "punch");
}
ROSTER.forEach(loadFrames);
var AC = null, soundOn = true;
function audio(){ if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC=null; } }
  if(AC && AC.state === "suspended"){ AC.resume(); } return AC; }
function tone(freq, dur, type, vol, slide){
  if(!soundOn) return; var ac = audio(); if(!ac) return;
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = type || "square"; o.frequency.setValueAtTime(freq, ac.currentTime);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), ac.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.12, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
}
function noiseBurst(dur, vol){
  if(!soundOn) return; var ac = audio(); if(!ac) return;
  var len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for(var i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
  var s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = buf; g.gain.value = vol || 0.2; s.connect(g); g.connect(ac.destination); s.start();
}
function sfx(kind){
  if(kind==="punch"){ tone(110,0.09,"square",0.22,55); noiseBurst(0.06,0.18); }
  else if(kind==="kick"){ tone(85,0.12,"square",0.26,40); noiseBurst(0.08,0.22); }
  else if(kind==="block"){ tone(620,0.06,"square",0.1,420); }
  else if(kind==="jump"){ tone(220,0.14,"square",0.07,520); }
  else if(kind==="special"){ tone(180,0.3,"sawtooth",0.14,900); }
  else if(kind==="charge"){ tone(160,0.42,"sawtooth",0.12,1400); tone(1200,0.1,"square",0.05,2400); }
  else if(kind==="thunder"){ tone(95,0.5,"sawtooth",0.28,32); noiseBurst(0.45,0.3); tone(1600,0.07,"square",0.08,300); }
  else if(kind==="ko"){ tone(320,0.5,"sawtooth",0.2,40); noiseBurst(0.3,0.25); }
  else if(kind==="select"){ tone(660,0.07,"square",0.1); tone(880,0.09,"square",0.1); }
  else if(kind==="fight"){ tone(392,0.12,"square",0.16); tone(523,0.2,"square",0.16); }
  else if(kind==="win"){ [523,659,784,1046].forEach(function(f,i){ setTimeout(function(){ tone(f,0.16,"square",0.13); }, i*120); }); }
}
function R(g,x,y,w,h,c){ g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
function seededRand(seed){ var s=seed; return function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
