const CATS=["Moradia","Alimentação","Transporte","Lazer","Saúde","Educação","Salário","Outros"];
const COLORS=["#3856d6","#17825f","#e0a100","#d4415a","#8a4fd6","#0d9bb5","#7aa63a","#8791a3"];
const KEY="gastos-v1";
const brl=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const $=id=>document.getElementById(id);
let tx=[];
try{tx=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){tx=[]}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(tx))}catch(e){}};
const ym=d=>d.slice(0,7);
const monthLabel=k=>{const[y,m]=k.split("-");return new Date(y,m-1,1).toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}).replace(".","")};

$("cat").innerHTML=CATS.map(c=>`<option>${c}</option>`).join("");
$("data").value=new Date().toISOString().slice(0,10);

let cCat,cMes;
function theme(){const s=getComputedStyle(document.documentElement);return{ink:s.getPropertyValue("--mute").trim(),line:s.getPropertyValue("--line").trim(),inn:s.getPropertyValue("--in").trim(),out:s.getPropertyValue("--out").trim()}}

function fillMonths(keep){
  const set=new Set(tx.map(t=>ym(t.date)));set.add(ym(new Date().toISOString()));
  const ks=[...set].sort().reverse();
  $("mes").innerHTML=`<option value="all">Todos os meses</option>`+ks.map(k=>`<option value="${k}">${monthLabel(k)}</option>`).join("");
  $("mes").value=ks.includes(keep)||keep==="all"?keep:ym(new Date().toISOString());
}

function render(){
  const m=$("mes").value;
  const cur=tx.filter(t=>m==="all"||ym(t.date)===m).sort((a,b)=>b.date.localeCompare(a.date));
  const inn=cur.filter(t=>t.tipo==="in").reduce((s,t)=>s+t.val,0);
  const out=cur.filter(t=>t.tipo==="out").reduce((s,t)=>s+t.val,0);
  $("kIn").textContent=brl(inn);$("kOut").textContent=brl(out);
  const bal=inn-out;$("kBal").textContent=brl(bal);$("kBal").className=bal>=0?"in":"out";

  const th=theme();
  const byCat={};cur.filter(t=>t.tipo==="out").forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)+t.val);
  const cl=Object.keys(byCat);
  cCat&&cCat.destroy();
  cCat=new Chart($("cCat"),{type:"doughnut",data:{labels:cl,datasets:[{data:cl.map(c=>byCat[c]),backgroundColor:cl.map(c=>COLORS[CATS.indexOf(c)]),borderWidth:0}]},
    options:{maintainAspectRatio:false,cutout:"62%",plugins:{legend:{position:"right",labels:{color:th.ink,boxWidth:12}},tooltip:{callbacks:{label:c=>` ${c.label}: ${brl(c.parsed)}`}}}}});

  const ks=[...new Set(tx.map(t=>ym(t.date)))].sort().slice(-6);
  const sum=(k,tp)=>tx.filter(t=>ym(t.date)===k&&t.tipo===tp).reduce((s,t)=>s+t.val,0);
  cMes&&cMes.destroy();
  cMes=new Chart($("cMes"),{type:"bar",data:{labels:ks.map(monthLabel),datasets:[{label:"Entradas",data:ks.map(k=>sum(k,"in")),backgroundColor:th.inn,borderRadius:4},{label:"Saídas",data:ks.map(k=>sum(k,"out")),backgroundColor:th.out,borderRadius:4}]},
    options:{maintainAspectRatio:false,scales:{x:{ticks:{color:th.ink},grid:{display:false}},y:{ticks:{color:th.ink,callback:v=>brl(v)},grid:{color:th.line}}},plugins:{legend:{labels:{color:th.ink,boxWidth:12}},tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${brl(c.parsed.y)}`}}}}});

  $("list").innerHTML=cur.length?cur.map(t=>`<div class="row"><span class="tag">${t.date.split("-").reverse().join("/")}</span><span>${esc(t.desc)}</span><span class="tag">${t.cat}</span><span class="v ${t.tipo}">${t.tipo==="out"?"−":"+"}${brl(t.val)}</span><button class="x" data-id="${t.id}" aria-label="Excluir ${esc(t.desc)}">×</button></div>`).join(""):`<p class="empty">Nenhuma transação neste período. Adicione uma acima ou carregue o exemplo.</p>`;
}
const esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

$("f").addEventListener("submit",e=>{
  e.preventDefault();
  const val=parseFloat($("val").value);if(!(val>0))return;
  tx.push({id:Date.now()+Math.random(),desc:$("desc").value.trim(),val,tipo:$("tipo").value,cat:$("cat").value,date:$("data").value});
  save();fillMonths(ym($("data").value));render();
  $("desc").value="";$("val").value="";$("desc").focus();
});
$("list").addEventListener("click",e=>{
  const b=e.target.closest(".x");if(!b)return;
  tx=tx.filter(t=>String(t.id)!==b.dataset.id);save();fillMonths($("mes").value);render();
});
$("mes").addEventListener("change",render);
$("clear").addEventListener("click",()=>{if(tx.length&&confirm("Apagar todas as transações?")){tx=[];save();fillMonths("all");render()}});
$("demo").addEventListener("click",()=>{
  const now=new Date(),d=[];
  for(let i=0;i<3;i++){
    const base=new Date(now.getFullYear(),now.getMonth()-i,1),p=n=>`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
    [["Salário",5200,"in","Salário",5],["Aluguel",1600,"out","Moradia",8],["Mercado",620+i*45,"out","Alimentação",12],["Combustível",280,"out","Transporte",15],["Cinema e jantar",190+i*30,"out","Lazer",20],["Plano de saúde",340,"out","Saúde",22],["Curso online",120,"out","Educação",25]]
      .forEach(r=>tx.push({id:Date.now()+Math.random(),desc:r[0],val:r[1],tipo:r[2],cat:r[3],date:p(r[4])}));
  }
  save();fillMonths(ym(now.toISOString()));render();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",render);
fillMonths(ym(new Date().toISOString()));render();