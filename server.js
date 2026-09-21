const express=require("express");
const path=require("path");
const crypto=require("crypto");
const app=express();
const PORT=process.env.PORT||10000;
// HavanaAi production deployment syntax verified.
app.use(express.json({limit:"2mb"}));
app.use(express.static(__dirname));

const items=[
{id:1,title:"The future of artificial intelligence",category:"AI",description:"Explore practical ways AI is changing work, creativity and everyday life.",tags:["ai","technology","future"]},
{id:2,title:"Build a digital business from your phone",category:"Business",description:"Practical ideas for turning skills and knowledge into digital products and services.",tags:["business","entrepreneurship","digital"]},
{id:3,title:"Creator trends to explore",category:"Creators",description:"Discover formats and workflows creators are using to reach audiences.",tags:["creator","video","social"]},
{id:4,title:"Learn faster with smart research",category:"Education",description:"Simple habits for finding, comparing and organizing useful information.",tags:["education","research","learning"]},
{id:5,title:"Technology shaping Africa",category:"Africa",description:"Explore technology stories, products and opportunities across African markets.",tags:["africa","technology","innovation"]},
{id:6,title:"Mobile-first product design",category:"Design",description:"Principles for building simple, fast and useful mobile experiences.",tags:["design","mobile","ux"]},
{id:7,title:"How modern AI assistants work",category:"AI",description:"A beginner-friendly overview of models, prompts, tools and retrieval.",tags:["ai","models","learning"]},
{id:8,title:"Research workflow for busy teams",category:"Technology",description:"A repeatable workflow for collecting, comparing and summarizing information.",tags:["research","productivity","teams"]}
];

const sessions=new Map();
const MODES={
quick:"Answer directly. Be concise, accurate and practical. Lead with the answer.",
research:"Act like a research analyst. Break the question into sub-problems, compare evidence when available, state uncertainty, then give a concise conclusion and next steps.",
learn:"Teach from first principles using simple examples, then give a short practical exercise or checklist.",
create:"Act as a creative and product strategist. Produce concrete options, trade-offs and ready-to-use drafts when appropriate."
};
const historyFor=id=>{const k=String(id||"default");if(!sessions.has(k))sessions.set(k,[]);return sessions.get(k);};

function providerConfig(){
  const key=process.env.AI_API_KEY||process.env.OPENAI_API_KEY;
  const url=process.env.AI_API_URL||"https://api.openai.com/v1/chat/completions";
  const model=process.env.AI_MODEL||"gpt-4o-mini";
  return {key,url,model};
}
function extractAnswer(d){
  return d?.choices?.[0]?.message?.content||d?.output_text||d?.response?.output_text||"";
}

app.get("/api/health",(req,res)=>res.json({
  ok:true,app:"HavanaAi",version:"3.0.0",
  capabilities:["chat","multi-turn memory","research mode","learning mode","creation mode","content discovery","PWA"]
}));

app.get("/api/config",(req,res)=>res.json({ok:true,aiConfigured:Boolean(providerConfig().key),model:providerConfig().model}));

app.get("/api/discover",(req,res)=>{
  const q=String(req.query.q||"").trim().toLowerCase();
  const cat=String(req.query.category||"All");
  let out=items.filter(x=>cat==="All"||x.category===cat);
  if(q){
    const words=q.split(/\s+/).filter(Boolean);
    out=out.map(x=>{
      const hay=[x.title,x.description,x.category,...x.tags].join(" ").toLowerCase();
      const score=words.reduce((n,w)=>n+(hay.includes(w)?1:0),0);
      return {...x,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  }
  res.json({query:q,category:cat,total:out.length,results:out});
});

app.post("/api/chat",async(req,res)=>{
  const prompt=String(req.body?.prompt||"").trim();
  const mode=MODES[req.body?.mode]?req.body.mode:"quick";
  const sessionId=String(req.body?.sessionId||crypto.randomUUID());
  if(!prompt)return res.status(400).json({error:"Prompt is required."});

  const {key,url,model}=providerConfig();
  if(!key){
    return res.status(503).json({
      error:"AI provider is not configured.",
      detail:"Add AI_API_KEY (and optionally AI_API_URL and AI_MODEL) in Render Environment Variables."
    });
  }

  const history=historyFor(sessionId);
  const system="You are HavanaAi, a high-efficiency general AI assistant. "+MODES[mode]+
    " Never invent facts, sources, browsing, tool use or completed actions. If information is uncertain, say so. "+
    "Use clear structure, avoid repetition, and prioritize useful outcomes. Answer in the user's language when practical.";
  const messages=[{role:"system",content:system},...history.slice(-16),{role:"user",content:prompt}];

  try{
    const r=await fetch(url,{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization:"Bearer "+key},
      body:JSON.stringify({model,messages,temperature:mode==="quick"?0.2:0.4})
    });
    const raw=await r.text();
    let d={}; try{d=JSON.parse(raw)}catch(_){}
    if(!r.ok)throw new Error(d?.error?.message||("Provider returned HTTP "+r.status));
    const answer=extractAnswer(d);
    if(!answer)throw new Error("Provider returned an empty response.");
    history.push({role:"user",content:prompt},{role:"assistant",content:answer});
    sessions.set(sessionId,history.slice(-16));
    res.json({ok:true,mode:"ai",answer,sessionId,model});
  }catch(e){
    res.status(502).json({error:"AI service unavailable",detail:e.message});
  }
});

app.post("/api/reset",(req,res)=>{
  sessions.delete(String(req.body?.sessionId||"default"));
  res.json({ok:true});
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log("HavanaAi listening on "+PORT));
