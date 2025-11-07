#!/usr/bin/env python
"""
Validation script for Orchestration Agent
Verifies that all requirements are met
"""

import sys
import ast
from pathlib import Path
from typing import List, Tuple


class CodeValidator:
    """Validates code against requirements"""

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.checks_passed = 0
        self.checks_total = 0

    def check_file_exists(self, filepath: Path, description: str) -> bool:
        """Check if file exists"""
        self.checks_total += 1
        if filepath.exists():
            self.checks_passed += 1
            print(f"✓ {description}: {filepath.name}")
            return True
        else:
            self.errors.append(f"Missing {description}: {filepath}")
            print(f"✗ Missing {description}: {filepath}")
            return False

    def check_no_forbidden_patterns(self, filepath: Path) -> bool:
        """Check for forbidden patterns"""
        self.checks_total += 1
        
        if not filepath.exists():
            return False

        content = filepath.read_text(encoding='utf-8')
        
        forbidden_patterns = [
            ("NotImplementedError", "raise NotImplementedError"),
            ("TODO", "# TODO"),
            ("FIXME", "# FIXME"),
            ("pass  # implement", "pass  # implement"),
            ("simplified version", "# simplified version"),
            ("basic implementation", "# basic implementation"),
        ]
        
        found_issues = []
        for pattern, search_str in forbidden_patterns:
            if search_str in content:
                found_issues.append(pattern)
        
        if found_issues:
            self.errors.append(
                f"{filepath.name}: Found forbidden patterns: {', '.join(found_issues)}"
            )
            print(f"✗ {filepath.name}: Contains forbidden patterns")
            return False
        else:
            self.checks_passed += 1
            print(f"✓ {filepath.name}: No forbidden patterns")
            return True

    def check_required_classes(self, filepath: Path, required_classes: List[str]) -> bool:
        """Check if required classes are defined"""
        self.checks_total += 1
        
        if not filepath.exists():
            return False

        content = filepath.read_text(encoding='utf-8')
        
        try:
            tree = ast.parse(content)
            defined_classes = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
            
            missing_classes = [cls for cls in required_classes if cls not in defined_classes]
            
            if missing_classes:
                self.errors.append(
                    f"{filepath.name}: Missing classes: {', '.join(missing_classes)}"
                )
                print(f"✗ {filepath.name}: Missing required classes")
                return False
            else:
                self.checks_passed += 1
                print(f"✓ {filepath.name}: All required classes present")
                return True
        except SyntaxError as e:
            self.errors.append(f"{filepath.name}: Syntax error: {str(e)}")
            print(f"✗ {filepath.name}: Syntax error")
            return False

    def check_required_functions(self, filepath: Path, required_functions: List[str]) -> bool:
        """Check if required functions are defined"""
        self.checks_total += 1
        
        if not filepath.exists():
            return False

        content = filepath.read_text(encoding='utf-8')
        
        try:
            tree = ast.parse(content)
            
            # Get all function and method names
            defined_functions = []
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    defined_functions.append(node.name)
                elif isinstance(node, ast.AsyncFunctionDef):
                    defined_functions.append(node.name)
            
            missing_functions = [func for func in required_functions if func not in defined_functions]
            
            if missing_functions:
                self.errors.append(
                    f"{filepath.name}: Missing functions: {', '.join(missing_functions)}"
                )
                print(f"✗ {filepath.name}: Missing required functions")
                return False
            else:
                self.checks_passed += 1
                print(f"✓ {filepath.name}: All required functions present")
                return True
        except SyntaxError as e:
            self.errors.append(f"{filepath.name}: Syntax error: {str(e)}")
            print(f"✗ {filepath.name}: Syntax error")
            return False

    def check_config_structure(self, filepath: Path, required_keys: List[str]) -> bool:
        """Check YAML config structure"""
        self.checks_total += 1
        
        if not filepath.exists():
            return False

        try:
            import yaml
            with open(filepath, 'r') as f:
                config = yaml.safe_load(f)
            
            missing_keys = [key for key in required_keys if key not in config]
            
            if missing_keys:
                self.errors.append(
                    f"{filepath.name}: Missing config keys: {', '.join(missing_keys)}"
                )
                print(f"✗ {filepath.name}: Missing required config keys")
                return False
            else:
                self.checks_passed += 1
                print(f"✓ {filepath.name}: All required config keys present")
                return True
        except Exception as e:
            self.errors.append(f"{filepath.name}: Error loading config: {str(e)}")
            print(f"✗ {filepath.name}: Config error")
            return False

    def check_imports(self, filepath: Path, required_imports: List[str]) -> bool:
        """Check for required imports"""
        self.checks_total += 1
        
        if not filepath.exists():
            return False

        content = filepath.read_text(encoding='utf-8')
        
        missing_imports = []
        for imp in required_imports:
            if imp not in content:
                missing_imports.append(imp)
        
        if missing_imports:
            self.warnings.append(
                f"{filepath.name}: Potentially missing imports: {', '.join(missing_imports)}"
            )
            print(f"⚠ {filepath.name}: Some imports might be missing")
            self.checks_passed += 1  # Warning, not error
            return True
        else:
            self.checks_passed += 1
            print(f"✓ {filepath.name}: All required imports present")
            return True

    def print_summary(self):
        """Print validation summary"""
        print("\n" + "=" * 70)
        print("VALIDATION SUMMARY")
        print("=" * 70)
        print(f"Checks Passed: {self.checks_passed}/{self.checks_total}")
        print(f"Success Rate: {(self.checks_passed/self.checks_total*100):.1f}%")
        
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")
        
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  - {warning}")
        
        if not self.errors:
            print("\n✅ ALL CRITICAL CHECKS PASSED!")
            print("The implementation meets all mandatory requirements.")
            return True
        else:
            print("\n❌ VALIDATION FAILED!")
            print("Please fix the errors above.")
            return False


def main():
    """Main validation function"""
    print("=" * 70)
    print("ORCHESTRATION AGENT VALIDATION")
    print("=" * 70)
    print()
    
    validator = CodeValidator()
    base_path = Path(__file__).parent
    
    # Check file structure
    print("📁 Checking File Structure...")
    print("-" * 70)
    validator.check_file_exists(base_path / "orchestration_agent.py", "Main agent file")
    validator.check_file_exists(base_path / "config.yaml", "Configuration file")
    validator.check_file_exists(base_path / "requirements.txt", "Requirements file")
    validator.check_file_exists(base_path / "Dockerfile", "Dockerfile")
    validator.check_file_exists(base_path / "README.md", "README")
    validator.check_file_exists(base_path / "docker-compose.yml", "Docker Compose")
    validator.check_file_exists(base_path / ".env.example", "Environment example")
    validator.check_file_exists(base_path / "tests" / "test_orchestration_agent.py", "Unit tests")
    validator.check_file_exists(base_path / "tests" / "test_integration.py", "Integration tests")
    
    print()
    
    # Check main agent file
    print("🔍 Checking Main Agent Implementation...")
    print("-" * 70)
    agent_file = base_path / "orchestration_agent.py"
    
    required_classes = [
        "TaskStatus",
        "CircuitBreakerState",
        "LoadBalancingStrategy",
        "TaskRequest",
        "TaskResponse",
        "HealthResponse",
        "RoutingRule",
        "CircuitBreaker",
        "PriorityQueue",
        "RateLimiter",
        "MessageQueueClient",
        "OrchestrationAgent",
    ]
    
    validator.check_required_classes(agent_file, required_classes)
    
    required_functions = [
        "route_request",
        "distribute_task",
        "monitor_execution",
        "aggregate_results",
        "handle_failure",
    ]
    
    validator.check_required_functions(agent_file, required_functions)
    validator.check_no_forbidden_patterns(agent_file)
    
    required_imports = [
        "fastapi",
        "pydantic",
        "structlog",
        "httpx",
        "prometheus_client",
        "asyncio",
    ]
    
    validator.check_imports(agent_file, required_imports)
    
    print()
    
    # Check configuration
    print("⚙️  Checking Configuration...")
    print("-" * 70)
    config_file = base_path / "config.yaml"
    
    required_config_keys = [
        "agent",
        "routing_rules",
        "load_balancing",
        "error_recovery",
        "message_queue",
        "monitoring",
        "rate_limiting",
        "priority_queue",
        "timeouts",
    ]
    
    validator.check_config_structure(config_file, required_config_keys)
    
    print()
    
    # Check tests
    print("🧪 Checking Tests...")
    print("-" * 70)
    test_file = base_path / "tests" / "test_orchestration_agent.py"
    
    test_classes = [
        "TestCircuitBreaker",
        "TestPriorityQueue",
        "TestRateLimiter",
        "TestOrchestrationAgent",
        "TestAPI",
    ]
    
    validator.check_required_classes(test_file, test_classes)
    validator.check_no_forbidden_patterns(test_file)
    
    print()
    
    # Print summary
    success = validator.print_summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
