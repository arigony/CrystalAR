# CrystalAR 5.1.0 — comparação científica de polimorfos

## Escopo

A versão 5.1.0 acrescenta seis estruturas, dois roteiros comparativos e ferramentas de interpretação cristalográfica, preservando a experiência móvel e WebAR da versão 5.0.0.

## Novas estruturas

- TiO₂: rutilo (`9015662`), anatásio (`9015929`) e brookita (`9004137`);
- CaCO₃: calcita (`9000095`), aragonita (`9000229`) e vaterita (`9007475`).

Os arquivos locais são derivados educacionais expandidos em P1, com COD ID, referência, cela e grupo espacial original preservados.

## Novas funções

- regras de contatos específicas por par de elementos;
- distinção entre ligações covalentes e coordenação;
- poliedros de coordenação opcionais;
- medição de distâncias e ângulos;
- transparência proporcional para ocupações parciais;
- roteiro sequencial com perguntas de investigação;
- alerta científico específico para o modelo histórico de vaterita.

## Validação esperada

- `npm run check`;
- `npm test`;
- `npm run smoke:browser`;
- teste manual em celular para galeria, medição, poliedros e AR.
