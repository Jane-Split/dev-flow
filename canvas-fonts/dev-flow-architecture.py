#!/usr/bin/env python3
"""
dev-flow Architecture Visualization
A meticulously crafted visualization of the AI development workflow orchestration system
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, FancyArrowPatch
import numpy as np

# Set up the figure with a dark professional background
plt.style.use('dark_background')
fig, ax = plt.subplots(1, 1, figsize=(28, 18), dpi=150)
ax.set_xlim(0, 28)
ax.set_ylim(0, 18)
ax.set_aspect('equal')
ax.axis('off')

# Color palette - carefully crafted for visual hierarchy
NAVY = '#0d1b2a'
DARK_BLUE = '#1b263b'
ELECTRIC_BLUE = '#4361ee'
AMBER = '#f77f00'
LIGHT_AMBER = '#ffb703'
CORAL = '#e63946'
SUCCESS_GREEN = '#06d6a0'
LIGHT_GRAY = '#8d99ae'
MID_GRAY = '#6c757d'
WHITE = '#edf2f4'
LIGHT_BLUE = '#74b9ff'

# Main title
ax.text(14, 17.3, 'DEV-FLOW', ha='center', va='center', 
        fontsize=32, fontweight='bold', color=WHITE, family='sans-serif')
ax.text(14, 16.7, 'AI Development Workflow Orchestration System', ha='center', va='center',
        fontsize=16, color=LIGHT_GRAY, family='sans-serif')

# =====================
# TOP FLOW - Main Pipeline
# =====================
phases = [
    {'name': 'RESEARCH', 'x': 3, 'y': 12.5, 'color': ELECTRIC_BLUE, 'desc': 'Project Scan'},
    {'name': 'ANALYZE', 'x': 7, 'y': 12.5, 'color': LIGHT_BLUE, 'desc': 'Requirement Analysis'},
    {'name': 'DESIGN', 'x': 11, 'y': 12.5, 'color': AMBER, 'desc': 'Technical Design'},
    {'name': 'TASK SPLIT', 'x': 15, 'y': 12.5, 'color': LIGHT_AMBER, 'desc': 'Parallel Planning'},
    {'name': 'DEVELOP', 'x': 19, 'y': 12.5, 'color': SUCCESS_GREEN, 'desc': 'Code Implementation'},
    {'name': 'TEST', 'x': 23, 'y': 12.5, 'color': CORAL, 'desc': 'Verification'},
]

# Draw phase boxes with modern styling
for phase in phases:
    # Outer glow effect
    glow = FancyBboxPatch((phase['x'] - 1.4, phase['y'] - 0.9),
                          2.8, 1.8,
                          boxstyle="round,pad=0.05,rounding_size=0.25",
                          facecolor=phase['color'], alpha=0.1,
                          edgecolor='none')
    ax.add_patch(glow)
    
    # Main box
    box = FancyBboxPatch((phase['x'] - 1.3, phase['y'] - 0.8),
                         2.6, 1.6,
                         boxstyle="round,pad=0.05,rounding_size=0.2",
                         facecolor=phase['color'], alpha=0.25,
                         edgecolor=phase['color'], linewidth=3)
    ax.add_patch(box)
    
    # Phase name
    ax.text(phase['x'], phase['y'] + 0.3, phase['name'],
            ha='center', va='center', fontsize=13, fontweight='bold',
            color=WHITE, family='sans-serif')
    
    # Description
    ax.text(phase['x'], phase['y'] - 0.3, phase['desc'],
            ha='center', va='center', fontsize=9, color=LIGHT_GRAY)

# Draw connecting arrows
for i in range(len(phases) - 1):
    x1 = phases[i]['x'] + 1.4
    x2 = phases[i+1]['x'] - 1.4
    y = phases[i]['y']
    
    # Arrow line
    ax.annotate('', xy=(x2, y), xytext=(x1 + 0.1, y),
                arrowprops=dict(arrowstyle='->', color=WHITE, lw=2.5,
                               connectionstyle="arc3,rad=0"))
    
    # Confirmation gate (amber circle)
    gate_x = (x1 + x2) / 2
    gate = Circle((gate_x, y + 0.6), 0.18, color=AMBER, alpha=0.9, zorder=10)
    ax.add_patch(gate)
    ax.text(gate_x, y + 0.6, 'U', ha='center', va='center',
            fontsize=7, fontweight='bold', color=NAVY, zorder=11)

# User confirmation labels
ax.text(5, 14.2, 'USER CONFIRM', ha='center', va='center',
        fontsize=8, color=AMBER, fontweight='bold')

# =====================
# ORCHESTRATOR - Central Coordinator
# =====================
orch_x, orch_y = 14, 10.5
orch_box = FancyBboxPatch((orch_x - 2.5, orch_y - 0.8),
                          5, 1.6,
                          boxstyle="round,pad=0.05,rounding_size=0.2",
                          facecolor=AMBER, alpha=0.2,
                          edgecolor=AMBER, linewidth=3)
ax.add_patch(orch_box)
ax.text(orch_x, orch_y + 0.4, 'ORCHESTRATOR', ha='center', va='center',
        fontsize=16, fontweight='bold', color=AMBER)
ax.text(orch_x, orch_y - 0.2, 'Task Scheduling | DAG Execution | Result Integration',
        ha='center', va='center', fontsize=10, color=LIGHT_GRAY)

# Connection to phases
ax.annotate('', xy=(15, 12.5), xytext=(14, 11.3),
            arrowprops=dict(arrowstyle='->', color=AMBER, lw=2, ls='--'))

# =====================
# MEMORY LAYER - Persistent Storage
# =====================
mem_y = 7.5
ax.text(3.5, mem_y + 1.5, '.dev-flow/memory/', ha='center', va='center',
        fontsize=12, fontweight='bold', color=ELECTRIC_BLUE)

memory_files = [
    ('project-overview.md', ELECTRIC_BLUE),
    ('service-registry.md', LIGHT_BLUE),
    ('dependency-graph.md', AMBER),
    ('conventions.md', LIGHT_AMBER),
]

for i, (filename, color) in enumerate(memory_files):
    x = 1.5 + i * 1.8
    box = FancyBboxPatch((x - 0.8, mem_y - 0.3),
                         1.6, 0.6,
                         boxstyle="round,pad=0.02,rounding_size=0.1",
                         facecolor=color, alpha=0.15,
                         edgecolor=color, linewidth=1.5)
    ax.add_patch(box)
    ax.text(x, mem_y, filename.split('.')[0], ha='center', va='center',
            fontsize=7, color=WHITE)

# Connection from orchestrator
ax.annotate('', xy=(3.5, 9.7), xytext=(3.5, 8.1),
            arrowprops=dict(arrowstyle='->', color=ELECTRIC_BLUE, lw=1.5, ls=':'))

# =====================
# DESIGN CONTRACT
# =====================
dc_x, dc_y = 11, 7.5
dc_box = FancyBboxPatch((dc_x - 2, dc_y - 0.6),
                         4, 1.2,
                         boxstyle="round,pad=0.05,rounding_size=0.15",
                         facecolor=AMBER, alpha=0.15,
                         edgecolor=AMBER, linewidth=2)
ax.add_patch(dc_box)
ax.text(dc_x, dc_y + 0.35, 'design-contract.yaml', ha='center', va='center',
        fontsize=11, fontweight='bold', color=AMBER)
ax.text(dc_x, dc_y - 0.15, 'Entities | DTOs | Services | Controllers',
        ha='center', va='center', fontsize=9, color=LIGHT_GRAY)

# =====================
# TASK DAG
# =====================
dag_x, dag_y = 19, 7.5
dag_box = FancyBboxPatch((dag_x - 2.2, dag_y - 0.6),
                          4.4, 1.2,
                          boxstyle="round,pad=0.05,rounding_size=0.15",
                          facecolor=SUCCESS_GREEN, alpha=0.15,
                          edgecolor=SUCCESS_GREEN, linewidth=2)
ax.add_patch(dag_box)
ax.text(dag_x, dag_y + 0.35, 'task-dag.yaml', ha='center', va='center',
        fontsize=11, fontweight='bold', color=SUCCESS_GREEN)
ax.text(dag_x, dag_y - 0.15, 'Parallel Tasks | Serial Tasks | Dependencies',
        ha='center', va='center', fontsize=9, color=LIGHT_GRAY)

# Connection from orchestrator
ax.annotate('', xy=(19, 9.7), xytext=(19, 8.1),
            arrowprops=dict(arrowstyle='->', color=SUCCESS_GREEN, lw=1.5, ls=':'))

# =====================
# SUBAGENTS DETAIL
# =====================
ax.text(14, 5.8, 'SUBAGENTS', ha='center', va='center',
        fontsize=14, fontweight='bold', color=WHITE)

subagent_groups = [
    {'name': 'Research Expert', 'agents': ['@structure-analyzer', '@dependency-scanner', '@config-analyzer'], 'x': 3.5, 'color': ELECTRIC_BLUE},
    {'name': 'Analyze Expert', 'agents': ['@impact-assessor', '@risk-analyzer'], 'x': 8, 'color': LIGHT_BLUE},
    {'name': 'Design Expert', 'agents': ['@entity-designer', '@interface-designer', '@logic-designer'], 'x': 12.5, 'color': AMBER},
    {'name': 'Task Split Expert', 'agents': ['@dag-builder', '@interface-registry', '@transitive-dep'], 'x': 17, 'color': LIGHT_AMBER},
    {'name': 'Develop Expert', 'agents': ['@context-manager', '@on-demand-loader', '@step-enforcer'], 'x': 21.5, 'color': SUCCESS_GREEN},
    {'name': 'Verify Expert', 'agents': ['@unit-test', '@smoke-test', '@integration-test'], 'x': 25.5, 'color': CORAL},
]

for group in subagent_groups:
    # Group header
    ax.text(group['x'], 5.2, group['name'], ha='center', va='center',
            fontsize=9, fontweight='bold', color=group['color'])
    
    # Agent boxes
    for i, agent in enumerate(group['agents']):
        y = 4.6 - i * 0.55
        box = FancyBboxPatch((group['x'] - 1.1, y - 0.2),
                             2.2, 0.4,
                             boxstyle="round,pad=0.02,rounding_size=0.08",
                             facecolor=group['color'], alpha=0.1,
                             edgecolor=group['color'], linewidth=1)
        ax.add_patch(box)
        ax.text(group['x'], y, agent, ha='center', va='center',
                fontsize=7, color=WHITE)

# =====================
# PLATFORM COMPATIBILITY
# =====================
ax.text(14, 2.3, 'PLATFORM COMPATIBILITY', ha='center', va='center',
        fontsize=11, fontweight='bold', color=WHITE)

platforms = [
    ('Trae', 'Native / Full', SUCCESS_GREEN),
    ('Cursor', 'No Subagent', CORAL),
    ('Claude Code', 'No Subagent', CORAL),
    ('Codex', 'Limited', LIGHT_AMBER),
    ('Qoder', 'No Subagent', CORAL),
]

for i, (name, support, color) in enumerate(platforms):
    x = 5 + i * 4.5
    # Platform box
    box = FancyBboxPatch((x - 1.5, 1.2),
                         3, 0.9,
                         boxstyle="round,pad=0.03,rounding_size=0.1",
                         facecolor=color, alpha=0.15,
                         edgecolor=color, linewidth=1.5)
    ax.add_patch(box)
    ax.text(x, 1.7, name, ha='center', va='center',
            fontsize=10, fontweight='bold', color=WHITE)
    ax.text(x, 1.35, support, ha='center', va='center',
            fontsize=8, color=color)

# =====================
# LEGEND
# =====================
legend_y = 0.4
ax.text(1.5, legend_y + 0.5, 'LEGEND:', fontsize=9, fontweight='bold', color=WHITE)

legend_items = [
    (ELECTRIC_BLUE, 'Data Flow'),
    (AMBER, 'User Interaction'),
    (SUCCESS_GREEN, 'Output / Execution'),
    (CORAL, 'Testing / Verification'),
]

for i, (color, label) in enumerate(legend_items):
    x = 4 + i * 5
    ax.plot([x, x + 0.8], [legend_y, legend_y], color=color, lw=4)
    ax.text(x + 1, legend_y, label, fontsize=8, color=LIGHT_GRAY, va='center')

# Version
ax.text(27, 0.2, 'v3.1.0', fontsize=8, color=MID_GRAY, ha='right')

# =====================
# EXECUTION FLOW EXAMPLE
# =====================
ax.text(14, 3.5, 'PARALLEL EXECUTION MODEL', ha='center', va='center',
        fontsize=11, fontweight='bold', color=WHITE)

# Draw batch example
batch_x = 14
batches = [
    {'batch': 1, 'tasks': ['Entity A', 'Entity B', 'Enum C'], 'parallel': True, 'y': 3.0},
    {'batch': 2, 'tasks': ['DTO A', 'Mapper A'], 'parallel': True, 'y': 2.4},
    {'batch': 3, 'tasks': ['Service A'], 'parallel': False, 'y': 1.8},
]

for batch in batches:
    # Batch label
    ax.text(batch_x - 3, batch['y'], f'Batch {batch["batch"]}:',
            ha='right', va='center', fontsize=9, color=LIGHT_GRAY)
    
    # Tasks
    for i, task in enumerate(batch['tasks']):
        x = batch_x - 1.5 + i * 2
        color = SUCCESS_GREEN if batch['parallel'] else AMBER
        box = FancyBboxPatch((x - 0.7, batch['y'] - 0.2),
                             1.4, 0.4,
                             boxstyle="round,pad=0.02,rounding_size=0.08",
                             facecolor=color, alpha=0.2,
                             edgecolor=color, linewidth=1)
        ax.add_patch(box)
        ax.text(x, batch['y'], task, ha='center', va='center',
                fontsize=7, color=WHITE)

# Legend for batch
ax.text(batch_x + 4.5, 3.0, '(Parallel)', fontsize=8, color=SUCCESS_GREEN)
ax.text(batch_x + 4.5, 1.8, '(Serial)', fontsize=8, color=AMBER)

# Save
plt.tight_layout()
plt.savefig('/workspace/canvas-fonts/dev-flow-architecture.png',
            dpi=150, bbox_inches='tight',
            facecolor=NAVY, edgecolor='none')
plt.close()

print("Architecture visualization saved successfully!")
