// ---------- WHO groeireferentie (meisjes, 0–12 mnd) — bij benadering ----------
// Uit getraind geheugen, geen live opzoeking; controleer bij twijfel de officiële
// WHO-tabellen of het consultatiebureau-boekje. P3/P97 hier gebruikt als grove
// onder-/bovengrens, niet als klinische afkapwaarde.
export const WEIGHT_REF_KG = [
  [2.4, 3.2, 4.2], [3.2, 4.2, 5.5], [3.9, 5.1, 6.6], [4.5, 5.8, 7.5],
  [5.0, 6.4, 8.2], [5.4, 6.9, 8.8], [5.7, 7.3, 9.3], [6.0, 7.6, 9.8],
  [6.3, 7.9, 10.2], [6.5, 8.2, 10.5], [6.7, 8.5, 10.9], [6.9, 8.7, 11.2],
  [7.0, 8.9, 11.5],
];
export const LENGTH_REF_CM = [
  [45.4, 49.1, 52.9], [49.8, 53.7, 57.6], [53.0, 57.1, 61.1], [55.6, 59.8, 64.0],
  [57.8, 62.1, 66.4], [59.6, 64.0, 68.5], [61.2, 65.7, 70.3], [62.7, 67.3, 71.9],
  [64.0, 68.7, 73.5], [65.3, 70.1, 74.9], [66.5, 71.5, 76.3], [67.7, 72.8, 77.6],
  [68.9, 74.0, 78.9],
];
export const WEEKS_PER_MONTH = 52 / 12;

export function refAtWeek(week, refTable) {
  const monthPos = week / WEEKS_PER_MONTH;
  const m0 = Math.max(0, Math.min(12, Math.floor(monthPos)));
  const m1 = Math.max(0, Math.min(12, Math.ceil(monthPos)));
  const t = monthPos - m0;
  const lerp = (a, b) => a + (b - a) * t;
  const [lo0, mid0, hi0] = refTable[m0];
  const [lo1, mid1, hi1] = refTable[m1];
  return { low: lerp(lo0, lo1), mid: lerp(mid0, mid1), high: lerp(hi0, hi1) };
}

export function buildChartData(weeks, refTable, entries, valueKey) {
  const measured = entries
    .filter(e => e[valueKey] != null)
    .map(e => ({ week: e.week, value: Number(e[valueKey]) }))
    .sort((a, b) => a.week - b.week);

  // Interpoleer tussen opgeslagen metingen zodat de lijn doorloopt in plaats van
  // losse puntjes te tonen. Buiten het bereik van de metingen blijft de lijn leeg
  // (we verzinnen geen waarden vóór de eerste of ná de laatste meting).
  function measuredAtWeek(w) {
    if (measured.length === 0) return null;
    if (w < measured[0].week || w > measured[measured.length - 1].week) return null;
    const exact = measured.find(m => m.week === w);
    if (exact) return exact.value;
    let prev = measured[0];
    let next = measured[measured.length - 1];
    for (let i = 0; i < measured.length - 1; i++) {
      if (measured[i].week <= w && measured[i + 1].week >= w) {
        prev = measured[i];
        next = measured[i + 1];
        break;
      }
    }
    if (next.week === prev.week) return prev.value;
    const t = (w - prev.week) / (next.week - prev.week);
    return Math.round((prev.value + (next.value - prev.value) * t) * 100) / 100;
  }

  const measuredWeeks = new Set(measured.map(m => m.week));
  const out = [];
  for (let w = 0; w <= weeks; w++) {
    const ref = refAtWeek(w, refTable);
    out.push({
      week: w,
      onder: Math.round(ref.low * 100) / 100,
      gemiddeld: Math.round(ref.mid * 100) / 100,
      boven: Math.round(ref.high * 100) / 100,
      gemeten: measuredAtWeek(w),
      isMeetpunt: measuredWeeks.has(w),
    });
  }
  return out;
}

// Tekst-templates gebruiken {kind}, {sibling} en {partner} — vervang deze bij
// weergave met renderText(). {sibling} valt weg (samen met de zin) als er geen
// broer/zus in het gezin zit; zie Tracker.jsx.
const STAGES = [
  { start: 0, end: 1, month: 0, label: "Week 0–1", facts: [
    "Went aan licht, geluid en aanraking buiten de buik.",
    "Slaapt 16–17 uur per dag, in korte blokjes.",
    "Ziet scherp op zo'n 20–30 cm — precies de afstand tot een gezicht tijdens voeding.",
  ], tips: [
    "Huid-op-huidcontact helpt bij hechting en temperatuurregulatie — doe dit veel, ook als vader.",
    "Verdeel nachten in shiften met {partner} als dat kan; twee halfuitgeruste ouders redden het langer dan één uitgeputte.",
    "Bezoek beperken in de eerste week is geen onvriendelijkheid — het is ruimte nemen om te wennen.",
  ]},
  { start: 2, end: 4, month: 1, label: "Week 2–4", facts: [
    "Herkent de stem van jou en {partner} al van tijdens de zwangerschap.",
    "Reflexen (zoek-, grijp-, moro-reflex) zijn actief.",
    "Eerste voorzichtige mondbewegingen die op een glimlach lijken.",
  ], tips: [
    "Praat en zing veel, ook als er nog geen reactie lijkt te zijn — het bouwt taalherkenning op.",
    "Baken een vast rustmoment voor jezelf in, al is het 10 minuten; dit is een fase van overleven, niet van perfectie.",
    "Let bij {partner} op signalen van overbelasting of somberheid — de kraamperiode is zwaar, ook mentaal.",
  ]},
  { start: 5, end: 8, month: 2, label: "Week 5–8", facts: [
    "Eerste echte sociale glimlach — reageert bewust op een gezicht.",
    "Volgt langzaam bewegende voorwerpen met de ogen.",
    "Begint te 'koeren': korte klinkergeluidjes.",
  ], tips: [
    "Reageer op elk geluidje of glimlachje — dit is de eerste 'conversatie' en bouwt vertrouwen op.",
    "Begin (indien gewenst) met een voorzichtig dag-nachtritme: overdag licht en actief, 's avonds rustig en gedimd.",
    "Verdeel taken expliciet met {partner} — spreek hardop uit wie wat doet, in plaats van ervan uit te gaan.",
  ]},
  { start: 9, end: 12, month: 3, label: "Week 9–12", facts: [
    "Houdt het hoofdje steviger op tijdens buikligging.",
    "Grijpreflex wordt bewuster grijpen naar speelgoed.",
    "Dieptezicht en kleurwaarneming worden scherper.",
  ], tips: [
    "Dagelijks even buikligging (tummy time) stimuleert nek- en rugspieren — kort en vaak werkt beter dan lang en zelden.",
    "De zogeheten '3-maanden-huil' kan pieken; als huilen niet te troosten is, is dat geen falen van jullie kant.",
    "Plan als ouders weer een moment samen in, al is het kort — de relatie verdient ook aandacht naast de baby.",
  ]},
  { start: 13, end: 16, month: 4, label: "Week 13–16", facts: [
    "Rolt mogelijk voor het eerst van buik naar rug.",
    "Lacht hardop en brengt handjes samen boven de borst.",
    "Speeksel neemt toe — vroege voorbode van tandjes.",
  ], tips: [
    "Nu {kind_subj} kan rollen: nooit meer onbewaakt op het verschoontafel of de bank laten liggen.",
    "Vaste terugkerende rituelen (bad, boekje, liedje) helpen nu al met voorspelbaarheid, ook al lijkt {kind_subj} nog klein.",
    "Kwijlspeeltjes of een koud washandje kunnen verlichten als de tandjes al gaan spelen.",
  ]},
  { start: 17, end: 20, month: 5, label: "Week 17–20", facts: [
    "Grijpt gericht naar speelgoed en brengt het naar de mond.",
    "Brabbelt met klinkercombinaties.",
    "Kan met wat steun even rechtop zitten.",
  ], tips: [
    "Alles wat binnen bereik komt gaat nu in de mond — check speelgoed en omgeving op kleine onderdelen.",
    "Reageer benoemend op wat {kind_subj} doet ('jij pakt het blokje!') — dit voedt taalontwikkeling voordat er woorden zijn.",
    "Als {sibling} erbij is: betrek {sib_obj} actief ('help jij {kind} {kind_poss} speeltje pakken?') om jaloezie te verzachten.",
  ]},
  { start: 21, end: 24, month: 6, label: "Week 21–24", facts: [
    "Vaak het moment om te starten met bijvoeding.",
    "Rolt nu beide kanten op.",
    "Reageert herkenbaar op de eigen naam.",
  ], tips: [
    "Begin bijvoeding rustig met één nieuw voedingsmiddel per keer, zodat allergische reacties herkenbaar blijven.",
    "Volg {kind_poss} signalen van honger en verzadiging, niet alleen de klok.",
    "Blijf {kind_obj} aanraken en dragen ook nu {kind_subj} mobieler wordt — fysiek contact blijft een basisbehoefte, geen 'verwennerij'.",
  ]},
  { start: 25, end: 28, month: 7, label: "Week 25–28", facts: [
    "Zit zonder steun rechtop.",
    "Brabbelt medeklinkers: 'bababa', 'dadada'.",
    "Objectpermanentie ontwikkelt — snapt dat iets nog bestaat als het uit zicht is.",
  ], tips: [
    "Kiekeboe-spelletjes sluiten precies aan bij wat {kind_subj} nu leert over objectpermanentie — leuk én leerzaam.",
    "Vreemdelingenangst kan nu opkomen; forceer geen contact met minder bekende mensen, geef {kind_obj} de tijd.",
    "Baby-proof waar {kind_subj} straks gaat kruipen: stopcontacten, snoeren, kleine voorwerpen.",
  ]},
  { start: 29, end: 32, month: 8, label: "Week 29–32", facts: [
    "Kruipt of schuifelt op de billen.",
    "Trekt zich mogelijk op tot staan, met steun.",
    "Pincetgreep (duim + wijsvinger) ontwikkelt zich.",
  ], tips: [
    "Geef ruimte om te oefenen met kruipen en optrekken, ook als dat af en toe een bonkje betekent.",
    "Vingerhapjes (zacht, in reepjes) sluiten mooi aan bij de opkomende pincetgreep.",
    "Consequent zijn met een 'nee' bij gevaar werkt beter dan veel woorden — herhaling is normaal en nodig op deze leeftijd.",
  ]},
  { start: 33, end: 36, month: 9, label: "Week 33–36", facts: [
    "Trekt zichzelf overal aan op om te gaan staan.",
    "Zwaait vaarwel en klapt in de handjes.",
    "Zoekt actief naar verstopt speelgoed onder een doek.",
  ], tips: [
    "Zet meubels vast (kantelbeveiliging) nu {kind_subj} overal aan optrekt.",
    "Vier kleine successen zichtbaar (klappen, juichen) — {kind_subj} leest jullie reactie als bevestiging.",
    "Blijf voorspelbare routines aanhouden rond eten en slapen; dit is een leeftijd waarin structuur veel oplevert.",
  ]},
  { start: 37, end: 40, month: 10, label: "Week 37–40", facts: [
    "Kruipt vlot en 'cruiset' langs de bank.",
    "Zegt mogelijk bewust 'mama' of 'papa'.",
    "Begrijpt simpele woorden als 'nee' en 'kijk'.",
  ], tips: [
    "Benoem gevoelens hardop ('je bent moe, hè') — dit legt de basis voor emotieherkenning later.",
    "Laat {kind_obj} zoveel mogelijk zelf proberen (lepel vasthouden, opstaan) ook als het rommelig of traag is.",
    "Plan gezamenlijke momenten met {sibling} waarin {sib_subj} 'grote broer of zus' mag zijn, zoals samen een boekje lezen.",
  ]},
  { start: 41, end: 44, month: 11, label: "Week 41–44", facts: [
    "Staat af en toe los, zonder steun.",
    "Doet eerste dansbewegingen op muziek.",
    "Volgt eenvoudige opdrachten zoals 'geef eens'.",
  ], tips: [
    "Ruim scherpe hoeken en instabiele objecten op — vallen hoort bij leren lopen, maar maak het zo veilig mogelijk.",
    "Herhaling van simpele opdrachten in spelvorm ('geef papa de bal') versterkt begrip zonder dat het als les voelt.",
    "Blijf zelf rustig bij frustratiehuilen — {kind_subj} leent nu al jullie manier van omgaan met tegenslag.",
  ]},
  { start: 45, end: 48, month: 12, label: "Week 45–48", facts: [
    "Zet mogelijk de allereerste zelfstandige stapjes.",
    "Zegt een handjevol herkenbare woordjes.",
    "Imiteert dagelijkse handelingen, zoals bellen of eten geven.",
  ], tips: [
    "Geef ruimte voor 'gevaarlijk' spel binnen veilige grenzen (klimmen, vallen, opstaan) — dit bouwt zelfvertrouwen op.",
    "Imitatiespel (samen 'koken', poppen voeren) stimuleert taal en sociale ontwikkeling tegelijk.",
    "Vergelijk niet te veel met ontwikkelingslijstjes of met {sibling} op die leeftijd — de spreiding tussen kinderen is groot en normaal.",
  ]},
  { start: 49, end: 52, month: 12, label: "Week 49–52 · 1e verjaardag", facts: [
    "Het eerste jaar zit erop — een compleet nieuw mensje erbij.",
    "Ontwikkeling verschilt sterk per kind; dit zijn richtlijnen, geen norm.",
    "Tijd om terug te kijken op 52 weken groei.",
  ], tips: [
    "Neem een moment om als ouders terug te kijken op het jaar — wat werkte, wat zouden jullie anders doen.",
    "Bij zorgen over ontwikkeling: het consultatiebureau (JGZ) is er precies voor dit soort vragen, gebruik het gerust.",
    "Blijf routines rond slapen en eten aanhouden bij de overgang naar peuterfase — die verandert nu geleidelijk.",
  ]},
];

export { STAGES };

// ---------- Voornaamwoorden op basis van geslacht ----------
// gender: "jongen" | "meisje" | null/anders (dan neutraal "die"/"diens")
export function getPronouns(gender) {
  if (gender === "jongen") return { subj: "hij", obj: "hem", poss: "zijn" };
  if (gender === "meisje") return { subj: "zij", obj: "haar", poss: "haar" };
  return { subj: "die", obj: "die", poss: "diens" };
}

// ---------- Mijlpalen: "eerste keertjes" om af te vinken ----------
export const MILESTONES = [
  { key: "glimlach", label: "Eerste (bewuste) glimlach" },
  { key: "hardop_lachen", label: "Eerste keer hardop lachen" },
  { key: "omrollen_bn", label: "Eerste keer omrollen (buik naar rug)" },
  { key: "omrollen_nb", label: "Eerste keer omrollen (rug naar buik)" },
  { key: "zelfstandig_zitten", label: "Eerste keer zelfstandig zitten" },
  { key: "eerste_tandje", label: "Eerste tandje" },
  { key: "eerste_hapje", label: "Eerste hapje vast voedsel" },
  { key: "kruipen", label: "Eerste keer kruipen" },
  { key: "optrekken", label: "Eerste keer optrekken tot staan" },
  { key: "eerste_woordje", label: "Eerste woordje" },
  { key: "los_staan", label: "Eerste keer los staan" },
  { key: "eerste_stapjes", label: "Eerste stapjes" },
  { key: "eerste_verjaardag", label: "Eerste verjaardag" },
];

// ---------- Broer/zus-tips: afhankelijk van babyfase én leeftijd van broer/zus ----------
// 5 bredere babyfases (in plaats van de 14 fijnmazige stages hierboven) gekruist met
// 4 leeftijdscategorieën van de broer/zus, plus "onbekend" als er geen geboortedatum is.
export const SIBLING_PHASES = [
  { id: "newborn", start: 0, end: 4 },
  { id: "early", start: 5, end: 12 },
  { id: "mid", start: 13, end: 24 },
  { id: "late", start: 25, end: 36 },
  { id: "toddler", start: 37, end: 52 },
];

export function siblingPhaseForWeek(week) {
  return (SIBLING_PHASES.find(p => week >= p.start && week <= p.end) || SIBLING_PHASES[0]).id;
}

export function siblingAgeCategory(birthDateStr, today = new Date()) {
  if (!birthDateStr) return "onbekend";
  const ageYears = (today - new Date(birthDateStr)) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 3) return "peuter";
  if (ageYears < 6) return "kleuter";
  if (ageYears < 12) return "schoolkind";
  return "tiener";
}

export const SIBLING_TIPS = {
  newborn: {
    peuter: [
      "Peuters snappen nog niet goed wat er verandert; laat {sibling} vooral merken dat de dagelijkse routine (eten, slapen, knuffels) hetzelfde blijft.",
      "Een eigen 'grote broer/zus'-cadeautje bij de geboorte kan het moment ook van {sibling} maken.",
    ],
    kleuter: [
      "Leg in simpele taal uit waarom {kind} zoveel slaapt en huilt — kleuters vragen graag concreet 'waarom'.",
      "Betrek {sibling} bij kleine klusjes zoals een luier aangeven; op deze leeftijd voelt 'helpen' al volwassen.",
    ],
    schoolkind: [
      "Schoolkinderen kunnen al goed verwoorden wat ze voelen; vraag {sibling} gericht hoe het is om nu broer/zus te zijn.",
      "Plan een vast moment voor een verhaaltje of huiswerk samen, zodat de drukte rond {kind} niet meteen ten koste gaat van die aandacht.",
    ],
    tiener: [
      "Tieners hebben vaak meer aan erkenning dan aan hulp vragen; check af en toe hoe {sibling} het echt vindt, zonder te pushen.",
      "Geef {sibling} de ruimte om er nog niet meteen enthousiast over te zijn — een nieuwe baby verstoort ook tienerleven (privacy, rust).",
    ],
    onbekend: [
      "Laat {sibling} op eigen tempo kennismaken, zonder te verplichten de baby vast te houden.",
      "Houd de vertrouwde dagelijkse routine van {sibling} zoveel mogelijk hetzelfde.",
    ],
  },
  early: {
    peuter: [
      "Peuters kunnen jaloers reageren op knuffelmomenten; geef {sibling} bewust ook fysieke aandacht op schoot.",
      "Korte, voorspelbare momentjes samen (liedje, boekje) werken beter dan lange uitleg op deze leeftijd.",
    ],
    kleuter: [
      "Kleuters spelen graag 'baby na' — laat {sibling} gerust meedoen met (nep-)verzorgen onder toezicht.",
      "Beloon rustig gedrag rond {kind} met aandacht, in plaats van vooral te corrigeren als het misgaat.",
    ],
    schoolkind: [
      "Schoolkinderen kunnen al een taakje aan, zoals zelf een speeltje voor {kind} uitzoeken of vasthouden tijdens het voeden.",
      "Vraag naar school of vriendjes als vast gespreksonderwerp, zodat niet alles om {kind} draait.",
    ],
    tiener: [
      "Heel kort en onder toezicht iets van 'oppas'-verantwoordelijkheid geven kan een tiener als blijk van vertrouwen ervaren.",
      "Blijf oude afspraken (uitjes, hobby's) van {sibling} zoveel mogelijk gewoon doorzetten.",
    ],
    onbekend: [
      "Plan bewust een moment alleen met {sibling}, al is het kort.",
      "Betrek {sibling} bij kleine, veilige taken rond de zorg voor {kind}.",
    ],
  },
  mid: {
    peuter: [
      "Nu {kind} meer reageert (lachen, grijpen) kan {sibling} trots zijn dat die al reactie oproept — benoem dat hardop.",
      "Peuters kunnen fysiek nog onhandig zijn; blijf toezicht houden bij dichtbij spelen.",
    ],
    kleuter: [
      "Kleuters kunnen al kleine 'spelletjes' doen zoals kiekeboe met {kind} — leuk voor allebei.",
      "Leg uit dat {kind} nog niet kan praten of spelen zoals {sibling} gewend is, zodat de verwachtingen kloppen.",
    ],
    schoolkind: [
      "Rond de bijvoeding kan {sibling} al meehelpen met een hapje geven, onder toezicht.",
      "Blijf oog houden op jaloezie nu de aandacht rond eten meer naar {kind} verschuift.",
    ],
    tiener: [
      "Een tiener kan de ontwikkeling van {kind} nu echt interessant gaan vinden — betrek {sibling} actief als die dat wil.",
      "Forceer geen betrokkenheid; sommige tieners houden liever meer afstand, en dat is ook prima.",
    ],
    onbekend: [
      "Reageer merkbaar enthousiast als {kind} reageert op {sibling} — dat versterkt de band.",
      "Blijf specifieke, ongedeelde aandacht geven aan {sibling}, los van de baby.",
    ],
  },
  late: {
    peuter: [
      "{kind} kan nu kruipen en spullen pakken; help {sibling} om eigen speelgoed op een hogere plek te bewaren.",
      "Peuters kunnen boos worden als speelgoed 'afgepakt' wordt; leer een simpele regel zoals 'om de beurt'.",
    ],
    kleuter: [
      "Kleuters kunnen goed meedenken over veiligheid ('dit zetten we hoog, want {kind} kan er nu bij') — betrek {sibling} erbij.",
      "Vier kleine mijlpalen van {kind} samen met {sibling}, zodat het ook hun succes voelt.",
    ],
    schoolkind: [
      "Schoolkinderen kunnen al even 'oppassen' terwijl jij vlakbij bent, bijvoorbeeld tijdens het koken.",
      "Blijf vragen naar hun eigen dag of prestaties, niet alleen over {kind}.",
    ],
    tiener: [
      "Tieners vinden het soms leuk om {kind} iets te 'leren' (geluidjes, bewegingen) — een fijne manier om verbinding te maken.",
      "Respecteer als {sibling} behoefte heeft aan een eigen rustige plek, weg van babydrukte.",
    ],
    onbekend: [
      "Betrek {sibling} bij het vieren van kleine mijlpalen van {kind}.",
      "Zorg voor duidelijke afspraken over spullen en ruimte nu {kind} mobieler wordt.",
    ],
  },
  toddler: {
    peuter: [
      "Nu {kind} misschien gaat lopen, kan het spannend zijn dat de baby 'overal' komt — blijf geduldig herhalen wat wel/niet mag.",
      "Betrek {sibling} bij het vieren van de eerste verjaardag, bijvoorbeeld met een eigen taakje.",
    ],
    kleuter: [
      "Kleuters kunnen goed meehelpen bij het voorbereiden van het verjaardagsfeest van {kind} — geef een concrete rol.",
      "Blijf ook rond het feest een moment alleen met {sibling} inplannen, zodat het niet alléén om {kind} draait.",
    ],
    schoolkind: [
      "Schoolkinderen vertellen soms trots op school over hun broertje/zusje — vraag ernaar, het versterkt de band.",
      "Betrek {sibling} bij het terugkijken op het jaar: wat vond die het leukst aan grote broer/zus zijn?",
    ],
    tiener: [
      "Een tiener kan nu al oprecht gehecht zijn geraakt — een mooi moment om dat te benoemen bij de eerste verjaardag.",
      "Check of {sibling} zich nog gezien voelt nu het 'nieuwe' van de baby wat is afgezwakt — soms zakt aandacht juist té veel weg.",
    ],
    onbekend: [
      "Betrek {sibling} bij de voorbereiding van de eerste verjaardag van {kind}.",
      "Blik samen met {sibling} terug op het jaar: wat vond die er leuk aan?",
    ],
  },
};

export function getSiblingTips(week, birthDateStr) {
  const phase = siblingPhaseForWeek(week);
  const category = siblingAgeCategory(birthDateStr);
  return SIBLING_TIPS[phase][category] || SIBLING_TIPS[phase].onbekend;
}

// ---------- Snel advies per onderwerp (eten/slapen/huilen), ook per babyfase ----------
export const TOPICS = [
  { id: "eten", label: "Eten" },
  { id: "slapen", label: "Slapen" },
  { id: "huilen", label: "Huilen" },
];

export const TOPIC_TIPS = {
  newborn: {
    eten: [
      "Voed op vraag; in de eerste weken is dat vaak elke 2-3 uur, ook 's nachts.",
      "Boertje laten is normaal na elke voeding — even rechtop houden en zachtjes op de rug kloppen.",
      "Twijfel je of {kind} genoeg binnenkrijgt (natte luiers, gewicht)? Bel het consultatiebureau, zij schatten dit goed in.",
    ],
    slapen: [
      "Pasgeborenen slapen 16-17 uur per dag, maar in korte blokjes van 2-4 uur.",
      "Leg {kind} op de rug te slapen, in een leeg bedje zonder kussen/dekbed — vermindert het risico op wiegendood.",
      "Dag en nacht zijn nog niet te onderscheiden voor {kind}; een vast ritme komt pas later.",
    ],
    huilen: [
      "Huilen is nu de enige manier van communiceren; het went een beetje om de oorzaak te leren herkennen (honger, luier, moe, prikkels).",
      "Huilt {kind} ontroostbaar door? Leg 'm veilig neer en neem zelf even afstand — beter dan gefrustreerd raken.",
      "Aanhoudend, ongewoon huilen samen met koorts of niet drinken? Neem contact op met de huisarts of het consultatiebureau.",
    ],
  },
  early: {
    eten: [
      "Voedingsintervallen worden vaak voorspelbaarder, maar groeispurts (rond 3 en 6 weken) geven tijdelijk extra honger.",
      "Bij flesvoeding: check de temperatuur en houd de fles schuin zodat er geen lucht wordt meegezogen.",
      "Spugen na de voeding is meestal onschuldig; bij overmatig spugen of gewichtsverlies, overleg met de JGZ.",
    ],
    slapen: [
      "Een vast avondritueel (bad, voeding, liedje) kan nu al helpen bij het aanvoelen van 'bedtijd'.",
      "De eerste langere nachtelijke slaapperiode ontstaat vaak in deze fase — verwacht geen vast patroon, elk kind verschilt.",
      "Blijf {kind} op de rug leggen; draait die zich later zelf om, is dat geen probleem.",
    ],
    huilen: [
      "Het 'avondhuiltje' (vaak tussen 17-23u) piekt rond 6 weken en neemt daarna vaak weer af.",
      "Inbakeren, wit-ruisgeluid of dragen in een draagdoek kalmeert sommige baby's — probeer wat werkt voor {kind}.",
      "Twijfel je aan darmkrampjes? Het consultatiebureau kan meedenken over voeding en houding.",
    ],
  },
  mid: {
    eten: [
      "Rond 4-6 maanden begint de voorbereiding op bijvoeding; volg het tempo van {kind}, niet alleen de kalender.",
      "Begin met één nieuw voedingsmiddel per keer, een paar dagen na elkaar, om reacties te herkennen.",
      "Blijf borst- of flesvoeding als basis aanhouden naast de eerste hapjes.",
    ],
    slapen: [
      "Sommige baby's laten een 'slaapregressie' zien rond 4 maanden door een veranderend slaappatroon — tijdelijk, geen zorg.",
      "Een consistente bedtijdroutine helpt steeds meer, ook al blijft nachtvoeding nog gebruikelijk.",
      "Een vast dutjesritme overdag maakt de nacht vaak ook rustiger.",
    ],
    huilen: [
      "Huilen wordt vaker een signaal van iets specifieks (moe, honger, prikkels) — probeer patronen te herkennen.",
      "Tandjes kunnen nu al ongemak geven; een koel bijtring kan verlichten.",
      "Blijft {kind} veel huilen zonder duidelijke oorzaak? Bespreek dit bij het volgende consultatiebureau-bezoek.",
    ],
  },
  late: {
    eten: [
      "De textuur van hapjes kan grover; zelf oefenen met een lepel of vingerhapjes stimuleert de motoriek.",
      "Bekers met tuit kunnen nu geïntroduceerd worden naast fles/borst.",
      "Blijf bekende allergenen (pinda, ei, koemelk) met mate en één voor één introduceren.",
    ],
    slapen: [
      "Scheidingsangst kan de nacht beïnvloeden; een vast, voorspelbaar ritueel helpt geruststellen.",
      "Kruipen of leren zitten kan tijdelijk voor onrustiger slapen zorgen — meestal gaat dit vanzelf over.",
      "Houd een vaste slaapplek aan, ook op reis of bij oppas, voor herkenbaarheid.",
    ],
    huilen: [
      "Vreemdelingenangst kan huilen bij onbekende mensen verklaren; forceer geen contact, geef {kind} de tijd.",
      "Frustratiehuilen (iets niet kunnen pakken of kruipen waar die wil) hoort bij deze fase van groeiende zelfstandigheid.",
      "Blijf zelf rustig reageren; {kind} spiegelt op deze leeftijd al jullie emotieregulatie.",
    ],
  },
  toddler: {
    eten: [
      "Steeds meer 'gewoon' mee-eten aan tafel kan nu, in aangepaste vorm (klein gesneden, geen toegevoegd zout/suiker).",
      "Een afnemende eetlust rond deze leeftijd is normaal; de groei vertraagt licht na het eerste half jaar.",
      "Blijf zelf eten aanmoedigen (lepel vasthouden, met handjes), ook al is het rommelig.",
    ],
    slapen: [
      "De overgang naar minder dutjes per dag (van 2 naar 1) kan rond deze leeftijd beginnen — volg het ritme van {kind}.",
      "Los leren staan of lopen kan tijdelijk voor opgewonden, onrustiger slapen zorgen.",
      "Het vaste avondritueel blijft de sterkste voorspeller van rustig inslapen.",
    ],
    huilen: [
      "Huilen bij het achterlaten (bijv. crèche, oppas) hoort bij de leeftijd — een vast afscheidsritueel helpt vaak.",
      "Woede-uitbarstingen door frustratie (nog niet kunnen praten) kunnen al beginnen — blijf rustig benoemen wat je ziet.",
      "Aanhoudend ongewoon huilgedrag blijft altijd een reden om even bij het consultatiebureau te checken.",
    ],
  },
};

export function getTopicTips(topicId, week) {
  const phase = siblingPhaseForWeek(week);
  return TOPIC_TIPS[phase][topicId] || [];
}

