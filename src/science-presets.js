export const SCIENCE_EXAMPLES = {
  carbonDiamond: {
    family: "carbon", label: "C — diamante", shortLabel: "Diamante", path: "examples/diamond-9012293.cif", codId: "9012293",
    originalSpaceGroup: "Fd-3m (nº 227)", crystalSystem: "cúbico", coordination: "cada C ligado covalentemente a 4 C",
    hybridization: "sp³", dimensionality: "rede covalente tridimensional",
    propertySummary: "Rede 3D rígida: elevada dureza e comportamento isolante elétrico no estado puro.",
    teachingNote: "Observe a geometria tetraédrica local e procure caminhos covalentes que se estendem nas três dimensões.",
    question: "Por que uma rede covalente 3D resiste melhor à deformação do que uma estrutura em camadas?",
    mineralImage: {
      path: "assets/minerals/diamond.jpg", kind: "Fotografia de cristal real", title: "Diamante bruto — C",
      alt: "Diamante natural transparente, branco e octaédrico arredondado, isolado sobre fundo neutro.",
      caption: "Diamante natural de 0,06 ct do Crater of Diamonds State Park, Arkansas. A forma octaédrica arredondada é uma morfologia externa real, não uma fotografia da rede atômica.",
      author: "Rob Lavinsky, iRocks.com", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Diamond-260146.jpg"
    },
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["C", "C"], minDistance: 1.35, maxDistance: 1.65, kind: "covalent" }],
    polyhedra: null
  },
  carbonGraphite: {
    family: "carbon", label: "C — grafite 2H", shortLabel: "Grafite", path: "examples/graphite-1200017.cif", codId: "1200017",
    originalSpaceGroup: "P6₃/mmc (nº 194)", crystalSystem: "hexagonal", coordination: "cada C ligado covalentemente a 3 C na camada",
    hybridization: "sp²", dimensionality: "folhas bidimensionais empilhadas",
    propertySummary: "Ligações fortes na camada e interações mais fracas entre camadas: maciez, clivagem e condução elétrica anisotrópica.",
    teachingNote: "Identifique os anéis hexagonais, as folhas planas e a separação entre camadas. As linhas não devem unir carbonos de folhas diferentes.",
    question: "Qual característica estrutural permite que o grafite deixe traços no papel?",
    mineralImage: {
      path: "assets/minerals/graphite.jpg", kind: "Fotografia de exemplar real", title: "Grafite — C",
      alt: "Massa natural cinza-aço de grafite, com aspecto lamelar e foliado claramente visível.",
      caption: "Massa natural de grafite com forma lamelar e brilho cinza-aço. O aspecto foliado ajuda a introduzir o deslizamento entre camadas.",
      author: "Rob Lavinsky, iRocks.com", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Graphite-233436.jpg"
    },
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["C", "C"], minDistance: 1.30, maxDistance: 1.60, kind: "covalent" }],
    polyhedra: null
  },
  tio2Rutile: {
    family: "tio2", label: "TiO₂ — rutilo", shortLabel: "Rutilo", path: "examples/tio2-rutile-9015662.cif", codId: "9015662",
    originalSpaceGroup: "P4₂/mnm (nº 136)", crystalSystem: "tetragonal", coordination: "TiO₆ distorcido; octaedros compartilham arestas e vértices",
    teachingNote: "Compare a cadeia de octaedros TiO₆ e a compactação da cela com anatásio e brookita.", question: "Como o compartilhamento dos octaedros altera a densidade da rede?",
    mineralImage: {
      path: "assets/minerals/rutile.jpg", kind: "Fotografia de exemplar real", title: "Rutilo — TiO₂",
      alt: "Cristais reticulados, estriados e vermelho-escuros de rutilo, sem quartzo dominando a imagem.",
      caption: "Cristais reticulados e estriados de rutilo de Diamantina, Minas Gerais. O rutilo é o mineral protagonista da fotografia.",
      author: "Rob Lavinsky, iRocks.com", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Rutile-ww7c.jpg"
    },
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["Ti", "O"], minDistance: 1.70, maxDistance: 2.20, kind: "coordination" }],
    polyhedra: { centralElements: ["Ti"], ligandElements: ["O"], minNeighbors: 6, maxDistance: 2.20, color: 0x5f8fc4 }
  },
  tio2Anatase: {
    family: "tio2", label: "TiO₂ — anatásio", shortLabel: "Anatásio", path: "examples/tio2-anatase-9015929.cif", codId: "9015929",
    originalSpaceGroup: "I4₁/amd (nº 141)", crystalSystem: "tetragonal", coordination: "TiO₆ distorcido; conectividade distinta do rutilo",
    teachingNote: "A mesma composição TiO₂ produz outra rede de octaedros; relacione estrutura, área superficial e fotocatálise.", question: "Quais mudanças estruturais aparecem sem mudar a fórmula química?",
    mineralImage: {
      path: "assets/minerals/anatase.jpg", kind: "Fotografia de exemplar real", title: "Anatásio — TiO₂",
      alt: "Cristais castanhos de anatásio com faces cristalinas bem definidas.",
      caption: "Cristais castanhos de anatásio de Gouveia, Minas Gerais. Compare o hábito externo com o rutilo sem confundir aparência e estrutura atômica.",
      author: "Tom Epaminondas e Eurico Zimbres", license: "CC BY-SA 2.0 BR", source: "https://commons.wikimedia.org/wiki/File:Anat%C3%A1sio.jpeg"
    },
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["Ti", "O"], minDistance: 1.70, maxDistance: 2.20, kind: "coordination" }],
    polyhedra: { centralElements: ["Ti"], ligandElements: ["O"], minNeighbors: 6, maxDistance: 2.20, color: 0x5f8fc4 }
  },
  tio2Brookite: {
    family: "tio2", label: "TiO₂ — brookita", shortLabel: "Brookita", path: "examples/tio2-brookite-9004137.cif", codId: "9004137",
    originalSpaceGroup: "Pbca (nº 61)", crystalSystem: "ortorrômbico", coordination: "TiO₆ mais assimétrico; cela com 24 átomos",
    teachingNote: "A brookita evidencia maior complexidade cristalográfica, apesar da mesma fórmula TiO₂.", question: "Por que uma cela maior não significa uma composição diferente?",
    mineralImage: {
      path: "assets/minerals/brookite.jpg", kind: "Fotografia de exemplar real", title: "Brookita — TiO₂",
      alt: "Exemplar de brookita em que o hábito tabular e lamelar é visível.",
      caption: "Exemplar real de brookita. Observe a aparência tabular/lamelar e compare com os dois polimorfos tetragonais do TiO₂.",
      author: "Assianir", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Brookite.jpg"
    },
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["Ti", "O"], minDistance: 1.70, maxDistance: 2.25, kind: "coordination" }],
    polyhedra: { centralElements: ["Ti"], ligandElements: ["O"], minNeighbors: 6, maxDistance: 2.25, color: 0x5f8fc4 }
  },
  caco3Calcite: {
    family: "caco3", label: "CaCO₃ — calcita", shortLabel: "Calcita", path: "examples/caco3-calcite-9000095.cif", codId: "9000095",
    originalSpaceGroup: "R-3c (nº 167)", crystalSystem: "trigonal", coordination: "CO₃²⁻ trigonal planar; Ca com coordenação 6",
    teachingNote: "Separe ligações covalentes C–O das interações de coordenação Ca–O.", question: "Quais contatos representam ligação intramolecular e quais representam coordenação?",
    mineralImage: {
      path: "assets/minerals/calcite.jpg", kind: "Fotografia de exemplar real", title: "Calcita — CaCO₃",
      alt: "Conjunto de romboedros de calcita mostrando faces inclinadas características.",
      caption: "Romboedros de calcita escolhidos para evidenciar um hábito macroscópico característico do sistema trigonal.",
      author: "Parent Géry", license: "Domínio público", source: "https://commons.wikimedia.org/wiki/File:Calcite_5.jpg"
    },
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["C", "O"], minDistance: 1.10, maxDistance: 1.40, kind: "covalent" }, { elements: ["Ca", "O"], minDistance: 2.10, maxDistance: 2.55, kind: "coordination" }],
    polyhedra: { centralElements: ["Ca"], ligandElements: ["O"], minNeighbors: 6, maxDistance: 2.55, color: 0x5fbf78 }
  },
  caco3Aragonite: {
    family: "caco3", label: "CaCO₃ — aragonita", shortLabel: "Aragonita", path: "examples/caco3-aragonite-9000229.cif", codId: "9000229",
    originalSpaceGroup: "Pmcn (nº 62)", crystalSystem: "ortorrômbico", coordination: "CO₃²⁻ trigonal planar; Ca com coordenação 9",
    teachingNote: "Compare o ambiente Ca–O mais amplo da aragonita com a coordenação 6 da calcita.", question: "Como a coordenação do Ca muda entre os polimorfos?",
    mineralImage: {
      path: "assets/minerals/aragonite.jpg", kind: "Fotografia de exemplar real", title: "Aragonita — CaCO₃",
      alt: "Agregados radiais tridimensionais de cristais de aragonita.",
      caption: "Agregados radiais de aragonita do Northern Lights Mine, Nevada. A morfologia contrasta claramente com os romboedros de calcita.",
      author: "Rob Lavinsky, iRocks.com", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Aragonite-23204.jpg"
    },
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["C", "O"], minDistance: 1.10, maxDistance: 1.40, kind: "covalent" }, { elements: ["Ca", "O"], minDistance: 2.20, maxDistance: 2.80, kind: "coordination" }],
    polyhedra: { centralElements: ["Ca"], ligandElements: ["O"], minNeighbors: 8, maxDistance: 2.80, color: 0x5fbf78 }
  },
  caco3Vaterite: {
    family: "caco3", label: "CaCO₃ — vaterita (modelo histórico)", shortLabel: "Vaterita", path: "examples/caco3-vaterite-9007475.cif", codId: "9007475",
    originalSpaceGroup: "P6₃/mmc (nº 194; modelo de Kamhi)", crystalSystem: "hexagonal", coordination: "modelo médio com orientações de CO₃²⁻ parcialmente ocupadas",
    teachingNote: "Este modelo histórico usa ocupação 1/3 para orientações alternativas do carbonato. Transparência não significa ausência de átomo: representa ocupação estatística.", question: "Por que não se deve interpretar todas as orientações parciais como simultâneas?",
    scientificWarning: "A estrutura da vaterita é historicamente controversa. O COD 9007475 representa a pseudocela média de Kamhi (1963), com posições de carbonato de ocupação 1/3; não é um modelo ordenado definitivo.",
    mineralImage: {
      path: "assets/minerals/vaterite.jpg", kind: "Micrografia eletrônica real", title: "Vaterita — CaCO₃",
      alt: "Micrografia eletrônica de varredura mostrando uma esfera microscópica de vaterita e sua barra de escala.",
      caption: "Esfera microscópica de vaterita observada por MEV. Não é uma fotografia de amostra mineral macroscópica; a barra de escala foi preservada.",
      author: "A. Di Falco", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Vaterite_Spheres_SEM.jpg"
    },
    representation: "space-fill", supercell: 2, showBonds: false, allowBonds: false,
    bondRules: [{ elements: ["C", "O"], minDistance: 1.05, maxDistance: 1.48, kind: "covalent" }, { elements: ["Ca", "O"], minDistance: 2.05, maxDistance: 2.85, kind: "coordination" }],
    polyhedra: null
  }
};

export const LESSON_FAMILIES = {
  carbon: {
    title: "Carbono: mesma composição, redes diferentes", keys: ["carbonDiamond", "carbonGraphite"],
    guidingQuestion: "Como o mesmo elemento químico pode originar um material extremamente duro e outro macio e condutor?",
    synthesis: "Compare número de vizinhos, geometria local, hibridização e dimensionalidade. A propriedade não depende apenas da composição: depende de como os átomos estão conectados.",
    comparison: [
      ["Composição", "C", "C"],
      ["Vizinhos por C", "4", "3"],
      ["Geometria / hibridização", "tetraédrica · sp³", "trigonal planar · sp²"],
      ["Dimensionalidade", "rede covalente 3D", "folhas 2D empilhadas"],
      ["Propriedade-chave", "muito duro · isolante", "macio · condutor anisotrópico"]
    ],
    questions: [
      "Qual estrutura apresenta caminhos covalentes contínuos nas três dimensões?",
      "Por que as folhas do grafite podem deslizar sem romper todas as ligações C–C?",
      "Como a coordenação 4 versus 3 se relaciona com sp³ e sp²?"
    ]
  },
  tio2: {
    title: "Polimorfos do TiO₂", keys: ["tio2Rutile", "tio2Anatase", "tio2Brookite"],
    guidingQuestion: "Como a conectividade e a distorção dos octaedros TiO₆ mudam sem alterar a composição TiO₂?",
    synthesis: "Observe sistema cristalino, volume da cela, número de átomos e padrões de compartilhamento dos octaedros. Compare também a fotografia real sem concluir que cor e hábito dependem somente do polimorfo."
  },
  caco3: {
    title: "Polimorfos do CaCO₃", keys: ["caco3Calcite", "caco3Aragonite", "caco3Vaterite"],
    guidingQuestion: "Como coordenação do Ca, empacotamento e desordem distinguem calcita, aragonita e vaterita?",
    synthesis: "Diferencie ligações C–O, coordenação Ca–O e ocupação parcial. A imagem da vaterita está em escala microscópica e não deve ser comparada diretamente em tamanho com as amostras macroscópicas."
  }
};

export function scienceExampleEntries() { return Object.entries(SCIENCE_EXAMPLES); }
export function scienceKeysForFamily(family) { return LESSON_FAMILIES[family]?.keys || []; }
