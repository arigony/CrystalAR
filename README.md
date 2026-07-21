# CrystalAR

**CrystalAR** é um visualizador educacional aberto de estruturas cristalográficas em 3D e realidade aumentada diretamente no navegador.

## Versão

`5.1.1` — **Comparação científica de polimorfos, coordenação e ocupação cristalográfica**.

A versão 5.1 reúne **21 estruturas**. A correção 5.1.1 torna a versão científica explícita no HTML inicial, atualiza o cache dos arquivos estáticos, sincroniza a proveniência e amplia o teste em navegador real.

## Roteiros comparativos

### TiO₂

- rutilo — COD `9015662`, P4₂/mnm;
- anatásio — COD `9015929`, I4₁/amd;
- brookita — COD `9004137`, Pbca.

O roteiro compara cela, conectividade e distorção dos octaedros TiO₆.

### CaCO₃

- calcita — COD `9000095`, R-3c;
- aragonita — COD `9000229`, Pmcn;
- vaterita — COD `9007475`, modelo médio histórico P6₃/mmc.

O aplicativo distingue ligações C–O de contatos Ca–O. Na vaterita, posições com ocupação `1/3` aparecem com transparência e alerta de interpretação.

## Integridade cristalográfica

Os seis novos arquivos são derivados educacionais expandidos em P1. COD ID, autores, parâmetros da cela e grupo espacial original permanecem registrados. Os arquivos locais não são apresentados como CIFs experimentais intactos.

## Funcionalidades

- 21 estruturas em sete famílias;
- roteiro guiado de polimorfos;
- regras específicas para Ti–O, C–O e Ca–O;
- poliedros de coordenação opcionais;
- medição de distâncias e ângulos;
- representação de ocupações parciais;
- ball-and-stick, space-filling e wireframe;
- celas unitárias e supercelas;
- upload local de CIF, SHA-256 e proveniência;
- WebAR com rastreamento de mão e fallback por toque.

## Testes

```bash
npm run check
npm test
npm run smoke:browser
```

Os testes verificam os CIFs, ocupação parcial, regras químicas, versão exibida no HTML e no DOM, famílias TiO₂ e CaCO₃, controles científicos e inicialização no Chrome.

## Limitações

- estruturas antigas ainda podem usar inferência geométrica genérica;
- poliedros nas fronteiras podem exigir supercela `2 × 2 × 2`;
- a vaterita selecionada é um modelo médio histórico;
- supercelas grandes podem reduzir o desempenho em celulares.

## Fonte e licença

Código: MIT. Dados COD: CC0, com reconhecimento dos autores originais. Modelos de MOFs: derivados educacionais identificados no painel de proveniência.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
