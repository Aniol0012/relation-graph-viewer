from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class View(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    view_id: int
    name: str
    name2: Optional[str] = None
    alias: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ViewCreate(BaseModel):
    view_id: int
    name: str
    name2: Optional[str] = None
    alias: Optional[str] = None

class ViewUpdate(BaseModel):
    name: Optional[str] = None
    name2: Optional[str] = None
    alias: Optional[str] = None

class ViewRelation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    id_view1: int
    id_view2: int
    relation: str
    relation2: Optional[str] = None
    edge_weight: Optional[int] = 10
    min_app_version: Optional[int] = None
    max_app_version: Optional[int] = None
    change_owner: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ViewRelationCreate(BaseModel):
    id_view1: int
    id_view2: int
    relation: str
    relation2: Optional[str] = None
    edge_weight: Optional[int] = 10
    min_app_version: Optional[int] = None
    max_app_version: Optional[int] = None
    change_owner: Optional[int] = None

class ViewRelationUpdate(BaseModel):
    relation: Optional[str] = None
    relation2: Optional[str] = None
    edge_weight: Optional[int] = None

class SqlImportRequest(BaseModel):
    sql: str

class SqlImportResponse(BaseModel):
    views_created: int
    relations_created: int
    errors: List[str]

# ============ SQL PARSER ============

def parse_view_insert(sql: str) -> Optional[dict]:
    """Parse a Report_View INSERT statement"""
    # Pattern for: INSERT INTO Report_View (...) VALUES(...);
    pattern = r"INSERT\s+INTO\s+Report_View\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)"
    match = re.search(pattern, sql, re.IGNORECASE)
    if not match:
        return None
    
    columns = [c.strip().lower() for c in match.group(1).split(',')]
    values_str = match.group(2)
    
    # Parse values handling quoted strings
    values = []
    current = ""
    in_string = False
    quote_char = None
    
    for char in values_str:
        if char in ("'", '"') and not in_string:
            in_string = True
            quote_char = char
        elif char == quote_char and in_string:
            in_string = False
            quote_char = None
        elif char == ',' and not in_string:
            values.append(current.strip())
            current = ""
            continue
        current += char
    values.append(current.strip())
    
    # Build dict
    data = {}
    col_mapping = {
        'idview': 'view_id',
        'viewid': 'view_id',
        'name': 'name',
        'name2': 'name2',
        'alias': 'alias'
    }
    
    for i, col in enumerate(columns):
        if i < len(values):
            mapped_col = col_mapping.get(col.replace(' ', ''))
            if mapped_col:
                val = values[i].strip("'\"")
                if val.upper() == 'NULL':
                    val = None
                elif mapped_col == 'view_id':
                    try:
                        val = int(val)
                    except:
                        continue
                data[mapped_col] = val
    
    return data if 'view_id' in data and 'name' in data else None

def parse_view_relation_insert(sql: str) -> Optional[dict]:
    """Parse a Report_ViewRelation INSERT statement"""
    pattern = r"INSERT\s+INTO\s+Report_ViewRelation\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)"
    match = re.search(pattern, sql, re.IGNORECASE)
    if not match:
        return None
    
    columns = [c.strip().lower() for c in match.group(1).split(',')]
    values_str = match.group(2)
    
    # Parse values handling quoted strings
    values = []
    current = ""
    in_string = False
    quote_char = None
    
    for char in values_str:
        if char in ("'", '"') and not in_string:
            in_string = True
            quote_char = char
        elif char == quote_char and in_string:
            in_string = False
            quote_char = None
        elif char == ',' and not in_string:
            values.append(current.strip())
            current = ""
            continue
        current += char
    values.append(current.strip())
    
    # Build dict
    data = {}
    col_mapping = {
        'idview1': 'id_view1',
        'idview2': 'id_view2',
        'relation': 'relation',
        'relation2': 'relation2',
        'edgeweight': 'edge_weight',
        'minappversion': 'min_app_version',
        'maxappversion': 'max_app_version',
        'changeowner': 'change_owner'
    }
    
    for i, col in enumerate(columns):
        if i < len(values):
            mapped_col = col_mapping.get(col.replace(' ', ''))
            if mapped_col:
                val = values[i].strip("'\"")
                if val.upper() == 'NULL':
                    val = None
                elif mapped_col in ('id_view1', 'id_view2', 'edge_weight', 'min_app_version', 'max_app_version', 'change_owner'):
                    try:
                        val = int(val)
                    except:
                        if mapped_col in ('id_view1', 'id_view2'):
                            continue
                        val = None
                data[mapped_col] = val
    
    return data if 'id_view1' in data and 'id_view2' in data and 'relation' in data else None

# ============ VIEW ENDPOINTS ============

@api_router.get("/views", response_model=List[View])
async def get_views(
    search: Optional[str] = None,
    view_id: Optional[int] = None
):
    """Get all views with optional filtering"""
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"name2": {"$regex": search, "$options": "i"}},
            {"alias": {"$regex": search, "$options": "i"}}
        ]
    
    if view_id is not None:
        query["view_id"] = view_id
    
    views = await db.views.find(query, {"_id": 0}).to_list(10000)
    
    for view in views:
        if isinstance(view.get('created_at'), str):
            view['created_at'] = datetime.fromisoformat(view['created_at'])
    
    return views

@api_router.get("/views/{view_id}", response_model=View)
async def get_view(view_id: int):
    """Get a single view by view_id"""
    view = await db.views.find_one({"view_id": view_id}, {"_id": 0})
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    
    if isinstance(view.get('created_at'), str):
        view['created_at'] = datetime.fromisoformat(view['created_at'])
    
    return view

@api_router.post("/views", response_model=View)
async def create_view(view_data: ViewCreate):
    """Create a new view"""
    # Check if view_id already exists
    existing = await db.views.find_one({"view_id": view_data.view_id})
    if existing:
        raise HTTPException(status_code=400, detail="View with this ID already exists")
    
    view = View(**view_data.model_dump())
    doc = view.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.views.insert_one(doc)
    return view

@api_router.put("/views/{view_id}", response_model=View)
async def update_view(view_id: int, update_data: ViewUpdate):
    """Update a view"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.views.update_one(
        {"view_id": view_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="View not found")
    
    view = await db.views.find_one({"view_id": view_id}, {"_id": 0})
    if isinstance(view.get('created_at'), str):
        view['created_at'] = datetime.fromisoformat(view['created_at'])
    
    return view

@api_router.delete("/views/{view_id}")
async def delete_view(view_id: int):
    """Delete a view and its relations"""
    result = await db.views.delete_one({"view_id": view_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="View not found")
    
    # Also delete related relations
    await db.view_relations.delete_many({
        "$or": [{"id_view1": view_id}, {"id_view2": view_id}]
    })
    
    return {"message": "View and related relations deleted"}

# ============ VIEW RELATION ENDPOINTS ============

@api_router.get("/relations", response_model=List[ViewRelation])
async def get_relations(
    view_id: Optional[int] = None,
    search: Optional[str] = None
):
    """Get all relations with optional filtering"""
    query = {}
    
    if view_id is not None:
        query["$or"] = [{"id_view1": view_id}, {"id_view2": view_id}]
    
    if search:
        query["relation"] = {"$regex": search, "$options": "i"}
    
    relations = await db.view_relations.find(query, {"_id": 0}).to_list(10000)
    
    for rel in relations:
        if isinstance(rel.get('created_at'), str):
            rel['created_at'] = datetime.fromisoformat(rel['created_at'])
    
    return relations

@api_router.get("/relations/{relation_id}", response_model=ViewRelation)
async def get_relation(relation_id: str):
    """Get a single relation by id"""
    relation = await db.view_relations.find_one({"id": relation_id}, {"_id": 0})
    if not relation:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    if isinstance(relation.get('created_at'), str):
        relation['created_at'] = datetime.fromisoformat(relation['created_at'])
    
    return relation

@api_router.post("/relations", response_model=ViewRelation)
async def create_relation(relation_data: ViewRelationCreate):
    """Create a new relation"""
    # Verify both views exist
    view1 = await db.views.find_one({"view_id": relation_data.id_view1})
    view2 = await db.views.find_one({"view_id": relation_data.id_view2})
    
    if not view1 or not view2:
        raise HTTPException(status_code=400, detail="One or both views do not exist")
    
    relation = ViewRelation(**relation_data.model_dump())
    doc = relation.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.view_relations.insert_one(doc)
    return relation

@api_router.put("/relations/{relation_id}", response_model=ViewRelation)
async def update_relation(relation_id: str, update_data: ViewRelationUpdate):
    """Update a relation"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.view_relations.update_one(
        {"id": relation_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    relation = await db.view_relations.find_one({"id": relation_id}, {"_id": 0})
    if isinstance(relation.get('created_at'), str):
        relation['created_at'] = datetime.fromisoformat(relation['created_at'])
    
    return relation

@api_router.delete("/relations/{relation_id}")
async def delete_relation(relation_id: str):
    """Delete a relation"""
    result = await db.view_relations.delete_one({"id": relation_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    return {"message": "Relation deleted"}

# ============ SQL IMPORT ENDPOINT ============

@api_router.post("/import-sql", response_model=SqlImportResponse)
async def import_sql(request: SqlImportRequest):
    """Import views and relations from SQL INSERT statements"""
    sql = request.sql
    views_created = 0
    relations_created = 0
    errors = []
    
    # Split by semicolon and process each statement
    statements = [s.strip() for s in sql.split(';') if s.strip()]
    
    for stmt in statements:
        if 'Report_View' in stmt and 'Report_ViewRelation' not in stmt:
            parsed = parse_view_insert(stmt)
            if parsed:
                try:
                    # Check if exists
                    existing = await db.views.find_one({"view_id": parsed['view_id']})
                    if not existing:
                        view = View(**parsed)
                        doc = view.model_dump()
                        doc['created_at'] = doc['created_at'].isoformat()
                        await db.views.insert_one(doc)
                        views_created += 1
                except Exception as e:
                    errors.append(f"Error creating view: {str(e)}")
        
        elif 'Report_ViewRelation' in stmt:
            parsed = parse_view_relation_insert(stmt)
            if parsed:
                try:
                    # Auto-create views if they don't exist
                    for vid in [parsed['id_view1'], parsed['id_view2']]:
                        existing = await db.views.find_one({"view_id": vid})
                        if not existing:
                            # Create placeholder view
                            view = View(view_id=vid, name=f"View_{vid}")
                            doc = view.model_dump()
                            doc['created_at'] = doc['created_at'].isoformat()
                            await db.views.insert_one(doc)
                            views_created += 1
                    
                    relation = ViewRelation(**parsed)
                    doc = relation.model_dump()
                    doc['created_at'] = doc['created_at'].isoformat()
                    await db.view_relations.insert_one(doc)
                    relations_created += 1
                except Exception as e:
                    errors.append(f"Error creating relation: {str(e)}")
    
    return SqlImportResponse(
        views_created=views_created,
        relations_created=relations_created,
        errors=errors
    )

# ============ GRAPH DATA ENDPOINT ============

@api_router.get("/graph-data")
async def get_graph_data():
    """Get all data formatted for graph visualization"""
    views = await db.views.find({}, {"_id": 0}).to_list(10000)
    relations = await db.view_relations.find({}, {"_id": 0}).to_list(10000)
    
    # Format for frontend
    nodes = []
    for v in views:
        display_name = v.get('alias') or v.get('name', f"View_{v['view_id']}")
        nodes.append({
            "id": str(v['view_id']),
            "view_id": v['view_id'],
            "name": v.get('name', ''),
            "name2": v.get('name2'),
            "alias": v.get('alias'),
            "display_name": display_name
        })
    
    edges = []
    for r in relations:
        edges.append({
            "id": r['id'],
            "source": str(r['id_view1']),
            "target": str(r['id_view2']),
            "relation": r.get('relation', ''),
            "relation2": r.get('relation2'),
            "edge_weight": r.get('edge_weight', 10)
        })
    
    return {"nodes": nodes, "edges": edges}

# ============ CLEAR DATA ENDPOINT ============

@api_router.delete("/clear-all")
async def clear_all_data():
    """Clear all views and relations"""
    await db.views.delete_many({})
    await db.view_relations.delete_many({})
    return {"message": "All data cleared"}

# ============ STATS ENDPOINT ============

@api_router.get("/stats")
async def get_stats():
    """Get database statistics"""
    views_count = await db.views.count_documents({})
    relations_count = await db.view_relations.count_documents({})
    return {
        "views_count": views_count,
        "relations_count": relations_count
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
