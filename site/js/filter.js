
(function(){
  const q = (s,el=document)=>el.querySelector(s);
  const qa = (s,el=document)=>[...el.querySelectorAll(s)];
  const theme = q('#f-theme'), scene=q('#f-scene'), country=q('#f-country'), payer=q('#f-payer'), depth=q('#f-depth'), search=q('#f-search');
  if(!theme) return;
  function apply(){
    const t=theme.value, sc=scene.value, c=country.value, p=payer.value, d=depth.value, s=(search.value||'').toLowerCase();
    qa('tbody tr').forEach(tr=>{
      const ok =
        (!t || tr.dataset.themes.includes(t)) &&
        (!sc || tr.dataset.scene===sc) &&
        (!c || tr.dataset.country===c) &&
        (!p || (tr.dataset.payer||'').toLowerCase().includes(p.toLowerCase())) &&
        (!d || tr.dataset.depth===d) &&
        (!s || tr.dataset.search.includes(s));
      tr.style.display = ok ? '' : 'none';
    });
  }
  [theme,scene,country,payer,depth,search].forEach(el=>el && el.addEventListener('input', apply));
})();
