const express=require("express");
const path=require("path");
const app=express();
const PORT=process.env.PORT||10000;
app.use(express.json({limit:"1mb"}));
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
app.get("/api/health",(req,res)=>res.json({ok:true,app:"HavanaAi",version:"1.0.0"}));
app.get("/api/discover",(req,res)=>{const q=String(req.query.q||"").trim().toLowerCase(),cat=String(req.query.category||"All");let out=items.filter(x=>cat==="All"||x.category===cat);if(q){const words=q.split(/\s+/).filter(Boolean);out=out.map(x=>{const hay=[x.title,x.description,x.category,...x.tags].join(" ").toLowerCase();return {...x,score:words.reduce((n,w)=>n+(hay.includes(w)?1:0),0)}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);}res.json({query:q,category:cat,total:out.length,results:out});});
app.post("/api/chat",async(req,res)=>{const prompt=String(req.body?.prompt||"").trim();if(!prompt)return res.status(400).json({error:"Prompt is required."});const url=process.env.AI_API_URL,key=process.env.AI_API_KEY;if(!url||!key)return res.json({mode:"local",answer:"HavanaAi is ready. I can help you research a topic, explain an idea, brainstorm, summarize information, or turn a goal into practical steps. For live model responses, configure the AI provider environment variables on your server."});try{const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},body:JSON.stringify({model:process.env.AI_MODEL||"default",messages:[{role:"system",content:"You are HavanaAi, a helpful content discovery assistant. Be concise, factual and practical. Do not claim to have browsed or taken actions unless the system actually provided that capability."},{role:"user",content:prompt}]})});const d=await r.json();if(!r.ok)throw new Error(d?.error?.message||"Provider error");const answer=d?.choices?.[0]?.message?.content||d?.output_text;if(!answer)throw new Error("Empty provider response");res.json({mode:"ai",answer});}catch(e){res.status(502).json({error:"AI service unavailable",detail:e.message});}});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log("HavanaAi listening on "+PORT));