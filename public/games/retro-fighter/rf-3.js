var screen = "title"; // title | select | vs | fight | over
var mode = "cpu", difficulty = "normal";
var fighters = [], wins = [0,0], roundNum = 1, timer = 99;
var phase = "idle", phaseT = 0, banner = "", bannerSub = "";
var shake = 0, timeScale = 1, endTimer = 0, matchOver = false;
var combo = [0,0], comboT = [0,0];
var ai = { nextThink: 0, move: 0, wantJump: false, wantBlock: false };
var paused = false;
var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var net = {
  peer: null, conn: null, isHost: false, code: "", connected: false,
  connecting: false, waiting: false, localSel: -1, remoteSel: -1,
  remoteHeld: { left: false, right: false, up: false, down: false, block: false },
  remotePress: {}, lastInputSeq: 0, outSeq: 0, pingMs: null,
  lastStateSent: 0, lastPingSent: 0, rematchWanted: false, rematchPeerWanted: false,
  dropped: false
};
var netFrameHeld = { left: false, right: false, up: false, down: false, block: false };
var netFramePress = {};
var _netUpPrev = false;
function netLocalSlot(){ return net.isHost ? 0 : 1; }
function netActive(){ return mode === "online" && net.connected; }
function makeFighter(def, side){
  return {
    def: def, side: side, x: side===0 ? 200 : 440, y: GROUND, vx: 0, vy: 0,
    dir: side===0 ? 1 : -1, hp: def.hp, dispHp: def.hp, meter: 0,
    state: "idle", stateT: 0, attack: null, attackId: 0, attackHit: false,
    hitFlash: 0, hitStun: 0, blocking: false, crouching: false,
    walkPhase: 0, bobPhase: Math.random()*6, facing: side===0 ? 1 : -1,
    dashT: 0, koDone: false, pullT: 0, pullFrom: 0, pullTarget: 0
  };
}
function syncTeleportBtn(){
  var b = document.getElementById("teleportBtn"); if(!b) return;
  var lf = (mode === "online" && net.connected) ? fighters[netLocalSlot()] : fighters[0];
  b.hidden = !(lf && lf.def.id === "wiz");
}
// ---------- Pre-fight introductions: every fighter speaks ----------
var introSpoken = false;
function stopSpeech(){ try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){} }
function speakLine(def){
  try{
    if(!soundOn || !window.speechSynthesis || !def.intro) return;
    var u = new SpeechSynthesisUtterance(def.intro);
    var v = def.voice || {};
    u.pitch = v.pitch || 1; u.rate = v.rate || 1;
    window.speechSynthesis.speak(u);
  }catch(e){  }
}
function speakIntros(){
  if(introSpoken) return; introSpoken = true;
  stopSpeech();
  speakLine(fighters[0].def);
  speakLine(fighters[1].def);
}
function wrapLine(g, text, maxW){
  var words = String(text).split(" "), lines = [], cur = "";
  words.forEach(function(wd){
    var test = cur ? cur + " " + wd : wd;
    if(g.measureText(test).width > maxW && cur){ lines.push(cur); cur = wd; }
    else cur = test;
  });
  if(cur) lines.push(cur);
  return lines.slice(0, 3);
}
function drawIntroBubble(g, f){
  var def = f.def;
  g.font = "8px 'Press Start 2P', monospace";
  var lines = wrapLine(g, def.intro, 172);
  var bw = 196, bh = 22 + lines.length * 11;
  var cx = f.x, bx = Math.max(8, Math.min(640 - bw - 8, cx - bw / 2)), by = 62;
  g.fillStyle = "rgba(10,10,18,.88)";
  g.fillRect(bx, by, bw, bh);
  g.strokeStyle = def.accent; g.lineWidth = 2; g.strokeRect(bx, by, bw, bh);
  g.fillStyle = def.accent; g.textAlign = "left";
  g.fillText(def.name, bx + 10, by + 13);
  g.fillStyle = "#fff";
  lines.forEach(function(ln, i){ g.fillText(ln, bx + 10, by + 27 + i * 11); });
  g.fillStyle = "rgba(10,10,18,.88)";
  g.beginPath(); g.moveTo(cx - 7, by + bh); g.lineTo(cx + 7, by + bh); g.lineTo(cx, by + bh + 9); g.closePath(); g.fill();
}
// ---------- Story mode: fight the ladder, take the crown ----------
var storyIdx = 0, storyLadder = [], storyNext = false, storyRestart = false, vsTimer = null;
var STORY_OPEN = "The crown of Chi-Town is up for grabs. " + (ROSTER.length - 1) + " fighters stand between you and the throne.";
var STORY_END = "The crown is yours. Chi-Town has a new champion.";
var STORY_BEATS = {
  wiz: "The Lyrical Assassin himself steps onto the roof. Outrap the bars, outfight the fists.",
  penny: "Club Sequin is packed tonight, and Penny K owns the floor. Take the spotlight from her.",
  toon: "A cartoon assassin bounces out of the ink, grinning. Cartoons don't stay down — put him down twice.",
  crimson: "Crimson Curl waits on the rooftop, plaid pressed and fists ready. She does not lose at home.",
  babes: "Babes Club runs the night shift, and the captain doesn't share the floor. Make her move.",
  denim: "The dojo doors slide open. Denim bows once — then comes at you fast.",
  wrap: "Wrap Warrior wears the crown. Take it from him.",
  slick: "Slick G slides in smooth, cap low, chain shining. Do not let the smile fool you — the hat is sharp.",
  richard: "Richard wades in off the dock, rod in hand. He has fished bigger things than you.",
  nonilla: "No-Nilla is already warmed up, gloves up and grinning. No vanilla here — just hands."
};
function storyBeatText(){
  var opp = ROSTER[storyLadder[storyIdx]];
  var txt = (storyIdx === 0 ? STORY_OPEN + " " : "") + (STORY_BEATS[opp.id] || "");
  if(storyIdx >= storyLadder.length - 1) txt += " The final fight — one more win and the crown is yours.";
  return txt;
}
function startStory(pickIdx){
  storyLadder = [];
  var crownAt = -1;
  ROSTER.forEach(function(d, idx){
    if(idx !== pickIdx){ storyLadder.push(idx); if(d.id === "wrap") crownAt = storyLadder.length - 1; }
  });
  if(crownAt >= 0 && crownAt !== storyLadder.length - 1){
    var c = storyLadder.splice(crownAt, 1)[0];
    storyLadder.push(c);
  }
  storyIdx = 0; storyNext = false; storyRestart = false;
  p1Sel = pickIdx; p2Sel = storyLadder[0];
  beginVs();
}
function resetMatch(){
  wins = [0,0]; roundNum = 1; startRound();
}
function startRound(){
  var d1 = ROSTER[p1Sel], d2 = ROSTER[p2Sel];
  fighters = [makeFighter(d1,0), makeFighter(d2,1)];
  timer = 99; phase = "intro"; phaseT = roundNum === 1 ? 3.4 : 1.7; banner = "ROUND " + roundNum; bannerSub = "";
  introSpoken = false;
  particles = []; projectiles = []; strikes = []; rings = []; skyFlash = 0; combo = [0,0]; comboT = [0,0];
  ai.nextThink = 0;
  syncTeleportBtn();
}
function endRound(winnerIdx, reason){
  if(phase === "end") return;
  phase = "end"; phaseT = 2.3;
  banner = reason === "time" ? "TIME UP" : "K.O.!"; bannerSub = "";
  if(winnerIdx === -1){ banner = "DOUBLE K.O."; }
  else {
    wins[winnerIdx]++;
    bannerSub = fighters[winnerIdx].def.name + " TAKES THE ROUND";
    fighters[winnerIdx].state = "win"; fighters[winnerIdx].stateT = 0;
    if(reason !== "time") sfx("ko");
  }
  shake = reduceMotion ? 0 : 10; timeScale = 0.35;
  setTimeout(function(){ timeScale = 1; }, 500);
}
function finishMatch(){
  matchOver = true;
  var wi = wins[0] > wins[1] ? 0 : 1;
  var w = fighters[wi];
  sfx("win");
  document.getElementById("resultTitle").textContent = w.def.name + " WINS!";
  document.getElementById("winName").textContent = w.def.name + " — " + w.def.title;
  var noteEl = document.getElementById("resultNote");
  if(mode === "story"){
    var playerWon = (wi === 0);
    var lastChapter = storyIdx >= storyLadder.length - 1;
    if(playerWon && lastChapter){
      document.getElementById("resultTitle").textContent = w.def.name + " TAKES THE CROWN!";
      noteEl.textContent = STORY_END + " Run it back?";
      document.getElementById("rematchBtn").textContent = "RUN IT BACK";
      storyNext = false; storyRestart = true; storyIdx = 0;
    } else if(playerWon){
      noteEl.textContent = "Chapter " + (storyIdx + 1) + " clear. The road to the crown continues.";
      document.getElementById("rematchBtn").textContent = "NEXT FIGHT";
      storyNext = true;
    } else {
      noteEl.textContent = "Chapter " + (storyIdx + 1) + " lost. The crown waits — try again.";
      document.getElementById("rematchBtn").textContent = "TRY AGAIN";
      storyNext = false;
    }
  } else {
    noteEl.textContent =
      (mode === "online" ? (wi === netLocalSlot() ? "You take the night. Run it back?" : "Your friend takes the night. Run it back?")
      : (mode === "cpu" ? "The rooftop is yours. Run it back?" : "Player " + (wi+1) + " takes the night. Run it back?"));
  }
  drawPortrait(document.getElementById("winPortrait"), w.def);
  showScreen("over");
}
var ATTACKS = {
  punch: { startup: 0.09, active: 0.10, recover: 0.16, range: 52, dmg: 6, stun: 0.22, kb: 130, meter: 9 },
  kick:  { startup: 0.14, active: 0.12, recover: 0.24, range: 60, dmg: 9, stun: 0.30, kb: 190, meter: 12 }
};
function tryAttack(f, type){
  if(f.state === "ko" || f.hitStun > 0) return false;
  if(f.state !== "idle" && f.state !== "walk" && f.state !== "crouch" && f.state !== "jump" && f.state !== "block") return false;
  // Air kicks are allowed (this line used to refuse them).
  var a = ATTACKS[type];
  f.state = type; f.stateT = 0; f.attackId++;
  f.attack = { type: type, t: 0, dur: a.startup + a.active + a.recover, hitDone: false };
  f.vx = 0;
  // Footwork: a kick starts with a plant-foot stomp — a big tan dust burst off the back foot.
  if(type === "kick"){ burst(f.x - f.dir*28, GROUND, "#c9b18a", 16, 95); burst(f.x - f.dir*28, GROUND - 4, "#e8dcc0", 8, 60); }
  return true;
}
function trySpecial(f){
  if(f.state === "ko" || f.hitStun > 0 || f.meter < 50) return false;
  if(f.state !== "idle" && f.state !== "walk" && f.state !== "crouch" && f.state !== "block") return false;
  f.meter -= 50; f.state = "special"; f.stateT = 0; f.attackId++;
  var kind = f.def.specialKind;
  var durMap = { dash: 0.42, lightning: 0.55, slam: 0.95, spin: 0.5, tackle: 0.42, barrage: 0.38 };
  f.attack = { type: "special", t: 0, dur: durMap[kind] || 0.38, hitDone: false, slamDone: false };
  if(kind === "spear"){
    sfx("special");
    projectiles.push({ kind: "spear", x: f.x + f.dir*40, y: f.y - 58, vx: f.dir*520, owner: f.side, life: 1.3, dmg: 6, color: "#ffd23f" });
    burst(f.x + f.dir*40, f.y - 58, "#ffd23f", 6, 60);
  } else if(kind === "projectile"){
    sfx("special");
    var mkVis = { penny: "fan", crimson: "scream", slick: "hat", richard: "lure" }[f.def.id];
    var mkCol = f.def.specialColor || "#ffd23f";
    projectiles.push({ visual: mkVis, x: f.x + f.dir*40, y: f.y - 58, vx: f.dir*430, owner: f.side, life: 1.1, dmg: 12, color: mkCol });
    burst(f.x + f.dir*40, f.y - 58, mkCol, 6, 60);
  } else if(kind === "barrage"){
    // Three shots at once — high, mid, low — each weaker than a
    // single blast, so the full spread only lands up close.
    sfx("special");
    [-72, -55, -38].forEach(function(dy){
      projectiles.push({ visual: "ring", x: f.x + f.dir*40, y: f.y + dy, vx: f.dir*430, owner: f.side, life: 1.1, dmg: 6, color: f.def.specialColor || f.def.accent });
    });
    burst(f.x + f.dir*40, f.y - 55, f.def.accent, 8, 70);
  } else if(kind === "slam"){
    // Leap toward the foe and slam down: the shockwave hits
    // anyone still standing near the landing spot.
    sfx("jump"); sfx("special");
    f.vy = -620; f.vx = f.dir * 250;
    burst(f.x, f.y - 90, f.def.accent, 8, 70);
  } else if(kind === "spin"){
    sfx("special");
    burst(f.x, f.y - 55, f.def.specialColor || f.def.accent, 10, 90);
  } else if(kind === "tackle"){
    sfx("special");
    f.dashT = 0.42; f.vx = f.dir * 560;
    burst(f.x, f.y - 40, f.def.accent, 8, 80);
  } else if(kind === "lightning"){
    // Same 50-meter cost as every other special. The bolt is called
    // down on the foe's spot at cast time and lands 0.45s later, so
    // it can be stepped out of or blocked — and it deals the same
    // 12 damage / 0.38s stun / 220 knockback as Chi Raq Wiz's blast.
    sfx("charge");
    callLightning(f);
    burst(f.x + f.dir*30, f.y - 110, "#ffd23f", 6, 50);
  } else {
    sfx("special");
    f.dashT = 0.42; f.vx = f.dir * 520;
    burst(f.x, f.y - 40, f.def.specialColor || "#ff4fa3", 8, 80);
  }
  return true;
}
function tryTeleport(f){
  if(f.def.id !== "wiz") return false;
  if(f.state === "ko" || f.hitStun > 0 || f.meter < 50) return false;
  if(f.state !== "idle" && f.state !== "walk" && f.state !== "crouch" && f.state !== "block") return false;
  f.meter -= 50; f.state = "special"; f.stateT = 0; f.attackId++;
  f.attack = { type: "teleport", t: 0, dur: 0.55, hitDone: false, teleDone: false };
  sfx("special");
  burst(f.x, f.y - 60, "#ff7a1a", 12, 110);
  burst(f.x, f.y - 20, "#ffd23f", 8, 80);
  return true;
}
function applyHit(att, vic, dmg, stun, kb, isSpecial, hx, hy){
  if(vic.attack && vic.attack.type === "teleport" && !vic.attack.teleDone){ return; }
  var blocked = vic.blocking && vic.state !== "ko" && vic.dir === -att.dir;
  if(blocked){
    vic.hp = Math.max(1, vic.hp - 1); vic.meter = Math.min(100, vic.meter + 5);
    burst(hx !== undefined ? hx : att.x + att.dir*34, hy !== undefined ? hy : att.y - 55, "#35e0e6", 6, 70); sfx("block");
    vic.vx = att.dir * 40; return;
  }
  vic.hp = Math.max(0, vic.hp - dmg);
  vic.hitFlash = 0.12; vic.hitStun = stun; vic.state = "hit"; vic.stateT = 0;
  vic.vx = att.dir * kb; vic.attack = null;
  vic.meter = Math.min(100, vic.meter + 7);
  att.meter = Math.min(100, att.meter + (isSpecial ? 4 : 9));
  var idx = vic.side;
  combo[att.side]++; comboT[att.side] = 1.4;
  var hitX = hx !== undefined ? hx : att.x + att.dir*34, hitY = hy !== undefined ? hy : att.y - 55;
  ring(hitX, hitY, isSpecial ? "#ffd23f" : "#ffffff", isSpecial ? 80 : 50);
  burst(hitX, hitY, isSpecial ? "#ffd23f" : "#ffffff", isSpecial ? 16 : 10, isSpecial ? 160 : 110);
  burst(hitX, hitY, "#ff2e2e", 5, 80);
  shake = reduceMotion ? 0 : Math.max(shake, isSpecial ? 9 : 5);
  sfx(isSpecial ? "kick" : (dmg > 7 ? "kick" : "punch"));
  if(vic.hp <= 0 && vic.state !== "ko"){
    vic.state = "ko"; vic.koDone = true; vic.vx = att.dir * 160;
    var other = fighters[1 - idx];
    endRound(att.side, "ko");
  }
}
var keys = {};
var press = { p1: {}, p2: {} }; // edge-triggered, consumed in update
function setPress(who, k){ press[who][k] = true; }
function bindKey(code, who, k, isDown){
  if(isDown && !keys[code]) setPress(who, k);
  keys[code] = isDown;
}
var KEYMAP = {
  KeyA: ["p1","left"], KeyD: ["p1","right"], KeyW: ["p1","up"], KeyS: ["p1","down"],
  KeyJ: ["p1","punch"], KeyK: ["p1","kick"], KeyU: ["p1","special"], KeyI: ["p1","teleport"], KeyL: ["p1","block"],
  ArrowLeft: ["p2","left"], ArrowRight: ["p2","right"], ArrowUp: ["p2","up"], ArrowDown: ["p2","down"],
  Comma: ["p2","punch"], Period: ["p2","kick"], Slash: ["p2","special"], Quote: ["p2","teleport"], ShiftRight: ["p2","block"],
  Numpad1: ["p2","punch"], Numpad2: ["p2","kick"], Numpad3: ["p2","special"], Numpad0: ["p2","block"]
};
window.addEventListener("keydown", function(e){
  if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].indexOf(e.code) >= 0) e.preventDefault();
  var m = KEYMAP[e.code];
  if(m) bindKey(e.code, m[0], m[1], true);
  if(e.code === "Enter" || e.code === "Space"){
    if(screen === "title"){ audio(); startSelect(); }
    else if(screen === "over"){ if(!(mode === "online" && net.connected)) rematch(); }
  }
  if(e.code === "Escape" || e.code === "KeyP"){
    if(mode === "online" && net.connected) return;
    if(screen === "fight"){ paused ? resumeGame() : pauseGame(); }
  }
});
window.addEventListener("keyup", function(e){
  var m = KEYMAP[e.code]; if(m) bindKey(e.code, m[0], m[1], false);
});
function held(who, k){
  for(var code in KEYMAP){ if(KEYMAP[code][0]===who && KEYMAP[code][1]===k && keys[code]) return true; }
  if(who === "p1" && gpHeld[k]) return true;
  return !!(touchHeld[who] && touchHeld[who][k]);
}
var touchHeld = { p1: {} };
var gpHeld = {};
var gpPrevJumpBtn = false; // edge tracker: pad jump is a tap like the keyboard
var gpActiveIdx = -1, gpMenuPrev = null, gpSelIdx = 0, gpLastStatus = "";
function gpBtn(gp, n){
  var b = gp.buttons && gp.buttons[n];
  return !!(b && (b.pressed || b.value > 0.5));
}
function gpSetStatus(text){
  if(text === gpLastStatus) return;
  gpLastStatus = text;
  var el = document.getElementById("padStatus");
  if(el) el.textContent = text;
}
function gpShowFocus(){
  var picks = document.querySelectorAll("#selGrid .pick");
  picks.forEach(function(p, i){ p.classList.toggle("gp-focus", i === gpSelIdx && i < ROSTER.length); });
}
function gpMenuAction(e){
  var drop = document.getElementById("netDropScreen");
  if(drop && !drop.hidden){
    if(e.a) document.getElementById("netDropTitleBtn").click();
    else if(e.b) document.getElementById("netDropRetryBtn").click();
    return;
  }
  if(paused){
    if(e.a || e.start) resumeGame();
    else if(e.b) quitToTitle();
    return;
  }
  if(screen === "title"){
    if(e.a || e.start){ audio(); sfx("select"); startSelect(); }
  } else if(screen === "select"){
    if(e.left){ gpSelIdx = (gpSelIdx + ROSTER.length - 1) % ROSTER.length; sfx("select"); gpShowFocus(); }
    else if(e.right){ gpSelIdx = (gpSelIdx + 1) % ROSTER.length; sfx("select"); gpShowFocus(); }
    else if(e.a){ gpShowFocus(); pickFighter(gpSelIdx); }
  } else if(screen === "over"){
    if(e.a) document.getElementById("rematchBtn").click();
    else if(e.b) document.getElementById("changeBtn").click();
  }
}
var gpMap = { jump: 0, punch: 2, kick: 1, special: 3, block: [4, 5], start: 9 };
var gpMapCustom = false;
var touchLast = "";
var touchLabel = { up: "JUMP", down: "CROUCH", left: "LEFT", right: "RIGHT", punch: "PUNCH", kick: "KICK", special: "SPECIAL", block: "BLOCK" };
function gpTouchSuffix(){ return touchLast ? " • TOUCH: " + touchLast : ""; }
var gpPrevBtns = {};
var gpLastBtn = -1;
var gpRemap = null; 
var gpRemapSteps = [
  { key: "jump", label: "JUMP" },
  { key: "punch", label: "PUNCH" },
  { key: "kick", label: "KICK" },
  { key: "special", label: "SPECIAL" },
  { key: "block", label: "BLOCK" }
];
var gpLastTest = "";
function gpSetTest(text){
  if(text === gpLastTest) return;
  gpLastTest = text;
  var el = document.getElementById("padTest");
  if(el) el.textContent = text;
}
function gpMapText(){
  return "JUMP=B" + gpMap.jump + " PUNCH=B" + gpMap.punch + " KICK=B" + gpMap.kick +
    " SPECIAL=B" + gpMap.special + " BLOCK=B" + gpMap.block.join("/") + " TELEPORT=B6";
}
function gpCancelRemap(){
  gpRemap = null;
  var b = document.getElementById("remapBtn");
  if(b){ b.textContent = "REMAP PAD"; b.classList.remove("remap-on"); }
}
function gpStartRemap(){
  if(gpRemap){ gpCancelRemap(); return; }
  gpRemap = { step: 0, ignore: -1, used: {} };
  var b = document.getElementById("remapBtn");
  if(b){ b.textContent = "CANCEL REMAP"; b.classList.add("remap-on"); }
}
function pollGamepad(){
  var pads = navigator.getGamepads ? navigator.getGamepads() : [];
  var list = [];
  for(var i = 0; i < pads.length; i++){ if(pads[i]) list.push(pads[i]); }
  if(!list.length){
    if(gpActiveIdx !== -1){ gpActiveIdx = -1; gpHeld = {}; gpMenuPrev = null; gpPrevBtns = {}; gpPrevJumpBtn = false; }
    gpSetStatus("NO CONTROLLER");
    if(gpRemap) gpSetTest("REMAP: plug in a controller first, then press the button you want for " + gpRemapSteps[gpRemap.step].label + ". Tap REMAP PAD again to cancel." + gpTouchSuffix());
    else gpSetTest("No controller seen yet — plug one in and press any button. If its buttons don't match the layout below, tap REMAP PAD and press the button you want for each move." + gpTouchSuffix());
    return;
  }
  var btn = {}, move = { left: false, right: false, up: false, down: false };
  for(var n = 0; n < 20; n++) btn[n] = false;
  var display = null, displayScore = -1;
  list.forEach(function(gp){
    var score = 0;
    for(var k = 0; k < gp.buttons.length && k < 20; k++){ if(gpBtn(gp, k)){ btn[k] = true; score = 2; } }
    var ax0 = gp.axes[0] || 0, ax1 = gp.axes[1] || 0;
    if(gpBtn(gp, 14) || ax0 < -0.4) move.left = true;
    if(gpBtn(gp, 15) || ax0 > 0.4) move.right = true;
    if(gpBtn(gp, 12) || ax1 < -0.4) move.up = true;
    if(gpBtn(gp, 13) || ax1 > 0.4) move.down = true;
    if(Math.abs(ax0) > 0.4 || Math.abs(ax1) > 0.4) score = Math.max(score, 1);
    if(score > displayScore){ displayScore = score; display = gp; }
  });
  if(displayScore <= 0){
    for(var j = 0; j < list.length; j++){ if(list[j].index === gpActiveIdx){ display = list[j]; break; } }
    if(!display) display = list[0];
  }
  if(display.index !== gpActiveIdx){ gpActiveIdx = display.index; gpMenuPrev = null; }
  var newBtns = [];
  for(var m = 0; m < 20; m++){ if(btn[m] && !gpPrevBtns[m]) newBtns.push(m); }
  if(newBtns.length) gpLastBtn = newBtns[0];
  if(gpRemap){
    if(gpRemap.ignore >= 0 && !btn[gpRemap.ignore]) gpRemap.ignore = -1;
    var cand = -1;
    for(var c = 0; c < newBtns.length; c++){ if(newBtns[c] !== gpRemap.ignore){ cand = newBtns[c]; break; } }
    if(cand >= 0 && gpRemap.used[cand]){
      gpSetTest("REMAP: BUTTON " + cand + " IS ALREADY USED FOR " + gpRemap.used[cand] + " — PRESS A DIFFERENT BUTTON FOR " + gpRemapSteps[gpRemap.step].label + ". Tap REMAP PAD again to cancel.");
      gpRemap.ignore = cand;
    } else if(cand >= 0){
      var step = gpRemapSteps[gpRemap.step];
      if(step.key === "block") gpMap.block = [cand]; else gpMap[step.key] = cand;
      gpRemap.used[cand] = step.label;
      gpMapCustom = true;
      gpRemap.ignore = cand; gpRemap.step++;
      sfx("select");
      if(gpRemap.step >= gpRemapSteps.length){
        gpCancelRemap();
        gpSetTest("REMAP SAVED FOR THIS SESSION — " + gpMapText() + ". Play a fight and test every button. Tap REMAP PAD to change it again.");
      }
    } else {
      gpSetTest("REMAP: press the button you want for " + gpRemapSteps[gpRemap.step].label + " (" + (gpRemap.step + 1) + " of 5). Tap REMAP PAD again to cancel.");
    }
    gpHeld = { left: false, right: false, up: false, down: false, block: false, punch: false, kick: false, special: false, jumpBtn: false };
    gpPrevBtns = btn;
    gpPrevJumpBtn = false;
    return;
  }
  var jumpDown = !!btn[gpMap.jump], kickDown = !!btn[gpMap.kick], startDown = !!btn[gpMap.start];
  var blockDown = false;
  for(var bi = 0; bi < gpMap.block.length; bi++){ if(btn[gpMap.block[bi]]) blockDown = true; }
  gpHeld = {
    left: move.left, right: move.right, up: move.up, down: move.down,
    block: blockDown,
    punch: !!btn[gpMap.punch], kick: kickDown, special: !!btn[gpMap.special], teleport: !!btn[6], jumpBtn: jumpDown
  };
  var nm = (display.id || "CONTROLLER").replace(/\s*\(.*?\)\s*/g, " ").trim();
  gpSetStatus("CONTROLLER: " + (nm || "CONNECTED").toUpperCase().slice(0, 42));
  var mapping = (display.mapping || "unknown").toUpperCase();
  var pressedList = [];
  for(var pl = 0; pl < 20; pl++){ if(btn[pl]) pressedList.push(pl); }
  gpSetTest("PAD: " + (nm || "CONNECTED").toUpperCase().slice(0, 30) + " • MAPPING: " + mapping +
    (mapping !== "STANDARD" ? " — NON-STANDARD, TAP REMAP PAD" : "") +
    " • PRESSED: " + (pressedList.length ? pressedList.join(", ") : "—") +
    (gpLastBtn >= 0 ? " • LAST BUTTON: " + gpLastBtn : "") +
    (gpMapCustom ? " • REMAP: " : " • DEFAULT: ") + gpMapText() + gpTouchSuffix());
  var prev = gpMenuPrev || {};
  var e = {
    a: jumpDown && !prev.a,
    b: kickDown && !prev.b,
    start: startDown && !prev.start,
    left: gpHeld.left && !prev.left,
    right: gpHeld.right && !prev.right
  };
  gpMenuPrev = { a: jumpDown, b: kickDown, start: startDown, left: gpHeld.left, right: gpHeld.right };
  gpPrevBtns = btn;
  var dropShown = (function(){ var d = document.getElementById("netDropScreen"); return !!(d && !d.hidden); })();
  if(screen !== "fight" || paused || dropShown){
    gpMenuAction(e);
  } else {
    if(gpHeld.jumpBtn && !gpPrevJumpBtn) setPress("p1", "up");
    if(gpHeld.punch) setPress("p1", "punch");
    if(gpHeld.kick) setPress("p1", "kick");
    if(gpHeld.special) setPress("p1", "special");
    if(gpHeld.teleport) setPress("p1", "teleport");
    if(e.start && !(mode === "online" && net.connected)) pauseGame();
  }
  gpPrevJumpBtn = !!gpHeld.jumpBtn;
}
window.addEventListener("gamepadconnected", function(ev){
  gpActiveIdx = ev.gamepad.index; gpMenuPrev = null;
  gpSetStatus("CONTROLLER: " + (ev.gamepad.id || "CONNECTED").toUpperCase().slice(0, 42));
});
window.addEventListener("gamepaddisconnected", function(){
  gpActiveIdx = -1; gpHeld = {}; gpMenuPrev = null; gpPrevBtns = {}; gpSetStatus("NO CONTROLLER");
});
function aiThink(f, opp, dt){
  ai.nextThink -= dt;
  var cfg = { easy: { react: 0.55, aggr: 0.45, block: 0.08, spec: 0.25 },
              normal: { react: 0.34, aggr: 0.62, block: 0.18, spec: 0.45 },
              hard: { react: 0.18, aggr: 0.8, block: 0.3, spec: 0.65 } }[difficulty];
  if(ai.nextThink <= 0){
    ai.nextThink = cfg.react * (0.6 + Math.random()*0.8);
    var dist = Math.abs(opp.x - f.x);
    var toward = opp.x > f.x ? 1 : -1;
    ai.move = 0; ai.wantJump = false; ai.wantBlock = false;
    var r = Math.random();
    if(dist > 62){ ai.move = toward; if(r < 0.08) ai.wantJump = true; }
    else if(dist < 40 && r < 0.25){ ai.move = -toward; }
    else if(r < cfg.aggr){ ai.move = toward; }
    if(opp.attack && dist < 70 && Math.random() < cfg.block) ai.wantBlock = true;
    if(dist <= 62 && Math.random() < cfg.aggr){
      if(f.meter >= 50 && Math.random() < cfg.spec) trySpecial(f);
      else if(Math.random() < 0.55) tryAttack(f, "punch"); else tryAttack(f, "kick");
    }
    if(dist > 200 && f.meter >= 50 && f.def.specialKind === "projectile" && Math.random() < 0.5) trySpecial(f);
    if(dist > 150 && f.meter >= 50 && f.def.specialKind === "spear" && Math.random() < 0.5) trySpecial(f);
    if(dist > 150 && f.meter >= 50 && f.def.specialKind === "barrage" && Math.random() < 0.5) trySpecial(f);
    if(dist >= 60 && dist <= 200 && f.meter >= 50 && f.def.specialKind === "slam" && Math.random() < 0.4) trySpecial(f);
    if(f.def.specialKind === "lightning" && f.meter >= 50 && Math.random() < 0.35) trySpecial(f);
  }
  return { left: ai.move === -1, right: ai.move === 1, up: ai.wantJump, down: false, block: ai.wantBlock };
}
function update(dt, t){
  var sdt = dt * timeScale;
  updateFx(sdt);
  if(phase === "intro" || phase === "announce"){
    if(roundNum === 1) speakIntros();
    phaseT -= dt;
    if(phaseT <= 0){ phase = "fight"; phaseT = 0.6; banner = "FIGHT!"; bannerSub = ""; sfx("fight"); }
    fighters.forEach(function(f){ f.state = "idle"; });
    return;
  }
  if(phase === "fight" && phaseT > 0){
    phaseT -= dt; if(phaseT <= 0) banner = "";
  }
  if(phase === "end"){
    phaseT -= dt;
    fighters.forEach(function(f){
      if(f.state === "ko"){ f.x += f.vx * sdt; f.vx *= 0.9; f.x = Math.max(f.def.sprite ? 42 : 28, Math.min(W - (f.def.sprite ? 42 : 28), f.x)); }
      if(f.state === "win"){ f.stateT += sdt; }
    });
    if(phaseT <= 0){
      if(wins[0] >= 2 || wins[1] >= 2){ finishMatch(); }
      else { roundNum++; startRound(); }
    }
    return;
  }
  if(phase !== "fight" || screen !== "fight" || paused) return;
  // timer
  timer -= dt;
  if(timer <= 0){
    timer = 0;
    var wi = fighters[0].hp === fighters[1].hp ? -1 : (fighters[0].hp > fighters[1].hp ? 0 : 1);
    if(wi === -1){ endRound(-1, "time"); }
    else endRound(wi, "time");
    return;
  }
  for(var ci=0; ci<2; ci++){ comboT[ci] -= dt; if(comboT[ci] <= 0) combo[ci] = 0; }
  fighters.forEach(function(f, idx){
    var opp = fighters[1-idx];
    f.hitFlash = Math.max(0, f.hitFlash - dt);
    f.hitStun = Math.max(0, f.hitStun - dt);
    // facing
    if(f.state !== "ko" && f.hitStun <= 0) f.dir = opp.x >= f.x ? 1 : -1;
    // Scorpion spear pull: yanked toward the spearman, no control.
    if(f.pullT > 0){
      f.pullT -= dt;
      f.hitStun = Math.max(f.hitStun, 0.05);
      f.state = "hit";
      var pdir = f.pullTarget > f.x ? 1 : -1;
      f.x += pdir * 950 * sdt;
      if((pdir > 0 && f.x >= f.pullTarget) || (pdir < 0 && f.x <= f.pullTarget)){
        f.x = f.pullTarget; f.pullT = 0; f.hitStun = 0.3; f.state = "hit"; f.stateT = 0;
      }
      f.vx = 0;
    }
    // input
    // Friend match: the local fighter is driven by this device's
    // Player 1 controls (keyboard / touch / gamepad) whichever side
    // it is on; the remote fighter is driven by this frame's network
    // input snapshot. Every other mode is unchanged.
    var isRemote = (mode === "online" && net.connected && idx !== netLocalSlot());
    var isLocalOnline = (mode === "online" && net.connected && idx === netLocalSlot());
    var inp;
    if(isRemote) inp = { left: !!netFrameHeld.left, right: !!netFrameHeld.right, up: !!netFrameHeld.up, down: !!netFrameHeld.down, block: !!netFrameHeld.block };
    else if(idx === 1 && mode === "cpu") inp = aiThink(f, opp, dt);
    else if(idx === 0 || isLocalOnline) inp = { left: held("p1","left"), right: held("p1","right"), up: held("p1","up"), down: held("p1","down"), block: held("p1","block") };
    else inp = { left: held("p2","left"), right: held("p2","right"), up: held("p2","up"), down: held("p2","down"), block: held("p2","block") };
    var who = idx === 0 ? "p1" : "p2";
    var p = isRemote ? netFramePress : press[isLocalOnline ? "p1" : who];
    var busy = f.attack !== null || f.hitStun > 0 || f.state === "ko" || f.pullT > 0;
    var onGround = f.y >= GROUND - 1;
    // Held touch-pad buttons act like held gamepad buttons: holding
    // PUNCH on a phone repeats the punch instead of needing a
    // perfectly timed tap, matching the gamepad fix above.
    if(!isRemote && (idx === 0 || isLocalOnline) && touchHeld.p1){
      if(touchHeld.p1.punch) p.punch = true;
      if(touchHeld.p1.kick) p.kick = true;
      if(touchHeld.p1.special) p.special = true;
      if(touchHeld.p1.teleport) p.teleport = true;
    }
    if(f.state === "hit" && f.hitStun <= 0){ f.state = "idle"; }
    // Air attacks allowed: punch/kick fire mid-jump; specials stay grounded via their own guards.
    if(!busy){
      if(p.punch){ tryAttack(f, "punch"); }
      else if(p.kick){ tryAttack(f, "kick"); }
      else if(p.special){ trySpecial(f); }
      else if(p.teleport){ tryTeleport(f); }
    }
    // Input buffer: a tap that lands while the fighter is busy
    // (mid-attack, in hitstun) is kept for the next free frame
    // instead of being thrown away — on a pad or touch screen a
    // tap is deliberate, so losing it to a hitstun frame reads as
    // "the button does nothing". A knocked-out fighter clears its
    // presses, so nothing fires into the next round.
    if(!(busy && f.state !== "ko")){ p.punch = p.kick = p.special = p.teleport = false; }
    // jump (edge via held + ground: use press for up too). The
    // press is only consumed on a free, grounded frame, for the
    // same buffering reason — a jump tapped during hitstun or
    // mid-air fires on the next free grounded frame instead of
    // vanishing.
    var jumpPressed = false;
    if(idx === 1 && mode === "cpu") jumpPressed = inp.up && onGround && !f._jumped;
    else if(isRemote) jumpPressed = !!netFramePress.up && onGround && !f._jumped;
    else if(!busy && onGround) jumpPressed = pressUp(isLocalOnline ? "p1" : who);
    var justJumped = false;
    if(jumpPressed && !busy && onGround){ f.vy = -640; f.state = "jump"; sfx("jump"); burst(f.x, GROUND, "#8a8494", 5, 50); justJumped = true; }
    f._jumped = inp.up;
    // movement — recompute after the attack/jump above: the old code
    // tested the pre-attack "busy" flag here, so walking overwrote a
    // punch, kick or special the very frame it started and the move
    // never showed. An attack now holds its pose; a jump is not
    // flattened back to walk/idle on its first frame.
    var nowBusy = f.attack !== null || f.hitStun > 0 || f.state === "ko";
    f.blocking = false; f.crouching = false;
    if(!nowBusy && !justJumped){
      var mv = 0;
      if(inp.left) mv -= 1; if(inp.right) mv += 1;
      if(inp.down && onGround){ f.crouching = true; f.state = "crouch"; f.vx = 0; }
      else if(inp.block && onGround){ f.blocking = true; f.state = "block"; f.vx = 0; }
      else if(onGround){
        f.vx = mv * f.def.speed;
        f.state = mv !== 0 ? "walk" : "idle";
        if(mv !== 0) f.walkPhase += dt * 10;
      } else {
        f.vx += mv * 320 * dt; f.state = "jump";
      }
    } else if(f.state === "hit" && f.hitStun <= 0){
      f.state = "idle";
    }
    // special dash / tackle motion
    if(f.state === "special" && f.def.specialKind === "dash"){ f.vx = f.dir * 520; }
    if(f.state === "special" && f.def.specialKind === "tackle"){ f.vx = f.dir * 560; }
    // attack timing
    if(f.attack){
      f.attack.t += sdt;
      var a = f.attack.type === "special" ? null : ATTACKS[f.attack.type];
      if(f.attack.type !== "special" && a){
        var inWindow = f.attack.t >= a.startup && f.attack.t <= a.startup + a.active;
        if(inWindow && !f.attack.hitDone){
          var reach = a.range, dmg = a.dmg, stun = a.stun, kb = a.kb;
          // Wiz's kick is a roundhouse: longer reach, harder hit.
          if(f.attack.type === "kick" && f.def.id === "wiz"){ reach = 85; dmg = 12; stun = 0.35; kb = 240; }
          var dx = Math.abs(opp.x - f.x), dy = Math.abs(opp.y - f.y);
          var facingOpp = (opp.x - f.x) * f.dir > 0;
          if(dx < reach && dy < 90 && facingOpp){
            f.attack.hitDone = true;
            applyHit(f, opp, dmg, stun, kb, false);
          }
        }
      }
      if(f.attack.type === "teleport" && !f.attack.teleDone && f.attack.t >= 0.22){
        f.attack.teleDone = true;
        f.x = opp.x - opp.dir * 44;
        f.dir = opp.dir;
        burst(f.x, f.y - 60, "#ff7a1a", 12, 110);
        burst(f.x, f.y - 20, "#ffd23f", 8, 80);
        sfx("special");
      }
      if(f.attack.type === "teleport" && f.attack.teleDone && !f.attack.hitDone && f.attack.t >= 0.22){
        if(Math.abs(opp.x - f.x) < 56 && Math.abs(opp.y - f.y) < 90){
          f.attack.hitDone = true;
          applyHit(f, opp, 10, 0.35, 200, true);
        }
      }
      if(f.attack.type === "special" && f.def.specialKind === "dash" && !f.attack.hitDone){
        if(Math.abs(opp.x - f.x) < 52 && Math.abs(opp.y - f.y) < 90){
          f.attack.hitDone = true; applyHit(f, opp, 14, 0.45, 260, true);
        }
      }
      if(f.attack.type === "special" && f.def.specialKind === "spin" && !f.attack.hitDone){
        // Whirlwind: wide close-in radius, hits even a foe that
        // slipped slightly behind during the spin.
        if(Math.abs(opp.x - f.x) < 68 && Math.abs(opp.y - f.y) < 90){
          f.attack.hitDone = true; applyHit(f, opp, 15, 0.45, 240, true);
          ring(opp.x, opp.y - 40, f.def.accent, 90);
        }
      }
      if(f.attack.type === "special" && f.def.specialKind === "tackle" && !f.attack.hitDone){
        if(Math.abs(opp.x - f.x) < 52 && Math.abs(opp.y - f.y) < 90){
          f.attack.hitDone = true;
          if(opp.blocking && opp.state !== "ko" && opp.dir === -f.dir){
            // The tackle's whole point: it still chips through a
            // block, four times the usual chip damage.
            opp.hp = Math.max(1, opp.hp - 4); opp.meter = Math.min(100, opp.meter + 5);
            burst(opp.x, opp.y - 55, "#35e0e6", 8, 80); sfx("block");
            opp.vx = f.dir * 80;
          } else {
            applyHit(f, opp, 16, 0.55, 300, true);
          }
        }
      }
      if(f.attack.t >= f.attack.dur){ f.attack = null; if(f.state !== "ko" && f.state !== "hit") f.state = "idle"; f.vx = 0; }
    }
    // physics
    f.vy += 1900 * sdt;
    f.x += f.vx * sdt; f.y += f.vy * sdt;
    if(f.y >= GROUND){
      f.y = GROUND; f.vy = 0; if(f.state === "jump") f.state = "idle";
      // Crimson Slam landing: shockwave around the landing spot.
      // It only fires once, on the way down — the fighter starts
      // the move grounded, so the leap itself cannot trigger it.
      if(f.state === "special" && f.def.specialKind === "slam" && f.attack && !f.attack.slamDone && f.attack.t > 0.2){
        f.attack.slamDone = true;
        ring(f.x, GROUND, f.def.accent, 110);
        burst(f.x, GROUND - 6, f.def.accent, 16, 160);
        burst(f.x, GROUND - 6, "#ffffff", 8, 110);
        shake = reduceMotion ? 0 : Math.max(shake, 9); sfx("kick");
        if(Math.abs(opp.x - f.x) < 78 && Math.abs(opp.y - f.y) < 90){
          applyHit(f, opp, 14, 0.45, 260, true, opp.x, opp.y - 55);
        }
      }
    }
    f.x = Math.max(f.def.sprite ? 42 : 28, Math.min(W - (f.def.sprite ? 42 : 28), f.x));
    if(f.state !== "ko") f.stateT += sdt;
    // display hp easing
    if(f.dispHp > f.hp) f.dispHp = Math.max(f.hp, f.dispHp - 26 * dt);
    else f.dispHp = f.hp;
  });
  // body push-apart (wider for the cartoon sprite, which is broader than a pixel fighter)
  var a0 = fighters[0], a1 = fighters[1];
  var sep = Math.min(44, (a0.def.sprite ? 36 : 16) + (a1.def.sprite ? 36 : 16) + 4);
  var overlap = sep - Math.abs(a1.x - a0.x);
  if(overlap > 0 && Math.abs(a0.y - a1.y) < 60 && a0.state !== "ko" && a1.state !== "ko"){
    var push = overlap / 2, sgn = a1.x >= a0.x ? 1 : -1;
    a0.x = Math.max(a0.def.sprite ? 42 : 28, a0.x - push * sgn); a1.x = Math.min(W - (a1.def.sprite ? 42 : 28), a1.x + push * sgn);
  }
  // projectiles vs opponent
  // In a friend match only the host applies projectile damage; the
  // guest shows the hit and the host snapshot corrects health.
  var netGuestProj = (mode === "online" && net.connected && !net.isHost);
  for(var pi = projectiles.length-1; pi >= 0; pi--){
    var pr = projectiles[pi], vic = fighters[1 - pr.owner], atk = fighters[pr.owner];
    if(Math.abs(pr.x - vic.x) < 26 && Math.abs(pr.y - (vic.y - 55)) < 55 && vic.state !== "ko"){
      if(pr.kind === "spear"){
        if(netGuestProj){ burst(pr.x, pr.y, pr.color || "#ffd23f", 6, 60); }
        else {
          var sBlocked = vic.blocking && vic.state !== "ko" && vic.dir === -atk.dir;
          if(sBlocked){
            vic.hp = Math.max(1, vic.hp - 1); vic.meter = Math.min(100, vic.meter + 5);
            burst(pr.x, pr.y, "#35e0e6", 6, 70); sfx("block"); vic.vx = atk.dir * 40;
          } else {
            vic.hp = Math.max(0, vic.hp - (pr.dmg || 6));
            vic.meter = Math.min(100, vic.meter + 7); atk.meter = Math.min(100, atk.meter + 4);
            vic.pullT = 0.65; vic.pullFrom = vic.x; vic.pullTarget = atk.x + atk.dir * 46;
            vic.attack = null; vic.vx = 0;
            banner = "GET OVER HERE!"; phaseT = 1.0;
            burst(pr.x, pr.y, "#ffd23f", 10, 120); sfx("kick");
            if(vic.hp <= 0 && vic.state !== "ko"){
              vic.state = "ko"; vic.koDone = true; vic.vx = atk.dir * 160;
              endRound(atk.side, "ko");
            }
          }
        }
        projectiles.splice(pi, 1);
      } else {
        if(netGuestProj){ burst(pr.x, pr.y, pr.color || "#ffd23f", 6, 60); }
        else { applyHit(atk, vic, pr.dmg || 12, 0.38, 220, true); }
        projectiles.splice(pi, 1);
      }
    }
  }
}
var _upPrev = { p1: false, p2: false };
function pressUp(who){
  var now = held(who, "up");
  var was = _upPrev[who];
  _upPrev[who] = now;
  // also consume a direct press flag set by touch/gamepad jump buttons
  if(press[who].up){ press[who].up = false; return true; }
  return now && !was;
}
