# Solution Overview — GridSentinel AI

## What We Built

**GridSentinel AI** is an intelligent grid monitoring and emergency dispatch decision-support platform that predicts high-voltage transformer failure risks and autonomously synthesizes emergency crew pre-positioning directives before extreme weather events cause catastrophic blackouts.

By fusing real-time IEEE C57.104 dissolved gas analysis (DGA), meteorological storm feeds, and substation grid criticality metrics, GridSentinel AI bridges deterministic engineering physics with generative AI. Powered by **IBM BoB IDE** and **IBM watsonx.ai (IBM Granite 3.0)**, the system transforms complex, fragmented sensor streams into actionable, dispatch-ready work orders that prevent multi-million-dollar outages.

---

## How It Works

GridSentinel AI executes an end-to-end 6-stage operational pipeline:

```
[SCADA Telemetry JSON] ──┐
[Live Weather Feed JSON] ┼─► [FastAPI Backend] ─► [Composite Risk Engine] ─► [IBM Granite 3.0 Copilot] ─► [React Dashboard]
[Grid Criticality JSON] ──┘                                                                                      │
                                                                                                        [Operator Approval]
```

1. **Multi-Vector Telemetry Ingestion:** Substation sensors report dissolved combustible gas concentrations (H2, CH4, C2H6, C2H4, C2H2), oil temperatures, and mechanical vibration alongside regional meteorological data (ambient heat, wind gusts, storm alerts).
2. **IEEE C57.104 DGA Diagnostic Assessment:** The diagnostic engine applies IEEE standard thresholds and gas ratio techniques (Doernenburg/Rogers ratios) to detect specific electrical and thermal degradation modes (such as arcing, partial discharge, and insulation breakdown).
3. **Meteorological Stress Compounding:** The weather engine computes a dynamic multiplier ($1.0\times - 1.5\times$) that factors severe ambient heat, wind gust velocity, and storm severity to elevate the priority of physically stressed equipment.
4. **Substation Criticality Prioritization:** Substation operational importance is quantified ($0-100$) by assessing downstream societal impacts, including trauma hospital feeds, municipal water treatment facilities, and electrified transit networks.
5. **Weighted Composite Risk Synthesis:** A deterministic heuristic combines physical health ($60\%$), weather stress ($20\%$), and societal criticality ($20\%$) to rank the entire transformer fleet by urgency.
6. **Autonomous Work-Order Generation via IBM Granite 3.0:** For high-urgency assets, the system prompts IBM Granite 3.0 on IBM watsonx.ai to generate structured emergency pre-positioning work orders detailing staging depots, diagnostic tools, required spare parts, and mandatory human operator sign-offs.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Separation of Deterministic Logic & Generative AI** | Safety-critical electrical utility operations cannot tolerate hallucinated numerical ratings. Numerical health indexes ($0-100$) are calculated using rigorous deterministic IEEE formulas, while IBM Granite is leveraged for explainability, synthesis, and operational dispatch directives. |
| **React 18 + FastAPI Architecture** | Decoupling the frontend from the backend provides a snappy single-page experience (SPA) with smooth animations, animated SVG health gauges, and instant modal interactions while maintaining a modular Python REST API. |
| **IEEE C57.104 Compliance** | Grounding gas thresholds in the recognized IEEE standard ensures operational credibility with utility transmission and distribution engineers. |
| **Built-in Offline Fallback** | Ensures that hackathon evaluators and demo audiences can run and test every single feature without requiring active IBM Cloud credentials. |

---

## IBM Technologies Used

- **IBM BoB IDE:** Used as the primary AI-accelerated development environment for rapid architecture scaffolding, deterministic rule formulation, and end-to-end integration testing.
- **IBM watsonx.ai:** The enterprise AI and model governance platform hosting foundation model endpoints used for text synthesis.
- **IBM Granite 3.0 (`ibm/granite-3-8b-instruct`):** Generates structured, explainable emergency crew pre-positioning work-order drafts from multi-variable physics and meteorological sensor contexts.
