# Sistema Interativo de Rotas e Exploração de Locais com OpenStreetMap

## Descrição do Projeto

Este projeto tem como objetivo desenvolver uma aplicação interativa que permita ao utilizador explorar um mapa baseado nos dados do OpenStreetMap (OSM), traçar rotas entre pontos de interesse e obter informações detalhadas sobre o trajeto e a área circundante.
A aplicação integra múltiplas APIs REST para cálculo de rotas, geocodificação e pesquisa de locais, permitindo uma experiência dinâmica e informativa.

## Tecnologias e APIs Utilizadas

### OpenStreetMap (OSM)
 - Base cartográfica livre e colaborativa.

### OSRM API
 - Cálculo de rotas, distância e tempo de viagem.

### Nominatim
 - Geocodificação e pesquisa de endereços/locais (opcional).

### Overpass API
 - Extração de pontos de interesse (POIs) (opcional).

## Funcionalidades
### Funcionalidades Obrigatórias

- Visualização de mapa interativo
- Exibição de mapa com zoom, pan e interação por clique.
- Base de dados carregada a partir do OpenStreetMap.
- Seleção de rota
- Envio de pedidos à API OSRM com origem e destino.
- Cálculo e desenho da rota no mapa com base na resposta JSON.
- Informações da rota
- Exibição da distância total e tempo estimado de viagem.
- Atualização dinâmica após cada cálculo de rota.
- Limpeza e reinício
- Opção para reiniciar a seleção de pontos e calcular uma nova rota.

### Funcionalidades Opcionais Implementadas

- Pesquisa de localização (Nominatim):
- Campo de pesquisa para encontrar locais e centralizar o mapa automaticamente.
- Modos de transporte (OSRM):
- Suporte a múltiplos modos — carro, bicicleta e a pé.
- Pontos de interesse (Overpass API):
- Exibição de POIs próximos do trajeto (restaurantes, parques, etc.).
- Múltiplos destinos:
- Possibilidade de adicionar waypoints intermédios na rota.
