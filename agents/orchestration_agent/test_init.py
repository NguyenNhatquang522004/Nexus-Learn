"""Test script to verify agent can be initialized"""
from orchestration_agent import app, OrchestrationAgent

print("✅ Import successful!")

agent = OrchestrationAgent()
print(f"✅ Agent initialized: {agent.config['agent']['name']}")
print(f"✅ Loaded {len(agent.routing_rules)} routing rules")
print(f"✅ FastAPI app created: {app.title}")
print("\n🎉 All initialization checks passed!")
