export const SCIENCE_EXAMPLES = {
  tio2Rutile: {
    family: "tio2", label: "TiO₂ — rutilo", shortLabel: "Rutilo", path: "examples/tio2-rutile-9015662.cif", codId: "9015662",
    originalSpaceGroup: "P4₂/mnm (nº 136)", crystalSystem: "tetragonal", coordination: "TiO₆ distorcido; octaedros compartilham arestas e vértices",
    teachingNote: "Compare a cadeia de octaedros TiO₆ e a compactação da cela com anatásio e brookita.", question: "Como o compartilhamento dos octaedros altera a densidade da rede?",
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["Ti", "O"], minDistance: 1.70, maxDistance: 2.20, kind: "coordination" }],
    polyhedra: { centralElements: ["Ti"], ligandElements: ["O"], minNeighbors: 6, maxDistance: 2.20, color: 0x5f8fc4 }
  },
  tio2Anatase: {
    family: "tio2", label: "TiO₂ — anatásio", shortLabel: "Anatásio", path: "examples/tio2-anatase-9015929.cif", codId: "9015929",
    originalSpaceGroup: "I4₁/amd (nº 141)", crystalSystem: "tetragonal", coordination: "TiO₆ distorcido; conectividade distinta do rutilo",
    teachingNote: "A mesma composição TiO₂ produz outra rede de octaedros; relacione estrutura, área superficial e fotocatálise.", question: "Quais mudanças estruturais aparecem sem mudar a fórmula química?",
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["Ti", "O"], minDistance: 1.70, maxDistance: 2.20, kind: "coordination" }],
    polyhedra: { centralElements: ["Ti"], ligandElements: ["O"], minNeighbors: 6, maxDistance: 2.20, color: 0x5f8fc4 }
  },
  tio2Brookite: {
    family: "tio2", label: "TiO₂ — brookita", shortLabel: "Brookita", path: "examples/tio2-brookite-9004137.cif", codId: "9004137",
    originalSpaceGroup: "Pbca (nº 61)", crystalSystem: "ortorrômbico", coordination: "TiO₆ mais assimétrico; cela com 24 átomos",
    teachingNote: "A brookita evidencia maior complexidade cristalográfica, apesar da mesma fórmula TiO₂.", question: "Por que uma cela maior não significa uma composição diferente?",
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["Ti", "O"], minDistance: 1.70, maxDistance: 2.25, kind: "coordination" }],
    polyhedra: { centralElements: ["Ti"], ligandElements: ["O"], minNeighbors: 6, maxDistance: 2.25, color: 0x5f8fc4 }
  },
  caco3Calcite: {
    family: "caco3", label: "CaCO₃ — calcita", shortLabel: "Calcita", path: "examples/caco3-calcite-9000095.cif", codId: "9000095",
    originalSpaceGroup: "R-3c (nº 167)", crystalSystem: "trigonal", coordination: "CO₃²⁻ trigonal planar; Ca com coordenação 6",
    teachingNote: "Separe ligações covalentes C–O das interações de coordenação Ca–O.", question: "Quais contatos representam ligação intramolecular e quais representam coordenação?",
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["C", "O"], minDistance: 1.10, maxDistance: 1.40, kind: "covalent" }, { elements: ["Ca", "O"], minDistance: 2.10, maxDistance: 2.55, kind: "coordination" }],
    polyhedra: { centralElements: ["Ca"], ligandElements: ["O"], minNeighbors: 6, maxDistance: 2.55, color: 0x5fbf78 }
  },
  caco3Aragonite: {
    family: "caco3", label: "CaCO₃ — aragonita", shortLabel: "Aragonita", path: "examples/caco3-aragonite-9000229.cif", codId: "9000229",
    originalSpaceGroup: "Pmcn (nº 62)", crystalSystem: "ortorrômbico", coordination: "CO₃²⁻ trigonal planar; Ca com coordenação 9",
    teachingNote: "Compare o ambiente Ca–O mais amplo da aragonita com a coordenação 6 da calcita.", question: "Como a coordenação do Ca muda entre os polimorfos?",
    representation: "ball-stick", supercell: 2, showBonds: true,
    bondRules: [{ elements: ["C", "O"], minDistance: 1.10, maxDistance: 1.40, kind: "covalent" }, { elements: ["Ca", "O"], minDistance: 2.20, maxDistance: 2.80, kind: "coordination" }],
    polyhedra: { centralElements: ["Ca"], ligandElements: ["O"], minNeighbors: 8, maxDistance: 2.80, color: 0x5fbf78 }
  },
  caco3Vaterite: {
    family: "caco3", label: "CaCO₃ — vaterita (modelo histórico)", shortLabel: "Vaterita", path: "examples/caco3-vaterite-9007475.cif", codId: "9007475",
    originalSpaceGroup: "P6₃/mmc (nº 194; modelo de Kamhi)", crystalSystem: "hexagonal", coordination: "modelo médio com orientações de CO₃²⁻ parcialmente ocupadas",
    teachingNote: "Este modelo histórico usa ocupação 1/3 para orientações alternativas do carbonato. Transparência não significa ausência de átomo: representa ocupação estatística.", question: "Por que não se deve interpretar todas as orientações parciais como simultâneas?",
    scientificWarning: "A estrutura da vaterita é historicamente controversa. O COD 9007475 representa a pseudocela média de Kamhi (1963), com posições de carbonato de ocupação 1/3; não é um modelo ordenado definitivo.",
    representation: "space-fill", supercell: 2, showBonds: false, allowBonds: false,
    bondRules: [{ elements: ["C", "O"], minDistance: 1.05, maxDistance: 1.48, kind: "covalent" }, { elements: ["Ca", "O"], minDistance: 2.05, maxDistance: 2.85, kind: "coordination" }],
    polyhedra: null
  }
};

export const LESSON_FAMILIES = {
  tio2: {
    title: "Polimorfos do TiO₂", keys: ["tio2Rutile", "tio2Anatase", "tio2Brookite"],
    guidingQuestion: "Como a conectividade e a distorção dos octaedros TiO₆ mudam sem alterar a composição TiO₂?",
    synthesis: "Observe sistema cristalino, volume da cela, número de átomos e padrões de compartilhamento dos octaedros."
  },
  caco3: {
    title: "Polimorfos do CaCO₃", keys: ["caco3Calcite", "caco3Aragonite", "caco3Vaterite"],
    guidingQuestion: "Como coordenação do Ca, empacotamento e desordem distinguem calcita, aragonita e vaterita?",
    synthesis: "Diferencie ligações C–O dentro do carbonato, coordenação Ca–O e ocupação cristalográfica parcial."
  }
};

export function scienceExampleEntries() { return Object.entries(SCIENCE_EXAMPLES); }
export function scienceKeysForFamily(family) { return LESSON_FAMILIES[family]?.keys || []; }
