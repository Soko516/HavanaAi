const $=id=>document.getElementById(id);
const categories=["All","AI","Business","Creators","Education","Technology","Africa","Design"];
let active="All";

function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

function chips(){
  $("chips").innerHTML=categories.map(c=>`<button class="chip ${c===active?"active":""}" data-cat="${c}">${c}</button>`).join("");
  document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{active=b.dataset.cat;chips();discover();});
}

async function jsonFetch(url,options={}){
  const r=await fetch(url,options);
  let d={};
  try{d=await r.json();}catch(_){}
  if(!r.ok)throw new Error(d.error||`Request failed (${r.status})`);
  return d;
}

async function discover(){
  const q=$("search").value.trim();
  $("results").innerHTML='<div class="empty">Searching HavanaAi…</div>';
  try{
    const d=await jsonFetch("/api/discover?q="+encodeURIComponent(q)+"&category="+encodeURIComponent(active));
    $("count").textContent=d.total+" results";
    $("results").innerHTML=d.results.length?d.results.map(x=>`<article class="card">
      <span class="cat">${esc(x.category).toUpperCase()}</span>
      <h3>${esc(x.title)}</h3><p>${esc(x.description)}</p>
      <div class="tags">${x.tags.map(t=>`<span>#${esc(t)}</span>`).join("")}</div>
    </article>`).join(""):'<div class="empty">No matches yet. Try another topic or category.</div>';
  }catch(e){
    $("count").textContent="";
    $("results").innerHTML='<div class="empty">HavanaAi could not load results. Refresh and try again.</div>';
  }
}

async function ask(){
  const prompt=$("prompt").value.trim();
  if(!prompt)return;
  const a=$("answer"), b=$("askBtn");
  a.classList.remove("hidden"); a.textContent="Thinking…"; b.disabled=true;
  try{
    const d=await jsonFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
    a.innerHTML=`<strong>${d.mode==="ai"?"AI response":"HavanaAi response"}</strong><br><span>${esc(d.answer||d.error||"No answer returned.")}</span>`;
  }catch(e){
    a.textContent="Could not reach HavanaAi right now. Please try again.";
  }finally{b.disabled=false;}
}

$("searchBtn").onclick=discover;
$("search").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();discover();}};
$("askBtn").onclick=ask;
$("prompt").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask();}};
$("prompt").oninput=()=>{$("prompt").style.height="auto";$("prompt").style.height=Math.min($("prompt").scrollHeight,120)+"px";};
$("newChat").onclick=()=>{$("prompt").value="";$("prompt").style.height="auto";$("answer").classList.add("hidden");$("prompt").focus();};
$("theme").onclick=()=>{document.body.classList.toggle("light");$("theme").textContent=document.body.classList.contains("light")?"☀":"☾";};

if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
chips();discover();