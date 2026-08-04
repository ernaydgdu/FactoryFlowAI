# Manufacturing Memory Coverage Report

**Date:** 2026-08-04  
**Source:** `domain/brain/manufacturing-memory`  
**llmEnabled:** false · **erpMutations:** false · **sideEffects:** APPEND_ONLY_BRAIN_MEMORY

---

## Sources collected

Sales Orders · Production Orders · MRP · Purchasing · Inventory · Warehouse · Shop Floor · Quality · Packaging · Shipment · Commercial Documents · Export Logistics · Finance Integration · Cost Closing · Style Closing · Reasoning Engine · Planning Engine · Simulation Engine

---

## Indexes

16 deterministic indexes: Decision, Supplier, Material, Machine, Operator, Customer, Style, Production, Inventory, Shipment, Quality, Planning, Simulation, Risk, Constraint, KPI.

## Experience coverage

Observation · Context · Decision · Action · Outcome · Accuracy · deterministic Lessons · stable trace links · append-only corrections.

## Query presets

8 read-only presets (style decisions, supplier delays, bottlenecks, OTIF, quality/purchasing/inventory shortages, machine planning counts)

---

## Persistence

Append-only onto existing `brainDecisionMemory` stream with deterministic IDs (idempotent re-collect). Corrections create new immutable records; originals remain unchanged.

## Timeline replay

Production-order replay reconstructs known facts, constraints, rules fired, recommendations, user/system execution, and later outcomes across the linked enterprise chain.

---

## Routes

`/brain-memory/coverage` · `records` · `indexes` · `queries` · `decisions` · `timeline`

## Gate

`validate:manufacturing-memory`
