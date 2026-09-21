const express=require("express");
const path=require("path");
const crypto=require("crypto");
const app=express();
const PORT=process.env.PORT||10000;
app.use(express.json({limit:"15mb"}));
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
  const key=process.env.AI_API_KEY||process.env.OPENAI_API_KEY||process.env.API_KEY;
  const url=process.env.AI_API_URL||process.env.OPENAI_API_URL||"https://api.openai.com/v1/chat/completions";
  const responsesUrl=process.env.AI_RESPONSES_URL||process.env.OPENAI_RESPONSES_URL||"https://api.openai.com/v1/responses";
  const model=process.env.AI_MODEL||process.env.OPENAI_MODEL||"gpt-4o-mini";
  const imageModel=process.env.AI_IMAGE_MODEL||"gpt-image-1";
  const imageUrl=process.env.AI_IMAGE_URL||"https://api.openai.com/v1/images/generations";
  return {key,url,responsesUrl,model,imageModel,imageUrl};
}
function extractAnswer(d){return d?.choices?.[0]?.message?.content||d?.output_text||d?.response?.output_text||"";}
async function postJson(url,key,body){
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify(body)});
  const raw=await r.text();let d={};try{d=JSON.parse(raw)}catch(_){}
  if(!r.ok)throw new Error(d?.error?.message||("Provider returned HTTP "+r.status));
  return d;
}
function responseText(d){
  if(d?.output_text)return d.output_text;
  const parts=[];
  for(const item of (d?.output||[])) for(const c of (item?.content||[])) if(c?.type==="output_text"&&c.text) parts.push(c.text);
  return parts.join("\n").trim();
}

app.get("/api/health",(req,res)=>res.json({ok:true,app:"HavanaAi",version:"4.0.0",capabilities:["chat","memory","web search","image understanding","file/PDF analysis","image generation","voice input","voice output","research mode","learning mode","creation mode","content discovery","tools","PWA"]}));
app.get("/api/config",(req,res)=>{const c=providerConfig();res.json({ok:true,aiConfigured:Boolean(c.key),model:c.model,features:{webSearch:true,vision:true,fileAnalysis:true,imageGeneration:true}});});

app.get("/api/discover",(req,res)=>{
  const q=String(req.query.q||"").trim().toLowerCase(),cat=String(req.query.category||"All");
  let out=items.filter(x=>cat==="All"||x.category===cat);
  if(q){const words=q.split(/\s+/).filter(Boolean);out=out.map(x=>{const hay=[x.title,x.description,x.category,...x.tags].join(" ").toLowerCase();const score=words.reduce((n,w)=>n+(hay.includes(w)?1:0),0);return {...x,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);}
  res.json({query:q,category:cat,total:out.length,results:out});
});

app.post("/api/chat",async(req,res)=>{
  const prompt=String(req.body?.prompt||"").trim(),mode=MODES[req.body?.mode]?req.body.mode:"quick",sessionId=String(req.body?.sessionId||crypto.randomUUID());
  if(!prompt)return res.status(400).json({error:"Prompt is required."});
  const {key,url,model}=providerConfig();
  if(!key)return res.status(503).json({error:"AI provider is not configured.",detail:"Add AI_API_KEY in Render Environment Variables."});
  const history=historyFor(sessionId);
  const system="You are HavanaAi, a high-efficiency general AI assistant with chat, photo/image upload, file analysis, web search, image generation, voice input/output, memory, research, learning and creation features. "+MODES[mode]+" Never claim that HavanaAi cannot accept images or files: the web app provides Photo and File upload controls. If the user says \"upload an image\", distinguish between (1) uploading a photo from their device, which they do with the Photo button, and (2) asking HavanaAi to create/find/show an image, which should use the Image/Web tools when available. Never invent facts, sources, browsing, tool use or completed actions. If information is uncertain, say so. Use clear structure, avoid repetition, and answer in the user's language when practical.";
  try{
    console.log("[HavanaAi] AI request",{model,url});
    const d=await postJson(url,key,{model,messages:[{role:"system",content:system},...history.slice(-16),{role:"user",content:prompt}]});
    const answer=extractAnswer(d);if(!answer)throw new Error("Provider returned an empty response.");
    history.push({role:"user",content:prompt},{role:"assistant",content:answer});sessions.set(sessionId,history.slice(-16));
    res.json({ok:true,mode:"ai",answer,sessionId,model});
  }catch(e){console.error("[HavanaAi] AI provider error:",e.message);res.status(502).json({error:"AI service unavailable",detail:e.message});}
});

app.post("/api/search",async(req,res)=>{
  const prompt=String(req.body?.prompt||"").trim();if(!prompt)return res.status(400).json({error:"Search query is required."});
  const {key,responsesUrl,model}=providerConfig();if(!key)return res.status(503).json({error:"AI provider is not configured."});
  try{
    const d=await postJson(responsesUrl,key,{model,input:prompt,tools:[{type:"web_search"}],include:["web_search_call.action.sources"]});
    const answer=responseText(d);if(!answer)throw new Error("Search returned an empty response.");
    res.json({ok:true,answer,model});
  }catch(e){console.error("[HavanaAi] web search error:",e.message);res.status(502).json({error:"Web search unavailable",detail:e.message});}
});

app.post("/api/analyze",async(req,res)=>{
  const prompt=String(req.body?.prompt||"Analyze this input and explain what matters.").trim();
  const imageData=String(req.body?.imageData||"").trim();
  const fileData=String(req.body?.fileData||"").trim();
  const filename=String(req.body?.filename||"upload");
  const {key,url,responsesUrl,model}=providerConfig();
  if(!key)return res.status(503).json({error:"AI provider is not configured.",detail:"Add AI_API_KEY in Render Environment Variables."});
  try{
    let answer="";
    if(imageData){
      if(!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(imageData)){
        return res.status(400).json({error:"Invalid image format. Please upload PNG, JPG, WEBP or GIF."});
      }
      // Prefer the Responses API because it has first-class image input.
      try{
        const d=await postJson(responsesUrl,key,{
          model,
          input:[{role:"user",content:[
            {type:"input_text",text:prompt},
            {type:"input_image",image_url:imageData}
          ]}]
        });
        answer=responseText(d);
      }catch(visionError){
        console.warn("[HavanaAi] Responses vision failed, trying chat vision:",visionError.message);
        const d=await postJson(url,key,{
          model,
          messages:[{role:"user",content:[
            {type:"text",text:prompt},
            {type:"image_url",image_url:{url:imageData,detail:"auto"}}
          ]}]
        });
        answer=extractAnswer(d);
      }
    }else if(fileData){
      const d=await postJson(responsesUrl,key,{
        model,
        input:[{role:"user",content:[
          {type:"input_text",text:prompt},
          {type:"input_file",filename,file_data:fileData}
        ]}]
      });
      answer=responseText(d);
    }else{
      return res.status(400).json({error:"No image or file was provided."});
    }
    if(!answer)throw new Error("Analysis returned an empty response.");
    res.json({ok:true,answer,filename,model});
  }catch(e){
    console.error("[HavanaAi] analysis error:",e.message);
    res.status(502).json({error:"Analysis unavailable",detail:e.message});
  }
});

app.post("/api/image",async(req,res)=>{
  const prompt=String(req.body?.prompt||"").trim();if(!prompt)return res.status(400).json({error:"Image prompt is required."});
  const {key,imageUrl,imageModel}=providerConfig();if(!key)return res.status(503).json({error:"AI provider is not configured."});
  try{
    const d=await postJson(imageUrl,key,{model:imageModel,prompt,n:1,size:"1024x1024"});
    const image=d?.data?.[0];if(!image)throw new Error("Image provider returned no image.");
    res.json({ok:true,image:image.url||("data:image/png;base64,"+image.b64_json),revisedPrompt:image.revised_prompt||"",model:imageModel});
  }catch(e){console.error("[HavanaAi] image generation error:",e.message);res.status(502).json({error:"Image generation unavailable",detail:e.message});}
});

app.post("/api/reset",(req,res)=>{sessions.delete(String(req.body?.sessionId||"default"));res.json({ok:true});});

const businessOrders=[];
const BUSINESS_WHATSAPP=String(process.env.BUSINESS_WHATSAPP||"255700000000").replace(/\\D/g,"");
const businessPackages=[
  {id:"starter",name:"Starter",price:"Bei itaelezwa",items:["Posters 3","Captions 5","WhatsApp Status 5"]},
  {id:"business",name:"Business",price:"Bei itaelezwa",items:["Posters 8","Videos/Reels 4","Captions 15","Catalogue ndogo"]},
  {id:"premium",name:"Premium",price:"Bei itaelezwa",items:["Content ya mwezi","Posters + videos + captions","Catalogue","Landing page/website"]}
];
app.get("/api/business/catalogue",(req,res)=>res.json({ok:true,whatsapp:BUSINESS_WHATSAPP,packages:businessPackages}));
app.post("/api/business/orders",(req,res)=>{
  const b=req.body||{};
  const name=String(b.name||"").trim(),phone=String(b.phone||"").trim(),pkg=String(b.package||"").trim(),details=String(b.details||"").trim();
  if(!name||!phone||!pkg)return res.status(400).json({error:"Name, phone and package are required."});
  const selected=businessPackages.find(x=>x.id===pkg);
  if(!selected)return res.status(400).json({error:"Invalid package."});
  const id="HB-"+Date.now().toString(36).toUpperCase()+"-"+crypto.randomBytes(2).toString("hex").toUpperCase();
  const order={id,name,phone,package:pkg,packageName:selected.name,details,status:"new",createdAt:new Date().toISOString()};
  businessOrders.unshift(order);
  res.status(201).json({ok:true,order,whatsapp:BUSINESS_WHATSAPP});
});
app.get("/api/business/orders",(req,res)=>{
  const key=String(req.headers["x-admin-key"]||"");
  if(!process.env.BUSINESS_ADMIN_KEY||key!==process.env.BUSINESS_ADMIN_KEY)return res.status(401).json({error:"Unauthorized"});
  res.json({ok:true,total:businessOrders.length,orders:businessOrders});
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log("HavanaAi listening on "+PORT));
