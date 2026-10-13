/* Catalogue statique et expérience de lecture - données stockées localement. */
(function () {
  "use strict";
  var BASE="/tutos-informatique/";
  var n=function(tag,cl,text){var e=document.createElement(tag);if(cl)e.className=cl;if(text!==undefined)e.textContent=text;return e;};
  var get=function(k){try{return localStorage.getItem(k);}catch(_){return null;}};
  var put=function(k,v){try{localStorage.setItem(k,v);}catch(_){}};
  function date(s){if(!s)return "Non renseignée";var d=new Date(s);return isNaN(d.getTime())?"Non renseignée":d.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});}
  function kind(item){
    var now=Date.now(),windowMs=14*86400000,p=Date.parse(item.published_at),u=Date.parse(item.updated_at);
    if(!isNaN(p)&&now>=p&&now-p<windowMs)return "Nouvelle procédure";
    if(!isNaN(u)&&!isNaN(p)&&now>=u&&now-u<windowMs&&u-p>3600000)return "Procédure mise à jour";
    return "";
  }
  function seenKey(item){return "kb-seen-"+item.id+"-"+item.updated_at;}
  function card(item){
    var a=n("a","kb-publication"),label=n("span","kb-publication-label",item.domain+" · "+item.level);
    a.href=BASE+item.url;a.appendChild(label);a.appendChild(n("strong","",item.title));
    a.appendChild(n("span","kb-publication-description",item.description));
    a.appendChild(n("small","",date(item.updated_at||item.published_at)+" · "+item.minutes+" min de lecture"));return a;
  }
  function news(items) {
    var host=document.querySelector("[data-kb-home-news]"),recent=items.filter(function(i){return !!kind(i);});
    var latest=document.querySelector("[data-kb-latest]");
    if(latest){latest.replaceChildren();items.slice(0,5).forEach(function(i){latest.appendChild(card(i));});if(!items.length)latest.appendChild(n("p","","Aucune procédure."));}
    var unseen=recent.filter(function(i){return !get(seenKey(i));});
    if(host&&unseen.length){
      host.replaceChildren();
      var panel=n("section","kb-news"),body=n("div","kb-news-text");
      body.appendChild(n("strong","",unseen.length+" nouveauté(s) disponibles"));
      body.appendChild(n("p","",kind(unseen[0])+" : "+unseen[0].title));
      var view=n("a","kb-news-link","Lire →");view.href=BASE+unseen[0].url;
      var close=n("button","kb-news-close","Masquer");close.type="button";close.addEventListener("click",function(){unseen.forEach(function(i){put(seenKey(i),"1");});panel.remove();});
      panel.appendChild(body);panel.appendChild(view);panel.appendChild(close);host.appendChild(panel);
    }
    if(!recent.length)return;
    var head=document.querySelector(".md-header__inner");if(!head||document.querySelector(".kb-bell-wrap"))return;
    var wrap=n("div","kb-bell-wrap"),button=n("button","kb-bell","Nouveautés ");
    var badge=n("span","kb-bell-count",String(unseen.length));button.appendChild(badge);button.type="button";
    button.setAttribute("aria-label","Afficher les dernières publications");button.setAttribute("aria-expanded","false");
    var menu=n("div","kb-bell-menu");menu.hidden=true;menu.appendChild(n("strong","","Dernières publications"));
    recent.slice(0,5).forEach(function(i){var a=n("a","",kind(i)+" — "+i.title);a.href=BASE+i.url;menu.appendChild(a);});
    button.addEventListener("click",function(){menu.hidden=!menu.hidden;button.setAttribute("aria-expanded",String(!menu.hidden));});
    document.addEventListener("click",function(e){if(!wrap.contains(e.target)){menu.hidden=true;button.setAttribute("aria-expanded","false");}});
    wrap.appendChild(button);wrap.appendChild(menu);head.appendChild(wrap);
  }
  function directory(items) {
    var root=document.querySelector("[data-kb-directory]");if(!root)return;
    root.replaceChildren();
    var form=n("div","kb-filter-grid"),query=n("input",""),queryLabel=n("label","kb-field","Rechercher");
    query.type="search";query.placeholder="Ex. DNS, PXE, sauvegarde";queryLabel.appendChild(query);form.appendChild(queryLabel);
    var names={domain:"Domaine",os:"Système",level:"Niveau",type:"Type"};
    var selects=Object.keys(names).map(function(prop){
      var label=n("label","kb-field",names[prop]),s=n("select","");
      s.dataset.prop=prop;s.appendChild(new Option("Tous",""));
      Array.from(new Set(items.map(function(i){return i[prop];}).filter(Boolean))).sort().forEach(function(value){s.appendChild(new Option(value,value));});
      label.appendChild(s);form.appendChild(label);return s;
    });
    var info=n("p","kb-results-summary"),results=n("div","kb-directory-results");
    root.appendChild(form);root.appendChild(info);root.appendChild(results);
    var params=new URLSearchParams(location.search);if(params.has("q"))query.value=params.get("q");
    function norm(t){return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
    function render(){
      var value=norm(query.value.trim());
      var matching=items.filter(function(i){return (!value||norm([i.title,i.description,i.domain,i.os].join(" ")).includes(value))&&selects.every(function(s){return !s.value||i[s.dataset.prop]===s.value;});});
      info.textContent=matching.length+" procédure(s) trouvée(s)";results.replaceChildren();
      matching.forEach(function(i){results.appendChild(card(i));});if(!matching.length)results.appendChild(n("p","","Aucun résultat."));
    }
    query.addEventListener("input",render);selects.forEach(function(s){s.addEventListener("change",render);});render();
  }
  function guide(items){
    var current=items.find(function(i){return BASE+i.url===location.pathname;});
    if(!current)return;
    put(seenKey(current),"1");
    var article=document.querySelector(".md-content__inner.md-typeset")||document.querySelector(".md-content__inner");if(!article)return;
    var box=n("section","kb-guide-panel"),meta=n("div","kb-guide-meta");
    var statuses={non_teste:"Non testé en laboratoire",relecture_documentaire:"Relecture documentaire",valide_laboratoire:"Testé en laboratoire",non_renseigne:"Non renseigné"};
    [current.domain,current.os,"Niveau : "+current.level,"Versions : "+(current.versions||"non renseignées"),
     "Statut : "+(statuses[current.validation]||"Non renseigné"),
     "Dernière vérification : "+date(current.verified_at),"Lecture estimée : "+current.minutes+" min"].forEach(function(t){meta.appendChild(n("span","",t));});
    box.appendChild(meta);
    var headings=Array.from(article.querySelectorAll("h2")).slice(0,20);
    if(headings.length>=2){
      box.appendChild(n("strong","kb-step-title","Progression de la procédure"));
      box.appendChild(n("p","kb-step-note","Cochez les sections terminées. La progression est conservée sur cet appareil."));
      var meter=n("progress","kb-step-progress");meter.max=headings.length;
      var count=n("span","kb-step-count"),line=n("div","kb-progress-line"),list=n("div","kb-step-list");
      line.appendChild(meter);line.appendChild(count);box.appendChild(line);
      var key="kb-steps-"+current.id,done=[];try{done=JSON.parse(get(key)||"[]");if(!Array.isArray(done))done=[];}catch(_){done=[];}
      var checks=[];
      function update(){var checked=checks.filter(function(c){return c.checked;}).map(function(c){return c.value;});meter.value=checked.length;count.textContent=checked.length+"/"+checks.length+" sections";put(key,JSON.stringify(checked));}
      headings.forEach(function(h,index){
        var label=n("label","kb-step-item"),checkbox=n("input","");
        checkbox.type="checkbox";checkbox.value=h.id||String(index);checkbox.checked=done.includes(checkbox.value);
        checkbox.addEventListener("change",update);label.appendChild(checkbox);
        var anchor=n("a","",h.textContent.replace(/\s+¶/,"").trim());anchor.href="#"+h.id;
        label.appendChild(anchor);list.appendChild(label);checks.push(checkbox);
      });
      box.appendChild(list);
      var reset=n("button","kb-text-button","Réinitialiser");reset.type="button";reset.addEventListener("click",function(){checks.forEach(function(c){c.checked=false;});update();});
      box.appendChild(reset);update();
    }
    var print=n("button","kb-print","Imprimer / enregistrer au format PDF");print.type="button";print.addEventListener("click",function(){window.print();});box.appendChild(print);
    var mainTitle=article.querySelector("h1");if(mainTitle&&mainTitle.nextSibling)mainTitle.parentNode.insertBefore(box,mainTitle.nextSibling);else article.prepend(box);
    var bar=n("div","kb-reading-bar"),fill=n("span","kb-reading-fill");bar.setAttribute("role","progressbar");
    bar.setAttribute("aria-valuemin","0");bar.setAttribute("aria-valuemax","100");bar.setAttribute("aria-label","Progression de lecture");bar.appendChild(fill);document.body.appendChild(bar);
    function updateBar(){var max=document.documentElement.scrollHeight-innerHeight;var pct=max>0?Math.max(0,Math.min(100,Math.round(scrollY/max*100))):100;fill.style.width=pct+"%";bar.setAttribute("aria-valuenow",String(pct));}
    addEventListener("scroll",updateBar,{passive:true});addEventListener("resize",updateBar);updateBar();
  }
  function init(){
    fetch(BASE+"data/procedures.json",{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("catalogue indisponible");return r.json();})
      .then(function(d){var items=d.procedures||[];news(items);directory(items);guide(items);})
      .catch(function(){var r=document.querySelector("[data-kb-directory]");if(r)r.textContent="Impossible de charger le catalogue.";});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
