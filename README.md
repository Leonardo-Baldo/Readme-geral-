# 🎓 Repositório de Certificados & Portfólio Interativo

> *De forma geral, utilizarei esse portfólio para demonstrar minhas competências técnicas, desenvolvidas com IA, Java, HTML, CSS, JavaScript e DB futuramente.*

---

Este repositório possui duas partes complementares:

1. 📂 **A pasta [`meus-certificados/`](meus-certificados/):** Onde ficam salvos os arquivos físicos (PDFs e imagens) dos seus certificados reais, versionados pelo Git para que qualquer pessoa que clone o repositório possa acessá-los.
2. 💻 **O Web App Interativo ([`index.html`](index.html)):** Uma aplicação moderna que serve como **vitrine demonstrativa** para recrutadores e outros desenvolvedores explorarem recursos como busca em tempo real, visualizador lightbox, linha do tempo e armazenamento sem limites.

---

## 📂 1. Onde colocar seus Certificados Reais

Coloque seus arquivos dentro da pasta [`meus-certificados/`](meus-certificados/), organizada nas seguintes categorias:

```text
meus-certificados/
├── devops/           # Bootcamp, IA, Agentes, Chatbots e Engenharia de Prompts
├── tecnologia/       # Cursos de Programação, Dados, IA, Engenharia de Software
├── cloud-devops/     # AWS, Azure, Google Cloud, Docker, Kubernetes
├── gestao-agil/      # Scrum, Kanban, Liderança, Metodologias Ágeis
├── idiomas/          # Certificações de Inglês, Espanhol e testes de proficiência
├── graduacao-pos/    # Diplomas de Graduação, Pós-graduação e Especializações
└── outros/           # Palestras, workshops e eventos diversos
```

### Como enviar para o GitHub:
Sempre que você adicionar novos arquivos na pasta `meus-certificados/`, basta rodar:
```bash
git add meus-certificados/
git commit -m "feat: adiciona novos certificados"
git push
```
Dessa forma, qualquer pessoa que clonar o seu repositório terá acesso direto a todos os seus arquivos físicos.

---

## 💻 2. Web App Demonstrativo (`index.html`)

O aplicativo web serve como uma **vitrine de portfólio e demonstração técnica**:

- 🌟 **Certificados de Exemplo Integrados:** Permite que qualquer visitante veja imediatamente como funciona a organização de certificados na prática.
- 🔍 **Filtros e Busca Instantânea:** Pesquisa por nome, instituição ou tecnologias (*Python, AWS, Scrum, Figma*).
- 👁️ **3 Modos de Exibição:** Visualização em Grade (Cards), Lista Compacta ou Linha do Tempo (*Timeline*).
- 🔍 **Visualizador Lightbox:** Zoom in/out, cópia do código de validação, link para checagem online e botão de impressão em PDF.
- 💾 **Armazenamento Seguro via IndexedDB:** O visitante pode inclusive adicionar seus próprios certificados no navegador sem limites artificiais de tamanho.

### Como abrir o App:
* Basta dar um duplo clique no arquivo [`index.html`](index.html) para abrir diretamente no navegador (Chrome, Edge, Firefox, Brave, etc.).
* Ou se preferir rodar um servidor local:
  ```bash
  python -m http.server 5500
  ```
  E acessar `http://localhost:5500` no seu navegador.
