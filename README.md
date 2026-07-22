# CrystalAR

**CrystalAR** é um visualizador educacional aberto de estruturas cristalográficas em 3D e realidade aumentada diretamente no navegador.

## Versão

`5.3.2` — **Composição, conectividade atômica e propriedades: diamante × grafite**.

A versão 5.3 mantém as **21 estruturas** e amplia a 5.2 com um roteiro introdutório sobre alotropia do carbono. Fotografias reais de diamante bruto e grafite lamelar são comparadas aos respectivos modelos cristalográficos, sem confundir aparência macroscópica com organização atômica.

Na correção 5.3.2, o selo visual ‘imagem real’ foi removido e a fotografia do diamante foi substituída por um exemplar natural maclado, triangular e transparente, com licença CC BY-SA 3.0. As miniaturas compactas e a ampliação por mouse ou toque foram preservadas.

## Roteiros comparativos

### Carbono: diamante × grafite

- diamante — COD `9012293`, Fd-3m;
- grafite 2H — COD `1200017`, P6₃/mmc.

O roteiro compara:

- mesma composição química: `C`;
- coordenação `4` versus `3`;
- geometria tetraédrica/sp³ versus trigonal planar/sp²;
- rede covalente tridimensional versus folhas bidimensionais empilhadas;
- dureza e isolamento elétrico versus maciez e condução anisotrópica.

Uma matriz comparativa e perguntas de investigação conduzem a relação **estrutura → propriedade**. Os cartões originais de diamante e grafite abrem diretamente o roteiro científico.

### TiO₂

- rutilo — COD `9015662`, P4₂/mnm;
- anatásio — COD `9015929`, I4₁/amd;
- brookita — COD `9004137`, Pbca.

O roteiro compara cela, conectividade e distorção dos octaedros TiO₆. As fotografias foram selecionadas para deixar cada mineral como protagonista. A imagem principal do rutilo, por exemplo, não utiliza quartzo rutilado.

### CaCO₃

- calcita — COD `9000095`, R-3c;
- aragonita — COD `9000229`, Pmcn;
- vaterita — COD `9007475`, modelo médio histórico P6₃/mmc.

O aplicativo distingue ligações C–O de contatos Ca–O. Na vaterita, posições com ocupação `1/3` aparecem com transparência e alerta de interpretação. Sua imagem complementar é uma micrografia eletrônica real de uma esfera de vaterita, não uma fotografia macroscópica.

## Fotografias e micrografias minerais

As oito imagens estão em `assets/minerals/` e possuem:

- autoria e licença explícitas;
- link para a página original;
- descrição do exemplar ou da técnica de imagem;
- registro das modificações realizadas;
- SHA-256 do arquivo original e do arquivo processado;
- dimensões padronizadas em `900 × 900 px`.

Os dados completos estão em:

- `assets/minerals/IMAGE_CREDITS.md`;
- `assets/minerals/manifest.json`;
- `scripts/fetch-mineral-images.py`.

A interface diferencia **fotografia de exemplar real**, **micrografia eletrônica real** e **modelo atômico 3D**. A aparência externa não é tratada como consequência exclusiva da fórmula ou do grupo espacial: cor e hábito também podem depender de impurezas, geminação, associação mineral e condições de crescimento.

## Integridade cristalográfica

Os oito exemplos dos roteiros científicos são derivados educacionais de determinações experimentais do COD. COD ID, parâmetros da cela e grupo espacial original permanecem registrados. Os arquivos locais não são apresentados como CIFs experimentais intactos.

## Funcionalidades

- 21 estruturas em sete famílias;
- três roteiros guiados: carbono, TiO₂ e CaCO₃;
- matriz estrutura–propriedade para diamante × grafite;
- imagens reais sincronizadas às estruturas;
- regras explícitas C–C, Ti–O, C–O e Ca–O;
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

Os testes verificam os CIFs, ocupação parcial, regras químicas, versão exibida, oito registros de imagem, arquivos JPEG, créditos, licenças, matriz diamante–grafite, integração dos roteiros e inicialização no Chrome.

## Limitações

- uma fotografia mostra um exemplar específico e não todos os hábitos possíveis de um mineral;
- propriedades são apresentadas em nível educacional e podem ser anisotrópicas ou depender de defeitos;
- não se deve comparar diretamente o tamanho da micrografia de vaterita com as amostras macroscópicas;
- estruturas antigas ainda podem usar inferência geométrica genérica;
- poliedros nas fronteiras podem exigir supercela `2 × 2 × 2`;
- a vaterita selecionada é um modelo médio histórico;
- supercelas grandes podem reduzir o desempenho em celulares.

## Fontes e licenças

O código-fonte permanece sob licença **MIT**. Dados COD são CC0, com reconhecimento dos autores originais. Modelos de MOFs são derivados educacionais identificados no painel de proveniência.

As fotografias e micrografias de `assets/minerals/` **não são automaticamente abrangidas pela licença MIT do código**. Cada arquivo mantém a licença registrada em `IMAGE_CREDITS.md` e `manifest.json`. As adaptações de imagens CC BY-SA devem permanecer sob licença compatível e conservar a atribuição.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
