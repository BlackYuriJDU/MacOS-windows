# Mac OS (para Windows)

Um **ambiente de trabalho estilo macOS que roda como um app Windows comum** — clique, tela cheia, e o seu Windows vira um Mac (funcional). Nada de máquina virtual, nada de Hackintosh: é uma recriação autoral do shell do macOS com os apps básicos funcionando de verdade sobre o seu Windows real.

![Plataforma](https://img.shields.io/badge/plataforma-Windows%2010%2F11%20(x64%20%2B%20ARM64)-0078D4)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

## O que é

- **Shell macOS recriado do zero**: barra de menus que segue o app ativo, Dock com ampliação parabólica, janelas com semáforos (vermelho fecha a janela, amarelo minimiza, verde amplia), Spotlight, Launchpad, Central de Controle, papel de parede em gradiente, tema claro/escuro.
- **Modo Foco**: ao entrar, congela os aplicativos em segundo plano com a mesma técnica do Process Explorer (`NtSuspendProcess`) e os **retoma intactos na saída** — abas, documentos, tudo de volta. Ou finaliza os apps de verdade, se preferir. Processos do sistema ficam sempre protegidos, e um arquivo de estado garante a retomada mesmo se o app cair.
- **Apps funcionais**: Finder (arquivos reais do seu Windows, com Quick Look), Notas (persistente), Calculadora, Terminal (comandos reais de leitura do sistema), Ajustes, Sobre (hardware real), Safari embutido e Lixeira.

## O que não é

- Não é uma VM, não é um Hackintosh, não roda apps de Mac.
- **Nenhum asset da Apple é distribuído**: sem logo, sem fontes SF (a licença da Apple proíbe), sem wallpapers originais. Todo o visual é recriação autoral (gradientes CSS, SVGs próprios, fontes abertas Inter + JetBrains Mono).

> Projeto de fã, **sem qualquer afiliação com a Apple Inc.** "macOS" e "Mac" são marcas da Apple. Este repositório distribui apenas código original.

## Stack

Tauri 2 (Rust) + WebView2 · React 18 + TypeScript + Tailwind v4 + Zustand + Framer Motion. No Windows ARM64 roda **nativo** (aarch64), sem emulação.

## Desenvolvimento

```bash
npm install
npx tauri dev        # precisa de Rust + MSVC Build Tools
```

Sem Rust, dá para iterar no navegador puro (com mocks):

```bash
npm run dev
```

Build de release:

```bash
npx tauri build --target aarch64-pc-windows-msvc   # ARM64
npx tauri build --target x86_64-pc-windows-msvc   # x64
```

## Roadmap (v0.2+)

- Controle real de brilho/volume (WMI + IAudioEndpointVolume)
- Mission Control, Spaces e notificações
- Suspensão via ProcessStateChange (auto-retomada se o app morrer)
- Suspensão seletiva por app (lista editável nos Ajustes)
- Safari com webview dedicada (sem limite de X-Frame-Options)

## Licença

MIT — veja [LICENSE](LICENSE).
