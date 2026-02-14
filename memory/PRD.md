# DB Graph Visualizer - PRD

## Original Problem Statement
Aplicació web per visualitzar estructures de base de dades en forma de grafs basada en dues taules:
- **View**: ViewId, Name, Name2, Alias
- **ViewRelation**: IdView1, IdView2, Relation, Relation2, EdgeWeight, MinAppVersion, MaxAppVersion, ChangeOwner

## User Personas
- Desenvolupadors de bases de dades
- Administradors de sistemes
- Analistes de dades

## Core Requirements
- Importar dades des de SQL (INSERTs) via portapapers
- Visualitzar vistes i relacions com a graf interactiu
- Zoom, arrossegar nodes, reorganitzar graf
- Veure detalls de vistes i relacions (SQL JOIN)
- Operacions CRUD: crear, editar, eliminar vistes i relacions
- Filtrar per nom, alias i ID
- Canviar tema fosc/clar

## What's Been Implemented (Jan 2026)

### v1.0 - MVP
- [x] Backend FastAPI amb CRUD complet
- [x] Parser SQL per INSERTs
- [x] Graf interactiu amb ReactFlow
- [x] Sidebar amb llista filtrable
- [x] Panel de detalls
- [x] Toggle tema fosc/clar

### v1.1 - Millores Visuals
- [x] Colors per tipus de JOIN (LEFT, INNER, RIGHT, CROSS, FULL)
- [x] Nodes mostren alias + ID, nom original a sota
- [x] Llegenda de colors a la sidebar
- [x] Pathfinding entre vistes
- [x] Panel de configuració complet

### v1.2 - Productivitat (Actual)
- [x] **Focus al graf**: Clic a una vista fa zoom al node
- [x] **Creueta cerca**: Botó per netejar la cerca ràpidament
- [x] **Exportar SQL**: Cada vista/relació es pot exportar com INSERT o UPDATE MariaDB
- [x] **Crear relacions intuïtivament**: Context menu (clic dret) per crear relacions des dels nodes
- [x] **Marcar elements nous**: Badge "NOU" taronja per vistes i relacions noves (no al script original)
- [x] **Relacions noves amb línia discontínua**: Per diferenciar-les visualment
- [x] **Exportar tots els nous**: Botó "Nous (X)" per copiar tots els INSERTs nous
- [x] **MAX(ViewId)+1**: Al crear vista suggereix el pròxim ID disponible
- [x] **Persistència completa**:
  - Configuració visual a localStorage
  - Últim script SQL importat guardat i recuperable
  - IDs originals per detectar canvis

## Tech Stack
- Backend: FastAPI, MongoDB, Motor
- Frontend: React, ReactFlow, TailwindCSS, Shadcn/UI
- Persistència: localStorage (configuració, script SQL)

## Prioritized Backlog

### P1 (High)
- Selecció múltiple de nodes
- Historial de canvis/undo
- Arrossegar per crear relacions (drag & drop)

### P2 (Medium)
- Guardar layouts personalitzats
- Filtres per EdgeWeight, versions
- Importar des de fitxer
- Agrupar vistes per esquema

### P3 (Low)
- Exportar graf com a imatge PNG/SVG
- Integració amb BD real
- Múltiples grafs/projectes
