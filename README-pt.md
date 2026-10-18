# dsh-font-enhancer

> Personalize, por região, a tipografia da interface do DSH: fonte, tamanho, entrelinha, peso, itálico e cor. Inclui criação de regiões por seleção na tela, estilos unificados, temas salvos, paletas aleatórias, instalação de 8 fontes "cute" em um clique e um catálogo de 128 skins compartilhado com as outras duas bolhas flutuantes.

> Documentação completa: [README em inglês](./README.md) · [中文速查](./README-zh.md)

## Visão geral

| Recurso | Detalhe |
|---|---|
| Ajustes por região | **10** regiões integradas; cada uma com fonte chinesa/inglesa, tamanho, entrelinha, peso (100–900), itálico e cor |
| Seleção de região | Clique em elementos da página ao vivo e crie sua própria região — sem escrever seletores CSS |
| Unificado | Três interruptores (cor / fonte / itálico) aplicados a todas as regiões ativas |
| Temas | Salve toda a configuração como tema nomeado; aplique, renomeie, exclua |
| Aleatório | 🎲 fonte aleatória, 🎨 paleta aleatória (passo do ângulo áureo) |
| Instalação de fontes | **8** fontes "cute" em um clique (com progresso); também aceita seu .ttf/.otf |
| Skins | **128** skins compartilhadas com dsh-todo-float-ball e dsh-skill-browser, sincronizadas em tempo real |
| Persistência | localStorage + backup em `settings.json` do host; sobrevive a recarregamentos, reinícios e atualizações |
| Plataformas | Web GUI do DSH e desktop (Electron) |

## As 10 regiões integradas

Todas localizadas por atributos estáveis **`data-slot`**, imunes às mudanças das classes hash do CSS-Modules.

1. Barra lateral · 2. Área de chat · 3. Cabeçalho do chat · 4. Área de entrada · 5. Progresso de todo ·
6. Espaço de trabalho · 7. Informações do chat · 8. Marca/Logo · 9. Barra lateral inferior esquerda · 10. Barra inferior de informações do chat (nova na v1.5.2)

## Fontes

- **18 chinesas** · **18 inglesas** · **8 instaláveis em um clique** (LXGW WenKai, Smiley Sans, ZCOOL KuaiLe, Comic Neue, Baloo 2, Fredoka, Nunito, Caveat)
- Padrão: inglês Times New Roman, chinês 楷体

## Skins (128, compartilhadas pelas três bolhas)

招牌特效 28 · 浓郁深底 38 · 尘埃灰调 20 · 柔光深底 15 · 中性点缀 10 · 浅色纸面 17

## Como usar o painel

1. Clique na bolha **Aa** (canto inferior direito)
2. Topo: seletor de tema + nome + **💾 Salvar** / **Aplicar** / ✏ Renomear / ✕ Excluir
3. Meio: os três interruptores de **Unificado** + **🖱 Selecionar região** + **🎲 Fonte aleatória** + **🎨 Cor aleatória** + **🔄 Recarregar**
4. Abaixo: um cartão por região — marque a caixa, fontes à esquerda, tamanho/peso/itálico/cor à direita
5. No fim: instalação de fontes "cute" + adicionar seu próprio arquivo de fonte

## Instalação

```bash
dsh plugin --profile desktop add dsh-font-enhancer
```

Ou procure "字体" no mercado de plugins.

**Erro conhecido**: se aparecer `minimumReleaseAge` ou `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, o plugin não está quebrado: o DSH aplica uma janela de segurança de 24 h para pacotes npm recém-publicados. Aguarde um dia e tente novamente.

## Onde os dados ficam

| Local | Conteúdo |
|---|---|
| localStorage | Configuração de regiões, temas, estado unificado, skin escolhida |
| `settings.json` do host | Backup — `~/.dsh/data/dsh-font-enhancer/settings.json` |
| Fontes instaladas | Diretório de fontes do host, servido em `/dsh-font-enhancer/fonts/*` |

No desktop a origem muda a cada reinício, então o localStorage pode estar vazio; nesse caso a configuração é restaurada do `settings.json`.

## Perguntas frequentes

**O estilo não aplica?** Clique em **🔄 Recarregar** no painel, ou no botão "重载" do DSH, ou feche e reabra a bolha.

**Instalei a fonte mas ela não aparece na lista?** No desktop clique em 🔄 Recarregar; na web, F5.

**O interruptor Unificado está ligado e o aleatório não faz nada?** Com unificado ligado, o aleatório altera o valor unificado, não cada região — é o comportamento projetado.

**A região criada por seleção some após reiniciar?** Corrigido na v1.5.2. Se ainda falhar, use **🖱 Destacar** para ver quantos elementos correspondem; "nenhum elemento correspondente" significa que a estrutura do frontend do DSH mudou e é preciso selecionar novamente.

## Licença

MIT · [GitHub Issues](https://github.com/loyalchiiina/dsh-font-enhancer/issues)
