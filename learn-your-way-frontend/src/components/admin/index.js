/**
 * Admin Dashboard Components - Index
 * 
 * Central export file for all admin dashboard components.
 * Simplifies imports across the application.
 * 
 * Usage:
 * import { AnalyticsDashboard, ContentManagement, AdminRoute } from '@/components/admin';
 */

// Main Dashboard Components
export { default as AnalyticsDashboard } from './AnalyticsDashboard';
export { default as ContentManagement } from './ContentManagement';
export { default as UserManagement } from './UserManagement';
export { default as SystemHealth } from './SystemHealth';

// Route Protection
export { default as AdminRoute } from './AdminRoute';

// Chart Components
export {
  ProgressChart,
  EngagementChart,
  PerformanceChart,
  LatencyChart,
  DistributionChart,
  MetricCard
} from './charts/AdminCharts';

/**
 * Component Overview:
 * 
 * AnalyticsDashboard - Student progress, engagement metrics, content performance, A/B testing
 * ContentManagement - Content review queue, approve/reject, metadata editing, bulk actions
 * UserManagement - Student roster, progress reports, intervention alerts, bulk email/assignment
 * SystemHealth - 20 agent status cards, API latency, error logs, system alerts, resource usage
 * AdminRoute - Role-based access control (ADMIN/EDUCATOR only)
 * 
 * Charts:
 * - ProgressChart: AreaChart for student progress over time
 * - EngagementChart: LineChart for engagement metrics (DAU/MAU, session duration)
 * - PerformanceChart: BarChart for content performance comparison
 * - LatencyChart: LineChart for API latency metrics (P50/P95/avg)
 * - DistributionChart: PieChart for value distributions
 * - MetricCard: Single metric display with trend indicator
 */
