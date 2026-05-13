const STORAGE_KEY = 'capisco_leads_v1';
let leads = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const searchTerms = ["HAG Capisco","Hag Capisco","Håg Capisco","Capisco","Capisco chair","HAG Capisco 8106","Capisco Puls","saddle office chair","standing desk chair","ergonomic stool","drafting stool HAG"];
const nearbyTerms = ["New Rochelle","White Plains","Yonkers","Bronx","Manhattan","Brooklyn","Queens","Stamford","Norwalk","Fairfield County","Hudson Valley","Long Island","North Jersey"];

const presets = {
  balanced: { priceWeight: 1, mismatchTolerance: 1 },
  strict: { priceWeight: .8, mismatchTolerance: .6 },
  bargain: { priceWeight: 1.3, mismatchTolerance: 1 },
  mislabeled: { priceWeight: 1, mismatchTolerance: 1.4 }
};

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); }
function low(s){ return (s||'').toLowerCase(); }

function generateLinks(){
  const maxPrice = Number(document.getElementById('maxPrice').value || 400);
  const links = [];
  const craigRegions = [
    'newyork','hudsonvalley','longisland','newjersey','cnj','northjersey','fairfield'
  ];
  for (const r of craigRegions){
    links.push({label:`Craigslist ${r} (price <= ${maxPrice})`, url:`https://${r}.craigslist.org/search/fua?query=capisco&max_price=${maxPrice}&sort=priceasc`});
  }
  links.push({label:'eBay used (cheapest first)', url:`https://www.ebay.com/sch/i.html?_nkw=HAG+Capisco&_sacat=0&LH_ItemCondition=3000&_sop=15&_udhi=${maxPrice}`});

  const gq = encodeURIComponent(`(${searchTerms.join(' OR ')}) (${nearbyTerms.join(' OR ')}) (used OR office liquidation OR furniture)`);
  links.push({label:'Google local intent search', url:`https://www.google.com/search?q=${gq}`});
  links.push({label:'Google office liquidator angle', url:'https://www.google.com/search?q=used+office+furniture+liquidation+new+rochelle+white+plains+yonkers'});

  const box = document.getElementById('links');
  box.innerHTML = links.map(l=>`<a href="${l.url}" target="_blank">${l.label}</a>`).join('');
  box.dataset.links = JSON.stringify(links);
}

function parsePrice(v){ const n = Number(String(v).replace(/[^\d.]/g,'')); return Number.isFinite(n)?n:999999; }

function scoreLead(lead, presetName='balanced'){
  const p = presets[presetName] || presets.balanced;
  const t = low(`${lead.title} ${lead.notes}`);
  const location = low(lead.location);
  const price = parsePrice(lead.price);

  let match = 20;
  if (/hag\s*capisco/.test(t)) match += 45;
  if (/capisco\s*puls/.test(t)) match += 40;
  else if (/capisco/.test(t)) match += 25;
  if (/saddle office chair|standing desk chair|ergonomic stool|drafting stool hag/.test(t)) match += Math.round(10*p.mismatchTolerance);
  if (/unknown|not sure|maybe|similar/.test(t)) match -= 10;

  let deal = 20;
  if (price < 300) deal += Math.round(40*p.priceWeight);
  else if (price <= 400) deal += Math.round(25*p.priceWeight);
  else if (price <= 550) deal += 10;
  else deal -= 15;

  if (/office liquidation|used office furniture/.test(t)) deal += 8;

  let hassle = 20;
  if (/shipping only|ship only|no pickup/.test(t)) hassle += 35;
  if (/broken|damage|damaged|missing|parts|repair/.test(t)) hassle += 30;
  if (/pickup|local/.test(t)) hassle -= 10;

  if (nearbyTerms.some(x => location.includes(x.toLowerCase()))) { deal += 12; hassle -= 8; }
  if (/california|texas|florida|washington|illinois/.test(location)) hassle += 20;

  match = Math.max(0, Math.min(100, match));
  deal = Math.max(0, Math.min(100, deal));
  hassle = Math.max(0, Math.min(100, hassle));
  const overall = Math.round((match*0.45) + (deal*0.4) - (hassle*0.25));

  let rec = 'SKIP';
  if (overall >= 50 && match >= 55 && hassle <= 45) rec = 'CONTACT NOW';
  else if (overall >= 30) rec = 'MAYBE';

  const offer = Math.max(100, Math.round(price * (rec==='CONTACT NOW'?0.9:rec==='MAYBE'?0.8:0.7)));
  const why = `match ${match}, deal ${deal}, hassle ${hassle}. ${rec==='CONTACT NOW'?'Strong local/value signal.':rec==='MAYBE'?'Needs quick clarification.':'Low confidence or poor value.'}`;
  const msg = `Hi! Is this still available? I'm interested in your ${lead.title}. Could you confirm condition, model label, and whether local pickup near ${lead.location} is possible? If all checks out, I can offer around $${offer} and pick up quickly.`;

  return {...lead, price, match, deal, hassle, overall, rec, offer, why, msg};
}

function render(){
  const preset = document.getElementById('preset').value;
  const filterRec = document.getElementById('filterRec').value;
  const filterPrice = Number(document.getElementById('filterPrice').value || 0);
  const scored = leads.map(l=>scoreLead(l,preset)).sort((a,b)=>b.overall-a.overall || a.price-b.price);
  const filtered = scored.filter(x => (filterRec==='ALL'||x.rec===filterRec) && (!filterPrice || x.price <= filterPrice));

  const rows = filtered.map((x,i)=>`<tr>
<td>${i+1}</td><td><a href="${x.url}" target="_blank">${x.title}</a><div class="small">${x.source} • ${x.location}</div></td>
<td>$${x.price}</td><td>${x.match}</td><td>${x.deal}</td><td>${x.hassle}</td><td>${x.overall}</td>
<td><span class="badge ${x.rec==='CONTACT NOW'?'contact':x.rec==='MAYBE'?'maybe':'skip'}">${x.rec}</span></td>
<td>$${x.offer}</td><td>${x.why}<details><summary>Draft message</summary>${x.msg}</details></td></tr>`).join('');

  document.getElementById('tableWrap').innerHTML = `<table><thead><tr><th>#</th><th>Lead</th><th>Price</th><th>Match</th><th>Deal</th><th>Hassle</th><th>Overall</th><th>Recommendation</th><th>Suggested Offer</th><th>Explanation</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function addFromForm(){
  const lead = ['title','url','price','location','source','notes'].reduce((a,k)=> (a[k]=document.getElementById(k).value.trim(),a),{});
  leads.push(lead); save(); render(); document.getElementById('leadForm').reset();
}

function parseBulk(){
  const text = document.getElementById('bulkPaste').value.trim(); if(!text) return;
  const lines = text.split(/\r?\n/);
  for (const line of lines){
    const cols = line.includes('|') ? line.split('|') : line.split(',');
    if (cols.length < 6) continue;
    const [title,url,price,location,source,...rest] = cols.map(x=>x.trim());
    leads.push({title,url,price,location,source,notes:rest.join(', ')});
  }
  save(); render();
}

function seed(){
  leads = [
    {title:'HAG Capisco 8106 black',url:'https://example.com/1',price:'295',location:'White Plains',source:'Craigslist',notes:'local pickup, good condition'},
    {title:'Ergonomic saddle office chair',url:'https://example.com/2',price:'180',location:'Yonkers',source:'Facebook',notes:'similar to Capisco maybe'},
    {title:'Capisco Puls stool',url:'https://example.com/3',price:'360',location:'Stamford',source:'eBay',notes:'used office furniture seller'},
    {title:'HAG chair parts/repair',url:'https://example.com/4',price:'120',location:'Queens',source:'Craigslist',notes:'missing parts, repair needed'},
    {title:'Capisco chair shipping only',url:'https://example.com/5',price:'330',location:'Brooklyn',source:'eBay',notes:'shipping only'}
  ];
  save(); render();
}

function exportFile(name, data, type){
  const blob = new Blob([data], {type});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}

document.getElementById('generateLinks').onclick = generateLinks;
document.getElementById('openTopLinks').onclick = () => {
  const links = JSON.parse(document.getElementById('links').dataset.links || '[]').slice(0,6);
  links.forEach(l=>window.open(l.url,'_blank'));
};
document.getElementById('addLead').onclick = addFromForm;
document.getElementById('parseBulk').onclick = parseBulk;
document.getElementById('reScore').onclick = render;
document.getElementById('seedData').onclick = seed;
document.getElementById('clearLeads').onclick = ()=>{ if(confirm('Clear all leads?')){leads=[];save();render();}};
document.getElementById('exportCsv').onclick = ()=>{
  const header = 'title,url,price,location,source,notes\n';
  const body = leads.map(l=>[l.title,l.url,l.price,l.location,l.source,l.notes].map(v=>`"${String(v||'').replaceAll('"','""')}"`).join(',')).join('\n');
  exportFile('capisco-leads.csv', header+body, 'text/csv');
};
document.getElementById('exportJson').onclick = ()=>exportFile('capisco-leads.json', JSON.stringify(leads,null,2), 'application/json');

document.getElementById('chatgptTemplate').value = `Rank these leads for buying a used HAG Capisco near New Rochelle, NY.\nUse: match confidence, deal quality, hassle, recommended action (CONTACT NOW / MAYBE / SKIP), and suggested offer.\nPrioritize exact HAG Capisco/Capisco Puls, lower price, nearby pickup, and penalize shipping-only/damaged/vague listings.\n\nLEADS:\n[paste rows here]`;

generateLinks(); render();
