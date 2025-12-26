// app.js（置き換え：肩書きフィルタ/並び替え無し、検索は Tags/拠点中心）
const $ = (sel) => document.querySelector(sel);

const els = {
  q: $("#q"),
  base: $("#base"),
  tag: $("#tag"),
  reset: $("#reset"),
  grid: $("#grid"),
  count: $("#count"),
};

let DATA = [];

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>a.localeCompare(b,"ja"));
}

function optionize(selectEl, values, allLabel = "すべて") {
  selectEl.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = allLabel;
  selectEl.appendChild(optAll);

  for (const v of values) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  }
}

function normalize(s){ return (s ?? "").toString().trim(); }

function includesLoose(haystack, needle){
  if(!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

// 検索対象：name/kana/base/tags（肩書きは検索対象に含めない）
function buildIndex(item){
  const parts = [
    item.name,
    item.kana,
    item.base,
    ...(item.tags || []),
  ].map(normalize);
  return parts.join(" / ");
}

// 並び：基本は kana → なければ name、order があれば優先（手動並び）
function sortItems(items){
  const copy = [...items];
  copy.sort((a,b)=>{
    const ao = (a.order ?? 999999);
    const bo = (b.order ?? 999999);
    if(ao !== bo) return ao - bo;
    const ak = (a.kana || a.name || "");
    const bk = (b.kana || b.name || "");
    return ak.localeCompare(bk, "ja");
  });
  return copy;
}

function render(items){
  els.grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  for(const item of items){
    const a = document.createElement("a");
    a.className = "card";
    a.href = item.url || "#";
    a.target = "_blank";
    a.rel = "noopener";

    const thumb = document.createElement("div");
    thumb.className = "thumb";

    if(item.thumb){
      const img = document.createElement("img");
      img.src = item.thumb;
      img.alt = `${item.name} サムネイル`;
      img.loading = "lazy";
      thumb.appendChild(img);
    }else{
      const ph = document.createElement("div");
      ph.style.color = "rgba(17,17,17,.35)";
      ph.style.fontSize = "12px";
      ph.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
      ph.textContent = "no image";
      thumb.appendChild(ph);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const nameRow = document.createElement("div");
    nameRow.className = "name-row";

    const name = document.createElement("h2");
    name.className = "name";
    name.textContent = item.name || "noname";

    const base = document.createElement("span");
    base.className = "base";
    base.textContent = item.base || "";

    nameRow.appendChild(name);
    nameRow.appendChild(base);

    const roles = document.createElement("p");
    roles.className = "roles";
    roles.textContent = (item.role || []).join(" / ");

    const tags = document.createElement("div");
    tags.className = "tags";
    for(const t of (item.tags || []).slice(0, 6)){
      const s = document.createElement("span");
      s.className = "tag";
      s.textContent = t;
      tags.appendChild(s);
    }

    body.appendChild(nameRow);
    if((item.role || []).length) body.appendChild(roles);
    if((item.tags || []).length) body.appendChild(tags);

    a.appendChild(thumb);
    a.appendChild(body);
    frag.appendChild(a);
  }

  els.grid.appendChild(frag);
  els.count.textContent = `${items.length} 件`;
}

function apply(){
  const q = normalize(els.q.value);
  const base = els.base.value;
  const tag = els.tag.value;

  let items = DATA.filter(item=>{
    const idx = buildIndex(item);
    if(q && !includesLoose(idx, q)) return false;
    if(base && item.base !== base) return false;
    if(tag && !(item.tags || []).includes(tag)) return false;
    return true;
  });

  items = sortItems(items);
  render(items);
}

function wire(){
  els.q.addEventListener("input", apply);
  els.base.addEventListener("change", apply);
  els.tag.addEventListener("change", apply);

  els.reset.addEventListener("click", ()=>{
    els.q.value = "";
    els.base.value = "";
    els.tag.value = "";
    apply();
  });
}

async function init(){
  const res = await fetch("data/creators.json", { cache: "no-store" });
  DATA = await res.json();

  const bases = uniq(DATA.map(d=>d.base));
  const tags  = uniq(DATA.flatMap(d=>d.tags || []));

  optionize(els.base, bases, "すべての拠点");
  optionize(els.tag,  tags,  "すべてのTags");

  wire();
  apply();
}

init().catch(err=>{
  console.error(err);
  els.count.textContent = "読み込みに失敗しました（data/creators.json を確認してね）";
});
}

function includesLoose(haystack, needle){
  if(!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function buildIndex(item){
  const parts = [
    item.name,
    item.kana,
    item.base,
    ...(item.role || []),
    ...(item.tags || []),
  ].map(normalize);
  return parts.join(" / ");
}

function sortItems(items, mode){
  const copy = [...items];
  if(mode === "manual"){
    copy.sort((a,b)=>(a.order ?? 999999) - (b.order ?? 999999));
    return copy;
  }
  if(mode === "updated"){
    copy.sort((a,b)=>new Date(b.updated || 0) - new Date(a.updated || 0));
    return copy;
  }
  // kana
  copy.sort((a,b)=> (a.kana || a.name || "").localeCompare((b.kana || b.name || ""), "ja"));
  return copy;
}

function render(items){
  els.grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  for(const item of items){
    const a = document.createElement("a");
    a.className = "card";
    a.href = item.notionUrl || "#";
    a.target = "_blank";
    a.rel = "noopener";

    const thumb = document.createElement("div");
    thumb.className = "thumb";

    if(item.thumb){
      const img = document.createElement("img");
      img.src = item.thumb;
      img.alt = `${item.name} サムネイル`;
      img.loading = "lazy";
      thumb.appendChild(img);
    }else{
      const ph = document.createElement("div");
      ph.style.color = "rgba(255,255,255,.35)";
      ph.style.fontSize = "12px";
      ph.textContent = "no image";
      thumb.appendChild(ph);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const nameRow = document.createElement("div");
    nameRow.className = "name-row";

    const name = document.createElement("h2");
    name.className = "name";
    name.textContent = item.name || "noname";

    const base = document.createElement("span");
    base.className = "base";
    base.textContent = item.base || "";

    nameRow.appendChild(name);
    nameRow.appendChild(base);

    const roles = document.createElement("p");
    roles.className = "roles";
    roles.textContent = (item.role || []).join(" / ");

    const tags = document.createElement("div");
    tags.className = "tags";
    for(const t of (item.tags || []).slice(0, 6)){
      const s = document.createElement("span");
      s.className = "tag";
      s.textContent = t;
      tags.appendChild(s);
    }

    body.appendChild(nameRow);
    if((item.role || []).length) body.appendChild(roles);
    if((item.tags || []).length) body.appendChild(tags);

    a.appendChild(thumb);
    a.appendChild(body);
    frag.appendChild(a);
  }

  els.grid.appendChild(frag);
  els.count.textContent = `${items.length} 件`;
}

function apply(){
  const q = normalize(els.q.value);
  const base = els.base.value;
  const role = els.role.value;
  const tag = els.tag.value;
  const sort = els.sort.value;

  let items = DATA.filter(item=>{
    const idx = buildIndex(item);
    if(q && !includesLoose(idx, q)) return false;
    if(base && item.base !== base) return false;
    if(role && !(item.role || []).includes(role)) return false;
    if(tag && !(item.tags || []).includes(tag)) return false;
    return true;
  });

  items = sortItems(items, sort);
  render(items);
}

function wire(){
  ["input","change"].forEach(evt=>{
    els.q.addEventListener("input", apply);
    els.base.addEventListener("change", apply);
    els.role.addEventListener("change", apply);
    els.tag.addEventListener("change", apply);
    els.sort.addEventListener("change", apply);
  });

  els.reset.addEventListener("click", ()=>{
    els.q.value = "";
    els.base.value = "";
    els.role.value = "";
    els.tag.value = "";
    els.sort.value = "kana";
    apply();
  });
}

async function init(){
  const res = await fetch("data/creators.json", { cache: "no-store" });
  DATA = await res.json();

  const bases = uniq(DATA.map(d=>d.base));
  const roles = uniq(DATA.flatMap(d=>d.role || []));
  const tags  = uniq(DATA.flatMap(d=>d.tags || []));

  optionize(els.base, bases, "すべての拠点");
  optionize(els.role, roles, "すべての肩書き");
  optionize(els.tag,  tags,  "すべてのタグ");

  wire();
  apply();
}

init().catch(err=>{
  console.error(err);
  els.count.textContent = "読み込みに失敗しました（data/creators.json を確認してね）";
});
