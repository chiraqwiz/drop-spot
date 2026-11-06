function drawBar(g, x, y, w, hp, disp, flip, color){
  g.fillStyle = "#000"; g.fillRect(x-2, y-2, w+4, 16);
  g.fillStyle = "#3a0d0d"; g.fillRect(x, y, w, 12);
  var pct = Math.max(0, hp/100), dpct = Math.max(0, disp/100);
  g.fillStyle = "#ffd23f"; // chip (yellow shows recent damage)
  if(flip){ g.fillRect(x + w*(1-dpct), y, w*dpct, 12); } else { g.fillRect(x, y, w*dpct, 12); }
  g.fillStyle = color;
  if(flip){ g.fillRect(x + w*(1-pct), y, w*pct, 12); } else { g.fillRect(x, y, w*pct, 12); }
  g.strokeStyle = "#000"; g.lineWidth = 2; g.strokeRect(x, y, w, 12);
}
function drawMeter(g, x, y, w, val, flip){
  g.fillStyle = "#000"; g.fillRect(x-1, y-1, w+2, 8);
  g.fillStyle = "#22223a"; g.fillRect(x, y, w, 6);
  var pct = val/100;
  g.fillStyle = val >= 50 ? "#35e0e6" : "#2a7d8c";
  if(flip) g.fillRect(x + w*(1-pct), y, w*pct, 6); else g.fillRect(x, y, w*pct, 6);
  if(val >= 50){ g.fillStyle = "#fff"; g.font = "7px 'Press Start 2P', monospace"; g.textAlign = flip ? "right" : "left"; g.fillText("SPECIAL READY", flip ? x+w : x, y+16); }
}
function render(t){
  ctx.save();
  if(shake > 0){ ctx.translate(Math.round((Math.random()-0.5)*shake), Math.round((Math.random()-0.5)*shake)); shake = Math.max(0, shake - 0.6); }
  drawStage(ctx, t);
  if(screen === "fight" || screen === "vs" || screen === "over"){
    fighters.forEach(function(f){ drawFighter(ctx, f, t); });
    drawFx(ctx);
    // HUD
    var f0 = fighters[0], f1 = fighters[1];
    drawBar(ctx, 20, 16, 250, f0.hp, f0.dispHp, false, "#37e05a");
    drawBar(ctx, 370, 16, 250, f1.hp, f1.dispHp, true, "#37e05a");
    ctx.font = "9px 'Press Start 2P', monospace"; ctx.textAlign = "left";
    ctx.fillStyle = "#fff"; ctx.fillText(f0.def.name, 20, 44);
    ctx.textAlign = "right"; ctx.fillText(f1.def.name, 620, 44);
    // round pips
    for(var i=0;i<2;i++){
      ctx.fillStyle = wins[0] > i ? "#ffd23f" : "#33334a";
      ctx.beginPath(); ctx.arc(28 + i*14, 54, 5, 0, 6.283); ctx.fill();
      ctx.fillStyle = wins[1] > i ? "#ffd23f" : "#33334a";
      ctx.beginPath(); ctx.arc(612 - i*14, 54, 5, 0, 6.283); ctx.fill();
    }
    // timer box
    ctx.fillStyle = "#000"; ctx.fillRect(292, 10, 56, 34);
    ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 2; ctx.strokeRect(292, 10, 56, 34);
    ctx.fillStyle = "#ff2e2e"; ctx.font = "16px 'Press Start 2P', monospace"; ctx.textAlign = "center";
    ctx.fillText(String(Math.ceil(timer)).padStart(2, "0"), 320, 35);
    drawMeter(ctx, 20, 62, 150, f0.meter, false);
    drawMeter(ctx, 470, 62, 150, f1.meter, true);
    // combo
    ctx.font = "11px 'Press Start 2P', monospace";
    if(combo[0] >= 2){ ctx.fillStyle = "#ffd23f"; ctx.textAlign = "left"; ctx.fillText(combo[0] + " HITS!", 24, 100); }
    if(combo[1] >= 2){ ctx.fillStyle = "#ffd23f"; ctx.textAlign = "right"; ctx.fillText(combo[1] + " HITS!", 616, 100); }
    if(mode === "online" && net.connected){
      ctx.font = "7px 'Press Start 2P', monospace"; ctx.fillStyle = "#35e0e6"; ctx.textAlign = "center";
      ctx.fillText("FRIEND MATCH" + (net.pingMs !== null ? " • " + net.pingMs + "MS" : ""), 320, 350);
    }
    if(mode === "story"){
      ctx.font = "7px 'Press Start 2P', monospace"; ctx.fillStyle = "#ffd23f"; ctx.textAlign = "center";
      ctx.fillText("STORY • CHAPTER " + (storyIdx + 1) + " OF " + storyLadder.length, 320, 350);
    }
    // banner
    if(banner){
      ctx.textAlign = "center";
      ctx.font = "30px 'Press Start 2P', monospace";
      ctx.fillStyle = "#000"; ctx.fillText(banner, 322, 152);
      ctx.fillStyle = banner === "K.O.!" ? "#ff2e2e" : "#ffd23f"; ctx.fillText(banner, 320, 150);
      if(bannerSub){ ctx.font = "9px 'Press Start 2P', monospace"; ctx.fillStyle = "#fff"; ctx.fillText(bannerSub, 320, 172); }
    }
    if(phase === "intro" && roundNum === 1 && fighters.length === 2){
      drawIntroBubble(ctx, fighters[0]);
      drawIntroBubble(ctx, fighters[1]);
    }
  } else {
    // attract mode: both fighters idle on stage
    var demo = [makeFighter(ROSTER[0],0), makeFighter(ROSTER[1],1)];
    demo[0].x = 220; demo[1].x = 420; demo[0].y = demo[1].y = GROUND;
    demo.forEach(function(f){ drawFighter(ctx, f, t); });
    drawFx(ctx);
  }
  ctx.restore();
}
var lastT = 0;
function loop(ts){
  var t = ts / 1000, dt = Math.min(0.05, t - (lastT || t)); lastT = t;
  // Poll even while paused, or a controller could never resume: the
  // old loop skipped polling when paused, so Start on the pad was
  // dead on the pause screen.
  pollGamepad();
  if(!paused){
    if(netActive()){
      // Snapshot this frame's remote input, then send the local
      // player's input before update() consumes the local presses.
      netFrameHeld = { left: !!net.remoteHeld.left, right: !!net.remoteHeld.right, up: !!net.remoteHeld.up, down: !!net.remoteHeld.down, block: !!net.remoteHeld.block };
      netFramePress = { punch: !!net.remotePress.punch, kick: !!net.remotePress.kick, special: !!net.remotePress.special, teleport: !!net.remotePress.teleport, up: !!net.remotePress.up };
      net.remotePress = {};
      if(screen === "fight") netSendInput(t);
    } else { netFrameHeld = { left: false, right: false, up: false, down: false, block: false }; netFramePress = {}; }
    // touch-held flags reset each frame for gamepad merge (touch sets its own)
    if(screen === "fight") update(dt, t);
    else updateFx(dt);
    if(netActive() && screen === "fight") netSendStatePing(t);
  }
  render(t);
  requestAnimationFrame(loop);
}
var screens = {
  title: document.getElementById("titleScreen"),
  select: document.getElementById("selectScreen"),
  vs: document.getElementById("vsScreen"),
  over: document.getElementById("resultScreen"),
  pause: document.getElementById("pauseScreen")
};
function showScreen(name){
  screen = name;
  Object.keys(screens).forEach(function(k){ screens[k].hidden = (k !== name && k !== "pause") || (k === "pause" && !paused); });
  if(name === "pause") screens.pause.hidden = false;
}
var p1Sel = 0, p2Sel = 1, selStep = "p1";
function buildSelect(){
  var grid = document.getElementById("selGrid");
  grid.innerHTML = "";
  ROSTER.forEach(function(def, i){
    var b = document.createElement("button");
    b.type = "button"; b.className = "pick"; b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", def.name + " — " + def.title);
    if(def.photo){
      var im = document.createElement("img");
      im.src = def.photo; im.alt = def.portraitAlt || ("Cartoon portrait of " + def.name);
      im.width = 120; im.height = 140;
      b.appendChild(im);
    } else {
      var cv = document.createElement("canvas"); cv.width = 120; cv.height = 140;
      drawPortrait(cv, def);
      b.appendChild(cv);
    }
    var nm = document.createElement("div"); nm.className = "pname"; nm.textContent = def.name;
    var ti = document.createElement("div"); ti.className = "ptitle"; ti.textContent = def.title;
    b.appendChild(nm); b.appendChild(ti);
    b.addEventListener("click", function(){ pickFighter(i); });
    grid.appendChild(b);
  });
  LOCKED.forEach(function(l){
    var b = document.createElement("button");
    b.type = "button"; b.className = "pick locked"; b.disabled = true;
    var cv = document.createElement("canvas"); cv.width = 120; cv.height = 140;
    var g = cv.getContext("2d");
    g.fillStyle = "#1a1a28"; g.fillRect(0,0,120,140);
    g.fillStyle = "#45455f"; g.font = "40px monospace"; g.textAlign = "center"; g.fillText("?", 60, 82);
    var nm = document.createElement("div"); nm.className = "pname"; nm.textContent = l.name;
    var ti = document.createElement("div"); ti.className = "ptitle"; ti.textContent = "MORE FIGHTERS SOON";
    b.appendChild(cv); b.appendChild(nm); b.appendChild(ti);
    grid.appendChild(b);
  });
}
function pickFighter(i){
  audio(); sfx("select"); gpSelIdx = i; gpShowFocus();
  if(mode === "online"){ pickFighterOnline(i); return; }
  if(selStep === "p1"){
    p1Sel = i;
    if(mode === "cpu"){
      var others = [];
      ROSTER.forEach(function(d, idx){ if(idx !== i) others.push(idx); });
      p2Sel = others[Math.floor(Math.random() * others.length)];
      beginVs();
    } else if(mode === "story"){
      startStory(i);
    } else {
      selStep = "p2";
      document.getElementById("selectHeading").textContent = "PLAYER 2 — CHOOSE YOUR FIGHTER";
      document.getElementById("selectHint").textContent = "Player 2 — pick a fighter. Same fighter twice means a mirror match.";
      markPicks();
    }
  } else {
    p2Sel = i; beginVs();
  }
}
function markPicks(){
  var picks = document.querySelectorAll("#selGrid .pick");
  if(mode === "online"){
    picks.forEach(function(p, i){ p.setAttribute("aria-pressed", String(i === net.localSel)); });
    return;
  }
  picks.forEach(function(p, i){ p.setAttribute("aria-pressed", String(i === p1Sel && selStep === "p2")); });
}
function syncPickAvailability(){
  var picks = document.querySelectorAll("#selGrid .pick:not(.locked)");
  var lockPicks = (mode === "online" && !net.connected);
  picks.forEach(function(p){ p.disabled = lockPicks; });
  // Until a friend is connected there is nothing to pick: keep the
  // room panel in view instead of pushing the grid below the fold.
  document.getElementById("selGrid").style.display = lockPicks ? "none" : "";
}
function pickFighterOnline(i){
  if(!net.connected) return;
  net.localSel = i;
  stageIdx = resolveStage();
  netSend({ type: "pick", idx: i, stage: stageIdx });
  markPicks();
  var me = ROSTER[i].name;
  if(net.remoteSel >= 0){
    // Both picked: host is Player 1, guest is Player 2.
    p1Sel = net.isHost ? net.localSel : net.remoteSel;
    p2Sel = net.isHost ? net.remoteSel : net.localSel;
    beginVs();
  } else {
    document.getElementById("selectHint").textContent = "You picked " + me + " — waiting for your friend to pick.";
    setNetStatus("Connected to your friend. You picked " + me + ".");
  }
}
function startSelect(){
  stopSpeech();
  storyIdx = 0; storyLadder = []; storyNext = false; storyRestart = false;
  document.getElementById("vsStory").hidden = true;
  selStep = "p1";
  net.localSel = -1; net.remoteSel = -1; net.rematchWanted = false; net.rematchPeerWanted = false;
  document.getElementById("onlineRematchNote").hidden = true;
  document.getElementById("rematchBtn").textContent = "Rematch";
  document.getElementById("selectHeading").textContent = "CHOOSE YOUR FIGHTER";
  document.getElementById("selectHint").textContent = mode === "online"
    ? (net.connected ? "Connected — pick your fighter." : "Connect to a friend first, then pick your fighter.")
    : "Player 1 — pick a fighter.";
  syncPickAvailability(); markPicks(); gpSelIdx = 0; gpShowFocus();
  showScreen("select");
}
function beginVs(){
  if(mode !== "online") stageIdx = resolveStage();
  document.getElementById("vsName1").textContent = ROSTER[p1Sel].name;
  document.getElementById("vsName2").textContent = ROSTER[p2Sel].name + (mode === "cpu" ? " (CPU)" : mode === "online" ? " (FRIEND)" : "");
  document.getElementById("vsSub").textContent = (mode === "story" ? "STORY • CHAPTER " + (storyIdx + 1) + " OF " + storyLadder.length + " • FIRST TO 2 ROUNDS" : mode === "online" ? "FRIEND MATCH • FIRST TO 2 ROUNDS" : "FIRST TO 2 ROUNDS") + " • " + STAGES[stageIdx].name;
  var vsStoryEl = document.getElementById("vsStory");
  if(mode === "story"){ vsStoryEl.textContent = storyBeatText(); vsStoryEl.hidden = false; }
  else { vsStoryEl.hidden = true; }
  drawPortrait(document.getElementById("vsP1"), ROSTER[p1Sel]);
  drawPortrait(document.getElementById("vsP2"), ROSTER[p2Sel]);
  showScreen("vs");
  resetMatch();
  speakIntros();
  vsTimer = setTimeout(function(){ if(screen === "vs"){ showScreen("fight"); screen = "fight"; } }, mode === "story" ? 4500 : 1500);
}
function rematch(){
  document.getElementById("resultScreen").hidden = true;
  if(mode === "story" && storyRestart){ storyRestart = false; startStory(p1Sel); return; }
  if(mode === "story" && storyNext){ storyNext = false; storyIdx++; p2Sel = storyLadder[storyIdx]; beginVs(); return; }
  resetMatch(); showScreen("fight"); screen = "fight";
}
function doOnlineRematch(){
  net.rematchWanted = false; net.rematchPeerWanted = false;
  document.getElementById("onlineRematchNote").hidden = true;
  document.getElementById("rematchBtn").textContent = "Rematch";
  rematch();
}
function pauseGame(){ paused = true; screens.pause.hidden = false; }
function resumeGame(){ paused = false; screens.pause.hidden = true; }
function quitToTitle(){
  stopSpeech(); paused = false; screens.pause.hidden = true; showScreen("title");
}
document.getElementById("startBtn").addEventListener("click", function(){ audio(); sfx("select"); startSelect(); });
document.getElementById("vsScreen").addEventListener("click", function(){ if(mode === "story" && screen === "vs"){ if(vsTimer) clearTimeout(vsTimer); showScreen("fight"); screen = "fight"; } });
document.getElementById("modeCpu").addEventListener("click", function(){ if(net.connected || net.connecting || net.waiting) leaveOnline(); mode = "cpu"; syncModeDiff(); selStep = "p1"; document.getElementById("selectHeading").textContent = "CHOOSE YOUR FIGHTER"; });
document.getElementById("mode2p").addEventListener("click", function(){ if(net.connected || net.connecting || net.waiting) leaveOnline(); mode = "2p"; syncModeDiff(); selStep = "p1"; document.getElementById("selectHeading").textContent = "CHOOSE YOUR FIGHTER"; });
document.getElementById("modeStory").addEventListener("click", function(){ if(net.connected || net.connecting || net.waiting) leaveOnline(); mode = "story"; syncModeDiff(); selStep = "p1"; document.getElementById("selectHeading").textContent = "STORY MODE — CHOOSE YOUR FIGHTER"; document.getElementById("selectHint").textContent = "Fight through all " + (ROSTER.length - 1) + " rivals and take the crown."; });
document.getElementById("modeOnline").addEventListener("click", function(){
  mode = "online"; syncModeDiff(); selStep = "p1";
  document.getElementById("selectHeading").textContent = "FRIEND MATCH — CHOOSE YOUR FIGHTER";
  document.getElementById("selectHint").textContent = net.connected ? "Connected — pick your fighter." : "Connect to a friend first, then pick your fighter.";
  syncPickAvailability(); markPicks();
  if(typeof window.Peer === "undefined") setNetStatus("Online could not load. Check your connection and reload the page, then try again.", true);
});
function syncModeDiff(){
  document.getElementById("modeCpu").setAttribute("aria-pressed", String(mode === "cpu"));
  document.getElementById("mode2p").setAttribute("aria-pressed", String(mode === "2p"));
  document.getElementById("modeOnline").setAttribute("aria-pressed", String(mode === "online"));
  document.getElementById("modeStory").setAttribute("aria-pressed", String(mode === "story"));
  document.getElementById("diffRow").style.display = mode === "online" ? "none" : "";
  document.getElementById("onlinePanel").hidden = mode !== "online";
  syncPickAvailability();
  syncStageButtons();
}
[["diffEasy","easy"],["diffNormal","normal"],["diffHard","hard"]].forEach(function(pair){
  document.getElementById(pair[0]).addEventListener("click", function(){
    difficulty = pair[1]; sfx("select");
    ["diffEasy","diffNormal","diffHard"].forEach(function(id, i){
      document.getElementById(id).setAttribute("aria-pressed", String(["easy","normal","hard"][i] === difficulty));
    });
  });
});
function syncStageButtons(){
  var lock = (mode === "online" && net.connected && !net.isHost);
  document.querySelectorAll("#stageRow .stage-btn").forEach(function(b){
    var v = parseInt(b.getAttribute("data-stage"), 10);
    b.setAttribute("aria-pressed", String(v === stageSel));
    b.disabled = lock;
  });
}
document.querySelectorAll("#stageRow .stage-btn").forEach(function(b){
  b.addEventListener("click", function(){
    if(mode === "online" && net.connected && !net.isHost) return;
    stageSel = parseInt(b.getAttribute("data-stage"), 10);
    sfx("select"); syncStageButtons();
  });
});
syncStageButtons();
document.getElementById("rematchBtn").addEventListener("click", function(){
  sfx("select");
  if(mode === "online" && net.connected){
    if(net.rematchPeerWanted){
      // Accepting the rematch: tell the other player to start it
      // BEFORE resetting local state, or they stay stuck on the
      // result screen while this side is already fighting alone.
      netSend({ type: "rematch-start" });
      doOnlineRematch(); return;
    }
    net.rematchWanted = true;
    netSend({ type: "rematch" });
    document.getElementById("rematchBtn").textContent = "WAITING…";
    var note = document.getElementById("onlineRematchNote");
    note.textContent = "Waiting for your friend to press Rematch too.";
    note.hidden = false;
    return;
  }
  rematch();
});
document.getElementById("changeBtn").addEventListener("click", function(){
  sfx("select");
  if(mode === "online" && net.connected){ netSend({ type: "leave" }); netCleanup(); }
  startSelect();
});
document.getElementById("pauseBtn").addEventListener("click", function(){
  // Pause would desync a live friend match, so it stays off there.
  if(mode === "online" && net.connected) return;
  if(screen === "fight"){ paused ? resumeGame() : pauseGame(); }
});
document.getElementById("resumeBtn").addEventListener("click", resumeGame);
document.getElementById("quitBtn").addEventListener("click", quitToTitle);
document.getElementById("soundBtn").addEventListener("click", function(){
  soundOn = !soundOn; this.setAttribute("aria-pressed", String(soundOn));
  this.textContent = "SOUND: " + (soundOn ? "ON" : "OFF"); if(soundOn){ audio(); sfx("select"); }
});
document.getElementById("remapBtn").addEventListener("click", function(){ audio(); gpStartRemap(); });
var touchBtn = document.getElementById("touchBtn"), touchpad = document.getElementById("touchpad");
touchBtn.addEventListener("click", function(){
  var on = !touchpad.classList.contains("on");
  touchpad.classList.toggle("on", on);
  touchBtn.setAttribute("aria-pressed", String(on));
});
if(window.matchMedia && window.matchMedia("(pointer: coarse)").matches){
  touchpad.classList.add("on"); touchBtn.setAttribute("aria-pressed", "true");
}
document.querySelectorAll(".tbtn").forEach(function(btn){
  var k = btn.getAttribute("data-k");
  var down = function(e){ e.preventDefault(); audio();
    touchLast = touchLabel[k] || k.toUpperCase();
    touchHeld.p1[k] = true; btn.classList.add("held");
    if(k === "punch" || k === "kick" || k === "special" || k === "teleport") setPress("p1", k);
    if(k === "up") setPress("p1", "up");
  };
  var up = function(e){ e.preventDefault(); touchHeld.p1[k] = false; btn.classList.remove("held"); };
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup", up);
  btn.addEventListener("pointercancel", up);
  btn.addEventListener("pointerleave", up);
});
var NET_PREFIX = "retrofighter1";
function peerAvailable(){ return typeof window.Peer !== "undefined"; }
function makeRoomCode(){
  var chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", out = "";
  for(var i=0;i<4;i++) out += chars.charAt(Math.floor(Math.random()*chars.length));
  return out;
}
function setNetStatus(msg, isErr){
  var el = document.getElementById("netStatus");
  el.textContent = msg;
  el.classList.toggle("err", !!isErr);
}
function updateNetBar(){
  var bar = document.getElementById("netBar");
  if(net.connected){
    bar.hidden = false;
    document.getElementById("netBarText").textContent =
      "FRIEND MATCH • CODE " + net.code + " • YOU ARE " + (net.isHost ? "PLAYER 1" : "PLAYER 2") +
      (net.pingMs !== null ? " • " + net.pingMs + "MS" : "");
  } else { bar.hidden = true; }
}
function netSend(obj){
  try{ if(net.conn && net.conn.open) net.conn.send(obj); }catch(e){}
}
function netTeardownTransport(){
  try{ if(net.conn) net.conn.close(); }catch(e){}
  try{ if(net.peer) net.peer.destroy(); }catch(e){}
  net.conn = null; net.peer = null;
}
function netCleanup(){
  netTeardownTransport();
  net.connected = false; net.connecting = false; net.waiting = false;
  net.localSel = -1; net.remoteSel = -1; net.pingMs = null;
  net.rematchWanted = false; net.rematchPeerWanted = false; net.dropped = false;
  net.remoteHeld = { left: false, right: false, up: false, down: false, block: false };
  net.remotePress = {};
  paused = false;
  document.getElementById("netDropScreen").hidden = true;
  document.getElementById("leaveNetBtn").hidden = true;
  document.getElementById("roomCodeBox").hidden = true;
  updateNetBar(); syncPickAvailability();
}
function onNetOpen(){
  net.connected = true; net.connecting = false; net.waiting = false; net.dropped = false;
  syncStageButtons();
  document.getElementById("netDropScreen").hidden = true;
  document.getElementById("leaveNetBtn").hidden = false;
  updateNetBar();
  setNetStatus("Connected to your friend. Pick your fighter — they pick theirs on their own screen.");
  if(screen === "select"){
    document.getElementById("selectHint").textContent = "Connected — pick your fighter.";
  }
  syncPickAvailability(); markPicks();
  netSend({ type: "hello" });
  sfx("select");
}
function onNetDrop(peerLeft){
  var wasConnected = net.connected;
  var inMatch = (screen === "fight" || screen === "vs" || screen === "over");
  netTeardownTransport();
  net.connected = false; net.connecting = false; net.waiting = false;
  updateNetBar(); syncPickAvailability();
  document.getElementById("leaveNetBtn").hidden = true;
  if(inMatch && wasConnected){
    net.dropped = true; paused = true;
    document.getElementById("netDropText").textContent = peerLeft
      ? "Your friend left the match. The match is over."
      : "Your friend disconnected. The match is over.";
    document.getElementById("netDropScreen").hidden = false;
  } else if(screen === "select"){
    net.localSel = -1; net.remoteSel = -1; markPicks();
    setNetStatus(peerLeft ? "Your friend left. Create a room or join a new code to play again." : "Connection lost. Create a room or join a new code to try again.", true);
    document.getElementById("selectHint").textContent = "Connect to a friend first, then pick your fighter.";
  }
}
function attachConn(c){
  if(net.conn && net.conn !== c){ try{ net.conn.close(); }catch(e){} }
  net.conn = c;
  c.on("open", onNetOpen);
  c.on("data", handleNetMessage);
  c.on("close", function(){ onNetDrop(false); });
  c.on("error", function(){ onNetDrop(false); });
}
function handleNetMessage(msg){
  if(!msg || typeof msg !== "object") return;
  if(msg.type === "ping"){ netSend({ type: "pong", t: msg.t }); return; }
  if(msg.type === "pong"){ net.pingMs = Math.max(0, Math.round(Date.now() - msg.t)); updateNetBar(); return; }
  if(msg.type === "hello"){ return; }
  if(msg.type === "pick"){
    net.remoteSel = msg.idx; markPicks();
    if(!net.isHost && typeof msg.stage === "number" && msg.stage >= 0 && msg.stage < STAGES.length) stageIdx = msg.stage;
    if(net.localSel >= 0 && screen === "select"){
      p1Sel = net.isHost ? net.localSel : net.remoteSel;
      p2Sel = net.isHost ? net.remoteSel : net.localSel;
      beginVs();
    } else if(screen === "select"){
      document.getElementById("selectHint").textContent = "Your friend picked — now pick your fighter.";
    }
    return;
  }
  if(msg.type === "input"){
    if(typeof msg.seq === "number" && msg.seq > net.lastInputSeq){
      net.lastInputSeq = msg.seq;
      net.remoteHeld = msg.held || net.remoteHeld;
      net.remotePress = msg.press || {};
    }
    return;
  }
  if(msg.type === "state"){ if(!net.isHost) applyNetState(msg); return; }
  if(msg.type === "rematch"){
    net.rematchPeerWanted = true;
    if(net.rematchWanted){ doOnlineRematch(); return; }
    if(screen === "over"){
      var note = document.getElementById("onlineRematchNote");
      note.textContent = "Your friend wants a rematch — press Rematch to accept.";
      note.hidden = false;
    }
    return;
  }
  if(msg.type === "rematch-start"){
    // The other player accepted our rematch request and has already
    // reset on their side: start the rematch here too. Only act
    // while still on the result screen, so a late or duplicate
    // message cannot reset a fight that already started.
    if(screen === "over"){ doOnlineRematch(); }
    return;
  }
  if(msg.type === "leave"){ onNetDrop(true); return; }
}
function applyNetState(m){
  if(!fighters || fighters.length !== 2 || !m.fighters || m.fighters.length !== 2) return;
  timer = m.timer; wins = m.wins.slice(0, 2); roundNum = m.roundNum;
  if(m.phase !== phase){ phase = m.phase; phaseT = m.phaseT; banner = m.banner || ""; }
  for(var i=0;i<2;i++){
    var f = fighters[i], s = m.fighters[i];
    f.hp = s.hp; f.dispHp = Math.max(s.hp, Math.min(f.dispHp, s.hp + 4));
    if(f.dispHp < s.hp) f.dispHp = s.hp;
    f.meter = s.meter;
    if(Math.abs(f.x - s.x) > 14) f.x = s.x;
    if(Math.abs(f.y - s.y) > 10) f.y = s.y;
    f.vx = s.vx; f.vy = s.vy; f.dir = s.dir;
    if((s.state === "ko" || s.state === "win") && f.state !== s.state){ f.state = s.state; f.stateT = s.stateT; }
  }
  projectiles = (m.projectiles || []).map(function(p){ return { kind: p.kind, visual: p.visual, x: p.x, y: p.y, vx: p.vx, owner: p.owner, life: p.life, dmg: p.dmg, color: p.color }; });
  strikes = (m.strikes || []).map(function(s){
    return { x: s.x, t: s.t, delay: s.delay, dur: s.dur, owner: s.owner, bolt: s.bolt, struck: !!s.struck };
  });
}
function netSendInput(t){
  var pr = press.p1 || {};
  var nowUp = held("p1", "up");
  var upEdge = nowUp && !_netUpPrev;
  _netUpPrev = nowUp;
  net.outSeq++;
  netSend({
    type: "input", seq: net.outSeq,
    held: { left: !!held("p1","left"), right: !!held("p1","right"), up: !!nowUp, down: !!held("p1","down"), block: !!held("p1","block") },
    press: { punch: !!pr.punch, kick: !!pr.kick, special: !!pr.special, teleport: !!pr.teleport, up: !!(upEdge || pr.up) }
  });
}
function netSendStatePing(t){
  if(t - net.lastPingSent >= 1){
    net.lastPingSent = t;
    netSend({ type: "ping", t: Date.now() });
    updateNetBar();
  }
  if(net.isHost && fighters.length === 2 && t - net.lastStateSent >= 0.25){
    net.lastStateSent = t;
    netSend({
      type: "state", timer: timer, phase: phase, phaseT: phaseT, banner: banner,
      wins: wins.slice(0, 2), roundNum: roundNum,
      fighters: fighters.map(function(f){
        return { x: f.x, y: f.y, vx: f.vx, vy: f.vy, dir: f.dir, hp: f.hp, dispHp: f.dispHp, meter: f.meter, state: f.state, stateT: f.stateT, hitStun: f.hitStun };
      }),
      projectiles: projectiles.map(function(p){ return { kind: p.kind, visual: p.visual, x: p.x, y: p.y, vx: p.vx, owner: p.owner, life: p.life, dmg: p.dmg, color: p.color }; }),
      strikes: strikes.map(function(s){ return { x: s.x, t: s.t, delay: s.delay, dur: s.dur, owner: s.owner, bolt: s.bolt, struck: !!s.struck }; })
    });
  }
}
function createRoom(){
  if(!peerAvailable()){ setNetStatus("Online could not load. Check your connection and reload the page, then try again.", true); return; }
  if(net.connected || net.connecting) return;
  netCleanup();
  var code = makeRoomCode();
  net.isHost = true; net.code = code; net.connecting = true; net.waiting = true;
  document.getElementById("roomCodeText").textContent = code;
  document.getElementById("roomCodeBox").hidden = false;
  document.getElementById("leaveNetBtn").hidden = false;
  setNetStatus("Room " + code + " is open. Share the code — waiting for your friend to join…");
  try{
    net.peer = new Peer(NET_PREFIX + code.toLowerCase());
    net.peer.on("open", function(){
      setNetStatus("Room " + code + " is open. Share the code — waiting for your friend to join…");
    });
    net.peer.on("connection", function(c){ attachConn(c); });
    net.peer.on("error", function(err){
      if(err && err.type === "unavailable-id"){
        netTeardownTransport();
        setNetStatus("That code was already in use. Press Create Room again for a fresh code.", true);
        document.getElementById("roomCodeBox").hidden = true;
        net.connecting = false; net.waiting = false;
      } else if(!net.connected){
        setNetStatus("Could not open a room. Check your connection and try again.", true);
      }
    });
  }catch(e){
    setNetStatus("Could not open a room. Check your connection and try again.", true);
  }
}
function joinRoom(){
  if(!peerAvailable()){ setNetStatus("Online could not load. Check your connection and reload the page, then try again.", true); return; }
  if(net.connected || net.connecting) return;
  var code = (document.getElementById("joinCodeInput").value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  document.getElementById("joinCodeInput").value = code;
  if(code.length !== 4){ setNetStatus("Enter the 4-letter code your friend shared.", true); return; }
  netCleanup();
  net.isHost = false; net.code = code; net.connecting = true;
  document.getElementById("leaveNetBtn").hidden = false;
  setNetStatus("Joining room " + code + "… your friend needs to have the room open right now.");
  try{
    var guestId = NET_PREFIX + "g" + Math.random().toString(36).slice(2, 10);
    net.peer = new Peer(guestId);
    net.peer.on("open", function(){
      var c = net.peer.connect(NET_PREFIX + code.toLowerCase(), { reliable: true });
      attachConn(c);
      setTimeout(function(){
        if(net.connecting && !net.connected) setNetStatus("Still trying… check the code and that your friend's room is still open.", true);
      }, 9000);
    });
    net.peer.on("error", function(err){
      if(err && err.type === "peer-unavailable"){
        netTeardownTransport(); net.connecting = false;
        setNetStatus("No open match with code " + code + ". Check the code and that your friend is waiting in the room.", true);
      } else if(!net.connected){
        setNetStatus("Could not join. Check your connection and try again.", true);
      }
    });
  }catch(e){
    setNetStatus("Could not join. Check your connection and try again.", true);
  }
}
document.getElementById("createRoomBtn").addEventListener("click", function(){ audio(); createRoom(); });
document.getElementById("joinRoomBtn").addEventListener("click", function(){ audio(); joinRoom(); });
document.getElementById("joinCodeInput").addEventListener("input", function(){
  this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
});
document.getElementById("joinCodeInput").addEventListener("keydown", function(e){
  if(e.key === "Enter"){ e.preventDefault(); joinRoom(); }
});
document.getElementById("copyCodeBtn").addEventListener("click", function(){
  var code = net.code;
  if(!code) return;
  var btn = this;
  function done(){ btn.textContent = "COPIED!"; setTimeout(function(){ btn.textContent = "COPY CODE"; }, 1200); }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(code).then(done, function(){ setNetStatus("Code: " + code + " — share it with your friend.", false); });
  } else { setNetStatus("Code: " + code + " — share it with your friend.", false); }
});
function leaveOnline(){
  if(net.connected) netSend({ type: "leave" });
  netCleanup();
}
document.getElementById("leaveNetBtn").addEventListener("click", function(){ leaveOnline(); setNetStatus("Left. Create a room or join a code to play again."); });
document.getElementById("netLeaveBtn").addEventListener("click", function(){ leaveOnline(); quitToTitle(); });
document.getElementById("netDropTitleBtn").addEventListener("click", function(){ netCleanup(); quitToTitle(); });
document.getElementById("netDropRetryBtn").addEventListener("click", function(){
  netCleanup(); mode = "online"; syncModeDiff(); startSelect();
  setNetStatus("Connection ended. Create a room or join a code to play again.");
});
buildSelect();
showScreen("title");
requestAnimationFrame(loop);
