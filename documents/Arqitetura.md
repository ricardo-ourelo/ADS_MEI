
# Documento de Arquitetura — Sistema Interativo de Rotas e Exploração de Locais com OpenStreetMap

## 1. Introdução

O objetivo deste documento é descrever a **arquitetura e design de software** do sistema “**Sistema Interativo de Rotas e Exploração de Locais com OpenStreetMap**”.
A aplicação será desenvolvida ao longo de **dois a três sprints**, com base numa metodologia **ágeil (Scrum)**, priorizando a entrega incremental de funcionalidades.

A ênfase da unidade curricular é o **design arquitetural**, a **integração de APIs REST** e a **visualização de dados dinâmicos** em contexto de aplicação web interativa.

---

## 2. Visão Geral do Sistema

O sistema é uma aplicação **web cliente (SPA – Single Page Application)** que utiliza dados do **OpenStreetMap (OSM)** para permitir:

* Visualização e exploração de mapas;
* Seleção de pontos e cálculo de rotas via **OSRM API**;
* (Opcionalmente) pesquisa de locais via **Nominatim**;
* (Opcionalmente) obtenção de pontos de interesse (POIs) via **Overpass API**.

A aplicação é totalmente executada no **lado do cliente (browser)**, comunicando com as APIs externas através de **requisições HTTP (REST)** e processando **respostas JSON**.

---

## 3. Planeamento de Desenvolvimento (Sprints)

| Sprint         | Objetivos Principais                                                                  |
| -------------- | ------------------------------------------------------------------------------------- |
| **Sprint 1**   | Mapa interativo e seleção de pontos; cálculo e exibição de rotas (OSRM).              |
| **Sprint 2**   | Pesquisa de locais (Nominatim) e melhorias na interface do utilizador.                |
| **Sprint 2/3** | Funcionalidades opcionais (POIs, exportação de rotas), refino, testes e documentação. |

---

## 4. Arquitetura de Alto Nível

A arquitetura segue o padrão **cliente modular**, dividido em **camadas funcionais**:

```
┌───────────────────────────────────────┐
│            Interface (UI)             │
│ - Mapa interativo                     │
│ - Controlo de zoom, pan e seleção     │
│ - Painel de informação da rota        │
└───────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│      Lógica de Aplicação (Core)       │
│ - Gestão do estado do mapa e pontos   │
│ - Processamento de respostas JSON     │
│ - Coordenação entre UI e APIs         │
└───────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│       Camada de Integração (APIs)     │
│ - OSRM API (rotas, distância, tempo)  │
│ - Nominatim (geocodificação)          │
│ - Overpass (pontos de interesse)      │
└───────────────────────────────────────┘
```

---

## 5. Principais Componentes

| Componente                   | Função                                                                 |
| ---------------------------- | ---------------------------------------------------------------------- |
| **Mapa (MapManager)**        | Inicializa e gere o mapa, zoom, pan e eventos de clique.               |
| **Rota (RouteManager)**      | Comunica com a API OSRM, calcula e desenha rotas.                      |
| **Pesquisa (SearchManager)** | Liga à API Nominatim para encontrar locais (opcional).                 |
| **POIManager**               | Obtém pontos de interesse via Overpass (opcional).                     |
| **UIController**             | Controla elementos da interface (botões, painéis, campos de pesquisa). |
| **APIClient**                | Responsável por efetuar requisições HTTP e devolver JSON tratado.      |
| **Utils/Helpers**            | Funções auxiliares para formatação, tratamento de erros e coordenadas. |

---

## 6. Fluxo de Interação (Exemplo: Cálculo de Rota)

1. O utilizador **clica em dois pontos** no mapa.
2. O sistema regista as coordenadas e chama o `RouteManager`.
3. O `RouteManager` constrói o pedido HTTP para a **API OSRM**.
4. A resposta (JSON) é processada e convertida em dados utilizáveis.
5. A rota é **desenhada no mapa** e as informações (distância e tempo) são apresentadas na UI.

---

## 7. Diagrama de Casos de Uso (Visão Textual)

| Ator       | Caso de Uso                | Descrição                                           |
| ---------- | -------------------------- | --------------------------------------------------- |
| Utilizador | Visualizar mapa            | Acede ao mapa interativo e navega.                  |
| Utilizador | Selecionar pontos          | Clica em dois pontos para definir origem e destino. |
| Utilizador | Calcular rota              | O sistema comunica com a API OSRM e desenha a rota. |
| Utilizador | Ver distância e tempo      | As informações da rota são exibidas.                |
| Utilizador | Pesquisar local (opcional) | Introduz texto e centraliza o mapa (Nominatim).     |
| Utilizador | Exportar rota (opcional)   | Guarda a rota em GPX ou JSON.                       |

---

## 8. Modelo de Dados (Simplificado)

**Exemplo de resposta OSRM (JSON):**

```json
{
  "routes": [
    {
      "distance": 1264.5,
      "duration": 214.3,
      "geometry": "encoded_polyline_data"
    }
  ],
  "waypoints": [
    { "name": "Origin", "location": [-9.1393, 38.7139] },
    { "name": "Destination", "location": [-9.1427, 38.7223] }
  ]
}
```

---

## 9. Ferramentas e Tecnologias

* **Linguagem:** JavaScript, HTML, CSS
* **Biblioteca de mapas:** [Leaflet.js](https://leafletjs.com/)
* **APIs Externas:** OSRM, Nominatim, Overpass
* **Gestão de versão:** Git + GitHub
* **Metodologia:** Scrum (2–3 sprints)

---

## 10. Próximos Passos

1. Elaborar **diagramas UML** (classes, sequência e arquitetura).
2. Criar **Product Backlog completo** (histórias de utilizador, critérios de aceitação).
3. Definir **wireframes da interface** (UI/UX).
4. Validar plano de Sprints e tarefas antes da implementação.

