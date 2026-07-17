import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCIFPayload,
  looksLikeCIF,
  extractDeclaredCODId,
  validateCODPayload,
  extractCIFTextFromDatasetResponse,
  buildDatasetFilterURL
} from "../src/cod-client.js";

const cif = `data_1506803
_cod_database_code 1506803
_cell_length_a 4.3791
_cell_length_b 9.2158
_cell_length_c 26.681
_cell_angle_alpha 90
_cell_angle_beta 92.748
_cell_angle_gamma 90
loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
C1 C 0.1 0.2 0.3
`;

const wrongCif = cif.replaceAll("1506803", "1506804");

test("normaliza payload e reconhece CIF", () => {
  const value = normalizeCIFPayload(`header externo\n${cif}\n\`\`\``);
  assert.equal(looksLikeCIF(value), true);
  assert.match(value, /^data_1506803/);
});

test("extrai e valida COD ID", () => {
  assert.equal(extractDeclaredCODId(cif), "1506803");
  assert.equal(validateCODPayload(cif, "1506803"), cif.trim());
  assert.throws(() => validateCODPayload(cif, "1506804"), /devolveu COD 1506803/);
});

test("seleciona o COD exato na resposta do Dataset Viewer", () => {
  const payload = {
    rows: [
      { row: { file: 1506804, cif_text: wrongCif }, truncated_cells: [] },
      { row: { file: 1506803, cif_text: cif }, truncated_cells: [] }
    ]
  };
  assert.equal(extractCIFTextFromDatasetResponse(payload, "1506803"), cif.trim());
});

test("ignora cif_text truncado", () => {
  const payload = { rows: [{ row: { file: 1506803, cif_text: cif }, truncated_cells: ["cif_text"] }] };
  assert.equal(extractCIFTextFromDatasetResponse(payload, "1506803"), "");
});

test("gera filtro numérico exato para COD ID", () => {
  const url = buildDatasetFilterURL("1506803");
  assert.equal(url.pathname, "/filter");
  assert.equal(url.searchParams.get("where"), '"file"=1506803');
  assert.equal(url.searchParams.get("length"), "1");
});
