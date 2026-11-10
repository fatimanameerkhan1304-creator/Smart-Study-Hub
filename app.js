const $ = (id) => document.getElementById(id);
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem("studyspace_"+key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => localStorage.setItem("studyspace_"+key, JSON.stringify(value));
let tasks = load("tasks", []);
let notes = load("notes", []);
let cards = load("cards", []);
let focusMinutes = load("focusMinutes", 0);
let taskFilter = "all", cardIndex = 0, flipped = false;
let timerSeconds = 25*60, timerInitial = 25*60, timerInterval = null, timerRunning = false;
let toastTimeout;

function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove("show"),2300)}
function dateLabel(){return new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric"}).format(new Date())}
$("todayLabel").textContent=dateLabel();
function showPage(name){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===name));$("currentSection").textContent=name[0].toUpperCase()+name.slice(1);$("sidebar").classList.remove("open");if(name==="dashboard")renderDashboard()}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.goto)));
$("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("studyspace_dark",document.body.classList.contains("dark")?"1":"0")});
if(localStorage.getItem("studyspace_dark")==="1")document.body.classList.add("dark");

function taskMarkup(task){return `<div class="task-row ${task.done?"is-done":""}"><input class="task-check" type="checkbox" aria-label="Complete task" data-check="${task.id}" ${task.done?"checked":""}><div class="task-info"><div class="task-title">${escapeHTML(task.title)}</div><div class="task-meta">${task.date?`Due ${escapeHTML(task.date)}`:"No due date"}</div></div><span class="priority ${task.priority}">${task.priority}</span><button class="delete-button" data-delete="${task.id}" aria-label="Delete task">×</button></div>`}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderTasks(){const list=tasks.filter(t=>taskFilter==="all"||(taskFilter==="active"&&!t.done)||(taskFilter==="done"&&t.done));$("taskList").innerHTML=list.length?list.map(taskMarkup).join(""):'<div class="empty-state">No tasks here yet. Add a task to get started ✨</div>';$("taskCountLabel").textContent=`${tasks.length} total`; $("taskNavCount").textContent=tasks.filter(t=>!t.done).length;bindTaskActions()}
function bindTaskActions(){document.querySelectorAll("[data-check]").forEach(el=>el.addEventListener("change",()=>{tasks=tasks.map(t=>t.id==el.dataset.check?{...t,done:el.checked}:t);save("tasks",tasks);renderAll()}));document.querySelectorAll("[data-delete]").forEach(el=>el.addEventListener("click",()=>{tasks=tasks.filter(t=>t.id!=el.dataset.delete);save("tasks",tasks);renderAll();toast("Task deleted")}))}
$("taskForm").addEventListener("submit",e=>{e.preventDefault();const title=$("taskInput").value.trim();if(!title)return;tasks.unshift({id:Date.now(),title,priority:$("taskPriority").value,date:$("taskDate").value,done:false});save("tasks",tasks);$("taskForm").reset();renderAll();toast("Task added successfully")});
$("taskFilters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;taskFilter=b.dataset.filter;document.querySelectorAll(".filter-tab").forEach(x=>x.classList.toggle("selected",x===b));renderTasks()});
function renderDashboard(){const open=tasks.filter(t=>!t.done).slice(0,4);$("dashboardTasks").innerHTML=open.length?open.map(taskMarkup).join(""):'<div class="empty-state">You’re all caught up! Add a task when you’re ready 🌟</div>';bindTaskActions();const total=tasks.length,done=tasks.filter(t=>t.done).length,pct=total?Math.round(done/total*100):0;$("progressPercent").textContent=pct+"%";$("progressRing").style.background=`conic-gradient(var(--purple) ${pct*3.6}deg,#eeecf7 0deg)`;$("completedStat").textContent=done;$("focusStat").textContent=focusMinutes;$("notesStat").textContent=notes.length;$("cardsStat").textContent=cards.length}
function renderAll(){renderTasks();renderDashboard();renderNotes();renderCards()}
function renderNotes(){$("notesGrid").innerHTML=notes.length?notes.map(n=>`<article class="note-card"><h3>${escapeHTML(n.title)}</h3><p>${escapeHTML(n.body)}</p><footer><span>${escapeHTML(n.date)}</span><button class="delete-button" data-note-delete="${n.id}" aria-label="Delete note">×</button></footer></article>`).join(""):'<div class="empty-state">Your notes will appear here. Capture your first idea above ✎</div>';document.querySelectorAll("[data-note-delete]").forEach(b=>b.addEventListener("click",()=>{notes=notes.filter(n=>n.id!=b.dataset.noteDelete);save("notes",notes);renderAll();toast("Note deleted")}))}
$("noteForm").addEventListener("submit",e=>{e.preventDefault();notes.unshift({id:Date.now(),title:$("noteTitle").value.trim(),body:$("noteBody").value.trim(),date:new Date().toLocaleDateString()});save("notes",notes);$("noteForm").reset();renderAll();toast("Note saved")});
function renderCards(){const card=cards[cardIndex];$("deckCount").textContent=cards.length;$("cardPosition").textContent=cards.length?`Card ${cardIndex+1} of ${cards.length}`:"No cards yet";$("flashQuestion").textContent=card?card.q:"Create your first flashcard";$("flashAnswer").textContent=card?card.a:"Your answer will appear here."; $("flashcard").classList.toggle("flipped",flipped&&!!card);$("flashcard").querySelector(".flash-hint").textContent=flipped?"ANSWER":"QUESTION"}
$("cardForm").addEventListener("submit",e=>{e.preventDefault();cards.push({id:Date.now(),q:$("cardQuestion").value.trim(),a:$("cardAnswer").value.trim()});save("cards",cards);cardIndex=cards.length-1;flipped=false;$("cardForm").reset();renderAll();toast("Flashcard added")});
$("flashcard").addEventListener("click",()=>{if(!cards.length)return;flipped=!flipped;renderCards()});
$("prevCard").addEventListener("click",()=>{if(!cards.length)return;cardIndex=(cardIndex-1+cards.length)%cards.length;flipped=false;renderCards()});
$("nextCard").addEventListener("click",()=>{if(!cards.length)return;cardIndex=(cardIndex+1)%cards.length;flipped=false;renderCards()});

function updateTimer(){const m=Math.floor(timerSeconds/60),s=timerSeconds%60;$("timerDisplay").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");const elapsed=timerInitial-timerSeconds,pct=timerInitial?elapsed/timerInitial:0;$("timerDisplay").parentElement.parentElement.style.background=`conic-gradient(var(--purple) ${pct*360}deg,#eeecf7 0deg)`}
function stopTimer(){clearInterval(timerInterval);timerInterval=null;timerRunning=false;$("timerStart").textContent="▶ Resume focus"}
function setTimer(minutes){stopTimer();timerSeconds=minutes*60;timerInitial=timerSeconds;$("timerMode").textContent=minutes===25?"Focus session":minutes===5?"Short break":"Long break";$("timerMessage").textContent="Ready when you are. You've got this!";document.querySelectorAll(".preset").forEach(b=>b.classList.toggle("active",Number(b.dataset.minutes)===minutes));$("timerStart").textContent="▶ Start focus";updateTimer()}
document.querySelectorAll(".preset").forEach(b=>b.addEventListener("click",()=>setTimer(Number(b.dataset.minutes))));
$("timerStart").addEventListener("click",()=>{if(timerRunning){stopTimer();return}timerRunning=true;$("timerStart").textContent="Ⅱ Pause";$("timerMessage").textContent="Stay present. One step at a time.";timerInterval=setInterval(()=>{timerSeconds--;updateTimer();if(timerSeconds<=0){stopTimer();if(timerInitial===25*60){focusMinutes+=25;save("focusMinutes",focusMinutes);renderDashboard()}$("timerMessage").textContent="Session complete — well done! 🎉";$("timerStart").textContent="▶ Start again";toast("Focus session completed!")}},1000)});
$("timerReset").addEventListener("click",()=>setTimer(timerInitial/60));
function renderFocusTotal(){$("focusTotal").textContent=focusMinutes+" min"}
const originalRenderDashboard=renderDashboard;renderDashboard=function(){originalRenderDashboard();renderFocusTotal()};
renderAll();updateTimer();renderFocusTotal();
