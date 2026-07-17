# CrystalAR

**CrystalAR** é um protótipo educacional aberto para visualizar estruturas cristalográficas em 3D e realidade aumentada diretamente no navegador.

## Versão

`v0.1.2` — recuperação ampliada de estruturas COD e modo de câmera reorganizado com a estratégia validada no MolecuAR.

## Funcionalidades

- busca por **COD ID**, com tentativa direta, espelhos COD, rota de leitura e alternativas compatíveis com CORS;
- cache local de CIFs recuperados pelo navegador;
- exemplos locais de diamante, BaO e CoFe₂O₄ para carregamento imediato;
- exemplo de busca remota do resveratrol, COD `1506803`;
- download de CIF pelo **Crystallography Open Database (COD)**;
- upload local de arquivos `.cif`;
- parser CIF executado no navegador;
- leitura de parâmetros de cela e metadados cristalográficos;
- expansão da unidade assimétrica por operações de simetria presentes no CIF;
- visualização de cela unitária e supercelas `1×1×1`, `2×2×2` e `3×3×3`;
- modos **ball-and-stick**, **space-filling** e **wireframe**;
- inferência geométrica simples de ligações;
- modo AR com câmera frontal ou traseira;
- inicialização da câmera após `loadedmetadata`, com fallback temporizado para navegadores móveis;
- reinicialização controlada do AR ao alternar entre câmeras;
- painel de proveniência e citação da estrutura original;
- GitHub Pages, sem backend próprio e sem chave de API.

## Executar

Publique os arquivos na branch `main` com GitHub Pages configurado para a raiz do repositório.

Também é possível executar localmente com um servidor HTTP simples:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Fonte dos dados

O COD documenta a recuperação de uma estrutura por uma URL previsível:

```text
https://www.crystallography.net/cod/COD_ID.cif
```

Os dados do COD e a base são dedicados ao domínio público sob **CC0**. O aplicativo mantém o COD ID e apresenta os metadados bibliográficos para que os autores originais dos dados estruturais sejam reconhecidos.

## Limitações da versão 0.1.2

- O parser cobre a parte mais comum de CIF 1.1, mas não pretende substituir validadores cristalográficos especializados.
- A visualização depende das operações de simetria explicitamente presentes no arquivo CIF.
- A inferência de ligações é geométrica e pode não representar corretamente ligações deslocalizadas, coordenação metálica ou contatos intermoleculares.
- Desordem, ocupações parciais, modulações, estruturas magnéticas e múltiplos blocos de dados ainda exigem suporte adicional.
- A recuperação remota depende da disponibilidade do COD, de seus espelhos ou de serviços públicos de leitura/compatibilidade CORS.
- Arquivos enviados pelo usuário são processados localmente no navegador e não são enviados aos serviços intermediários.
- Os três exemplos principais possuem cópias educacionais locais para que a interface não fique bloqueada quando o COD estiver inacessível.
- O exemplo local de CoFe₂O₄ representa uma geometria de espinélio idealizada; desordem ou inversão catiônica não são modeladas nesta versão.
- Supercelas grandes podem reduzir o desempenho em celulares.
- O modo AR é uma sobreposição de câmera; ancoragem em superfícies reais exigirá WebXR hit-test em uma etapa futura.
- A câmera depende de HTTPS, permissão concedida pelo usuário e suporte do navegador a `getUserMedia`.

## Estrutura

```text
index.html
style.css
examples/
src/camera-toggle.js
src/bootstrap.js
src/app.js
src/cif-parser.js
src/crystal.js
src/renderer.js
LICENSE
CITATION.cff
```

## Licença

Código: MIT.

Dados COD: CC0, com reconhecimento recomendado aos autores originais das estruturas.

## Autor

Prof. Dr. André Arigony Souto  
PUCRS — Pontifícia Universidade Católica do Rio Grande do Sul  
ORCID: 0000-0002-2437-8767
