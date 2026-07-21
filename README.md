# CrystalAR

**CrystalAR** é um visualizador educacional aberto de estruturas cristalográficas em 3D e realidade aumentada diretamente no navegador.

## Versão

`5.1.0` — **Comparação científica de polimorfos, coordenação e ocupação cristalográfica**.

A versão 5.1 mantém as quinze estruturas da 5.0 e acrescenta seis derivados educacionais de determinações experimentais do COD, totalizando **21 estruturas**. Os novos roteiros não tratam linhas geométricas indistintamente como “ligações”: regras específicas separam ligações covalentes de contatos de coordenação.

## Novos roteiros comparativos

### TiO₂: mesma fórmula, diferentes redes de octaedros

- rutilo — COD `9015662`, grupo original P4₂/mnm;
- anatásio — COD `9015929`, grupo original I4₁/amd;
- brookita — COD `9004137`, grupo original Pbca.

O roteiro orienta a comparação de sistema cristalino, cela, distorção e conectividade dos octaedros TiO₆. A visualização usa regras Ti–O explícitas e pode gerar poliedros de coordenação.

### CaCO₃: coordenação, empacotamento e desordem

- calcita — COD `9000095`, grupo original R-3c;
- aragonita — COD `9000229`, grupo original Pmcn;
- vaterita — COD `9007475`, modelo médio histórico P6₃/mmc de Kamhi.

O aplicativo distingue ligações covalentes C–O de contatos Ca–O. Na vaterita, as posições de ocupação `1/3` são mostradas com transparência e acompanhadas de alerta: orientações alternativas parcialmente ocupadas não devem ser interpretadas como presentes simultaneamente.

## Integridade cristalográfica

Os seis novos arquivos são derivados educacionais **expandidos em P1** a partir das coordenadas e operações de simetria das entradas COD citadas. Essa decisão:

- preserva o COD ID, os autores e os parâmetros da cela;
- registra o grupo espacial original no arquivo e na interface;
- evita depender da interpretação de configurações avançadas pelo parser;
- torna explícito que o arquivo local é um derivado, não o CIF experimental intacto.

## Funcionalidades científicas e pedagógicas

- 21 estruturas em sete famílias;
- roteiro guiado para alternar entre três polimorfos relacionados;
- regras de distância específicas para Ti–O, C–O e Ca–O;
- distinção visual entre ligação covalente e coordenação;
- poliedros TiO₆ e CaOₙ opcionais;
- medição interativa de distâncias e ângulos por seleção de átomos;
- representação semitransparente de ocupações parciais;
- perguntas orientadoras e alertas de interpretação;
- ball-and-stick, space-filling e wireframe;
- cela unitária e supercelas `1 × 1 × 1`, `2 × 2 × 2` e `3 × 3 × 3`;
- upload local de `.cif` e `.mcif`, SHA-256 e proveniência;
- WebAR com rastreamento de mão e fallback por toque.

## Galeria preservada da versão 5.0

Carbono: diamante, grafite e grafeno. Enxofre: α-S₈, β-S₈ e γ-S₈. Sólidos iônicos: NaCl, CsCl, MgO e CaF₂. MOFs: MOF-5, HKUST-1 e ZIF-8. ZnS: blenda e wurtzita.

## Testes

```bash
npm run check
npm test
npm run smoke:browser
```

Os testes da versão 5.1 verificam sintaxe, seis novos CIFs, COD IDs, fórmulas, grupos originais, número de átomos após expansão, ocupação parcial da vaterita, regras químicas e integração da interface.

## Limitações

- a inferência genérica permanece para estruturas antigas, enquanto os novos roteiros usam regras explícitas;
- poliedros próximos às fronteiras podem exigir supercela `2 × 2 × 2` para completar a coordenação;
- a vaterita COD `9007475` é um modelo médio histórico, não uma solução estrutural ordenada definitiva;
- o parser registra desordem e ocupação, mas não escolhe automaticamente uma configuração ordenada;
- supercelas grandes podem reduzir o desempenho em celulares.

## Fonte e licença

Código: MIT. Dados COD: CC0, com reconhecimento dos autores originais. Modelos de MOFs: derivados educacionais da coleção pública identificada no painel de proveniência.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
