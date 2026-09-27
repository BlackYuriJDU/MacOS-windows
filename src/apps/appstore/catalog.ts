export interface CatalogApp {
  id: string;
  name: string;
  desc: string;
  category: string;
}

/** Seleção curada da aba Descobrir — apps populares, gratuitos, IDs winget confirmados. */
export const CATALOG: CatalogApp[] = [
  // Navegadores
  { id: "Google.Chrome", name: "Google Chrome", desc: "Navegador rápido do Google", category: "Navegadores" },
  { id: "Mozilla.Firefox", name: "Firefox", desc: "Navegador livre e privado", category: "Navegadores" },
  { id: "Brave.Brave", name: "Brave", desc: "Navegador com bloqueio de anúncios", category: "Navegadores" },
  { id: "Microsoft.Edge", name: "Microsoft Edge", desc: "Navegador da Microsoft", category: "Navegadores" },
  // Produtividade
  { id: "Microsoft.VisualStudioCode", name: "VS Code", desc: "Editor de código da Microsoft", category: "Produtividade" },
  { id: "Notepad++.Notepad++", name: "Notepad++", desc: "Editor de texto leve", category: "Produtividade" },
  { id: "Obsidian.Obsidian", name: "Obsidian", desc: "Notas em Markdown conectadas", category: "Produtividade" },
  { id: "TheDocumentFoundation.LibreOffice", name: "LibreOffice", desc: "Suíte de escritório livre", category: "Produtividade" },
  // Mídia
  { id: "VideoLAN.VLC", name: "VLC", desc: "Reprodutor de mídia universal", category: "Mídia" },
  { id: "Spotify.Spotify", name: "Spotify", desc: "Streaming de música", category: "Mídia" },
  { id: "Audacity.Audacity", name: "Audacity", desc: "Editor de áudio", category: "Mídia" },
  // Comunicação
  { id: "Discord.Discord", name: "Discord", desc: "Chat de voz e texto", category: "Comunicação" },
  { id: "Telegram.TelegramDesktop", name: "Telegram", desc: "Mensageiro rápido", category: "Comunicação" },
  { id: "WhatsApp.WhatsApp", name: "WhatsApp", desc: "Mensagens e chamadas", category: "Comunicação" },
  { id: "Zoom.Zoom", name: "Zoom", desc: "Videoconferências", category: "Comunicação" },
  // Utilidades
  { id: "7zip.7zip", name: "7-Zip", desc: "Compactador de arquivos", category: "Utilidades" },
  { id: "Microsoft.PowerToys", name: "PowerToys", desc: "Utilitários da Microsoft", category: "Utilidades" },
  { id: "voidtools.Everything", name: "Everything", desc: "Busca instantânea de arquivos", category: "Utilidades" },
  { id: "ShareX.ShareX", name: "ShareX", desc: "Captura de tela avançada", category: "Utilidades" },
  // Dev
  { id: "Git.Git", name: "Git", desc: "Controle de versão", category: "Dev" },
  { id: "OpenJS.NodeJS.LTS", name: "Node.js LTS", desc: "Runtime JavaScript", category: "Dev" },
  { id: "Python.Python.3.13", name: "Python 3.13", desc: "Linguagem Python", category: "Dev" },
  { id: "GitHub.GitHubDesktop", name: "GitHub Desktop", desc: "Git com interface gráfica", category: "Dev" },
];

export const CATEGORIES = ["Navegadores", "Produtividade", "Mídia", "Comunicação", "Utilidades", "Dev"];
