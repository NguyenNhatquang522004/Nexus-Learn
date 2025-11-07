"""
Quick demo script to showcase Orchestration Agent features
"""

import asyncio
from orchestration_agent import OrchestrationAgent, TaskRequest

async def demo():
    print("=" * 60)
    print("🎯 Orchestration Agent - Feature Demo")
    print("=" * 60)
    
    # Initialize agent
    print("\n1️⃣ Initializing agent...")
    agent = OrchestrationAgent()
    print(f"   ✅ Agent: {agent.config['agent']['name']}")
    print(f"   ✅ Routing rules: {len(agent.routing_rules)}")
    
    # Test routing
    print("\n2️⃣ Testing request routing...")
    routing_tests = [
        "upload_pdf",
        "personalize_content",
        "generate_assessment",
        "create_mindmap",
        "translate_content"
    ]
    
    for pattern in routing_tests:
        try:
            request = TaskRequest(pattern=pattern, payload={"test": "data"})
            route = agent.route_request(request)
            agent_name = route if isinstance(route, str) else route.get('target_agent', 'unknown')
            print(f"   ✅ {pattern} -> {agent_name}")
        except Exception as e:
            print(f"   ❌ {pattern} -> Error: {e}")
    
    # Test priority queue
    print("\n3️⃣ Testing priority queue...")
    from orchestration_agent import PriorityQueue
    queue = PriorityQueue()
    
    await queue.enqueue("task-1", 5, {"name": "Critical"})
    await queue.enqueue("task-2", 1, {"name": "Low"})
    await queue.enqueue("task-3", 3, {"name": "Medium"})
    
    print(f"   ✅ Queue size: {queue.get_size()}")
    
    task1 = await queue.dequeue()
    print(f"   ✅ First dequeued (highest priority): {task1['data']['name']}")
    
    # Test circuit breaker
    print("\n4️⃣ Testing circuit breaker...")
    from orchestration_agent import CircuitBreaker
    cb = CircuitBreaker(threshold=3, timeout=60)
    
    print(f"   ✅ Initial state: {cb.state}")
    
    for i in range(3):
        cb.record_failure()
    
    print(f"   ✅ After 3 failures: {cb.state}")
    
    # Test rate limiter
    print("\n5️⃣ Testing rate limiter...")
    from orchestration_agent import RateLimiter
    limiter = RateLimiter(rate=10, burst_size=5)
    
    acquired = await limiter.acquire()
    print(f"   ✅ Token acquired: {acquired}")
    print(f"   ✅ Available tokens: {limiter.tokens}")
    
    # Health status
    print("\n6️⃣ Checking health status...")
    health = agent.get_health_status()
    print(f"   ✅ Status: {health.status}")
    print(f"   ✅ Active tasks: {health.active_tasks}")
    print(f"   ✅ Queue size: {health.queue_size}")
    
    # Metrics
    print("\n7️⃣ Getting metrics...")
    metrics = agent.get_metrics()
    print(f"   ✅ Total requests: {metrics.get('total_requests', 0)}")
    print(f"   ✅ Successful: {metrics.get('successful_requests', 0)}")
    print(f"   ✅ Failed: {metrics.get('failed_requests', 0)}")
    
    print("\n" + "=" * 60)
    print("🎉 Demo completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(demo())
