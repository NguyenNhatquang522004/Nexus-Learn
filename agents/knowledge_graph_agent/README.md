# Knowledge Graph Agent

Production-ready Neo4j-based knowledge graph management agent for Learn Your Way Platform.

## Features

### Core Functionality
- ✅ **Node Management**: Create and manage Concept, User, Content, Quiz, LearningPath nodes
- ✅ **Relationship Management**: Create relationships between nodes (PREREQUISITE_OF, LEARNS, MASTERS, etc.)
- ✅ **Custom Cypher Queries**: Execute parameterized Cypher queries with injection prevention
- ✅ **Learning Path Finding**: Find optimal learning paths using shortest path algorithm
- ✅ **Prerequisites Retrieval**: Get prerequisite chains for concepts
- ✅ **Similar Users**: Find peers using Jaccard similarity
- ✅ **Mastery Tracking**: Update and track user mastery scores
- ✅ **Graph Visualization**: Get graph data for visualization tools

### Advanced Features
- 🚀 **Connection Pooling**: Neo4j connection pool with configurable size
- 🔄 **Retry Logic**: Automatic retry with exponential backoff
- 💾 **Redis Caching**: Query result caching with TTL
- 📊 **Prometheus Metrics**: Query count, duration, cache hits/misses
- 🏗️ **Index Management**: Automatic index and constraint creation
- 🔍 **Schema Validation**: Validate node types and relationship types
- 🎯 **APOC Support**: Support for APOC procedures
- 📦 **Batch Operations**: Efficient batch processing

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Knowledge Graph Agent                       │
├─────────────────────────────────────────────────────────┤
│  FastAPI Layer                                           │
│  ├── POST /nodes                                         │
│  ├── POST /relationships                                 │
│  ├── POST /query                                         │
│  ├── GET /learning-path/{user_id}/{concept_id}          │
│  ├── GET /prerequisites/{concept_id}                     │
│  ├── GET /similar-users/{user_id}                        │
│  ├── PUT /mastery                                        │
│  ├── GET /graph/{concept_id}                            │
│  ├── GET /health                                         │
│  └── GET /metrics                                        │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                    │
│  ├── Node Operations                                     │
│  ├── Relationship Operations                             │
│  ├── Graph Algorithms                                    │
│  ├── Path Finding                                        │
│  └── Similarity Computation                              │
├─────────────────────────────────────────────────────────┤
│  Data Access Layer                                       │
│  ├── Neo4j Connection Pool                               │
│  ├── Query Execution                                     │
│  ├── Transaction Management                              │
│  └── Cache Manager (Redis)                               │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    Neo4j 5.14           Redis 7.0           Prometheus
```

## Installation

### Prerequisites
- Python 3.10+
- Neo4j 5.14+ (with APOC and GDS plugins)
- Redis 7.0+
- Docker & Docker Compose (optional)

### Local Setup

1. **Clone repository**
```powershell
cd d:\nckh\project\learn-your-way-platform\agents\knowledge_graph_agent
```

2. **Install dependencies**
```powershell
pip install -r requirements.txt
```

3. **Configure environment**
```powershell
# Create .env file
echo "NEO4J_PASSWORD=your_password" > .env
```

4. **Update config.yaml**
```yaml
neo4j:
  uri: "bolt://localhost:7687"
  user: "neo4j"
  password: "${NEO4J_PASSWORD}"
```

5. **Run agent**
```powershell
python knowledge_graph_agent.py
```

### Docker Setup

```powershell
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f knowledge_graph_agent

# Stop services
docker-compose down
```

## Configuration

### config.yaml Structure

```yaml
agent:
  name: "knowledge_graph_agent"
  port: 8010
  host: "0.0.0.0"

neo4j:
  uri: "bolt://localhost:7687"
  user: "neo4j"
  password: "${NEO4J_PASSWORD}"
  database: "learn_your_way"
  max_connection_pool_size: 50
  connection_timeout: 30

node_types:
  - Concept
  - User
  - Content
  - Quiz
  - LearningPath

relationship_types:
  - PREREQUISITE_OF
  - LEARNS
  - STRUGGLES_WITH
  - MASTERS
  - BELONGS_TO
  - COLLABORATES_WITH

caching:
  enable: true
  ttl: 300
  redis_url: "redis://localhost:6379"
```

## API Documentation

### 1. Create Node

**Endpoint**: `POST /nodes`

**Request**:
```json
{
  "label": "Concept",
  "properties": {
    "id": "python_basics",
    "name": "Python Basics",
    "difficulty": 0.5,
    "estimated_hours": 10.0,
    "description": "Introduction to Python programming"
  }
}
```

**Response**:
```json
{
  "node_id": "python_basics",
  "label": "Concept",
  "properties": {
    "id": "python_basics",
    "name": "Python Basics",
    "created_at": "2025-11-03T10:00:00Z"
  },
  "created_at": "2025-11-03T10:00:00Z"
}
```

### 2. Create Relationship

**Endpoint**: `POST /relationships`

**Request**:
```json
{
  "from_id": "python_basics",
  "to_id": "python_oop",
  "rel_type": "PREREQUISITE_OF",
  "properties": {
    "weight": 1.0,
    "required": true
  }
}
```

**Response**:
```json
{
  "rel_id": "123",
  "from_id": "python_basics",
  "to_id": "python_oop",
  "type": "PREREQUISITE_OF",
  "properties": {
    "weight": 1.0,
    "required": true
  },
  "created_at": "2025-11-03T10:05:00Z"
}
```

### 3. Execute Cypher Query

**Endpoint**: `POST /query`

**Request**:
```json
{
  "cypher": "MATCH (c:Concept) WHERE c.difficulty < $max_difficulty RETURN c",
  "parameters": {
    "max_difficulty": 0.5
  },
  "cache": true
}
```

**Response**:
```json
{
  "results": [
    {"c": {"id": "python_basics", "name": "Python Basics"}},
    {"c": {"id": "html_basics", "name": "HTML Basics"}}
  ],
  "count": 2,
  "query": "MATCH (c:Concept) WHERE c.difficulty < $max_difficulty RETURN c"
}
```

### 4. Find Learning Path

**Endpoint**: `GET /learning-path/{user_id}/{concept_id}?max_depth=10`

**Response**:
```json
{
  "path": [
    {
      "id": "python_basics",
      "name": "Python Basics",
      "difficulty": 0.5,
      "hours": 10.0,
      "content_types": ["video", "quiz"],
      "description": "Introduction to Python"
    },
    {
      "id": "python_oop",
      "name": "Object-Oriented Programming",
      "difficulty": 0.7,
      "hours": 15.0,
      "content_types": ["video", "exercise"],
      "description": "OOP in Python"
    }
  ],
  "total_concepts": 2,
  "estimated_hours": 25.0,
  "difficulty_score": 0.6
}
```

### 5. Get Prerequisites

**Endpoint**: `GET /prerequisites/{concept_id}?max_depth=5`

**Response**:
```json
{
  "concept_id": "machine_learning",
  "prerequisites": [
    {
      "id": "python_basics",
      "name": "Python Basics",
      "difficulty": 0.5,
      "hours": 10.0,
      "depth": 2
    },
    {
      "id": "python_numpy",
      "name": "NumPy",
      "difficulty": 0.6,
      "hours": 8.0,
      "depth": 1
    }
  ],
  "count": 2
}
```

### 6. Find Similar Users

**Endpoint**: `GET /similar-users/{user_id}?limit=10&min_similarity=0.5`

**Response**:
```json
{
  "user_id": "user_123",
  "similar_users": [
    {
      "id": "user_456",
      "name": "John Doe",
      "similarity": 0.75,
      "concepts_learning": 12,
      "level": "intermediate",
      "interests": ["python", "machine_learning"]
    }
  ],
  "count": 1
}
```

### 7. Update Mastery

**Endpoint**: `PUT /mastery`

**Request**:
```json
{
  "user_id": "user_123",
  "concept_id": "python_basics",
  "score": 0.85,
  "timestamp": "2025-11-03T10:30:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "user_id": "user_123",
  "concept_id": "python_basics",
  "score": 0.85,
  "updated_at": "2025-11-03T10:30:00Z"
}
```

### 8. Get Concept Graph

**Endpoint**: `GET /graph/{concept_id}?depth=2&include_users=false`

**Response**:
```json
{
  "nodes": [
    {
      "node_id": "python_basics",
      "node_type": "Concept",
      "name": "Python Basics",
      "properties": {...}
    }
  ],
  "edges": [
    {
      "rel_id": "123",
      "from_id": "python_basics",
      "to_id": "python_oop",
      "rel_type": "PREREQUISITE_OF",
      "properties": {}
    }
  ],
  "central_node": "python_basics",
  "depth": 2
}
```

### 9. Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T10:00:00Z",
  "components": {
    "neo4j": "healthy",
    "redis_cache": "healthy"
  },
  "version": "1.0.0"
}
```

### 10. Metrics

**Endpoint**: `GET /metrics`

Returns Prometheus metrics in text format.

## Testing

### Run Unit Tests

```powershell
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=knowledge_graph_agent --cov-report=html

# Run specific test class
pytest tests/test_knowledge_graph_agent.py::TestKnowledgeGraphAgent -v
```

### Run Integration Tests

```powershell
# Requires Neo4j testcontainer
pytest tests/test_knowledge_graph_agent.py::test_integration_workflow -v
```

## Performance

### Connection Pooling
- Default pool size: 50 connections
- Configurable via `max_connection_pool_size`
- Automatic connection recycling

### Caching Strategy
- Redis-based query caching
- TTL: 300 seconds (configurable)
- Cache invalidation on mutations
- Pattern-based invalidation

### Query Optimization
- Parameterized queries (prevent injection)
- Index usage for ID lookups
- Batch operations support
- Transaction management

## Monitoring

### Prometheus Metrics

```
# Query metrics
kg_queries_total{query_type="create_node",status="success"} 150
kg_query_duration_seconds{query_type="find_learning_path"} 0.05

# Node metrics
kg_nodes_total{label="Concept"} 1000
kg_relationships_total{type="PREREQUISITE_OF"} 850

# Cache metrics
kg_cache_hits_total 450
kg_cache_misses_total 50
```

### Logging

Structured JSON logs with:
- Request ID
- Query type
- Duration
- Status
- Error details

## Security

### Query Injection Prevention
- Parameterized queries only
- Dangerous pattern detection
- Input validation

### Authentication
- Neo4j auth via config
- Environment variable support
- Secret management

## Troubleshooting

### Connection Issues

```powershell
# Test Neo4j connection
docker exec -it neo4j cypher-shell -u neo4j -p your_password

# Check agent logs
docker logs knowledge_graph_agent

# Test Redis
docker exec -it redis_cache redis-cli ping
```

### Performance Issues

```powershell
# Check query performance
MATCH (c:Concept) WHERE c.id = "python_basics" RETURN c
PROFILE

# Verify indexes
SHOW INDEXES

# Monitor memory
CALL dbms.listConfig() YIELD name, value 
WHERE name STARTS WITH 'dbms.memory'
```

## Production Deployment

### Environment Variables

```bash
NEO4J_PASSWORD=secure_password
REDIS_URL=redis://redis:6379
LOG_LEVEL=INFO
```

### Resource Requirements

- **CPU**: 2+ cores
- **Memory**: 4GB+ RAM
- **Disk**: 10GB+ SSD
- **Neo4j**: 2GB heap size minimum

### Scaling

- Horizontal: Multiple agent instances with load balancer
- Vertical: Increase Neo4j heap size
- Caching: Redis cluster for high availability

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [repository_url]
- Documentation: [docs_url]
- Email: support@example.com
