# CrystalAR

**CrystalAR** é um visualizador educacional aberto para estruturas cristalográficas em 3D e realidade aumentada no navegador.

## Versão

`v0.3.0` — galeria local de estruturas fundamentais, com proveniência experimental explícita e funcionamento independente de CORS.

## Galeria didática local

A galeria principal não depende de servidores externos. Os arquivos são processados diretamente pelo navegador.

### Formas do carbono

- diamante — derivado da entrada experimental COD `9012293`;
- grafite 2H — derivado da entrada experimental COD `1200017`;
- grafeno — modelo periódico 2D educacional, com espaçamento de vácuo artificial claramente identificado.

### Sólidos iônicos

- NaCl, estrutura sal-gema — COD `1000041`;
- CsCl, estrutura tipo CsCl — COD `9008789`;
- MgO, periclásio — COD `1011173`;
- CaF₂, fluorita — COD `1000043`.

### Polimorfos do ZnS

- blenda de zinco — COD `9000107`;
- wurtzita 2H — COD `1100044`.

Os CIFs experimentais locais são **derivados educacionais**: preservam o COD ID, os parâmetros cristalográficos, a estrutura convencional e a referência bibliográfica, mas foram expandidos explicitamente para renderização estável no navegador. Não são apresentados como cópias intocadas dos arquivos exportados pelo COD.

## Funcionalidades

- galeria local categorizada e responsiva;
- classificação visível entre dados derivados de determinação experimental e modelo 2D;
- notas didáticas sobre coordenação, empilhamento e tipo estrutural;
- representação ball-and-stick, space-filling e wireframe;
- seleção automática de space-filling sem cilindros para sólidos iônicos;
- cela unitária e supercelas `1×1×1`, `2×2×2` e `3×3×3`;
- busca opcional por COD ID;
- upload local de arquivos `.cif`;
- parser CIF executado no navegador;
- AR com câmera frontal/traseira;
- rastreamento de mão com MediaPipe HandLandmarker;
- rotação pela mão, zoom por pinça e fallback por toque, mouse e roda;
- painel de metadados, proveniência, nota didática e referência.

## Busca remota

A busca por outros COD IDs permanece disponível, mas depende da disponibilidade dos servidores e das permissões CORS. A galeria local continua funcional mesmo quando a consulta remota falha.

## Testes

```bash
npm run check
npm test
npm run smoke:remote
```

O teste `tests/gallery.test.mjs` valida todos os CIFs locais, parâmetros de cela, coordenadas cartesianas e a identificação explícita do grafeno como modelo educacional.

## Limitações

- o parser cobre CIF 1.1 comum, não todos os casos avançados;
- ligações são inferidas geometricamente;
- nos sólidos iônicos, os cilindros são desativados por padrão para evitar a representação enganosa de ligações covalentes localizadas;
- o grafeno é um modelo periódico 2D com vácuo artificial no eixo perpendicular;
- os CIFs locais são derivados educacionais de dados experimentais, não exportações integrais e intocadas do COD;
- supercelas grandes podem reduzir o desempenho em celulares.

## Fonte e licença

Código: MIT. Dados estruturais derivados do COD: CC0, com reconhecimento dos autores originais e dos COD IDs.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
