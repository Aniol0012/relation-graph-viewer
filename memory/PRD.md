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
### Backend (FastAPI + MongoDB)
- [x] Models: View, ViewRelation amb Pydantic
- [x] Parser SQL per INSERTs de Report_View i Report_ViewRelation
- [x] Endpoints CRUD complets per vistes i relacions
- [x] Endpoint /api/import-sql per importar SQL
- [x] Endpoint /api/graph-data per obtenir dades del graf
- [x] Endpoint /api/stats per estadístiques
- [x] Endpoint /api/clear-all per esborrar tot

### Frontend (React + ReactFlow)
- [x] Graf interactiu amb ReactFlow (zoom, pan, drag)
- [x] Sidebar amb llista filtrable de vistes
- [x] Panel de detalls per vistes i relacions
- [x] Modal d'importació SQL
- [x] Modals per crear vistes i relacions
- [x] Toolbar amb totes les accions
- [x] Toggle tema fosc/clar
- [x] Toast notifications amb Sonner

## Prioritized Backlog
### P0 (Critical) - DONE
- Importació SQL ✅
- Visualització del graf ✅
- CRUD bàsic ✅

### P1 (High)
- Exportar dades a SQL
- Selecció múltiple de nodes
- Historial de canvis

### P2 (Medium)
- Guardar layouts personalitzats
- Filtres avançats (per EdgeWeight, versions)
- Importar des de fitxer

## Tech Stack
- Backend: FastAPI, MongoDB, Motor
- Frontend: React, ReactFlow, TailwindCSS, Shadcn/UI
- Testing: Playwright, Pytest
