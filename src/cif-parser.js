const UNKNOWN = new Set(["?", ".", ""]);

function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if ((ch === "'" || ch === '"') && (i === 0 || line[i - 1] !== "\\")) {
      quote = quote === ch ? null : quote || ch;
    }
    if (ch === "#" && !quote) return line.slice(0, i);
  }
  return line;
}

function tokenizeLine(line) {
  const tokens = [];
  const regex = /'(?:[^']|'')*'|"(?:[^"]|"")*"|[^\s]+/g;
  const clean = stripComment(line);
  for (const match of clean.matchAll(regex)) {
    let value = match[0];
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    tokens.push(value);
  }
  return tokens;
}

export function tokenizeCIF(text) {
  const tokens = [];
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  let multiline = null;

  for (const line of lines) {
    if (multiline !== null) {
      if (line.startsWith(";")) {
        tokens.push(multiline.join("\n").trim());
        multiline = null;
      } else {
        multiline.push(line);
      }
      continue;
    }

    if (line.startsWith(";")) {
      multiline = [line.slice(1)];
      continue;
    }

    tokens.push(...tokenizeLine(line));
  }

  if (multiline !== null) tokens.push(multiline.join("\n").trim());
  return tokens;
}

function isControlToken(token) {
  const lower = String(token || "").toLowerCase();
  return lower === "loop_" || lower === "stop_" || lower.startsWith("data_") || lower.startsWith("save_") || lower.startsWith("global_");
}

export function parseCIFDocument(text) {
  const tokens = tokenizeCIF(text);
  const scalars = new Map();
  const loops = [];
  let dataBlock = "";
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    const lower = token.toLowerCase();

    if (lower.startsWith("data_")) {
      dataBlock = token.slice(5);
      i += 1;
      continue;
    }

    if (lower === "loop_") {
      i += 1;
      const tags = [];
      while (i < tokens.length && tokens[i].startsWith("_")) {
        tags.push(tokens[i].toLowerCase());
        i += 1;
      }
      if (!tags.length) continue;

      const values = [];
      while (i < tokens.length && !tokens[i].startsWith("_") && !isControlToken(tokens[i])) {
        values.push(tokens[i]);
        i += 1;
      }
      const rows = [];
      for (let offset = 0; offset + tags.length <= values.length; offset += tags.length) {
        const row = {};
        tags.forEach((tag, index) => { row[tag] = values[offset + index]; });
        rows.push(row);
      }
      loops.push({ tags, rows });
      continue;
    }

    if (token.startsWith("_")) {
      const key = token.toLowerCase();
      const value = i + 1 < tokens.length ? tokens[i + 1] : "";
      scalars.set(key, value);
      i += 2;
      continue;
    }

    i += 1;
  }

  return { dataBlock, scalars, loops, raw: text };
}

export function cleanCIFValue(value, fallback = "") {
  const text = String(value ?? "").trim();
  return UNKNOWN.has(text) ? fallback : text;
}

export function numericCIFValue(value, fallback = NaN) {
  const text = cleanCIFValue(value);
  if (!text) return fallback;

  // CIF coordinates and symmetry-related values can occasionally be written as fractions.
  const fraction = text.match(/^([-+]?(?:\d+\.?\d*|\.\d+))\/([-+]?(?:\d+\.?\d*|\.\d+))/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0
      ? numerator / denominator
      : fallback;
  }

  const match = text.match(/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/);
  return match ? Number(match[0]) : fallback;
}

export function getScalar(doc, ...tags) {
  for (const tag of tags) {
    const value = doc.scalars.get(tag.toLowerCase());
    if (!UNKNOWN.has(String(value ?? "").trim())) return cleanCIFValue(value);
  }
  return "";
}

export function getLoop(doc, requiredTag) {
  const wanted = requiredTag.toLowerCase();
  return doc.loops.find(loop => loop.tags.includes(wanted)) || null;
}

export function inferElement(typeSymbol, label = "") {
  const explicit = cleanCIFValue(typeSymbol).replace(/[^A-Za-z]/g, "");
  const source = explicit || cleanCIFValue(label).replace(/^[^A-Za-z]*/, "");
  const match = source.match(/^([A-Z][a-z]?|[a-z]{1,2})/);
  if (!match) return "X";
  const symbol = match[1];
  return symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase();
}

export function extractMetadata(doc) {
  const authorsLoop = getLoop(doc, "_publ_author_name");
  const authors = authorsLoop ? authorsLoop.rows.map(row => cleanCIFValue(row._publ_author_name)).filter(Boolean).join("; ") : getScalar(doc, "_publ_author_name");

  return {
    codId: getScalar(doc, "_cod_database_code", "_cod_database_code_structure") || doc.dataBlock,
    name: getScalar(doc, "_chemical_name_common", "_chemical_name_mineral", "_chemical_name_systematic", "_chemical_name_structure_type") || "Estrutura cristalográfica",
    formula: getScalar(doc, "_chemical_formula_sum", "_chemical_formula_structural", "_chemical_formula_moiety") || "—",
    spaceGroup: getScalar(doc, "_space_group_name_h-m_alt", "_symmetry_space_group_name_h-m", "_space_group_name_hall") || "—",
    spaceGroupNumber: getScalar(doc, "_space_group_it_number", "_symmetry_int_tables_number") || "—",
    volume: getScalar(doc, "_cell_volume") || "—",
    z: getScalar(doc, "_cell_formula_units_z") || "—",
    density: getScalar(doc, "_exptl_crystal_density_diffrn", "_exptl_crystal_density_meas") || "—",
    temperature: getScalar(doc, "_diffrn_ambient_temperature", "_cell_measurement_temperature") || "—",
    doi: getScalar(doc, "_journal_paper_doi", "_cod_related_entry_uri") || "",
    title: getScalar(doc, "_publ_section_title") || "",
    authors,
    journal: getScalar(doc, "_journal_name_full", "_journal_name_abbrev") || "",
    year: getScalar(doc, "_journal_year") || "",
    volumeJournal: getScalar(doc, "_journal_volume") || "",
    pages: [getScalar(doc, "_journal_page_first"), getScalar(doc, "_journal_page_last")].filter(Boolean).join("–")
  };
}

export function extractCell(doc) {
  const cell = {
    a: numericCIFValue(getScalar(doc, "_cell_length_a")),
    b: numericCIFValue(getScalar(doc, "_cell_length_b")),
    c: numericCIFValue(getScalar(doc, "_cell_length_c")),
    alpha: numericCIFValue(getScalar(doc, "_cell_angle_alpha")),
    beta: numericCIFValue(getScalar(doc, "_cell_angle_beta")),
    gamma: numericCIFValue(getScalar(doc, "_cell_angle_gamma"))
  };
  const missing = Object.entries(cell).filter(([, value]) => !Number.isFinite(value)).map(([key]) => key);
  if (missing.length) throw new Error(`CIF sem parâmetros completos de cela: ${missing.join(", ")}.`);
  return cell;
}

export function extractAtomSites(doc) {
  const loop = getLoop(doc, "_atom_site_fract_x");
  if (!loop) throw new Error("O CIF não contém coordenadas fracionárias (_atom_site_fract_x/y/z).");

  const atoms = loop.rows.map((row, index) => ({
    label: cleanCIFValue(row._atom_site_label, `A${index + 1}`),
    element: inferElement(row._atom_site_type_symbol, row._atom_site_label),
    fract: [numericCIFValue(row._atom_site_fract_x), numericCIFValue(row._atom_site_fract_y), numericCIFValue(row._atom_site_fract_z)],
    occupancy: numericCIFValue(row._atom_site_occupancy, 1),
    disorder: cleanCIFValue(row._atom_site_disorder_group)
  })).filter(atom => atom.fract.every(Number.isFinite) && atom.occupancy > 0.01);

  if (!atoms.length) throw new Error("Nenhuma coordenada atômica válida foi encontrada.");
  return atoms;
}

export function extractSymmetryOperations(doc) {
  const tagCandidates = ["_space_group_symop_operation_xyz", "_symmetry_equiv_pos_as_xyz"];
  for (const tag of tagCandidates) {
    const loop = getLoop(doc, tag);
    if (loop?.rows?.length) {
      return loop.rows.map(row => cleanCIFValue(row[tag])).filter(Boolean);
    }
    const scalar = getScalar(doc, tag);
    if (scalar) return [scalar];
  }
  return ["x,y,z"];
}
