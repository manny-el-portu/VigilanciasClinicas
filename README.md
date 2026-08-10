# Vigilâncias Médicas - Aplicação Desktop (Tauri v2 + React)

Aplicação de gestão e acompanhamento de vigilâncias médicas e exames periódicos, pronta para ser compilada como aplicação desktop nativa para **Windows 11** (sem necessidade de privilégios de administrador), **macOS** e **Linux**.

---

## 🚀 Como publicar no GitHub e gerar o Executável (.exe / .msi) Automaticamente

O repositório está configurado com **GitHub Actions** (`.github/workflows/release.yml`). Para gerar os executáveis prontos para instalação sem compilar nada no seu computador:

### 1. Enviar o código para o GitHub
```bash
git init
git add .
git commit -m "feat: configuracao Tauri v2 com arranque automatico e GitHub Actions"
git branch -M main
git remote add origin https://github.com/SEU_UTILIZADOR/vigilancias.git
git push -u origin main
```

### 2. Disparar a Compilação Automática (Release)
Sempre que desejar gerar uma nova versão da aplicação com executável para Windows:

1. **Através de Tag (Recomendado):**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. **Através da Interface do GitHub:**
   - Aceda ao seu repositório no GitHub.
   - Vá ao separador **Actions**.
   - Selecione o workflow **Publish Release** e clique em **Run workflow**.

---

## ⚙️ Funcionalidades Integradas de Sistema Desktop

- **Arranque Automático no Windows 11 (`tauri-plugin-autostart`):**
  - Permite ativar/desativar o arranque do programa com o ligar do computador diretamente nas **Definições** da aplicação.
  - Funciona por utilizador (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`), pelo que **NÃO requer privilégios de Administrador** para ativar nem para instalar.

- **Instalação Sem Privilégios de Administrador (Windows NSIS `currentUser`):**
  - Configurado em `src-tauri/tauri.conf.json` com `"installMode": "currentUser"`.
  - Instala na pasta local do utilizador (`%LOCALAPPDATA%`), contornando bloqueios informáticos de TI e permissões administrativas.

- **Suporte para Múltiplas Plataformas:**
  - Gera instalador `.exe` / `.msi` para Windows, `.dmg` / `.app` para macOS e `.AppImage` / `.deb` para Linux.

---

## 🛠️ Desenvolvimento Local (Opcional)

Se preferir testar ou compilar localmente na sua máquina:

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Testar em modo desenvolvimento:**
   ```bash
   npm run tauri dev
   ```

3. **Compilar o executável manualmente:**
   ```bash
   npm run tauri build
   ```
   Os ficheiros compilados serão guardados na pasta `src-tauri/target/release/bundle/`.
