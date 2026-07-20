# CrystalAR

**CrystalAR** é um visualizador educacional aberto para estruturas cristalográficas em 3D e realidade aumentada no navegador.

## Versão

`v0.4.0` — fluxo reproduzível para dados do Crystallography Open Database: galeria local versionada, abertura da URI oficial do COD, carregamento local do CIF e registro de proveniência com SHA-256.

## Arquitetura de dados

A aplicação não tenta mais baixar automaticamente um CIF do servidor do COD a partir do JavaScript do GitHub Pages.

Para uma estrutura que não esteja na galeria:

1. o usuário informa o COD ID;
2. o CrystalAR abre a URI oficial `https://www.crystallography.net/cod/{COD_ID}.cif` em outra guia;
3. o usuário salva o CIF no dispositivo;
4. o arquivo é aberto localmente no CrystalAR;
5. o navegador calcula o SHA-256 do texto CIF carregado e apresenta a proveniência.

Esse desenho mantém explícitos o arquivo realmente utilizado, o identificador da estrutura, a versão do aplicativo e a origem dos dados. O upload é processado localmente e não envia o CIF para outro servidor.

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

## Proveniência apresentada

Para cada estrutura local ou arquivo aberto pelo usuário, o painel registra, quando disponível:

- classificação da estrutura;
- COD ID;
- URI oficial do CIF;
- data de incorporação ao CrystalAR ou indicação de uso na sessão atual;
- versão do aplicativo;
- SHA-256 do texto CIF processado no navegador;
- referência estrutural contida no arquivo.

O botão **Copiar proveniência** produz um bloco de texto que pode ser anexado a relatórios, roteiros de aula e registros de pesquisa.

## Funcionalidades

- galeria local categorizada e responsiva;
- classificação visível entre dados derivados de determinação experimental e modelo 2D;
- notas didáticas sobre coordenação, empilhamento e tipo estrutural;
- abertura da URI oficial a partir de um COD ID;
- cópia da URI oficial;
- upload local de arquivos `.cif` e `.mcif`;
- cálculo SHA-256 no navegador;
- representação ball-and-stick, space-filling e wireframe;
- seleção automática de space-filling sem cilindros para sólidos iônicos;
- cela unitária e supercelas `1×1×1`, `2×2×2` e `3×3×3`;
- parser CIF executado no navegador;
- AR com câmera frontal/traseira;
- rastreamento de mão com MediaPipe HandLandmarker;
- rotação pela mão, zoom por pinça e fallback por toque, mouse e roda;
- painel de metadados, proveniência, nota didática e referência.

## Testes

```bash
npm run check
npm test
```

Os testes validam os CIFs da galeria, parâmetros de cela, coordenadas cartesianas, a identificação explícita do grafeno como modelo educacional e o fluxo reproduzível de abertura da URI oficial sem busca automática entre domínios.

## Limitações

- o parser cobre CIF 1.1 comum, não todos os casos avançados;
- ligações são inferidas geometricamente;
- nos sólidos iônicos, os cilindros são desativados por padrão para evitar a representação enganosa de ligações covalentes localizadas;
- o grafeno é um modelo periódico 2D com vácuo artificial no eixo perpendicular;
- os CIFs locais são derivados educacionais de dados experimentais, não exportações integrais e intocadas do COD;
- o SHA-256 corresponde ao texto CIF decodificado e processado no navegador;
- supercelas grandes podem reduzir o desempenho em celulares.

## Fonte e licença

Código: MIT. Dados estruturais derivados do COD: CC0, com reconhecimento dos autores originais e dos COD IDs.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
