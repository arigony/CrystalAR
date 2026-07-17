# CrystalAR

**CrystalAR** é um visualizador educacional aberto para estruturas cristalográficas em 3D e realidade aumentada no navegador.

## Versão

`v0.2.1` — correção da busca por COD ID com filtro numérico exato e tempo de espera limitado.

## Funcionalidades

- busca por **COD ID**;
- validação do COD ID devolvido para impedir a exibição de uma estrutura incorreta;
- filtro exato na coluna numérica `file` do espelho COD, evitando busca textual lenta em centenas de milhares de CIFs;
- consultas remotas em paralelo, com tempo limite;
- cache via Cache Storage;
- exemplos locais de diamante, BaO e CoFe₂O₄;
- fallback para um snapshot CC0 do COD no Hugging Face Dataset Viewer;
- suporte opcional a proxy próprio configurado em `window.CRYSTALAR_PROXY_URL`;
- upload local de arquivos `.cif`;
- parser CIF executado no navegador;
- cela unitária e supercelas `1×1×1`, `2×2×2` e `3×3×3`;
- modos ball-and-stick, space-filling e wireframe;
- AR com câmera frontal/traseira;
- rastreamento de mão com MediaPipe HandLandmarker;
- rotação pela mão, zoom por pinça e fallback por toque, mouse e roda;
- painel de metadados, proveniência e citação.

## Arquitetura de dados

O navegador tenta:

1. cache local;
2. exemplo local, quando disponível;
3. filtro numérico exato no snapshot CC0 `LMucko/crystallography-open-database`;
4. servidores oficiais do COD, quando o navegador permite CORS;
5. proxy próprio, quando configurado.

As fontes remotas são consultadas de forma concorrente, e a interface não deve permanecer indefinidamente na tela de carregamento.

## Testes

```bash
npm run check
npm test
npm run smoke:remote
```

O workflow `.github/workflows/quality.yml` verifica sintaxe, funções de parsing/AR e realiza um teste remoto do COD `1506803`, incluindo a validação do CIF e do COD ID.

## Limitações

- o parser cobre CIF 1.1 comum, não todos os casos avançados;
- ligações são inferidas geometricamente;
- supercelas grandes podem reduzir o desempenho;
- o snapshot do Hugging Face é um espelho de terceiros datado de 6 de julho de 2026;
- IDs recém-depositados podem ainda não existir nesse snapshot;
- os servidores oficiais do COD podem bloquear leitura por CORS no navegador.

## Fonte e licença

Código: MIT. Dados COD: CC0, com reconhecimento dos autores originais das estruturas.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
