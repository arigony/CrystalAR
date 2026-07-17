# CrystalAR

**CrystalAR** é um visualizador educacional aberto para estruturas cristalográficas em 3D e realidade aumentada no navegador.

## Versão

`v0.2.0` — refatoração da camada de dados e AR com rastreamento de mãos.

## Funcionalidades

- busca por **COD ID**;
- validação do COD ID devolvido para impedir a exibição de uma estrutura incorreta;
- cache via Cache Storage;
- exemplos locais de diamante, BaO e CoFe₂O₄;
- fallback para um snapshot CC0 do COD no Hugging Face Dataset Viewer;
- suporte a proxy próprio do CrystalAR via Cloudflare Worker;
- upload local de arquivos `.cif`;
- parser CIF executado no navegador;
- cela unitária e supercelas `1×1×1`, `2×2×2` e `3×3×3`;
- modos ball-and-stick, space-filling e wireframe;
- AR com câmera frontal/traseira;
- rastreamento de mão com MediaPipe HandLandmarker;
- rotação pela mão, zoom por pinça e fallback por toque, mouse e roda;
- painel de metadados, proveniência e citação.

## Arquitetura de dados

O navegador tenta, nesta ordem:

1. cache local;
2. exemplo local, quando disponível;
3. proxy próprio configurado em `window.CRYSTALAR_PROXY_URL`;
4. snapshot CC0 `LMucko/crystallography-open-database` no Hugging Face Dataset Viewer;
5. servidores oficiais do COD, quando o navegador permite CORS.

Os proxies CORS públicos genéricos foram removidos. Para uso institucional ou produção, implante `worker/index.js` em uma conta Cloudflare e configure a URL no site.

## Testes

```bash
npm run check
npm test
npm run smoke:remote
```

O workflow `.github/workflows/quality.yml` verifica sintaxe, funções de parsing/AR e realiza um teste remoto do COD `1506803`, incluindo o cabeçalho CORS.

## Limitações

- o parser cobre CIF 1.1 comum, não todos os casos avançados;
- ligações são inferidas geometricamente;
- supercelas grandes podem reduzir o desempenho;
- o snapshot do Hugging Face é um espelho de terceiros datado de 6 de julho de 2026;
- para disponibilidade controlada e IDs recém-depositados, use o Worker próprio.

## Fonte e licença

Código: MIT. Dados COD: CC0, com reconhecimento dos autores originais das estruturas.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
