(() => {
  const els = {
    q: document.querySelector("#q"),      // なくてもOKにする
    base: document.querySelector("#base"),
    tag: document.querySelector("#tag"),
    reset: document.querySelector("#reset"),
    grid: document.querySelector("#grid"),
    count: document.querySelector("#count"),
  };

  let DATA = [];
  const state = { q: "", base: "", tag: "" };

  function normalize(v) {
    return (v ?? "").toString().trim().toLowerCase();
  }

  function uniq(arr) {
    return [...new Set(arr.filter(Boolean))];
  }

  function optionize(selectEl, values, placeholder) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = placeholder;
    selectEl.appendChild(opt0);

    for (const v of values) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    }
  }

  function setCount(n) {
    if (els.count) els.count.textContent = `${n} 件`;
  }

  function safeText(v) {
    return (v ?? "").toString();
  }

  function cardHTML(item) {
    const name = safeText(item.name);
    const base = safeText(item.base);
    const roles = Array.isArray(item.role) ? item.role.join(" / ") : safeText(item.role);
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const href = item.notionUrl || "#";
    const thumb = (item.thumb || "").trim();

    const tagHtml = tags
      .map(t => `<span class="tag">${safeText(t)}</span>`)
      .join("");

    const thumbHtml = thumb
      ? `<img src="${thumb}" alt="${name} の写真" loading="lazy" decoding="async" />`
      : `<span class="muted" style="font-family:var(--mono);font-size:12px;opacity:.6;">no image</span>`;

    return `
      <a class="card" href="${href}" target="_blank" rel="noopener">
        <div class="thumb">${thumbHtml}</div>
        <div class="card-body">
          <div class="name-row">
            <h3 class="name">${name}</h3>
            <span class="base">${base}</span>
          </div>
          <p class="roles">${roles}</p>
          <div class="tags">${tagHtml}</div>
        </div>
      </a>
    `.trim();
  }

  function matches(item, q) {
    if (!q) return true;

    const hay = [
      item.name,
      item.kana,
      item.base,
      ...(Array.isArray(item.role) ? item.role : []),
      ...(Array.isArray(item.tags) ? item.tags : []),
    ]
      .map(normalize)
      .join(" ");

    return hay.includes(q);
  }

  function getFiltered() {
    const q = state.q;
    const base = state.base;
    const tag = state.tag;

    return DATA
      .filter(d => !base || d.base === base)
      .filter(d => !tag || (Array.isArray(d.tags) && d.tags.includes(tag)))
      .filter(d => matches(d, q))
      .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
  }

  function render() {
    const list = getFiltered();
    if (els.grid) els.grid.innerHTML = list.map(cardHTML).join("");
    setCount(list.length);
  }

  function bindUI() {
    // q は存在するときだけ有効
    if (els.q) {
      els.q.addEventListener("input", () => {
        state.q = normalize(els.q.value);
        render();
      });
    }

    if (els.base) {
      els.base.addEventListener("change", () => {
        state.base = els.base.value || "";
        render();
      });
    }

    if (els.tag) {
      els.tag.addEventListener("change", () => {
        state.tag = els.tag.value || "";
        render();
      });
    }

    if (els.reset) {
      els.reset.addEventListener("click", () => {
        state.q = "";
        state.base = "";
        state.tag = "";
        if (els.q) els.q.value = "";
        if (els.base) els.base.value = "";
        if (els.tag) els.tag.value = "";
        render();
      });
    }
  }

  async function init() {
    try {
      bindUI();

      const res = await fetch("./data/creators.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("creators.json must be an array");

      DATA = json;

      // options
      const bases = uniq(DATA.map(d => d.base)).sort((a, b) => a.localeCompare(b, "ja"));
      const tags = uniq(DATA.flatMap(d => (Array.isArray(d.tags) ? d.tags : []))).sort((a, b) =>
        a.localeCompare(b, "ja")
      );

      optionize(els.base, bases, "すべての拠点");
      optionize(els.tag, tags, "すべてのTags");

      render();
    } catch (e) {
      console.error(e);
      if (els.grid) {
        els.grid.innerHTML =
          `<p class="muted" style="padding:16px 0;">読み込みに失敗しました（data/creators.json を確認してね）</p>`;
      }
      setCount(0);
    }
  }

  init();
})();

