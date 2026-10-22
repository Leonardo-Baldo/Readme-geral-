# 🎓 CertifyVault - Galeria & Gerenciador Ilimitado de Certificados

Um sistema moderno, rápido e sem limites para você armazenar, gerenciar e apresentar todas as suas certificações, diplomas e cursos concluídos diretamente pelo navegador.

---

## 🚀 Como Abrir

Você pode abrir o sistema de duas formas muito simples:

1. **Diretamente no navegador:**
   - Dê um duplo clique no arquivo [`index.html`](index.html) ou arraste-o para o Chrome, Edge, Firefox, Brave, etc.
2. **Via servidor local (opcional):**
   - Abra um terminal nesta pasta e execute:
     ```bash
     python -m http.server 5500
     ```
   - Depois acesse: `http://localhost:5500`

---

## 🌟 Principais Recursos

- ♾️ **Armazenamento Sem Limites:** Utiliza **IndexedDB**, tecnologia nativa de alta capacidade que permite guardar centenas de certificados em alta resolução (imagens e PDFs) sem a restrição de 5MB do `localStorage`.
- 📁 **Suporte a Imagens e PDFs:** Carregue arquivos nos formatos `PNG`, `JPG`, `WEBP`, `SVG` e documentos `PDF` com arrastar e soltar (*drag & drop*) ou seletor de arquivos.
- 🔍 **Busca em Tempo Real & Filtros:** Pesquise instantaneamente por título, instituição emissora, tags ou habilidades (ex: *Python*, *AWS*, *Scrum*).
- 🏷️ **Categorias Inteligentes:** Filtre por Tecnologia, Cloud & DevOps, Gestão & Ágil, Idiomas, Design & UX, Acadêmico e Outros.
- 👁️ **3 Modos de Visualização:**
  - **Grade (Cards):** Visual rico com efeitos de hover e capas.
  - **Lista:** Visualização compacta e objetiva.
  - **Linha do Tempo (Timeline):** Organizado cronologicamente por ano de conclusão.
- 🔍 **Visualizador / Lightbox Completo:**
  - Zoom interativo (Aumentar, Reduzir, Ajustar à tela).
  - Cópia do código de autenticação com 1 clique.
  - Link direto de validação no site oficial.
  - Botão de download do arquivo original.
  - Botão de impressão / exportar em PDF formatado.
- 💾 **Backup & Restauração Completa:**
  - Exporte todos os seus certificados e imagens em um arquivo `.json` de backup.
  - Importe e restaure seus dados em qualquer computador com total segurança e privacidade (seus dados nunca saem do seu computador).
- 🌓 **Tema Claro e Escuro:** Alterne com um clique entre o modo dark com glassmorphism e o modo light elegante.
