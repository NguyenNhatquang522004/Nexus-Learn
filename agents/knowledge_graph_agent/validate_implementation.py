"""
Comprehensive validation script for Knowledge Graph Agent
Validates implementation completeness and correctness
"""

import ast
import sys
from pathlib import Path
from typing import Dict, List, Set


class KnowledgeGraphValidator:
    """Validator for Knowledge Graph Agent implementation"""
    
    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.errors: List[str] = []
        self.warnings: List[str] = []
        
    def validate_all(self) -> bool:
        """Run all validation checks"""
        print("🔍 Validating Knowledge Graph Agent Implementation...\n")
        
        checks = [
            ("File Structure", self.validate_file_structure),
            ("Python Code", self.validate_python_code),
            ("Configuration", self.validate_configuration),
            ("Dependencies", self.validate_dependencies),
            ("Tests", self.validate_tests),
            ("Docker Setup", self.validate_docker),
            ("Forbidden Patterns", self.check_forbidden_patterns),
        ]
        
        for check_name, check_func in checks:
            print(f"📋 Checking {check_name}...")
            try:
                check_func()
                print(f"   ✅ {check_name} - PASSED\n")
            except Exception as e:
                self.errors.append(f"{check_name}: {str(e)}")
                print(f"   ❌ {check_name} - FAILED: {str(e)}\n")
        
        return self.print_results()
    
    def validate_file_structure(self):
        """Validate required files exist"""
        required_files = [
            "knowledge_graph_agent.py",
            "config.yaml",
            "requirements.txt",
            "Dockerfile",
            "docker-compose.yml",
            "prometheus.yml",
            "README.md",
            "tests/test_knowledge_graph_agent.py",
        ]
        
        for file_path in required_files:
            full_path = self.base_path / file_path
            if not full_path.exists():
                raise FileNotFoundError(f"Missing required file: {file_path}")
    
    def validate_python_code(self):
        """Validate Python code structure"""
        agent_file = self.base_path / "knowledge_graph_agent.py"
        
        with open(agent_file, 'r', encoding='utf-8') as f:
            content = f.read()
            tree = ast.parse(content)
        
        # Required classes
        required_classes = {
            "KnowledgeGraphAgent",
            "Neo4jConnectionPool",
            "CacheManager",
            "NodeType",
            "RelationshipType",
            "NodeRequest",
            "RelationshipRequest",
            "QueryRequest",
            "MasteryUpdate",
        }
        
        # Required methods in KnowledgeGraphAgent
        required_methods = {
            "create_node",
            "create_relationship",
            "query_cypher",
            "find_learning_path",
            "get_prerequisites",
            "find_similar_users",
            "update_mastery",
            "get_concept_graph",
        }
        
        # Find all classes
        found_classes = set()
        agent_methods = set()
        
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                found_classes.add(node.name)
                
                if node.name == "KnowledgeGraphAgent":
                    for item in node.body:
                        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            agent_methods.add(item.name)
        
        # Check classes
        missing_classes = required_classes - found_classes
        if missing_classes:
            raise ValueError(f"Missing required classes: {missing_classes}")
        
        # Check methods
        missing_methods = required_methods - agent_methods
        if missing_methods:
            raise ValueError(f"Missing required methods: {missing_methods}")
        
        print(f"   Found {len(found_classes)} classes, {len(agent_methods)} methods in KnowledgeGraphAgent")
    
    def validate_configuration(self):
        """Validate config.yaml structure"""
        import yaml
        
        config_file = self.base_path / "config.yaml"
        
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
        
        # Required sections
        required_sections = ["agent", "neo4j", "node_types", "relationship_types", "caching"]
        
        for section in required_sections:
            if section not in config:
                raise ValueError(f"Missing config section: {section}")
        
        # Validate node types
        expected_node_types = {"Concept", "User", "Content", "Quiz", "LearningPath"}
        actual_node_types = set(config["node_types"])
        
        if not expected_node_types.issubset(actual_node_types):
            missing = expected_node_types - actual_node_types
            raise ValueError(f"Missing node types: {missing}")
        
        # Validate relationship types
        expected_rel_types = {
            "PREREQUISITE_OF", "LEARNS", "STRUGGLES_WITH",
            "MASTERS", "BELONGS_TO", "COLLABORATES_WITH"
        }
        actual_rel_types = set(config["relationship_types"])
        
        if not expected_rel_types.issubset(actual_rel_types):
            missing = expected_rel_types - actual_rel_types
            raise ValueError(f"Missing relationship types: {missing}")
        
        print(f"   Config has {len(config['node_types'])} node types, {len(config['relationship_types'])} relationship types")
    
    def validate_dependencies(self):
        """Validate requirements.txt"""
        req_file = self.base_path / "requirements.txt"
        
        with open(req_file, 'r') as f:
            requirements = f.read()
        
        required_packages = [
            "fastapi",
            "neo4j",
            "redis",
            "pydantic",
            "structlog",
            "prometheus-client",
            "tenacity",
            "pytest",
        ]
        
        for package in required_packages:
            if package not in requirements.lower():
                raise ValueError(f"Missing required package: {package}")
        
        print(f"   All required packages present")
    
    def validate_tests(self):
        """Validate test file"""
        test_file = self.base_path / "tests" / "test_knowledge_graph_agent.py"
        
        with open(test_file, 'r', encoding='utf-8') as f:
            content = f.read()
            tree = ast.parse(content)
        
        # Count test functions
        test_count = 0
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.name.startswith("test_"):
                    test_count += 1
        
        if test_count < 20:
            raise ValueError(f"Insufficient test coverage: only {test_count} tests found")
        
        print(f"   Found {test_count} test functions")
    
    def validate_docker(self):
        """Validate Docker configuration"""
        dockerfile = self.base_path / "Dockerfile"
        compose_file = self.base_path / "docker-compose.yml"
        
        # Check Dockerfile
        with open(dockerfile, 'r') as f:
            dockerfile_content = f.read()
        
        required_dockerfile = ["FROM python", "COPY", "EXPOSE", "CMD"]
        for item in required_dockerfile:
            if item not in dockerfile_content:
                raise ValueError(f"Dockerfile missing: {item}")
        
        # Check docker-compose.yml
        import yaml
        with open(compose_file, 'r') as f:
            compose = yaml.safe_load(f)
        
        required_services = ["knowledge_graph_agent", "neo4j", "redis"]
        for service in required_services:
            if service not in compose.get("services", {}):
                raise ValueError(f"Missing docker service: {service}")
        
        print(f"   Docker setup validated")
    
    def check_forbidden_patterns(self):
        """Check for forbidden code patterns"""
        agent_file = self.base_path / "knowledge_graph_agent.py"
        
        with open(agent_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        forbidden = {
            "TODO": "TODO comments",
            "FIXME": "FIXME comments",
            "NotImplementedError": "Not implemented errors",
            "pass  # implement": "Placeholder implementations",
        }
        
        found_issues = []
        for pattern, description in forbidden.items():
            if pattern in content:
                # Check if it's in a comment or actual code
                lines = content.split('\n')
                for i, line in enumerate(lines, 1):
                    if pattern in line and not line.strip().startswith('#'):
                        found_issues.append(f"Line {i}: {description}")
        
        if found_issues:
            self.warnings.extend(found_issues)
            print(f"   ⚠️  Found {len(found_issues)} potential issues")
        else:
            print(f"   No forbidden patterns found")
    
    def print_results(self) -> bool:
        """Print validation results"""
        print("\n" + "="*60)
        print("VALIDATION RESULTS")
        print("="*60)
        
        if self.errors:
            print(f"\n❌ FAILED - {len(self.errors)} error(s):\n")
            for error in self.errors:
                print(f"   • {error}")
        else:
            print("\n✅ ALL CHECKS PASSED")
        
        if self.warnings:
            print(f"\n⚠️  {len(self.warnings)} warning(s):\n")
            for warning in self.warnings:
                print(f"   • {warning}")
        
        print("\n" + "="*60 + "\n")
        
        return len(self.errors) == 0


def main():
    """Main validation entry point"""
    base_path = Path(__file__).parent
    validator = KnowledgeGraphValidator(base_path)
    
    success = validator.validate_all()
    
    if success:
        print("✅ Knowledge Graph Agent implementation is COMPLETE and CORRECT!")
        sys.exit(0)
    else:
        print("❌ Knowledge Graph Agent implementation has ERRORS - Please fix them!")
        sys.exit(1)


if __name__ == "__main__":
    main()
