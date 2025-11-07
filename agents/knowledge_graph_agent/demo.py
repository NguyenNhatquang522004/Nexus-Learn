"""
Knowledge Graph Agent - Feature Demonstration
Demonstrates all core functionality without requiring Neo4j
"""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
import io


async def demo_knowledge_graph_agent():
    """Demonstrate all Knowledge Graph Agent features"""
    
    print("🎯 Knowledge Graph Agent - Feature Demo\n")
    print("="*60)
    
    # Mock configuration YAML content
    yaml_content = """agent:
  name: knowledge_graph_agent
  port: 8010
neo4j:
  uri: bolt://localhost:7687
  user: neo4j
  password: test
  database: test_db
  max_connection_pool_size: 10
  connection_timeout: 5
node_types:
  - Concept
  - User
  - Content
  - Quiz
  - LearningPath
relationship_types:
  - PREREQUISITE_OF
  - LEARNS
  - MASTERS
caching:
  enable: true
  ttl: 300
  redis_url: redis://localhost:6379
"""
    
    # Mock Neo4j driver
    mock_driver = AsyncMock()
    mock_session = AsyncMock()
    mock_result = AsyncMock()
    
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_result.single = AsyncMock(return_value={"id": "concept_1"})
    mock_result.data = AsyncMock(return_value=[
        {"id": "concept_1", "name": "Python Basics", "difficulty": 0.5}
    ])
    mock_session.run = AsyncMock(return_value=mock_result)
    mock_driver.session = MagicMock(return_value=mock_session)
    
    # Mock Redis
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.setex = AsyncMock()
    mock_redis.ping = AsyncMock()
    mock_redis.close = AsyncMock()
    
    # Import with patches
    with patch("builtins.open", return_value=io.StringIO(yaml_content)):
        with patch("neo4j.AsyncGraphDatabase.driver", return_value=mock_driver):
            with patch("redis.asyncio.from_url", return_value=mock_redis):
                from knowledge_graph_agent import KnowledgeGraphAgent
                
                agent = KnowledgeGraphAgent("config.yaml")
                agent.neo4j_pool.driver = mock_driver
                if agent.cache:
                    agent.cache.redis = mock_redis
    
    # Feature 1: Agent Initialization
    print("\n1️⃣ Agent Initialization")
    print(f"   ✅ Agent: {agent.config['agent']['name']}")
    print(f"   ✅ Node types: {len(agent.node_types)}")
    print(f"   ✅ Relationship types: {len(agent.relationship_types)}")
    
    # Feature 2: Create Node
    print("\n2️⃣ Create Node")
    node_id = await agent.create_node("Concept", {
        "id": "python_basics",
        "name": "Python Basics",
        "difficulty": 0.5
    })
    print(f"   ✅ Created node: {node_id}")
    
    # Feature 3: Create Relationship
    print("\n3️⃣ Create Relationship")
    mock_result.single = AsyncMock(return_value={"rel_id": "123"})
    rel_id = await agent.create_relationship(
        "python_basics",
        "python_oop",
        "PREREQUISITE_OF",
        {"weight": 1.0}
    )
    print(f"   ✅ Created relationship: {rel_id}")
    
    # Feature 4: Execute Cypher Query
    print("\n4️⃣ Execute Cypher Query")
    results = await agent.query_cypher(
        "MATCH (c:Concept) WHERE c.difficulty < $max RETURN c",
        {"max": 0.6}
    )
    print(f"   ✅ Query executed: {len(results)} results")
    
    # Feature 5: Find Learning Path
    print("\n5️⃣ Find Learning Path")
    # Mock the async iterator for mastered concepts
    async def mock_mastered_iter():
        yield {"concept_id": "python_basics"}
    
    mock_mastered = AsyncMock()
    mock_mastered.__aiter__ = lambda self: mock_mastered_iter()
    
    mock_path_result = AsyncMock()
    mock_path_result.data = AsyncMock(return_value=[
        {
            "id": "python_oop",
            "name": "OOP",
            "difficulty": 0.7,
            "hours": 15.0,
            "content_types": ["video"],
            "description": "OOP in Python"
        }
    ])
    
    mock_session.run = AsyncMock(side_effect=[mock_mastered, mock_path_result])
    
    path = await agent.find_learning_path("user_1", "advanced_python")
    print(f"   ✅ Path found: {path['total_concepts']} concepts")
    print(f"   ✅ Estimated hours: {path['estimated_hours']}")
    print(f"   ✅ Difficulty: {path['difficulty_score']}")
    
    # Feature 6: Get Prerequisites
    print("\n6️⃣ Get Prerequisites")
    mock_result.data = AsyncMock(return_value=[
        {"id": "prereq_1", "name": "Basics", "depth": 1},
        {"id": "prereq_2", "name": "Intermediate", "depth": 2}
    ])
    mock_session.run = AsyncMock(return_value=mock_result)
    
    prereqs = await agent.get_prerequisites("advanced_concept")
    print(f"   ✅ Prerequisites found: {len(prereqs)}")
    
    # Feature 7: Find Similar Users
    print("\n7️⃣ Find Similar Users")
    mock_result.data = AsyncMock(return_value=[
        {
            "id": "user_2",
            "name": "John Doe",
            "similarity": 0.85,
            "concepts_learning": 15,
            "level": "intermediate",
            "interests": ["python", "ml"]
        }
    ])
    mock_session.run = AsyncMock(return_value=mock_result)
    
    similar = await agent.find_similar_users("user_1", limit=5)
    print(f"   ✅ Similar users found: {len(similar)}")
    if similar:
        print(f"   ✅ Top match: {similar[0]['name']} (similarity: {similar[0]['similarity']})")
    
    # Feature 8: Update Mastery
    print("\n8️⃣ Update Mastery")
    mock_result.single = AsyncMock(return_value={"score": 0.92})
    mock_session.run = AsyncMock(return_value=mock_result)
    
    success = await agent.update_mastery("user_1", "python_basics", 0.92)
    print(f"   ✅ Mastery updated: {success}")
    
    # Feature 9: Get Concept Graph
    print("\n9️⃣ Get Concept Graph")
    mock_nodes = AsyncMock()
    mock_nodes.data = AsyncMock(return_value=[
        {"node_id": "c1", "node_type": "Concept", "name": "Python"},
        {"node_id": "c2", "node_type": "Concept", "name": "OOP"}
    ])
    
    mock_edges = AsyncMock()
    mock_edges.data = AsyncMock(return_value=[
        {
            "rel_id": "123",
            "from_id": "c1",
            "to_id": "c2",
            "rel_type": "PREREQUISITE_OF",
            "properties": {}
        }
    ])
    
    mock_session.run = AsyncMock(side_effect=[mock_nodes, mock_edges])
    
    graph = await agent.get_concept_graph("python_basics", depth=2)
    print(f"   ✅ Graph retrieved: {graph['node_count']} nodes, {graph['edge_count']} edges")
    
    # Feature 10: Health Check
    print("\n🔟 Health Check")
    mock_result.single = AsyncMock(return_value={"health": 1})
    mock_session.run = AsyncMock(return_value=mock_result)
    
    health = await agent.get_health_status()
    print(f"   ✅ Status: {health['status']}")
    print(f"   ✅ Neo4j: {health['components']['neo4j']}")
    print(f"   ✅ Redis: {health['components']['redis_cache']}")
    
    print("\n" + "="*60)
    print("🎉 All features demonstrated successfully!")
    print("="*60 + "\n")


def main():
    """Run demo"""
    asyncio.run(demo_knowledge_graph_agent())


if __name__ == "__main__":
    main()
