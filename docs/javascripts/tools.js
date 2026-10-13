/* Diagnostics et schémas explicatifs : aucun appel au réseau cible. */
(function(){
  "use strict";
  function e(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n;}
  var cases={
    pxe:{title:"Le poste PXE ne démarre pas",start:"ip",steps:{
      ip:{question:"Le poste reçoit-il une adresse IP du serveur DHCP ?",hint:"Contrôler la liaison, le VLAN et le bail DHCP.",choices:[["Non","noip"],["Oui","menu"]]},
      noip:{result:"Vérifier la liaison et le serveur DHCP.",checks:["Vérifier la carte Ethernet, le VLAN et les baux du DHCP existant.","Contrôler que le DHCP est joignable sur le réseau du client.","Ne pas installer un deuxième serveur DHCP d'adressage sans validation."]},
      menu:{question:"Un chargeur iPXE ou le menu FOG apparaît-il ?",hint:"L'adresse IP ne garantit pas le téléchargement du chargeur.",choices:[["Non","tftp"],["Oui","fog"]]},
      tftp:{result:"Vérifier ProxyDHCP et TFTP.",checks:["Lire les journaux : sudo journalctl -u dnsmasq -n 100 --no-pager","Contrôler le chargeur BIOS/UEFI réellement présent dans /tftpboot.","Contrôler la connectivité TFTP UDP/69 et le pare-feu."]},
      fog:{result:"Examiner la tâche FOG et les services de stockage.",checks:["Vérifier l'accès à l'interface web FOG.","Vérifier l'inventaire, l'association d'image et la tâche planifiée.","Contrôler les journaux FOG, les services de stockage et l'espace disponible."]}
    }},
    dns:{title:"Le DNS ne répond pas",start:"config",steps:{
      config:{question:"Le poste utilise-t-il les serveurs DNS attendus ?",hint:"Windows : ipconfig /all ou Get-DnsClientServerAddress.",choices:[["Non","address"],["Oui","names"]]},
      address:{result:"Corriger la configuration DNS du client.",checks:["Vérifier l'option DNS du DHCP et les adresses statiques.","En domaine Active Directory, utiliser les DNS adaptés au domaine.","Retester la résolution après correction autorisée."]},
      names:{question:"La panne concerne-t-elle uniquement les noms internes ?",hint:"Comparer une résolution publique et une résolution interne.",choices:[["Oui","internal"],["Non","external"]]},
      internal:{result:"Vérifier la zone DNS du domaine.",checks:["Tester Resolve-DnsName _ldap._tcp.dc._msdcs.domaine.exemple -Type SRV (adapter le domaine).","Contrôler les enregistrements A et SRV et la réplication AD.","Comparer la réponse de plusieurs DNS du domaine."]},
      external:{result:"Vérifier la connectivité et le résolveur.",checks:["Tester Resolve-DnsName example.com -Server ADRESSE_DNS.","Examiner le pare-feu UDP/TCP 53 et le service DNS.","Contrôler la configuration des redirecteurs et les journaux serveur."]}
    }},
    gpo:{title:"Une GPO ne s'applique pas",start:"ou",steps:{
      ou:{question:"La machine ou l'utilisateur appartient-il à l'OU ciblée ?",hint:"Consulter les liens et l'état de la GPO dans GPMC.",choices:[["Non / incertain","scope"],["Oui","gpresult"]]},
      scope:{result:"Contrôler le ciblage de la GPO.",checks:["Contrôler le lien de GPO, l'OU et l'héritage.","Vérifier le filtrage de sécurité et les autorisations Appliquer la stratégie de groupe.","Contrôler les filtres WMI éventuels."]},
      gpresult:{question:"La GPO apparaît-elle dans gpresult ?",hint:"Utiliser gpresult /r ou gpresult /h rapport.html dans le contexte requis.",choices:[["Non","excluded"],["Oui","processing"]]},
      excluded:{result:"Analyser les stratégies exclues.",checks:["Lire le rapport gpresult /h rapport.html.","Vérifier les filtres, le ciblage, SYSVOL et la connectivité domaine.","Examiner Microsoft-Windows-GroupPolicy/Operational."]},
      processing:{result:"Analyser le traitement et les paramètres.",checks:["Vérifier la portée Utilisateur / Ordinateur.","Contrôler les priorités, paramètres contradictoires et préférences.","Examiner le journal GroupPolicy/Operational avant toute modification."]}
    }}
  };
  function initAssistant(root){
    root.replaceChildren();var chooser=e("div","kb-tool-options"),stage=e("div","kb-tool-stage");
    root.appendChild(chooser);root.appendChild(stage);
    function select(){
      chooser.hidden=false;chooser.replaceChildren();stage.replaceChildren();
      chooser.appendChild(e("p","","Sélectionner le problème :"));
      Object.keys(cases).forEach(function(id){var b=e("button","kb-option",cases[id].title);b.type="button";b.onclick=function(){chooser.hidden=true;show(id,cases[id].start);};chooser.appendChild(b);});
    }
    function show(id,part){
      var s=cases[id].steps[part];stage.replaceChildren();stage.appendChild(e("h2","",cases[id].title));
      if(s.question)stage.appendChild(e("h3","",s.question));
      if(s.hint)stage.appendChild(e("p","kb-note",s.hint));
      if(s.choices)s.choices.forEach(function(c){var b=e("button","kb-option",c[0]);b.type="button";b.onclick=function(){show(id,c[1]);};stage.appendChild(b);});
      if(s.result){
        stage.appendChild(e("h3","",s.result));var ul=e("ul","");
        s.checks.forEach(function(t){ul.appendChild(e("li","",t));});stage.appendChild(ul);
        stage.appendChild(e("p","kb-note","Diagnostic indicatif, à confirmer sur l'infrastructure autorisée."));
        var retry=e("button","kb-option","Recommencer");retry.type="button";retry.onclick=function(){show(id,cases[id].start);};stage.appendChild(retry);
      }
      var back=e("button","kb-text-button","Choisir un autre diagnostic");back.type="button";back.onclick=select;stage.appendChild(back);
    }
    select();
  }
  var graphs={
    dhcp:{title:"DHCP : obtenir une configuration IP",nodes:[
      ["Client","Envoie DHCPDISCOVER pour découvrir un serveur DHCP."],
      ["DHCP","Répond par DHCPOFFER avec une proposition de bail."],
      ["Client","Émet DHCPREQUEST pour demander l'offre retenue."],
      ["DHCP","Confirme le bail avec DHCPACK et les paramètres prévus."]]},
    dns:{title:"DNS : résoudre un nom",nodes:[
      ["Application","Demande une adresse à partir d'un nom."],
      ["Résolveur","Examine son cache ou interroge la hiérarchie DNS."],
      ["Serveur autoritaire","Retourne un enregistrement relevant de sa zone."],
      ["Application","Utilise ensuite l'adresse pour établir sa connexion."]]},
    pxe:{title:"PXE : amorcer le réseau",nodes:[
      ["Client BIOS/UEFI","Démarre par son interface réseau."],
      ["DHCP et ProxyDHCP","DHCP attribue l'adresse, ProxyDHCP peut désigner le chargeur."],
      ["TFTP","Transfère le chargeur adapté au firmware."],
      ["Serveur FOG","Fournit le menu iPXE et les informations de tâche via le web."],
      ["Stockage","Participe à la capture ou à la restauration selon la tâche."]]},
    ad:{title:"Active Directory : utiliser le domaine",nodes:[
      ["Poste","Recherche les services de domaine."],
      ["DNS AD","Indique les contrôleurs via ses enregistrements SRV."],
      ["Contrôleur","Gère les opérations d'authentification, notamment Kerberos."],
      ["SYSVOL / GPO","Fournit les fichiers et paramètres des stratégies selon le périmètre."]]},
    vlan:{title:"VLAN : segmenter",nodes:[
      ["VLAN 10","Domaine de diffusion logique du premier réseau."],
      ["Commutateur","Associe les ports d'accès aux VLAN et transporte les VLAN autorisés."],
      ["Équipement L3","Route éventuellement entre VLAN selon les règles définies."],
      ["VLAN 20","Second domaine de diffusion, distinct du premier."]]}
  };
  function initGraphs(root){
    root.replaceChildren();var tabs=e("div","kb-tool-tabs"),title=e("h2",""),nodes=e("div","kb-flow-nodes"),detail=e("div","kb-flow-detail");
    detail.setAttribute("aria-live","polite");root.appendChild(tabs);root.appendChild(title);root.appendChild(nodes);root.appendChild(detail);
    function show(id){
      var graph=graphs[id];title.textContent=graph.title;nodes.replaceChildren();
      Array.from(tabs.children).forEach(function(t){t.setAttribute("aria-pressed",String(t.dataset.id===id));});
      graph.nodes.forEach(function(item){
        var b=e("button","kb-flow-node",item[0]);b.type="button";
        b.onclick=function(){detail.replaceChildren();detail.appendChild(e("strong","",item[0]));detail.appendChild(e("p","",item[1]));Array.from(nodes.children).forEach(function(t){t.setAttribute("aria-pressed",String(t===b));});};
        nodes.appendChild(b);
      });
      if(nodes.firstChild)nodes.firstChild.click();
    }
    Object.keys(graphs).forEach(function(id){var b=e("button","kb-option",id.toUpperCase());b.type="button";b.dataset.id=id;b.onclick=function(){show(id);};tabs.appendChild(b);});
    show("pxe");
  }
  function start(){var a=document.querySelector("[data-kb-assistant]"),g=document.querySelector("[data-kb-diagrams]");if(a)initAssistant(a);if(g)initGraphs(g);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
