import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import './D3Visualization.css';

const D3Visualization = ({
  nodes,
  edges,
  layout,
  selectedNode,
  hoveredNode,
  highlightedPath,
  zoom,
  pan,
  showLabels,
  nodeSize,
  edgeStyle,
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
  onNodeContextMenu,
  onZoomChange,
  onPanChange
}) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Calculate node radius based on importance and size setting
  const getNodeRadius = (node) => {
    const baseSize = node.importance || 1;
    const sizeMultiplier = {
      small: 0.7,
      normal: 1,
      large: 1.3
    }[nodeSize] || 1;
    
    return Math.max(10, Math.min(40, baseSize * 10 * sizeMultiplier));
  };

  // Get node color based on mastery level
  const getNodeColor = (node) => {
    const mastery = node.mastery || 0;
    
    if (mastery === 0) return '#ff4444'; // Red - not started
    if (mastery <= 20) return '#ff6644'; // Red-orange
    if (mastery <= 50) return '#ffaa00'; // Orange - in progress
    if (mastery <= 80) return '#ffdd00'; // Yellow - good progress
    if (mastery < 100) return '#88ff44'; // Yellow-green
    return '#44ff44'; // Green - mastered
  };

  // Get node opacity based on completion status
  const getNodeOpacity = (node) => {
    return node.isCompleted ? 1 : 0.6;
  };

  // Get edge color
  const getEdgeColor = (edge) => {
    if (highlightedPath.some(pathEdge => 
      pathEdge.source === edge.source && pathEdge.target === edge.target
    )) {
      return '#4f46e5'; // Indigo for highlighted path
    }
    
    return '#9ca3af'; // Gray for normal edges
  };

  // Get edge width based on strength
  const getEdgeWidth = (edge) => {
    const strength = edge.strength || 0.5;
    return 1 + (strength * 4);
  };

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize D3 visualization
  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Create container group for zoom/pan
    const container = svg
      .append('g')
      .attr('class', 'container');

    // Initialize zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        onZoomChange?.(event.transform.k);
        onPanChange?.({ x: event.transform.x, y: event.transform.y });
      });

    svg.call(zoomBehavior);

    // Apply initial zoom and pan
    svg.call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(pan.x, pan.y).scale(zoom)
    );

    // Create force simulation based on layout type
    let simulation;
    
    if (layout === 'force_directed') {
      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(edges)
          .id(d => d.id)
          .distance(d => 100 / (d.strength || 0.5))
        )
        .force('charge', d3.forceManyBody()
          .strength(-300)
        )
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide()
          .radius(d => getNodeRadius(d) + 10)
        );
    } else if (layout === 'tree') {
      // Hierarchical tree layout
      const root = d3.stratify()
        .id(d => d.id)
        .parentId(d => edges.find(e => e.target === d.id)?.source)(nodes);
      
      const treeLayout = d3.tree()
        .size([width - 100, height - 100]);
      
      treeLayout(root);
      
      root.each(d => {
        const node = nodes.find(n => n.id === d.id);
        if (node) {
          node.x = d.x + 50;
          node.y = d.y + 50;
          node.fx = node.x;
          node.fy = node.y;
        }
      });
      
      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
        .stop();
    } else if (layout === 'radial') {
      // Radial layout
      const angleStep = (2 * Math.PI) / nodes.length;
      const radius = Math.min(width, height) / 3;
      
      nodes.forEach((node, i) => {
        const angle = i * angleStep;
        node.x = width / 2 + radius * Math.cos(angle);
        node.y = height / 2 + radius * Math.sin(angle);
        node.fx = node.x;
        node.fy = node.y;
      });
      
      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
        .stop();
    }

    simulationRef.current = simulation;

    // Draw edges
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(edges)
      .join('path')
      .attr('class', 'edge')
      .attr('stroke', getEdgeColor)
      .attr('stroke-width', getEdgeWidth)
      .attr('stroke-opacity', 0.6)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrow)');

    // Add arrow markers
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#9ca3af');

    // Draw nodes
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Node circles
    node.append('circle')
      .attr('r', getNodeRadius)
      .attr('fill', getNodeColor)
      .attr('stroke', d => d.isPrerequisite ? '#ef4444' : '#6b7280')
      .attr('stroke-width', 2)
      .attr('opacity', getNodeOpacity)
      .attr('class', d => {
        let classes = ['node-circle'];
        if (selectedNode === d.id) classes.push('selected');
        if (hoveredNode === d.id) classes.push('hovered');
        return classes.join(' ');
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        onNodeDoubleClick?.(d);
      })
      .on('mouseenter', (event, d) => {
        onNodeHover?.(d.id);
      })
      .on('mouseleave', () => {
        onNodeHover?.(null);
      })
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        onNodeContextMenu?.(d, event);
      });

    // Node labels
    if (showLabels) {
      node.append('text')
        .text(d => d.name || d.label)
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', d => getNodeRadius(d) + 15)
        .attr('font-size', '12px')
        .attr('fill', '#374151')
        .attr('pointer-events', 'none');
    }

    // Animate node entrance
    node.selectAll('circle')
      .transition()
      .duration(500)
      .delay((d, i) => i * 50)
      .ease(d3.easeElasticOut)
      .attr('r', getNodeRadius);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link.attr('d', d => {
        const source = nodes.find(n => n.id === d.source.id || n.id === d.source);
        const target = nodes.find(n => n.id === d.target.id || n.id === d.target);
        
        if (!source || !target) return '';
        
        if (edgeStyle === 'straight') {
          return `M${source.x},${source.y}L${target.x},${target.y}`;
        } else {
          // Curved edges
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
        }
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep node fixed after dragging
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [nodes, edges, layout, dimensions, selectedNode, hoveredNode, highlightedPath, 
      showLabels, nodeSize, edgeStyle, zoom, pan]);

  return (
    <motion.div
      className="d3-visualization"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg
        ref={svgRef}
        className="mind-map-svg"
        style={{ width: '100%', height: '100%' }}
      />
    </motion.div>
  );
};

export default D3Visualization;
