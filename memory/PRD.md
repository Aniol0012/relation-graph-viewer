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
- Colors diferents per tipus de JOIN
- Eina de pathfinding entre vistes
- Panel de configuració personalitzable

## What's Been Implemented (Jan 2026)

### v1.0 - MVP
- [x] Backend FastAPI amb CRUD complet
- [x] Parser SQL per INSERTs
- [x] Graf interactiu amb ReactFlow
- [x] Sidebar amb llista filtrable
- [x] Panel de detalls
- [x] Toggle tema fosc/clar

### v1.1 - Millores (Actual)
- [x] **Colors per tipus de JOIN**: LEFT JOIN (blau), INNER JOIN (verd), RIGHT JOIN (lila), CROSS JOIN (ambar), FULL JOIN (rosa)
- [x] **Nodes millorats**: Mostren alias + ID (#), nom original a sota si hi ha alias
- [x] **Llegenda de colors**: A la sidebar per referència ràpida
- [x] **Pathfinding**: Botó "Trobar camí" per cercar ruta entre dues vistes, ressaltat del camí amb nodes verds i animació
- [x] **Panel de Configuració**:
  - Visualització: toggle ID, toggle nom original, longitud màx nom, mida nodes
  - Arestes: toggle etiquetes JOIN, animació, estil (smoothstep/bezier/recta)
  - Colors: personalitzar color de cada tipus de JOIN
  - Layout: direcció (vertical/horitzontal), espaiat entre nodes i nivells
  - Tema: fosc/clar
- [x] **Persistència**: Configuració guardada a localStorage

## Tech Stack
- Backend: FastAPI, MongoDB, Motor
- Frontend: React, ReactFlow, TailwindCSS, Shadcn/UI
- Persistència: localStorage per configuració

## Prioritized Backlog

### P1 (High)
- Exportar dades a SQL
- Selecció múltiple de nodes
- Historial de canvis/undo

### P2 (Medium)
- Guardar layouts personalitzats
- Filtres per EdgeWeight, versions
- Importar des de fitxer
- Agrupar vistes per esquema

### P3 (Low)
- Exportar graf com a imatge
- Integració amb BD real
- Múltiples grafs/projectes
