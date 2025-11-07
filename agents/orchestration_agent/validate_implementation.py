#!/usr/bin/env python3
"""
Validation script for Orchestration Agent implementation.
Checks that all requirements are met and code is production-ready.
"""

import sys
import ast
import yaml
from pathlib import Path
from typing import List, Dict, Set


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


class CodeValidator:
    """Validates the orchestration agent implementation."""
    
    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.errors: List[str] = []
        self.warnings: List[str] = []
        
    def validate_all(self) -> bool:
        """Run all validation checks."""
        print("🔍 Starting validation of Orchestration Agent...")
        print("=" * 60)
        
        try:
            self.validate_file_structure()
            self.validate_requirements()
            self.validate_config()
            self.validate_python_code()
            self.validate_tests()
            
            print("\n" + "=" * 60)
            if self.errors:
                print(f"❌ Validation FAILED with {len(self.errors)} error(s):")
                for i, error in enumerate(self.errors, 1):
                    print(f"  {i}. {error}")
                return False
            
            if self.warnings:
                print(f"⚠️  Found {len(self.warnings)} warning(s):")
                for i, warning in enumerate(self.warnings, 1):
                    print(f"  {i}. {warning}")
            
            print("\n✅ All validation checks PASSED!")
            return True
            
        except Exception as e:
            print(f"\n❌ Validation failed with exception: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def validate_file_structure(self):
        """Check that all required files exist."""
        print("\n📁 Validating file structure...")
        
        required_files = [
            "orchestration_agent.py",
            "config.yaml",
            "requirements.txt",
            "Dockerfile",
            "README.md",
            ".env.example",
            "tests/__init__.py",
            "tests/test_orchestration_agent.py",
            "tests/test_integration.py",
            "tests/conftest.py",
            "pytest.ini"
        ]
        
        for file_path in required_files:
            full_path = self.base_path / file_path
            if not full_path.exists():
                self.errors.append(f"Missing required file: {file_path}")
            else:
                print(f"  ✓ Found {file_path}")
    
    def validate_requirements(self):
        """Validate requirements.txt has all necessary packages."""
        print("\n📦 Validating requirements.txt...")
        
        req_file = self.base_path / "requirements.txt"
        if not req_file.exists():
            self.errors.append("requirements.txt not found")
            return
        
        required_packages = {
            "fastapi", "uvicorn", "pydantic", "pydantic-settings",
            "structlog", "aiohttp", "httpx", "pyyaml",
            "prometheus-client", "opentelemetry-api", "pika", "redis",
            "tenacity", "python-json-logger"
        }
        
        content = req_file.read_text()
        found_packages = set()
        
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                pkg_name = line.split('==')[0].split('>=')[0].split('[')[0].strip()
                found_packages.add(pkg_name.lower())
        
        missing = required_packages - found_packages
        if missing:
            self.errors.append(f"Missing required packages: {missing}")
        else:
            print(f"  ✓ All {len(required_packages)} required packages found")
    
    def validate_config(self):
        """Validate config.yaml structure."""
        print("\n⚙️  Validating config.yaml...")
        
        config_file = self.base_path / "config.yaml"
        if not config_file.exists():
            self.errors.append("config.yaml not found")
            return
        
        try:
            with open(config_file, 'r') as f:
                config = yaml.safe_load(f)
            
            # Check required sections
            required_sections = [
                "agent", "routing_rules", "load_balancing",
                "error_recovery", "message_queue", "monitoring"
            ]
            
            for section in required_sections:
                if section not in config:
                    self.errors.append(f"Missing config section: {section}")
                else:
                    print(f"  ✓ Found section: {section}")
            
            # Validate routing rules
            if "routing_rules" in config:
                rules = config["routing_rules"]
                if not isinstance(rules, list) or len(rules) == 0:
                    self.errors.append("routing_rules must be a non-empty list")
                else:
                    print(f"  ✓ Found {len(rules)} routing rules")
                    
                    for i, rule in enumerate(rules):
                        if "pattern" not in rule or "target_agent" not in rule or "endpoint" not in rule:
                            self.errors.append(f"Routing rule {i} missing required fields")
        
        except yaml.YAMLError as e:
            self.errors.append(f"Invalid YAML in config.yaml: {e}")
    
    def validate_python_code(self):
        """Validate the main Python implementation."""
        print("\n🐍 Validating orchestration_agent.py...")
        
        py_file = self.base_path / "orchestration_agent.py"
        if not py_file.exists():
            self.errors.append("orchestration_agent.py not found")
            return
        
        try:
            content = py_file.read_text(encoding='utf-8')
            tree = ast.parse(content)
            
            # Check for forbidden patterns
            self.check_forbidden_patterns(content)
            
            # Find all classes and functions
            classes = []
            functions = []
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    classes.append(node.name)
                elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                    functions.append(node.name)
                elif isinstance(node, ast.Assign):
                    # Check for class aliases like: OrchestrationRequest = TaskRequest
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            classes.append(target.id)
            
            print(f"  ✓ Found {len(classes)} classes")
            print(f"  ✓ Found {len(functions)} functions")
            
            # Check for required classes
            required_classes = ["OrchestrationAgent", "OrchestrationRequest", "TaskStatus"]
            for cls in required_classes:
                if cls not in classes:
                    self.errors.append(f"Missing required class: {cls}")
                else:
                    print(f"  ✓ Found class: {cls}")
            
            # Check for required methods
            required_methods = [
                "route_request", "distribute_task", "monitor_execution",
                "aggregate_results", "handle_failure"
            ]
            
            for method in required_methods:
                if method not in functions:
                    self.errors.append(f"Missing required method: {method}")
                else:
                    print(f"  ✓ Found method: {method}")
            
            # Check for imports
            imports = []
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
            
            required_imports = ["fastapi", "pydantic", "structlog", "yaml"]
            for imp in required_imports:
                found = any(imp in i for i in imports)
                if not found:
                    self.warnings.append(f"Missing import: {imp}")
        
        except SyntaxError as e:
            self.errors.append(f"Syntax error in orchestration_agent.py: {e}")
        except Exception as e:
            self.errors.append(f"Error parsing orchestration_agent.py: {e}")
    
    def check_forbidden_patterns(self, content: str):
        """Check for forbidden patterns in code."""
        forbidden_patterns = {
            "TODO": "TODO comments found",
            "FIXME": "FIXME comments found",
            "NotImplementedError": "NotImplementedError found",
            "pass  # implement": "Placeholder implementation found",
            "mock_data": "Mock data found",
            "dummy_": "Dummy data found"
        }
        
        for pattern, message in forbidden_patterns.items():
            if pattern in content:
                # Count occurrences
                count = content.count(pattern)
                self.errors.append(f"{message} ({count} occurrence(s))")
    
    def validate_tests(self):
        """Validate test files."""
        print("\n🧪 Validating test files...")
        
        test_file = self.base_path / "tests" / "test_orchestration_agent.py"
        if not test_file.exists():
            self.errors.append("test_orchestration_agent.py not found")
            return
        
        try:
            content = test_file.read_text(encoding='utf-8')
            tree = ast.parse(content)
            
            # Count test functions
            test_functions = []
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if node.name.startswith('test_'):
                        test_functions.append(node.name)
            
            if len(test_functions) < 5:
                self.warnings.append(f"Only {len(test_functions)} test functions found (recommend at least 5)")
            else:
                print(f"  ✓ Found {len(test_functions)} test functions")
        
        except SyntaxError as e:
            self.errors.append(f"Syntax error in test file: {e}")


def main():
    """Main validation entry point."""
    base_path = Path(__file__).parent
    validator = CodeValidator(base_path)
    
    success = validator.validate_all()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
