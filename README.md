# Relation Graph Viewer

Aplicació web per visualitzar estructures de base de dades en forma de grafs interactius. Permet importar vistes i relacions des de SQL (MariaDB), visualitzar-les, crear-ne de noves i exportar-les.

**Autor:** Aniol0012

## Característiques

- 📊 Visualització de grafs interactius amb zoom, pan i arrossegar
- 🎨 Colors diferenciats per tipus de JOIN (LEFT, RIGHT, INNER, CROSS, FULL)
- 🔍 Cerca i filtres avançats de vistes
- 🛤️ Pathfinding: troba el camí entre dues vistes
- ✏️ CRUD complet: crear, editar, eliminar vistes i relacions
- 📤 Exportar vistes/relacions com INSERT o UPDATE (MariaDB)
- 🌙 Tema fosc/clar
- ⚙️ Configuració personalitzable persistent
- 💾 Persistència de l'últim script SQL importat

## Estructura del Projecte

```
/app/
├── backend/          # FastAPI backend
│   ├── server.py     # API principal
│   ├── .env          # Variables d'entorn
│   └── requirements.txt
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.js
│   │   └── ...
│   ├── package.json
│   └── .env
└── README.md
```

## Prerequisits

- **Node.js** >= 18.x
- **Python** >= 3.9
- **MongoDB** >= 5.0

## Desplegament en Localhost

### 1. Configurar MongoDB

Assegura't que MongoDB estigui corrent localment:

```bash
# Ubuntu/Debian
sudo systemctl start mongod

# macOS amb Homebrew
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Configurar el Backend

```bash
cd backend

# Crear entorn virtual
python -m venv venv
source venv/bin/activate  # Linux/macOS
# o
venv\Scripts\activate     # Windows

# Instal·lar dependències
pip install -r requirements.txt

# Configurar variables d'entorn
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=relation_graph_db
CORS_ORIGINS=http://localhost:3000
EOF

# Executar el servidor
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Configurar el Frontend

```bash
cd frontend

# Instal·lar dependències
yarn install

# Configurar variables d'entorn
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Executar en mode desenvolupament
yarn start
```

L'aplicació estarà disponible a `http://localhost:3000`

## Desplegament en Servidor Remot

### Opció 1: Docker Compose (Recomanat)

Crea un fitxer `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=relation_graph_db
      - CORS_ORIGINS=https://yourdomain.com
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=https://yourdomain.com/api
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
```

Crea els Dockerfiles:

**backend/Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
RUN yarn global add serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

Executa:
```bash
docker-compose up -d
```

### Opció 2: Desplegament Manual amb Nginx

#### Backend (amb Gunicorn)

```bash
# Instal·lar i configurar
pip install gunicorn

# Executar amb Gunicorn
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001
```

#### Frontend (Build de producció)

```bash
cd frontend
yarn build

# Els fitxers estàtics estaran a frontend/build/
```

#### Configuració Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opció 3: Desplegament a Plataformes Cloud

#### Vercel (Frontend) + Railway/Render (Backend)

**Frontend a Vercel:**
```bash
cd frontend
vercel deploy --prod
```

**Backend a Railway:**
1. Connecta el repositori a Railway
2. Afegeix les variables d'entorn:
   - `MONGO_URL`
   - `DB_NAME`
   - `CORS_ORIGINS`

## Variables d'Entorn

### Backend (.env)
| Variable | Descripció | Exemple |
|----------|------------|---------|
| `MONGO_URL` | URL de connexió a MongoDB | `mongodb://localhost:27017` |
| `DB_NAME` | Nom de la base de dades | `relation_graph_db` |
| `CORS_ORIGINS` | Orígens permesos (separats per coma) | `http://localhost:3000` |

### Frontend (.env)
| Variable | Descripció | Exemple |
|----------|------------|---------|
| `REACT_APP_BACKEND_URL` | URL del backend API | `http://localhost:8001` |

## Ús

### Importar Dades

1. Clica "Importar SQL" a la barra d'eines
2. Enganxa els INSERTs de les taules `Report_View` i `Report_ViewRelation`
3. Clica "Importar"

Exemple de format SQL:
```sql
INSERT INTO Report_View (IdView, Name, Name2, Alias) VALUES(51, 'Shop', 'DBCommon.Shop', 'Botiga');
INSERT INTO Report_ViewRelation (IdView1, IdView2, Relation, Relation2, EdgeWeight, MinAppVersion, MaxAppVersion, ChangeOwner) 
VALUES(19528, 51, 'LEFT JOIN Shop ON Shop.CountryIsoCode = Loc__Country.Alpha3', NULL, 10, 2000000, 999999999, 1);
```

### Crear Relacions

- **Opció 1:** Clic dret sobre un node → "Crear relació des d'aquí" → Clica el node destí
- **Opció 2:** Arrossega des dels cercles de connexió del node
- **Opció 3:** Usa el botó "+" a la barra d'eines

### Filtrar Vistes

1. Clica "Filtrar" a la sidebar
2. Selecciona les vistes que vols mostrar
3. Clica "Aplicar"

O usa "Mostrar tot" per eliminar tots els filtres.

### Exportar

- **Una vista/relació:** Selecciona-la i usa els botons INSERT/UPDATE al panel de detalls
- **Tots els elements nous:** Clica el botó "Nous (X)" a la barra d'eines

## API Endpoints

| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| GET | `/api/views` | Llista totes les vistes |
| POST | `/api/views` | Crea una nova vista |
| PUT | `/api/views/{id}` | Actualitza una vista |
| DELETE | `/api/views/{id}` | Elimina una vista |
| GET | `/api/relations` | Llista totes les relacions |
| POST | `/api/relations` | Crea una nova relació |
| PUT | `/api/relations/{id}` | Actualitza una relació |
| DELETE | `/api/relations/{id}` | Elimina una relació |
| POST | `/api/import-sql` | Importa SQL |
| GET | `/api/graph-data` | Obté dades per al graf |
| GET | `/api/stats` | Estadístiques |
| DELETE | `/api/clear-all` | Esborra totes les dades |

## Tecnologies

- **Frontend:** React, ReactFlow, TailwindCSS, Shadcn/UI
- **Backend:** FastAPI, Motor (MongoDB async)
- **Base de dades:** MongoDB

## Llicència

MIT License

---

Desenvolupat per **Aniol0012**
