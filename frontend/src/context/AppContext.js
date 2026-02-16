import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { APP_NAME, APP_VERSION } from "../config/appInfo";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.trim();
const HAS_BACKEND_CONFIG =
  !!BACKEND_URL &&
  BACKEND_URL !== "undefined" &&
  BACKEND_URL !== "null";
const API = HAS_BACKEND_CONFIG ? `${BACKEND_URL}/api` : null;
const LOCAL_GRAPH_DATA_KEY = "dbgraph_graph_data";

const AppContext = createContext(null);

// Default settings
const defaultSettings = {
  // Display
  showViewId: true,
  showAlias: true,
  maxNodeNameLength: 20,
  nodeSize: "medium",

  // Colors per join type
  joinColors: {
    "LEFT JOIN": "#3B82F6",
    "RIGHT JOIN": "#8B5CF6",
    "INNER JOIN": "#10B981",
    "CROSS JOIN": "#F59E0B",
    "FULL JOIN": "#EC4899",
    JOIN: "#6366F1",
    DEFAULT: "#71717A",
  },

  // Layout
  layoutDirection: "TB",
  nodeSpacing: 80,
  levelSpacing: 120,

  // Edges
  edgeStyle: "smoothstep",
  edgePathOffset: 20,
  separateParallelEdges: true,
  showEdgeLabels: true,
  animatedEdges: false,

  // Theme
  theme: "light",

  // Details panel width
  detailsPanelWidth: 380,
};

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

const buildDisplayName = (view) =>
  view?.alias || view?.name || `View_${view?.view_id}`;

const toIntOrDefault = (value, defaultValue) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) ? numericValue : defaultValue;
};

const normalizeNode = (view) => ({
  ...view,
  id: String(view.id ?? view.view_id),
  view_id: Number(view.view_id),
  name: view.name || "",
  name2: view.name2 ?? null,
  alias: view.alias ?? null,
  min_app_version: toIntOrDefault(view.min_app_version, 0),
  max_app_version: toIntOrDefault(view.max_app_version, 999999),
  display_name: buildDisplayName(view),
});

const normalizeEdge = (relation) => ({
  ...relation,
  id: String(relation.id),
  source: String(relation.source ?? relation.id_view1),
  target: String(relation.target ?? relation.id_view2),
  relation: relation.relation || "",
  relation2: relation.relation2 ?? null,
  edge_weight: Number(relation.edge_weight ?? 10),
});

const splitSqlValues = (valuesStr) => {
  const values = [];
  let current = "";
  let inString = false;
  let quoteChar = null;

  for (let i = 0; i < valuesStr.length; i += 1) {
    const char = valuesStr[i];
    const nextChar = valuesStr[i + 1];

    if ((char === "'" || char === '"') && !inString) {
      inString = true;
      quoteChar = char;
      current += char;
      continue;
    }

    if (inString && char === quoteChar) {
      if (quoteChar === "'" && nextChar === "'") {
        current += "''";
        i += 1;
        continue;
      }
      inString = false;
      quoteChar = null;
      current += char;
      continue;
    }

    if (!inString && char === ",") {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const cleanSqlValue = (rawValue) => {
  if (rawValue == null) return null;
  const trimmed = rawValue.trim();
  if (trimmed.toUpperCase() === "NULL") return null;

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  return trimmed;
};

const parseViewInsert = (sql) => {
  const match = sql.match(
    /INSERT\s+INTO\s+Report_View\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
  );
  if (!match) return null;

  const columns = match[1].split(",").map((col) => col.trim().toLowerCase());
  const values = splitSqlValues(match[2]);
  const colMapping = {
    idview: "view_id",
    viewid: "view_id",
    name: "name",
    name2: "name2",
    alias: "alias",
    minappversion: "min_app_version",
    maxappversion: "max_app_version",
  };
  const numericFields = new Set([
    "view_id",
    "min_app_version",
    "max_app_version",
  ]);

  const result = {};
  columns.forEach((col, index) => {
    const mapped = colMapping[col.replace(/\s+/g, "")];
    if (!mapped) return;

    let value = cleanSqlValue(values[index]);
    if (numericFields.has(mapped)) {
      value = Number(value);
      if (!Number.isInteger(value)) {
        if (mapped === "view_id") return;
        value = null;
      }
    }
    result[mapped] = value;
  });

  if (!Number.isInteger(result.view_id) || !result.name) {
    return null;
  }

  if (result.min_app_version == null) {
    result.min_app_version = 0;
  }
  if (result.max_app_version == null) {
    result.max_app_version = 999999;
  }

  return result;
};

const parseViewRelationInsert = (sql) => {
  const match = sql.match(
    /INSERT\s+INTO\s+Report_ViewRelation\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
  );
  if (!match) return null;

  const columns = match[1].split(",").map((col) => col.trim().toLowerCase());
  const values = splitSqlValues(match[2]);
  const colMapping = {
    idview1: "id_view1",
    idview2: "id_view2",
    relation: "relation",
    relation2: "relation2",
    edgeweight: "edge_weight",
    minappversion: "min_app_version",
    maxappversion: "max_app_version",
    changeowner: "change_owner",
  };

  const numericFields = new Set([
    "id_view1",
    "id_view2",
    "edge_weight",
    "min_app_version",
    "max_app_version",
    "change_owner",
  ]);

  const result = {};
  columns.forEach((col, index) => {
    const mapped = colMapping[col.replace(/\s+/g, "")];
    if (!mapped) return;

    let value = cleanSqlValue(values[index]);

    if (numericFields.has(mapped)) {
      if (value == null) {
        result[mapped] = null;
        return;
      }
      value = Number(value);
      if (!Number.isInteger(value)) {
        if (mapped === "id_view1" || mapped === "id_view2") return;
        value = null;
      }
    }

    result[mapped] = value;
  });

  if (
    !Number.isInteger(result.id_view1) ||
    !Number.isInteger(result.id_view2) ||
    !result.relation
  ) {
    return null;
  }

  return result;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // React Flow instance ref
  const reactFlowInstance = useRef(null);

  // Settings state - load safely
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("dbgraph_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          joinColors: {
            ...defaultSettings.joinColors,
            ...(parsed.joinColors || {}),
          },
        };
      }
    } catch (e) {
      console.warn("Error loading settings:", e);
    }
    return { ...defaultSettings };
  });

  // Original imported data (to track what's new)
  const [originalImportedIds, setOriginalImportedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("dbgraph_original_ids");
      return saved ? JSON.parse(saved) : { views: [], relations: [] };
    } catch (e) {
      return { views: [], relations: [] };
    }
  });

  // Last imported SQL script
  const [lastImportedSql, setLastImportedSql] = useState(() => {
    return localStorage.getItem("dbgraph_last_sql") || "";
  });

  // Data state
  const [views, setViews] = useState([]);
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(
    HAS_BACKEND_CONFIG ? "server" : "local",
  );

  // UI state
  const [selectedView, setSelectedView] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ views_count: 0, relations_count: 0 });

  // Filter state
  const [filterMode, setFilterMode] = useState(false); // Selection mode for filtering
  const [hiddenViews, setHiddenViews] = useState(new Set());
  const [selectedForFilter, setSelectedForFilter] = useState(new Set());

  // Pathfinding state
  const [pathfindingMode, setPathfindingMode] = useState(false);
  const [pathStart, setPathStart] = useState(null);
  const [pathEnd, setPathEnd] = useState(null);
  const [foundPath, setFoundPath] = useState(null);

  // Connection mode (for creating relations from nodes)
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionSource, setConnectionSource] = useState(null);

  // Save settings to localStorage - debounced
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem("dbgraph_settings", JSON.stringify(settings));
      } catch (e) {
        console.warn("Error saving settings:", e);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [settings]);

  // Save original IDs
  useEffect(() => {
    try {
      localStorage.setItem(
        "dbgraph_original_ids",
        JSON.stringify(originalImportedIds),
      );
    } catch (e) {
      console.warn("Error saving original IDs:", e);
    }
  }, [originalImportedIds]);

  // Save last SQL
  useEffect(() => {
    try {
      localStorage.setItem("dbgraph_last_sql", lastImportedSql);
    } catch (e) {
      console.warn("Error saving SQL:", e);
    }
  }, [lastImportedSql]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(settings.theme);
  }, [settings.theme]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev };
      Object.keys(newSettings).forEach((key) => {
        if (
          key === "joinColors" &&
          typeof newSettings.joinColors === "object"
        ) {
          updated.joinColors = {
            ...prev.joinColors,
            ...newSettings.joinColors,
          };
        } else {
          updated[key] = newSettings[key];
        }
      });
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...defaultSettings });
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  }, []);

  // Get join type from relation string
  const getJoinType = useCallback((relationStr) => {
    if (!relationStr) return "DEFAULT";
    const upper = relationStr.toUpperCase();
    if (upper.includes("LEFT JOIN")) return "LEFT JOIN";
    if (upper.includes("RIGHT JOIN")) return "RIGHT JOIN";
    if (upper.includes("INNER JOIN")) return "INNER JOIN";
    if (upper.includes("CROSS JOIN")) return "CROSS JOIN";
    if (upper.includes("FULL JOIN") || upper.includes("FULL OUTER"))
      return "FULL JOIN";
    if (upper.includes("JOIN")) return "JOIN";
    return "DEFAULT";
  }, []);

  // Get color for join type
  const getJoinColor = useCallback(
    (relationStr) => {
      const joinType = getJoinType(relationStr);
      return settings.joinColors[joinType] || settings.joinColors["DEFAULT"];
    },
    [getJoinType, settings.joinColors],
  );

  // Check if a view is new (not in original import)
  const isNewView = useCallback(
    (viewId) => {
      return !originalImportedIds.views.includes(viewId);
    },
    [originalImportedIds.views],
  );

  // Check if a relation is new
  const isNewRelation = useCallback(
    (relationId) => {
      return !originalImportedIds.relations.includes(relationId);
    },
    [originalImportedIds.relations],
  );

  // Get next available view ID
  const getNextViewId = useCallback(() => {
    if (views.length === 0) return 1;
    const maxId = Math.max(...views.map((v) => v.view_id));
    return maxId + 1;
  }, [views]);

  // Focus on a node in the graph
  const focusOnNode = useCallback((nodeId) => {
    if (reactFlowInstance.current) {
      const node = reactFlowInstance.current.getNode(nodeId);
      if (node) {
        reactFlowInstance.current.fitView({
          nodes: [node],
          padding: 0.5,
          duration: 500,
        });
      }
    }
  }, []);

  // Copy to clipboard with fallback
  const copyToClipboard = useCallback(async (text) => {
    try {
      // Try modern API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn("Clipboard API failed, using fallback");
    }

    // Fallback: create textarea
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error("Fallback clipboard failed:", err);
      return false;
    }
  }, []);

  const saveLocalGraphData = useCallback((nodes, edges) => {
    try {
      localStorage.setItem(
        LOCAL_GRAPH_DATA_KEY,
        JSON.stringify({ nodes: nodes || [], edges: edges || [] }),
      );
    } catch (e) {
      console.warn("Error saving graph data:", e);
    }
  }, []);

  const loadLocalGraphData = useCallback(() => {
    const fallback = { nodes: [], edges: [] };
    const saved = localStorage.getItem(LOCAL_GRAPH_DATA_KEY);
    if (!saved) return fallback;
    const parsed = safeParse(saved, fallback);
    if (!parsed || typeof parsed !== "object") return fallback;
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes.map(normalizeNode) : [],
      edges: Array.isArray(parsed.edges)
        ? parsed.edges.map(normalizeEdge)
        : [],
    };
  }, []);

  const applyGraphData = useCallback(
    (nodes, edges, source = "local", externalStats = null) => {
      const normalizedNodes = (nodes || []).map(normalizeNode);
      const normalizedEdges = (edges || []).map(normalizeEdge);

      setViews(normalizedNodes);
      setRelations(normalizedEdges);
      setStats(
        externalStats || {
          views_count: normalizedNodes.length,
          relations_count: normalizedEdges.length,
        },
      );
      setDataSource(source);
      saveLocalGraphData(normalizedNodes, normalizedEdges);
    },
    [saveLocalGraphData],
  );

  const shouldUseLocalFallback = useCallback((err) => {
    if (!HAS_BACKEND_CONFIG) return true;
    if (!err?.response) return true;
    return err.response.status >= 500;
  }, []);

  const runWithLocalFallback = useCallback(
    async (serverOperation, localOperation) => {
      if (!HAS_BACKEND_CONFIG) {
        return localOperation();
      }

      try {
        const result = await serverOperation();
        setDataSource("server");
        return result;
      } catch (err) {
        if (shouldUseLocalFallback(err)) {
          return localOperation();
        }
        throw err;
      }
    },
    [shouldUseLocalFallback],
  );

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!HAS_BACKEND_CONFIG) {
        const localData = loadLocalGraphData();
        applyGraphData(localData.nodes, localData.edges, "local");
        return;
      }

      const [graphRes, statsRes] = await Promise.all([
        axios.get(`${API}/graph-data`),
        axios.get(`${API}/stats`),
      ]);

      applyGraphData(
        graphRes.data.nodes || [],
        graphRes.data.edges || [],
        "server",
        statsRes.data,
      );
    } catch (err) {
      console.error("Error fetching data:", err);
      if (shouldUseLocalFallback(err)) {
        const localData = loadLocalGraphData();
        applyGraphData(localData.nodes, localData.edges, "local");
      } else {
        setError("Error carregant les dades");
      }
    } finally {
      setLoading(false);
    }
  }, [applyGraphData, loadLocalGraphData, shouldUseLocalFallback]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pathfinding - BFS
  const findPath = useCallback(
    (startId, endId) => {
      if (!startId || !endId || startId === endId) {
        setFoundPath(null);
        return null;
      }

      const adjacency = new Map();
      views.forEach((v) => adjacency.set(v.id, []));

      relations.forEach((rel) => {
        if (adjacency.has(rel.source)) {
          adjacency.get(rel.source).push({ target: rel.target, relation: rel });
        }
        if (adjacency.has(rel.target)) {
          adjacency.get(rel.target).push({ target: rel.source, relation: rel });
        }
      });

      const queue = [{ node: startId, path: [startId], edges: [] }];
      const visited = new Set([startId]);

      while (queue.length > 0) {
        const { node, path, edges } = queue.shift();

        if (node === endId) {
          const result = { nodes: path, edges };
          setFoundPath(result);
          return result;
        }

        const neighbors = adjacency.get(node) || [];
        for (const { target, relation } of neighbors) {
          if (!visited.has(target)) {
            visited.add(target);
            queue.push({
              node: target,
              path: [...path, target],
              edges: [...edges, relation.id],
            });
          }
        }
      }

      setFoundPath({ nodes: [], edges: [], notFound: true });
      return null;
    },
    [views, relations],
  );

  // Clear pathfinding
  const clearPathfinding = useCallback(() => {
    setPathfindingMode(false);
    setPathStart(null);
    setPathEnd(null);
    setFoundPath(null);
  }, []);

  // Clear connection mode
  const clearConnectionMode = useCallback(() => {
    setConnectionMode(false);
    setConnectionSource(null);
  }, []);

  // Filter functions
  const toggleViewHidden = useCallback((viewId) => {
    setHiddenViews((prev) => {
      const next = new Set(prev);
      if (next.has(viewId)) {
        next.delete(viewId);
      } else {
        next.add(viewId);
      }
      return next;
    });
  }, []);

  const toggleViewForFilter = useCallback((viewId) => {
    setSelectedForFilter((prev) => {
      const next = new Set(prev);
      if (next.has(viewId)) {
        next.delete(viewId);
      } else {
        next.add(viewId);
      }
      return next;
    });
  }, []);

  const applyFilter = useCallback(() => {
    // Hide all views NOT in selectedForFilter
    const toHide = new Set();
    views.forEach((v) => {
      if (!selectedForFilter.has(v.view_id)) {
        toHide.add(v.view_id);
      }
    });
    setHiddenViews(toHide);
    setFilterMode(false);
    setSelectedForFilter(new Set());
  }, [views, selectedForFilter]);

  const clearFilters = useCallback(() => {
    setHiddenViews(new Set());
    setSelectedForFilter(new Set());
    setFilterMode(false);
  }, []);

  const showOnlyConnected = useCallback(
    (viewId) => {
      // Find all views connected to this one
      const connected = new Set([viewId]);
      relations.forEach((rel) => {
        const sourceView = views.find((v) => v.id === rel.source);
        const targetView = views.find((v) => v.id === rel.target);
        if (sourceView?.view_id === viewId && targetView) {
          connected.add(targetView.view_id);
        }
        if (targetView?.view_id === viewId && sourceView) {
          connected.add(sourceView.view_id);
        }
      });

      const toHide = new Set();
      views.forEach((v) => {
        if (!connected.has(v.view_id)) {
          toHide.add(v.view_id);
        }
      });
      setHiddenViews(toHide);
    },
    [views, relations],
  );

  // Import SQL
  const importSql = useCallback(
    async (sql, isInitialImport = true) => {
      return runWithLocalFallback(
        async () => {
          const response = await axios.post(`${API}/import-sql`, { sql });

          if (isInitialImport) {
            setLastImportedSql(sql);
            const graphRes = await axios.get(`${API}/graph-data`);
            const viewIds = (graphRes.data.nodes || []).map((v) => v.view_id);
            const relationIds = (graphRes.data.edges || []).map((r) => r.id);
            setOriginalImportedIds({ views: viewIds, relations: relationIds });
          }

          await fetchData();
          return response.data;
        },
        async () => {
          const statements = sql
            .split(";")
            .map((stmt) => stmt.trim())
            .filter(Boolean);

          const nodes = [...views];
          const edges = [...relations];
          const errors = [];
          let views_created = 0;
          let relations_created = 0;

          for (const statement of statements) {
            if (
              /Report_View/i.test(statement) &&
              !/Report_ViewRelation/i.test(statement)
            ) {
              const parsed = parseViewInsert(statement);
              if (!parsed) continue;

              const exists = nodes.some((v) => v.view_id === parsed.view_id);
              if (!exists) {
                nodes.push(
                  normalizeNode({
                    view_id: parsed.view_id,
                    name: parsed.name,
                    name2: parsed.name2,
                    alias: parsed.alias,
                    min_app_version: parsed.min_app_version,
                    max_app_version: parsed.max_app_version,
                  }),
                );
                views_created += 1;
              }
              continue;
            }

            if (/Report_ViewRelation/i.test(statement)) {
              const parsed = parseViewRelationInsert(statement);
              if (!parsed) continue;

              try {
                [parsed.id_view1, parsed.id_view2].forEach((id) => {
                  const exists = nodes.some((v) => v.view_id === id);
                  if (!exists) {
                    nodes.push(
                      normalizeNode({
                        view_id: id,
                        name: `View_${id}`,
                        name2: null,
                        alias: null,
                        min_app_version: 0,
                        max_app_version: 999999,
                      }),
                    );
                    views_created += 1;
                  }
                });

                const relationId =
                  typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

                edges.push(
                  normalizeEdge({
                    id: relationId,
                    source: String(parsed.id_view1),
                    target: String(parsed.id_view2),
                    relation: parsed.relation,
                    relation2: parsed.relation2,
                    edge_weight: parsed.edge_weight ?? 10,
                  }),
                );
                relations_created += 1;
              } catch (e) {
                errors.push(`Error creating relation: ${String(e)}`);
              }
            }
          }

          if (isInitialImport) {
            setLastImportedSql(sql);
          }

          applyGraphData(nodes, edges, "local");

          if (isInitialImport) {
            setOriginalImportedIds({
              views: nodes.map((v) => v.view_id),
              relations: edges.map((r) => r.id),
            });
          }

          return { views_created, relations_created, errors };
        },
      );
    },
    [applyGraphData, fetchData, relations, runWithLocalFallback, views],
  );

  // Export view as SQL
  const exportViewAsSql = useCallback((view, type = "INSERT") => {
    const name = view.name ? `'${view.name.replace(/'/g, "''")}'` : "NULL";
    const name2 = view.name2 ? `'${view.name2.replace(/'/g, "''")}'` : "NULL";
    const alias = view.alias ? `'${view.alias.replace(/'/g, "''")}'` : "NULL";
    const minAppVersion = toIntOrDefault(view.min_app_version, 0);
    const maxAppVersion = toIntOrDefault(view.max_app_version, 999999);

    if (type === "INSERT") {
      return `INSERT INTO Report_View (IdView, Name, Name2, Alias, MinAppVersion, MaxAppVersion) VALUES(${view.view_id}, ${name}, ${name2}, ${alias}, ${minAppVersion}, ${maxAppVersion});`;
    } else {
      return `UPDATE Report_View SET Name = ${name}, Name2 = ${name2}, Alias = ${alias}, MinAppVersion = ${minAppVersion}, MaxAppVersion = ${maxAppVersion} WHERE IdView = ${view.view_id};`;
    }
  }, []);

  // Export relation as SQL
  const exportRelationAsSql = useCallback(
    (relation, type = "INSERT") => {
      const rel1 = relation.relation
        ? `'${relation.relation.replace(/'/g, "''")}'`
        : "NULL";
      const rel2 = relation.relation2
        ? `'${relation.relation2.replace(/'/g, "''")}'`
        : "NULL";
      const weight = relation.edge_weight || 10;
      const idView1 = relation.source || relation.id_view1;
      const idView2 = relation.target || relation.id_view2;

      // Get numeric IDs
      const sourceView = views.find((v) => v.id === idView1);
      const targetView = views.find((v) => v.id === idView2);
      const numericId1 = sourceView?.view_id || idView1;
      const numericId2 = targetView?.view_id || idView2;

      if (type === "INSERT") {
        return `INSERT INTO Report_ViewRelation (IdView1, IdView2, Relation, Relation2, EdgeWeight, MinAppVersion, MaxAppVersion, ChangeOwner) VALUES(${numericId1}, ${numericId2}, ${rel1}, ${rel2}, ${weight}, 2000000, 999999999, 1);`;
      } else {
        return `UPDATE Report_ViewRelation SET Relation = ${rel1}, Relation2 = ${rel2}, EdgeWeight = ${weight} WHERE IdView1 = ${numericId1} AND IdView2 = ${numericId2};`;
      }
    },
    [views],
  );

  // CRUD operations
  const createView = useCallback(
    async (viewData) => {
      return runWithLocalFallback(
        async () => {
          await axios.post(`${API}/views`, viewData);
          await fetchData();
        },
        async () => {
          const numericViewId = Number(viewData.view_id);
          if (!Number.isInteger(numericViewId)) {
            throw new Error("View ID invàlid");
          }

          if (views.some((v) => v.view_id === numericViewId)) {
            throw new Error("Ja existeix una vista amb aquest ID");
          }

          const newView = normalizeNode({
            view_id: numericViewId,
            name: viewData.name,
            name2: viewData.name2 ?? null,
            alias: viewData.alias ?? null,
            min_app_version: toIntOrDefault(viewData.min_app_version, 0),
            max_app_version: toIntOrDefault(viewData.max_app_version, 999999),
          });

          applyGraphData([...views, newView], relations, "local");
        },
      );
    },
    [applyGraphData, fetchData, relations, runWithLocalFallback, views],
  );

  const updateView = useCallback(
    async (viewId, updateData) => {
      return runWithLocalFallback(
        async () => {
          await axios.put(`${API}/views/${viewId}`, updateData);
          await fetchData();
        },
        async () => {
          const numericViewId = Number(viewId);
          const existing = views.find((v) => v.view_id === numericViewId);
          if (!existing) {
            throw new Error("Vista no trobada");
          }

          const updatedViews = views.map((view) => {
            if (view.view_id !== numericViewId) return view;
            const normalizedUpdateData = { ...updateData };
            if (Object.prototype.hasOwnProperty.call(updateData, "min_app_version")) {
              normalizedUpdateData.min_app_version = toIntOrDefault(
                updateData.min_app_version,
                0,
              );
            }
            if (Object.prototype.hasOwnProperty.call(updateData, "max_app_version")) {
              normalizedUpdateData.max_app_version = toIntOrDefault(
                updateData.max_app_version,
                999999,
              );
            }
            return normalizeNode({
              ...view,
              ...normalizedUpdateData,
            });
          });

          applyGraphData(updatedViews, relations, "local");
        },
      );
    },
    [applyGraphData, fetchData, relations, runWithLocalFallback, views],
  );

  const deleteView = useCallback(
    async (viewId) => {
      return runWithLocalFallback(
        async () => {
          await axios.delete(`${API}/views/${viewId}`);
          if (selectedView?.view_id === viewId) {
            setSelectedView(null);
          }
          await fetchData();
        },
        async () => {
          const numericViewId = Number(viewId);
          const node = views.find((v) => v.view_id === numericViewId);
          if (!node) {
            throw new Error("Vista no trobada");
          }

          const updatedViews = views.filter((v) => v.view_id !== numericViewId);
          const updatedRelations = relations.filter(
            (r) => r.source !== node.id && r.target !== node.id,
          );

          if (selectedView?.view_id === numericViewId) {
            setSelectedView(null);
          }

          applyGraphData(updatedViews, updatedRelations, "local");
        },
      );
    },
    [applyGraphData, fetchData, relations, runWithLocalFallback, selectedView, views],
  );

  const createRelation = useCallback(
    async (relationData) => {
      return runWithLocalFallback(
        async () => {
          await axios.post(`${API}/relations`, relationData);
          await fetchData();
        },
        async () => {
          const idView1 = Number(relationData.id_view1);
          const idView2 = Number(relationData.id_view2);

          const sourceExists = views.some((v) => v.view_id === idView1);
          const targetExists = views.some((v) => v.view_id === idView2);

          if (!sourceExists || !targetExists) {
            throw new Error("Una o més vistes no existeixen");
          }

          const relationId =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

          const newRelation = normalizeEdge({
            id: relationId,
            source: String(idView1),
            target: String(idView2),
            relation: relationData.relation,
            relation2: relationData.relation2 ?? null,
            edge_weight: relationData.edge_weight ?? 10,
          });

          applyGraphData(views, [...relations, newRelation], "local");
        },
      );
    },
    [applyGraphData, fetchData, relations, runWithLocalFallback, views],
  );

  const updateRelation = useCallback(
    async (relationId, updateData) => {
      return runWithLocalFallback(
        async () => {
          await axios.put(`${API}/relations/${relationId}`, updateData);
          await fetchData();
        },
        async () => {
          const exists = relations.some((r) => r.id === relationId);
          if (!exists) {
            throw new Error("Relació no trobada");
          }

          const updatedRelations = relations.map((relation) => {
            if (relation.id !== relationId) return relation;
            return normalizeEdge({
              ...relation,
              ...updateData,
            });
          });

          applyGraphData(views, updatedRelations, "local");
        },
      );
    },
    [applyGraphData, fetchData, relations, runWithLocalFallback, views],
  );

  const deleteRelation = useCallback(
    async (relationId) => {
      return runWithLocalFallback(
        async () => {
          await axios.delete(`${API}/relations/${relationId}`);
          if (selectedRelation?.id === relationId) {
            setSelectedRelation(null);
          }
          await fetchData();
        },
        async () => {
          const updatedRelations = relations.filter((r) => r.id !== relationId);
          if (updatedRelations.length === relations.length) {
            throw new Error("Relació no trobada");
          }

          if (selectedRelation?.id === relationId) {
            setSelectedRelation(null);
          }

          applyGraphData(views, updatedRelations, "local");
        },
      );
    },
    [applyGraphData, fetchData, relations, runWithLocalFallback, selectedRelation, views],
  );

  const clearAllData = useCallback(async () => {
    return runWithLocalFallback(
      async () => {
        await axios.delete(`${API}/clear-all`);
        setSelectedView(null);
        setSelectedRelation(null);
        clearPathfinding();
        clearConnectionMode();
        clearFilters();
        setOriginalImportedIds({ views: [], relations: [] });
        setLastImportedSql("");
        await fetchData();
      },
      async () => {
        setSelectedView(null);
        setSelectedRelation(null);
        clearPathfinding();
        clearConnectionMode();
        clearFilters();
        setOriginalImportedIds({ views: [], relations: [] });
        setLastImportedSql("");
        applyGraphData([], [], "local");
      },
    );
  }, [
    applyGraphData,
    clearConnectionMode,
    clearFilters,
    clearPathfinding,
    fetchData,
    runWithLocalFallback,
  ]);

  // Get new views and relations
  const newViews = views.filter((v) => isNewView(v.view_id));
  const newRelations = relations.filter((r) => isNewRelation(r.id));

  const clearNewItems = useCallback(async () => {
    return runWithLocalFallback(
      async () => {
        const deletePromises = [];

        newRelations.forEach((rel) => {
          deletePromises.push(axios.delete(`${API}/relations/${rel.id}`));
        });

        newViews.forEach((view) => {
          deletePromises.push(axios.delete(`${API}/views/${view.view_id}`));
        });

        await Promise.all(deletePromises);

        if (selectedView && isNewView(selectedView.view_id)) {
          setSelectedView(null);
        }
        if (selectedRelation && isNewRelation(selectedRelation.id)) {
          setSelectedRelation(null);
        }

        await fetchData();
      },
      async () => {
        const newViewIdSet = new Set(newViews.map((v) => v.view_id));
        const newRelationIdSet = new Set(newRelations.map((r) => r.id));

        const updatedViews = views.filter((v) => !newViewIdSet.has(v.view_id));
        const removedNodeIds = new Set(
          views
            .filter((v) => newViewIdSet.has(v.view_id))
            .map((v) => String(v.id)),
        );
        const updatedRelations = relations.filter(
          (r) =>
            !newRelationIdSet.has(r.id) &&
            !removedNodeIds.has(r.source) &&
            !removedNodeIds.has(r.target),
        );

        if (selectedView && isNewView(selectedView.view_id)) {
          setSelectedView(null);
        }
        if (selectedRelation && isNewRelation(selectedRelation.id)) {
          setSelectedRelation(null);
        }

        applyGraphData(updatedViews, updatedRelations, "local");
      },
    );
  }, [
    applyGraphData,
    isNewRelation,
    isNewView,
    fetchData,
    relations,
    runWithLocalFallback,
    newViews,
    newRelations,
    selectedView,
    selectedRelation,
    views,
  ]);

  // Filter views based on search and hidden
  const filteredViews = views.filter((view) => {
    // Check if hidden
    if (hiddenViews.has(view.view_id)) return false;

    // Check search
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      view.display_name?.toLowerCase().includes(query) ||
      view.name?.toLowerCase().includes(query) ||
      view.alias?.toLowerCase().includes(query) ||
      String(view.view_id).includes(query)
    );
  });

  // Visible views (not hidden)
  const visibleViews = views.filter((v) => !hiddenViews.has(v.view_id));

  // Visible relations (both ends visible)
  const visibleRelations = relations.filter((rel) => {
    const sourceView = views.find((v) => v.id === rel.source);
    const targetView = views.find((v) => v.id === rel.target);
    return (
      sourceView &&
      targetView &&
      !hiddenViews.has(sourceView.view_id) &&
      !hiddenViews.has(targetView.view_id)
    );
  });

  const value = {
    // React Flow instance
    reactFlowInstance,

    // Settings
    settings,
    updateSettings,
    resetSettings,
    toggleTheme,
    defaultSettings,

    // Helpers
    getJoinType,
    getJoinColor,
    isNewView,
    isNewRelation,
    getNextViewId,
    focusOnNode,
    copyToClipboard,
    exportViewAsSql,
    exportRelationAsSql,

    // Data
    views,
    relations,
    filteredViews,
    visibleViews,
    visibleRelations,
    newViews,
    newRelations,
    loading,
    error,
    stats,
    lastImportedSql,
    dataSource,
    appName: APP_NAME,
    appVersion: APP_VERSION,

    // Selection
    selectedView,
    setSelectedView,
    selectedRelation,
    setSelectedRelation,

    // Search
    searchQuery,
    setSearchQuery,

    // Filters
    filterMode,
    setFilterMode,
    hiddenViews,
    selectedForFilter,
    toggleViewHidden,
    toggleViewForFilter,
    applyFilter,
    clearFilters,
    showOnlyConnected,

    // Pathfinding
    pathfindingMode,
    setPathfindingMode,
    pathStart,
    setPathStart,
    pathEnd,
    setPathEnd,
    foundPath,
    findPath,
    clearPathfinding,

    // Connection mode
    connectionMode,
    setConnectionMode,
    connectionSource,
    setConnectionSource,
    clearConnectionMode,

    // Actions
    fetchData,
    importSql,
    createView,
    updateView,
    deleteView,
    createRelation,
    updateRelation,
    deleteRelation,
    clearAllData,
    clearNewItems,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
