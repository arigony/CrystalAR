# CrystalAR

**CrystalAR** é um visualizador educacional aberto para estruturas cristalográficas em 3D e realidade aumentada no navegador.

## Versão

`v0.5.0` — galeria expandida com 16 estruturas, proveniência reproduzível e funcionamento independente de CORS.

## Galeria didática local

### Formas do carbono

- diamante — COD `9012293`;
- grafite 2H — COD `1200017`;
- grafeno — modelo periódico 2D educacional com vácuo artificial.

### Enxofre molecular

- α-S₈ ortorrômbico — COD `9011362`;
- β-S₈ monoclínico — COD `4124791`;
- γ-S₈ monoclínico — COD `2002079`;
- ciclo-S₆ — COD `9012361`.

A comparação diferencia **polimorfismo** — mesma molécula S₈ em empacotamentos diferentes — de **alotropia molecular**, representada pela mudança de S₈ para S₆.

### Cristal molecular

- iodo sólido, I₂ — COD `9008595`.

### Sólidos iônicos

- NaCl — COD `1000041`;
- CsCl — COD `9008789`;
- MgO — COD `1011173`;
- CaF₂ — COD `1000043`.

### Redes metal-orgânicas

- MOF-5/IRMOF-1 — COD `1516287`;
- ZIF-8 — COD `7111973`.

Os MOFs são abertos inicialmente em `1×1×1` e wireframe para reduzir o custo gráfico em celulares.

### Polimorfos do ZnS

- blenda de zinco — COD `9000107`;
- wurtzita 2H — COD `1100044`.

## Fluxo reproduzível para outros CIFs

1. informe o COD ID;
2. abra a URI oficial do COD;
3. salve o CIF no dispositivo;
4. abra o arquivo localmente no CrystalAR;
5. registre COD ID, URI, data, versão do aplicativo e SHA-256.

O navegador não consulta o COD automaticamente. Essa arquitetura segue a recomendação técnica recebida da equipe do COD e mantém a origem dos dados explícita.

## Funcionalidades

- galeria local categorizada e responsiva;
- ball-and-stick, space-filling e wireframe;
- cela unitária e supercelas `1×1×1`, `2×2×2` e `3×3×3`;
- upload local de `.cif` e `.mcif`;
- cálculo de SHA-256 no navegador;
- painel de metadados, nota didática, referência e proveniência;
- WebAR com câmera, rastreamento de mão e fallback por toque ou mouse.

## Testes

```bash
npm run check
npm test
```

Os testes verificam sintaxe, inicialização real em navegador, parser, galeria, CIFs locais, proveniência e conexão entre os cartões e seus arquivos.

## Limitações

- o parser cobre CIF 1.1 comum, não todos os casos avançados;
- ligações são inferidas geometricamente;
- ocupações parciais e desordem podem exigir curadoria adicional;
- células de MOFs são grandes e podem reduzir o desempenho em celulares;
- o grafeno é um modelo 2D educacional, não uma determinação cristalográfica 3D.

## Fonte e licença

Código: MIT. Dados locais experimentais: entradas COD disponibilizadas em CC0, com reconhecimento dos autores originais e dos COD IDs.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
