
# **Arquitetura das APIs — Sistema Interativo de Rotas e Exploração de Locais com OpenStreetMap**

## **1. Objetivo do Documento**

Este documento descreve a arquitetura de comunicação do sistema, detalhando como a aplicação cliente interage com o **backend Express** e como este, por sua vez, comunica com serviços externos do ecossistema OpenStreetMap (OSRM, Nominatim e Overpass API).

Desde a implementação atual, **nenhuma API externa é chamada diretamente pelo frontend**.
Todo o acesso passa pelo servidor, garantindo segurança, controlo e consistência.

---

# **2. Visão Geral da Arquitetura**

A aplicação segue um modelo de:

> **Cliente Web → API Interna (Express) → Serviços Externos OSM**

O diagrama seguinte representa o fluxo:

```
┌──────────────────────────────────────────────────────────┐
│                      Cliente Web (Frontend)              │
│  - UIController                                          │
│  - SearchManager → GET /api/search                       │
│  - RouteManager  → GET /api/route                        │
│  - POIManager    → GET /api/poi                          │
└──────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│                     Backend Express (API Interna)        │
│  /api/search → proxy para Nominatim                      │
│  /api/route  → proxy para OSRM                           │
│  /api/poi    → proxy para Overpass API                   │
└──────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│                 Serviços Externos OpenStreetMap          │
│  - Nominatim → Geocoding / Reverse geocoding             │
│  - OSRM      → Cálculo de rotas                          │
│  - Overpass  → Pontos de interesse (POIs)                │
└──────────────────────────────────────────────────────────┘
```

Esta arquitectura permite:

* Controlo total do consumo das APIs externas
* Evitar CORS e limites de user agent
* Possibilidade futura de caching local
* Melhor segurança e extensibilidade

---

# **3. Endpoints da API Interna (Express)**

Aqui estão os endpoints utilizados pelo frontend e implementados no backend Express.

## **3.1 /api/search – Pesquisa de locais**

**Função:** Procurar locais por nome (geocoding)
**Backend:** Proxy para *Nominatim*
**Método:** `GET`

### Exemplo:

```
GET /api/search?q=Lisboa&limit=5
```

Resposta típica:

```json
[
  {
    "display_name": "Lisboa, Portugal",
    "lat": "38.7169",
    "lon": "-9.1399"
  }
]
```

---

## **3.2 /api/route – Cálculo de rotas**

**Função:** Obter rotas entre origem, destino e múltiplos destinos intermédios
**Backend:** Proxy para *OSRM*
**Método:** `GET`

### Exemplo:

```
GET /api/route?start=38.72,-9.14&end=38.73,-9.10&profile=car&stops=38.71,-9.13;38.72,-9.11
```

Resposta típica:

```json
{
  "routes": [{
    "distance": 3540.2,
    "duration": 460.4,
    "geometry": "polyline_encoded"
  }]
}
```

---

## **3.3 /api/poi – Pontos de Interesse (POIs)**

**Função:** Obter POIs dentro de uma área visível ou bounding box
**Backend:** Proxy para *Overpass API*
**Método:** `GET`

### Exemplo:

```
GET /api/poi?bbox=38.71,-9.15,38.74,-9.10&types=restaurant,cafe,hotel
```

Resposta típica:

```json
{
  "elements": [
    {
      "type": "node",
      "lat": 38.72,
      "lon": -9.13,
      "tags": {
        "name": "Café Central",
        "amenity": "cafe"
      }
    }
  ]
}
```

---

# **4. Interação do Frontend com a API Interna**

Cada componente do frontend comunica com a API interna através de managers especializados:

| Manager           | Endpoint usado | Função                           |
| ----------------- | -------------- | -------------------------------- |
| **SearchManager** | `/api/search`  | Pesquisa Nominatim (via backend) |
| **RouteManager**  | `/api/route`   | Cálculo OSRM (via backend)       |
| **POIManager**    | `/api/poi`     | Dados Overpass (via backend)     |

---

# **5. Estrutura dos Dados Recebidos**

A seguir estão exemplos simplificados dos formatos de dados utilizados.

---

## **5.1 OSRM — Formato Resumido**

```json
{
  "routes": [
    {
      "distance": 3500,
      "duration": 420,
      "geometry": "polyline..."
    }
  ]
}
```

---

## **5.2 Nominatim — Formato Resumido**

```json
[
  {
    "display_name": "Lisboa",
    "lat": "38.7169",
    "lon": "-9.1399"
  }
]
```

---

## **5.3 Overpass — Formato Resumido**

```json
{
  "elements": [
    {
      "lat": 38.72,
      "lon": -9.14,
      "tags": {
        "name": "Museu X",
        "tourism": "museum"
      }
    }
  ]
}
```

---

# **6. Fluxos de Operação**

## **6.1 Fluxo: Cálculo de Rota**

1. Utilizador escolhe origem e destino.
2. `RouteManager` envia pedido para `/api/route`.
3. O backend faz proxy para OSRM.
4. A resposta é convertida para formato linear.
5. A rota é desenhada no mapa por Leaflet.

---

## **6.2 Fluxo: Pesquisa de Local**

1. Utilizador digita local no campo.
2. `SearchManager` chama `/api/search`.
3. Backend consulta Nominatim.
4. Resultados são listados no painel.
5. Utilizador escolhe um e é colocado `start`, `end` ou `stop`.

---

## **6.3 Fluxo: POIs na Vista do Mapa**

1. Frontend calcula bounding box da área visível.
2. `POIManager` envia `/api/poi?bbox=...`.
3. Backend cria query Overpass.
4. Devolve POIs filtrados.
5. UI desenha ícones de POIs no mapa.

---

# **7. Benefícios desta Arquitetura**

* **Evita limites de user agent** (Nominatim rejeita direto do browser)
* **Evita CORS**
* **Melhor segurança**
* **Permite caching futuro**
* **O backend pode transformar ou otimizar dados**
* **Frontend mais simples e coeso**

---

# **8. Possíveis Extensões Futuras**

* Cache local de resultados Nominatim e Overpass
* Suporte a Mapbox Directions ou Google Routes
* Exportação de rotas em GPX
* Heatmaps de POIs
* Clustering avançado

---


