
---

# Diagrama das APIs — Sistema Interativo de Rotas e Exploração de Locais com OpenStreetMap

## 1. Objetivo

Este diagrama representa a arquitetura de comunicação entre o **cliente web** (a aplicação) e os **serviços externos** usados para cálculo de rotas, pesquisa de locais e obtenção de pontos de interesse (POIs).
O foco é mostrar como o sistema utiliza cada API e o formato geral das interações.

---

## 2. Visão Geral

### APIs utilizadas

| API                                         | Função                                                                   | Tipo de Pedido | Exemplo de Endpoint                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------- |
| **OSRM (Open Source Routing Machine)**      | Cálculo e visualização de rotas entre pontos                             | `GET`          | `https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full` |
| **Nominatim (OpenStreetMap Geocoding)**     | Pesquisa e geocodificação de locais por nome                             | `GET`          | `https://nominatim.openstreetmap.org/search?q={query}&format=json`                           |
| **Overpass API (OpenStreetMap Data Query)** | Extração de POIs (ex: cafés, museus, parques) dentro de uma área ou rota | `POST`         | `https://overpass-api.de/api/interpreter`                                                    |

---

## 3. Estrutura de Dados (Resumida)

### **OSRM – Resposta de exemplo**

```json
{
  "routes": [{
    "geometry": "polyline_encoded_string",
    "legs": [{
      "distance": 1234.5,
      "duration": 345.6
    }]
  }],
  "waypoints": [
    {"name": "Origem", "location": [-9.14, 38.72]},
    {"name": "Destino", "location": [-9.10, 38.73]}
  ]
}
```

### **Nominatim – Resposta de exemplo**

```json
[
  {
    "display_name": "Lisboa, Portugal",
    "lat": "38.7169",
    "lon": "-9.1399"
  }
]
```

### **Overpass – Resposta de exemplo**

```json
{
  "elements": [
    {
      "type": "node",
      "id": 123456,
      "lat": 38.717,
      "lon": -9.14,
      "tags": {"name": "Café Central", "amenity": "cafe"}
    }
  ]
}
```

---

## 4. Fluxo de Comunicação entre APIs

### 🔹 Cenário 1 — Cálculo de rota (OSRM)

1. Utilizador seleciona origem e destino.
2. O cliente envia um pedido `GET` ao endpoint OSRM.
3. Recebe-se um JSON com distância, tempo e geometria da rota.
4. A rota é desenhada no mapa.

### 🔹 Cenário 2 — Pesquisa de local (Nominatim)

1. Utilizador escreve um nome de local.
2. O cliente envia um `GET /search`.
3. Recebe-se uma lista de resultados com coordenadas.
4. O mapa centra-se na posição escolhida.

### 🔹 Cenário 3 — Pontos de interesse (Overpass)

1. O sistema calcula uma *bounding box* ou área em torno da rota.
2. Envia um `POST` com uma query Overpass QL, por exemplo:

   ```
   [out:json];
   node["amenity"~"cafe|restaurant"](bbox);
   out;
   ```
3. Recebe um JSON com POIs e adiciona-os ao mapa.

---

## 5. Benefícios da Arquitetura

* Totalmente **desacoplada**: o cliente comunica diretamente com APIs públicas.
* **Extensível**: podem ser integradas outras APIs (ex. Mapbox, Google Places).
* **Leve**: sem necessidade de backend próprio (a não ser que se queira cachear resultados).
* **Transparente**: todas as chamadas usam formatos REST/JSON standard.

---

