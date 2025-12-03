
---

# Product Backlog — Sistema Interativo de Rotas e Exploração de Locais com OpenStreetMap

## Visão Geral

O **Product Backlog** define todas as **histórias de utilizador**, **critérios de aceitação** e **prioridades** que guiam o desenvolvimento do sistema.
O projeto será desenvolvido em **2 sprints**, seguindo a metodologia **Scrum** e prioriza a entrega de funcionalidades essenciais primeiro.

---

## Sprint 1 — Funcionalidades Núcleo

### **US01 — Visualização do mapa interativo**

**Como** utilizador
**quero** visualizar um mapa baseado no OpenStreetMap
**para** poder explorar a área e selecionar pontos.

* **Critérios de Aceitação:**

  * O mapa é carregado ao iniciar a aplicação.
  * O utilizador pode fazer **zoom**, **pan** e clicar no mapa.
  * A área do mapa é atualizada corretamente ao interagir.

---

### **US02 — Seleção de pontos de origem e destino**

**Como** utilizador
**quero** selecionar dois pontos no mapa (origem e destino)
**para** poder calcular uma rota entre eles.

* **Critérios de Aceitação:**

  * O primeiro clique define a **origem**.
  * O segundo clique define o **destino**.
  * Os pontos são marcados visualmente no mapa.
  * Após definir ambos, é ativado o cálculo da rota.

---

### **US03 — Cálculo e exibição da rota (OSRM)**

**Como** utilizador
**quero** que o sistema calcule a rota entre dois pontos selecionados
**para** ver o trajeto mais eficiente no mapa.

* **Critérios de Aceitação:**

  * A aplicação envia uma requisição à **API OSRM** com as coordenadas.
  * A resposta JSON é processada corretamente.
  * A rota é **desenhada** no mapa como uma linha contínua.
  * Em caso de erro (ex: sem resposta), é exibida uma mensagem informativa.

---

### **US04 — Exibição de distância e tempo**

**Como** utilizador
**quero** ver a **distância total** e o **tempo estimado de viagem** da rota
**para** compreender o percurso calculado.

* **Critérios de Aceitação:**

  * A distância e o tempo são obtidos da resposta da API OSRM.
  * Os valores são exibidos de forma clara na interface.
  * São atualizados automaticamente quando a rota é recalculada.

---

### **US05 — Limpar e reiniciar seleção**

**Como** utilizador
**quero** poder limpar o mapa e reiniciar a seleção de pontos
**para** calcular uma nova rota sem recarregar a página.

* **Critérios de Aceitação:**

  * Um botão ou controlo permite limpar pontos e rota.
  * O mapa retorna ao estado inicial.
  * Todos os elementos visuais da rota desaparecem.

---

##  Sprint 2 — Pesquisa e Interface

### **US06 — Pesquisa de locais (Nominatim)**

**Como** utilizador
**quero** pesquisar um local por nome
**para** centralizar o mapa rapidamente nessa área.

* **Critérios de Aceitação:**

  * Existe um campo de pesquisa na interface.
  * A pesquisa faz uma chamada à **API Nominatim**.
  * O mapa centra-se no local encontrado.
  * Caso não seja encontrado, é exibida uma mensagem adequada.

---

### **US07 — Melhorias na interface (UI/UX)**

**Como** utilizador
**quero** interagir com uma interface clara e intuitiva
**para** compreender facilmente como utilizar o sistema.

* **Critérios de Aceitação:**

  * A interface exibe os elementos principais (mapa, botões, painel informativo).
  * O layout adapta-se a diferentes tamanhos de ecrã.
  * As mensagens e ícones são coerentes e informativos.

---

### **US08 — Pontos de interesse ao longo da rota (Overpass API)**

**Como** utilizador
**quero** visualizar pontos de interesse (POIs) próximos da rota
**para** descobrir locais relevantes durante o percurso.

* **Critérios de Aceitação:**

  * O sistema consulta a **Overpass API** com base na rota calculada.
  * São apresentados POIs (restaurantes, parques, monumentos, etc.).
  * O utilizador pode ativar/desativar esta funcionalidade.

---

### **US09 —  Melhorias de UI e Refino de Funcionalidades**

**Como utilizador**
quero que a interface e certas funcionalidades do sistema sejam mais claras, consistentes e fáceis de utilizar
para ter uma experiência mais fluida ao planear rotas e explorar o mapa.


Inclui apenas melhorias e polimento de UI e UX. Não inclui novas funcionalidades estruturais.

---

### **US10 — Refino e testes finais**

**Como** equipa de desenvolvimento
**quero** testar e melhorar o desempenho e a usabilidade da aplicação
**para** garantir estabilidade e qualidade antes da entrega final.

* **Critérios de Aceitação:**

  * Todos os casos de uso obrigatórios funcionam sem erros.
  * A aplicação é testada em diferentes browsers.
  * O código é documentado e os comentários são coerentes.

---

## Prioridades 

| Prioridade   | História                     |
| ------------ | ---------------------------- |
| **Alta**     | US01, US02, US03, US04, US05 |
| **Média**    | US06, US07                   |
| **Baixa**    | US08, US09                   |
| **Contínua** | US10 (refino e testes)       |

---

## Entregáveis por Sprint

| Sprint       | Funcionalidades Entregues | Entregáveis                                                                               |
| ------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| **Sprint 1** | US01 a US05               | Mapa interativo, cálculo e visualização de rotas, painel de informações, limpeza de mapa. |
| **Sprint 2** | US06 e US07               | Pesquisa de locais e UI refinada.                                                         |
| **Sprint 2** | US08 a US10               | Funcionalidades opcionais (POIs, exportação), testes e documentação final.                |

---
