
---

# Documento Atualizado — Arquitetura das APIs e Comunicação do Sistema

## Visão Geral

Este documento descreve a arquitetura de comunicação entre:

* o **cliente web** (frontend),
* a **API interna** desenvolvida em Express (backend),
* e os **serviços externos do ecossistema OpenStreetMap**.

O objetivo é mostrar como o frontend comunica exclusivamente com a API interna, a qual atua como intermediária e responsável por obter dados de pesquisa, rotas e pontos de interesse (POIs) utilizando as APIs externas Nominatim, OSRM e Overpass.

Toda a comunicação entre camadas é feita em **JSON**.

---

## Arquitetura Geral do Sistema

### 1. Cliente Web (Frontend)

O frontend é responsável pela interface e interações do utilizador. É composto por vários módulos especializados:

* **UIController**
  Ponto central que coordena as ações do utilizador e comunica com os vários managers.

* **MapManager**
  Atualiza o mapa Leaflet: marcadores, camadas, rota, vista, POIs.

* **SearchManager**
  Envia pedidos de pesquisa de locais para o backend.

* **RouteManager**
  Solicita cálculo de rotas (incluindo múltiplos destinos).

* **POIManager**
  Solicita e apresenta POIs provenientes da API interna Overpass.

O frontend nunca comunica directamente com APIs externas. Todo o tráfego passa pelo backend.

---

### 2. API Interna (Backend Express)

A API interna funciona como:

* intermediária entre o frontend e serviços externos OSM,
* proxy que permite controlar, simplificar e unificar pedidos,
* camada que pode opcionalmente aplicar caching, autenticação, limites de uso ou segurança.

A API fornece três endpoints principais:

#### `/api/search`

Encaminha pedidos para o serviço **Nominatim** (geocoding e search).

#### `/api/route`

Encaminha pedidos para **OSRM** (routing).
Suporta parâmetros:

* `start`
* `end`
* `profile`
* `stops` (paragens intermédias)

#### `/api/poi`

Constrói uma query Overpass QL e solicita ao serviço **Overpass API** a lista de POIs dentro de uma bounding box.

O backend normaliza e devolve respostas ao frontend sempre em JSON.

---

### 3. Serviços Externos OSM

A aplicação utiliza três serviços principais:

* **Nominatim**
  Pesquisa geográfica e reverse geocoding.

* **OSRM**
  Cálculo de rotas, distância e duração.

* **Overpass API**
  Consulta de elementos OSM (POIs) dentro de áreas definidas pelo utilizador.

Estes serviços nunca são contactados diretamente pelo frontend.

---

## Fluxo de Comunicação

### Pesquisa de locais

1. Utilizador introduz uma pesquisa.
2. UIController chama SearchManager.
3. SearchManager envia pedido para `/api/search?q=...`.
4. Backend encaminha para Nominatim.
5. Resultados são devolvidos ao cliente e apresentados no mapa.

---

### Cálculo de rota

1. Utilizador seleciona origem, destino e eventuais paragens.
2. UIController chama RouteManager.
3. RouteManager envia pedido para:

```
/api/route?start=...&end=...&profile=...&stops=...
```

4. Backend chama OSRM.
5. A rota é devolvida ao frontend e desenhada no mapa.

---

### Carregamento de POIs

1. Utilizador selecciona uma categoria de POIs.
2. UIController chama POIManager.
3. POIManager envia pedido para:

```
/api/poi?bbox=...&types=cafe,restaurant,...
```

4. Backend constrói a query Overpass QL e consulta a Overpass API.
5. Os POIs são devolvidos e desenhados no mapa.

---

## Diagrama da Arquitetura das APIs

O diagrama reflete esta estrutura: o frontend comunica apenas com a API Express, que por sua vez contacta Nominatim, OSRM e Overpass, centralizando e simplificando toda a lógica de integração com o ecossistema OSM.

---

## Benefícios Desta Arquitetura

* **Isolamento total** entre frontend e serviços externos.
* **Melhor segurança**, ao evitar chamadas diretas do browser.
* **Maior flexibilidade** para alterar serviços externos sem afetar o frontend.
* **Possibilidade de caching** no backend.
* **Resposta sempre normalizada**, independentemente da API externa.
* **Extensível** para novas fontes de dados ou funcionalidades.

---

