const $=id=>document.getElementById(id);
const categories=["All","AI","Business","Creators","Education","Technology","Africa","Design"];
let active="All",mode="quick",pendingAttachment=null,lastAssistant="";
const sessionId=crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
const MEMORY_KEY="havanaai-memory-v1",PREF_KEY="havanaai-memory-enabled";
let memoryEnabled=localStorage.getItem(PREF_KEY)!=="0";

function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]||c))}
function chips(){$("chips").innerHTML=categories.map(c=>`<button class="chip ${c===active?"active":""}" data-cat="${c}">${c}</button>`).join("");document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{active=b.dataset.cat;chips();discover()})}
function setMode(m){mode=m;document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===m))}
async function jsonFetch(url,o={}){const r=await fetch(url,o);let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.detail?`${d.error||"Request failed"}: ${d.detail}`:(d.error||`Request failed (${r.status})`));return d}
async function discover(){const q=$("search").value.trim();$("results").innerHTML='<div class="empty">Searching HavanaAi…</div>';try{const d=await jsonFetch("/api/discover?q="+encodeURIComponent(q)+"&category="+encodeURIComponent(active));$("count").textContent=d.total+" results";$("results").innerHTML=d.results.length?d.results.map(x=>`<article class="card"><span class="cat">${esc(x.category).toUpperCase()}</span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="tags">${x.tags.map(t=>`<span>#${esc(t)}</span>`).join("")}</div></article>`).join(""):'<div class="empty">No matches yet. Try another topic or category.</div>'}catch(e){$("count").textContent="";$("results").innerHTML='<div class="empty">Could not load discovery. Refresh and try again.</div>'}}
function addMessage(role,text,save=true){const box=$("chatLog");box.classList.remove("hidden");const el=document.createElement("div");el.className="message "+role;el.innerHTML=`<div class="message-role">${role==="user"?"You":"HavanaAi"}</div><div class="message-text">${esc(text)}</div>`;box.appendChild(el);box.scrollTop=box.scrollHeight;if(role==="assistant"){lastAssistant=text;if(save&&memoryEnabled)saveMemory()}}
function saveMemory(){const msgs=[...$("chatLog").querySelectorAll(".message")].map(x=>({role:x.classList.contains("user")?"user":"assistant",text:x.querySelector(".message-text")?.textContent||""}));localStorage.setItem(MEMORY_KEY,JSON.stringify(msgs.slice(-30)))}
function loadMemory(){if(!memoryEnabled)return;try{const msgs=JSON.parse(localStorage.getItem(MEMORY_KEY)||"[]");if(msgs.length){msgs.forEach(m=>addMessage(m.role,m.text,false));$("chatLog").classList.remove("hidden")}}catch(_){}}
function showAttachment(name,type){const a=$("attachment");a.classList.remove("hidden");a.textContent=(type==="image"?"🖼️ ":"📎 ")+name+" attached — HavanaAi will analyze it."}
function clearAttachment(){pendingAttachment=null;$("attachment").classList.add("hidden");$("attachment").textContent=""}

async function ask(){const prompt=$("prompt").value.trim();if(!prompt&&!pendingAttachment)return;const b=$("askBtn");b.disabled=true;if(prompt)addMessage("user",prompt);$("prompt").value="";$("prompt").style.height="auto";const thinking=document.createElement("div");thinking.className="message assistant thinking";thinking.textContent="HavanaAi is thinking…";$("chatLog").appendChild(thinking);
try{
  let d;
  if(pendingAttachment){d=await jsonFetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompt||"Analyze this file/image and explain the important details clearly.",imageData:pendingAttachment.kind==="image"?pendingAttachment.data:"",fileData:pendingAttachment.kind==="file"?pendingAttachment.data:"",filename:pendingAttachment.name})})}
  else d=await jsonFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,mode,sessionId})});
  thinking.remove();addMessage("assistant",d.answer);clearAttachment();if(memoryEnabled)saveMemory();
}catch(e){thinking.remove();addMessage("assistant","I couldn't complete that request: "+e.message)}finally{b.disabled=false;$("prompt").focus()}}

async function webSearch(){const q=$("prompt").value.trim();if(!q){$("prompt").focus();$("prompt").placeholder="Type what you want me to search on the web…";return}$("askBtn").disabled=true;addMessage("user","🌐 Web search: "+q);$("prompt").value="";const t=document.createElement("div");t.className="message assistant thinking";t.textContent="Searching the web…";$("chatLog").appendChild(t);try{const d=await jsonFetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:q})});t.remove();addMessage("assistant",d.answer)}catch(e){t.remove();addMessage("assistant","Web search failed: "+e.message)}finally{$("askBtn").disabled=false}}
async function generateImage(){const p=$("prompt").value.trim();if(!p){$("prompt").focus();$("prompt").placeholder="Describe the image you want to create…";return}$("askBtn").disabled=true;addMessage("user","🎨 Create image: "+p);$("prompt").value="";const t=document.createElement("div");t.className="message assistant thinking";t.textContent="Creating image…";$("chatLog").appendChild(t);try{const d=await jsonFetch("/api/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:p})});t.remove();lastAssistant=d.revisedPrompt||"Image created.";const m=$("mediaResult");m.classList.remove("hidden");m.innerHTML=`<img src="${esc(d.image)}" alt="Generated by HavanaAi"><a class="primary download" href="${esc(d.image)}" download="havanaai-image.png">Save image</a>`;addMessage("assistant","🎨 Image created successfully.")}catch(e){t.remove();addMessage("assistant","Image generation failed: "+e.message)}finally{$("askBtn").disabled=false}}

function readFile(file,kind){if(!file)return;const max=10*1024*1024;if(file.size>max){addMessage("assistant","That file is larger than 10 MB. Please choose a smaller file.");return}const reader=new FileReader();reader.onload=()=>{pendingAttachment={kind,data:reader.result,name:file.name};showAttachment(file.name,kind)};reader.readAsDataURL(file)}
$("photoInput").onchange=e=>readFile(e.target.files[0],"image");
$("fileInput").onchange=e=>readFile(e.target.files[0],"file");
$("photoBtn").onclick=()=>$("photoInput").click();
$("fileBtn").onclick=()=>$("fileInput").click();
$("webBtn").onclick=webSearch;
$("imageBtn").onclick=generateImage;

let recognition=null;
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){recognition=new SpeechRecognition();recognition.lang=navigator.language||"en-US";recognition.interimResults=false;recognition.maxAlternatives=1;recognition.onstart=()=>{$("voiceBtn").textContent="⏹️ Stop";$("voiceBtn").classList.add("active")};recognition.onend=()=>{$("voiceBtn").textContent="🎙️ Voice";$("voiceBtn").classList.remove("active")};recognition.onresult=e=>{$("prompt").value=e.results[0][0].transcript;$("prompt").dispatchEvent(new Event("input"));$("prompt").focus()};recognition.onerror=e=>addMessage("assistant","Voice input: "+e.error)}}
$("voiceBtn").onclick=()=>{if(!recognition){addMessage("assistant","Voice input is not supported by this browser. Try Chrome on Android.");return}try{recognition.start()}catch(_){try{recognition.stop()}catch(__){}}};
$("speakBtn").onclick=()=>{if(!lastAssistant){addMessage("assistant","There is no HavanaAi answer to read yet.");return}if(!("speechSynthesis"in window)){addMessage("assistant","Voice output is not supported by this browser.");return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(lastAssistant);u.lang=navigator.language||"en-US";speechSynthesis.speak(u)};

$("memoryBtn").onclick=()=>{memoryEnabled=!memoryEnabled;localStorage.setItem(PREF_KEY,memoryEnabled?"1":"0");$("memoryBtn").textContent=memoryEnabled?"🧠 Memory ON":"🧠 Memory OFF";if(memoryEnabled)saveMemory();else localStorage.removeItem(MEMORY_KEY)};
$("newChat").onclick=async()=>{try{await jsonFetch("/api/reset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId})})}catch(_){}$("chatLog").innerHTML="";$("chatLog").classList.add("hidden");$("mediaResult").classList.add("hidden");$("mediaResult").innerHTML="";clearAttachment();lastAssistant="";if(memoryEnabled)localStorage.removeItem(MEMORY_KEY);$("prompt").value="";$("prompt").focus()};
$("theme").onclick=()=>{$("theme").textContent=document.body.classList.toggle("light")?"☀":"☾"};
$("searchBtn").onclick=discover;
$("search").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();discover()}};
$("askBtn").onclick=ask;
$("prompt").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask()}};
$("prompt").oninput=()=>{$("prompt").style.height="auto";$("prompt").style.height=Math.min($("prompt").scrollHeight,150)+"px"};
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
setMode("quick");chips();discover();$("memoryBtn").textContent=memoryEnabled?"🧠 Memory ON":"🧠 Memory OFF";loadMemory();
