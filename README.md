# CrystalAR

**CrystalAR** é um visualizador educacional aberto de estruturas cristalográficas em 3D e realidade aumentada diretamente no navegador.

## Versão

`5.0.0` — **Polimorfismo, sólidos cristalinos e materiais porosos**.

A versão 5.0 reorganiza a galeria em cinco famílias e amplia o escopo para quinze estruturas, distinguindo de forma explícita dados cristalográficos experimentais, derivados educacionais e modelos limpos de materiais porosos.

## Galeria didática

### Formas do carbono

- diamante — derivado do COD `9012293`;
- grafite 2H — derivado do COD `1200017`;
- grafeno — modelo periódico 2D educacional com vácuo artificial.

### Enxofre molecular: polimorfismo de S₈

- α-S₈ ortorrômbico — COD `9011362`;
- β-S₈ monoclínico — COD `4124791`;
- γ-S₈ monoclínico — COD `2002079`.

As três estruturas possuem a mesma unidade molecular S₈, mas diferem no empacotamento cristalino. Isso permite separar **polimorfismo** de mudança de composição molecular.

### Sólidos iônicos

- NaCl — COD `1000041`;
- CsCl — COD `9008789`;
- MgO — COD `1011173`;
- CaF₂ — COD `1000043`.

### Redes metal-orgânicas

- MOF-5/IRMOF-1 — modelo limpo identificado por `EDUSIF`;
- HKUST-1/Cu-BTC — modelo limpo identificado por `FIQCEN`;
- ZIF-8 — modelo limpo identificado por `OFERUN`.

Os modelos de MOFs são derivados educacionais sem solventes, com ocupação integral e simetria P1 explícita. Não são apresentados como CIFs experimentais intactos. A visualização inicial usa wireframe e cela `1 × 1 × 1` para reduzir o custo gráfico em celulares.

### Polimorfos do ZnS

- blenda de zinco — COD `9000107`;
- wurtzita 2H — COD `1100044`.

## Metadados didáticos dos MOFs

Cada cartão informa o nó metálico, o ligante, a topologia e a característica estrutural principal:

| Estrutura | Nó | Ligante | Topologia | Destaque |
| --- | --- | --- | --- | --- |
| MOF-5 | Zn₄O | tereftalato (BDC) | pcu | grandes cavidades cúbicas |
| HKUST-1 | Cu₂ paddlewheel | BTC | tbo | sítios metálicos abertos após ativação |
| ZIF-8 | Zn tetraédrico | 2-metilimidazolato | sod | cavidades conectadas por janelas estreitas |

## Proveniência e reprodutibilidade

Para cada estrutura, o CrystalAR apresenta, quando disponível:

- classificação do arquivo;
- COD ID ou identificador estrutural do modelo;
- URI da fonte;
- versão do aplicativo;
- data de incorporação;
- SHA-256 do texto CIF processado;
- referência cristalográfica contida no arquivo.

Arquivos experimentais adicionais continuam sendo obtidos pelo fluxo em duas etapas: abrir a URI oficial do COD, salvar o CIF e carregá-lo localmente. O arquivo não é enviado para outro servidor.

## Funcionalidades

- galeria local categorizada e responsiva;
- ball-and-stick, space-filling e wireframe;
- cela unitária e supercelas `1 × 1 × 1`, `2 × 2 × 2` e `3 × 3 × 3`;
- upload de `.cif` e `.mcif` processado no navegador;
- cálculo de SHA-256;
- painel de metadados, referência, nota didática e proveniência;
- WebAR com câmera, rastreamento de mão e fallback por toque, mouse e roda;
- teste automatizado de inicialização em navegador real.

## Testes

```bash
npm run check
npm test
npm run smoke:browser
```

Os testes verificam os quinze CIFs, parâmetros de cela, coordenadas cartesianas, conexão entre cartões e arquivos, proveniência, escopo da versão e inicialização completa no Chrome.

## Escopo adiado

S₆ e UiO-66 não fazem parte do lançamento 5.0.0. S₆ depende de validação adicional da seleção estrutural; UiO-66 exige tratamento explícito de desordem, ocupações fracionárias e hóspedes. Modos de superfície de poros e separação automática entre nó, ligante e hóspedes ficam para uma versão posterior.

## Limitações

- o parser cobre CIF 1.1 comum, não todos os casos avançados;
- ligações são inferidas geometricamente;
- o parser registra ocupações e grupos de desordem, mas não resolve automaticamente configurações desordenadas;
- os modelos limpos de MOFs representam a rede para fins didáticos e não preservam solventes ou desordem da determinação original;
- supercelas grandes podem reduzir o desempenho em celulares.

## Fonte e licença

Código: MIT. Estruturas derivadas do COD mantêm identificadores e referências. Os modelos de MOFs são derivados da coleção pública usada no `mlip-arena`, com os identificadores estruturais preservados.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
