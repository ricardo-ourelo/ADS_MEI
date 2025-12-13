# Sistema Interativo de Rotas e Exploração de Locais com OpenStreetMap

## Descrição do Projeto

Este projeto consiste no desenvolvimento de uma aplicação web interativa que permite ao utilizador explorar mapas baseados em dados do **OpenStreetMap (OSM)**, calcular rotas entre pontos geográficos e obter informações detalhadas sobre o percurso e a área envolvente.

A aplicação integra várias **APIs REST externas** para cálculo de rotas, geocodificação e pesquisa de pontos de interesse, sendo desenvolvida com foco na **arquitetura MVC**, modularidade e boas práticas de engenharia de software.

---

## Arquitetura

O sistema segue um modelo **MVC híbrido**, aplicado em duas camadas:

* **Backend (Express)**
  Atua como gateway para serviços externos (OSRM, Nominatim, Overpass), expondo endpoints REST normalizados.

* **Frontend (Client-Side MVC)**
  Responsável pela interação com o utilizador, renderização do mapa (Leaflet) e orquestração da lógica através de um controlador principal (`UIController`) e vários módulos de serviço (Managers).

---

## Tecnologias e APIs Utilizadas

### OpenStreetMap (OSM)

* Base cartográfica livre e colaborativa.

### OSRM API

* Cálculo de rotas, distância e tempo de viagem.

### Nominatim

* Geocodificação e pesquisa de locais.

### Overpass API

* Extração de pontos de interesse (POIs) ao longo do trajeto.

### Outras tecnologias

* Node.js
* Express
* Leaflet
* JavaScript (ES Modules)

---

## Funcionalidades

### Funcionalidades Obrigatórias

* **Visualização de mapa interativo**

    * Mapa carregado a partir do OpenStreetMap.
    * Suporte a zoom, pan e interação por clique.

* **Seleção e cálculo de rotas**

    * Definição de origem e destino.
    * Envio de pedidos à API OSRM.
    * Desenho da rota no mapa com base na resposta JSON.

* **Informações da rota**

    * Exibição da distância total e tempo estimado de viagem.
    * Atualização dinâmica após cada cálculo.

* **Limpeza e reinício**

    * Opção para reiniciar a seleção de pontos e calcular uma nova rota.

---

### Funcionalidades Opcionais Implementadas

* **Pesquisa de localização (Nominatim)**

    * Campo de pesquisa textual para encontrar locais e centrar o mapa automaticamente.

* **Modos de transporte (OSRM)**

    * Suporte a múltiplos perfis: carro, bicicleta e a pé.

* **Pontos de interesse (Overpass API)**

    * Exibição de POIs próximos da rota (restaurantes, parques, serviços, etc.).

* **Múltiplos destinos**

    * Possibilidade de adicionar paragens intermédias (waypoints) ao percurso.

---

## Documentação e Diagramas

Toda a documentação técnica do projeto encontra-se disponível na pasta **`/documents`** do repositório.
Esta pasta inclui:

* Relatório final do projeto;
* Product Backlog;
* Diagramas de arquitetura (MVC, componentes, classes, implantação);
* Diagramas de sequência (geral e por API);
* Diagramas de fluxo lógico de dados;
* Utility Tree e definição dos atributos de qualidade;
* Mockup inicial da interface.

Esta documentação serve como referência central para compreender as decisões arquiteturais, o desenho do sistema e a evolução do projeto ao longo dos sprints.

---

## Execução do Projeto

Requisitos:

* Node.js (versão recente)

Passos básicos:

```bash
npm install
npm start
```

A aplicação ficará disponível em:

```
http://localhost:3000
```

---

## Notas Finais

Este projeto foi desenvolvido no contexto académico da unidade curricular de **Arquitetura e Desenho de Software**, com especial foco na integração de APIs externas, separação de responsabilidades, testabilidade e qualidade de código.


