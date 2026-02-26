# Batch Material Optimizer

Batch Material Optimizer is a time-saving Panel Plugin designed to help developers quickly manage and optimize material rendering properties across their Lens Studio projects. Instead of modifying materials one by one, this tool provides a multi-select checklist of all materials in your project, allowing you to instantly apply global property mutations with a single click.
***

## The Problem
When importing complex 3D models with many materials, Lens Studio often assigns default rendering configurations (like Two-Sided rendering enabled, or specific Blend Modes). Updating 50 materials one-by-one is tedious.

## The Solution
This plugin adds a **Batch Material Optimizer** panel to your editor. It provides a checklist of every material in your project, allowing you to multi-select them and click a single button to apply global property mutations.

## Features
- **Multi-Select Material List**: Check or uncheck any imported material.
- **Enable/Disable Depth Write**: Batch update the `depthWrite` flag.
- **Enable/Disable Two Sided**: Batch update the `twoSided` flag.
- **Set Blend Mode**: Force the blend mode of multiple materials simultaneously.
- **Toggle Material Visibility**: Show or hide materials by controlling the `colorMask` on their render pass.

***

## Installation

1. Place the **BatchMaterialOptimizer** folder into your Lens Studio plugin directory.
2. Open Lens Studio.
3. Go to **Preferences → Plugins** and click **Add**.
4. Select the `BatchMaterialOptimizer` directory.
5. Enable the "Batch Material Optimizer" in the plugin list.
