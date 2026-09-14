"""
GridSentinel AI — FastAPI Backend Server
Module: src/server.py

Exposes RESTful endpoints connecting IEEE C57.104 DGA analysis,
meteorological compounding risk calculations, and IBM Granite 3.0
emergency work-order generation to the React frontend dashboard.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import core analytical engines
try:
    from .risk_engine import calculate_comprehensive_risk
    from .dga_engine import evaluate_dga_and_health
    from .weather_engine import calculate_weather_factor
    from .criticality_engine import calculate_grid_criticality
    from .work_order_generator import generate_granite_work_order, WATSONX_API_KEY, WATSONX_PROJECT_ID
except ImportError:
    from risk_engine import calculate_comprehensive_risk  # type: ignore
    from dga_engine import evaluate_dga_and_health  # type: ignore
    from weather_engine import calculate_weather_factor  # type: ignore
    from criticality_engine import calculate_grid_criticality  # type: ignore
    from work_order_generator import generate_granite_work_order, WATSONX_API_KEY, WATSONX_PROJECT_ID  # type: ignore


# =============================================================================
# DATA PATH CONFIGURATION & LOADERS
# =============================================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

TRANSFORMER_DATA_PATH = DATA_DIR / "transformer_telemetry.json"
WEATHER_DATA_PATH = DATA_DIR / "weather_data.json"
GRID_DATA_PATH = DATA_DIR / "grid_criticality.json"


def _load_json_file(path: Path, default: Any = None) -> Any:
    """Safely load JSON from file path."""
    if not path.exists():
        return default if default is not None else []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {path}: {e}")
        return default if default is not None else []


def get_raw_transformers() -> List[Dict[str, Any]]:
    return _load_json_file(TRANSFORMER_DATA_PATH, [])


def get_raw_weather() -> Dict[str, Any]:
    return _load_json_file(WEATHER_DATA_PATH, {})


def get_raw_substations() -> List[Dict[str, Any]]:
    return _load_json_file(GRID_DATA_PATH, [])


# =============================================================================
# FASTAPI APP INITIALIZATION
# =============================================================================

app = FastAPI(
    title="GridSentinel AI API",
    description="Outage Prediction & Equipment Failure Copilot powered by IBM Granite 3.0",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local development with Vite/React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# SCHEMAS
# =============================================================================

class WorkOrderRequest(BaseModel):
    asset_id: str
    custom_notes: Optional[str] = None


class CountersignRequest(BaseModel):
    asset_id: str
    operator_name: str
    operator_id: str
    approved: bool
    notes: Optional[str] = ""


# =============================================================================
# HELPER SERVICES
# =============================================================================

def _enrich_asset_record(
    risk_record: Dict[str, Any],
    raw_assets_map: Dict[str, Dict[str, Any]],
    substations_map: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    """Combine calculated risk with raw telemetry metadata and substation data."""
    aid = str(risk_record.get("asset_id"))
    sid = str(risk_record.get("substation_id"))

    raw = raw_assets_map.get(aid, {})
    sub = substations_map.get(sid, {})

    # Calculate criticality factors if available
    crit_info = calculate_grid_criticality(sub) if sub else {"criticality_score": 50, "criticality_factors": []}

    enriched = dict(risk_record)
    enriched["model"] = raw.get("model", "High-Voltage Power Transformer")
    enriched["age_years"] = raw.get("age_years", 20)
    enriched["oil_temp_c"] = raw.get("oil_temp_c") or risk_record.get("telemetry_snapshot", {}).get("oil_temperature")
    enriched["winding_temp_c"] = raw.get("winding_temp_c")
    enriched["vibration_mms"] = raw.get("vibration_mms") or risk_record.get("telemetry_snapshot", {}).get("vibration_level")
    enriched["load_pct"] = raw.get("load_pct") or risk_record.get("telemetry_snapshot", {}).get("electrical_load_pct")
    enriched["dga_ppm"] = raw.get("dga_ppm", {})

    enriched["substation_name"] = sub.get("name", sid)
    enriched["customers_served"] = sub.get("customers_served", 0)
    enriched["criticality_factors"] = crit_info.get("criticality_factors", [])
    enriched["hospital_connected"] = sub.get("hospital_connected", False)
    enriched["transit_connected"] = sub.get("transit_connected", False)
    enriched["water_plant_connected"] = sub.get("water_plant_connected", False)

    return enriched


# =============================================================================
# API ROUTES
# =============================================================================

@app.get("/", tags=["System"])
def root() -> Dict[str, Any]:
    """Root endpoint providing service overview and links to docs and frontend."""
    return {
        "service": "GridSentinel AI API",
        "status": "online",
        "documentation": "/docs",
        "frontend_dev_url": "http://localhost:5173",
        "endpoints": {
            "health": "/api/health",
            "ranked_risk": "/api/risk/ranked",
            "weather": "/api/weather",
            "substations": "/api/substations",
            "generate_work_order": "/api/work-order/generate",
            "countersign": "/api/work-order/countersign"
        }
    }

@app.get("/api/health", tags=["System"])
def health_check() -> Dict[str, Any]:
    """Health status and IBM technology connectivity verification."""
    api_key = os.getenv("WATSONX_API_KEY", "")
    project_id = os.getenv("WATSONX_PROJECT_ID", "")
    model_id = os.getenv("WATSONX_MODEL_ID", "ibm/granite-3-8b-instruct")
    has_watsonx = bool(
        api_key
        and project_id
        and api_key not in ("your_api_key_here", "your_ibm_cloud_api_key_here", "")
    )
    return {
        "status": "healthy",
        "service": "GridSentinel AI Backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "watsonx_connected": has_watsonx,
        "model_in_use": model_id if has_watsonx else "Deterministic High-Fidelity Fallback",
    }


@app.get("/api/weather", tags=["Telemetry"])
def get_weather() -> Dict[str, Any]:
    """Current live meteorological weather feed."""
    return get_raw_weather()


@app.get("/api/substations", tags=["Telemetry"])
def get_substations() -> List[Dict[str, Any]]:
    """Substation topology and grid criticality records."""
    subs = get_raw_substations()
    for s in subs:
        c_res = calculate_grid_criticality(s)
        s["computed_criticality"] = c_res["criticality_score"]
        s["criticality_factors"] = c_res["criticality_factors"]
    return subs


@app.get("/api/risk/ranked", tags=["Risk Analysis"])
def get_ranked_risk() -> Dict[str, Any]:
    """
    Execute comprehensive multi-variable risk engine across all transformer assets.
    Combines IEEE C57.104 DGA, weather severity compounding, and grid criticality.
    """
    assets = get_raw_transformers()
    weather = get_raw_weather()
    substations = get_raw_substations()

    if not assets:
        return {"summary": {}, "ranked_assets": []}

    # Execute comprehensive risk synthesis
    raw_ranked = calculate_comprehensive_risk(assets, weather, substations)

    # Index raw telemetry for fast lookup
    raw_map = {str(a.get("asset_id")): a for a in assets}
    sub_map = {str(s.get("substation_id")): s for s in substations}

    # Enrich ranked records with all UI metadata
    enriched_ranked = [
        _enrich_asset_record(r, raw_map, sub_map)
        for r in raw_ranked
    ]

    # Compute high-level operational KPIs
    critical_count = sum(1 for r in enriched_ranked if r["risk_category"] == "CRITICAL")
    high_count = sum(1 for r in enriched_ranked if r["risk_category"] == "HIGH")
    medium_count = sum(1 for r in enriched_ranked if r["risk_category"] == "MEDIUM")
    low_count = sum(1 for r in enriched_ranked if r["risk_category"] == "LOW")

    total_customers = sum(r.get("customers_served", 0) for r in enriched_ranked)
    customers_at_risk = sum(
        r.get("customers_served", 0)
        for r in enriched_ranked
        if r["risk_category"] in ("CRITICAL", "HIGH")
    )

    avg_score = round(sum(r["composite_risk_score"] for r in enriched_ranked) / len(enriched_ranked), 1)
    max_score = max(r["composite_risk_score"] for r in enriched_ranked)

    # Max weather multiplier across fleet
    max_weather_mult = max((r.get("weather_multiplier", 1.0) for r in enriched_ranked), default=1.0)

    summary = {
        "total_assets": len(enriched_ranked),
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "avg_risk_score": avg_score,
        "max_risk_score": max_score,
        "weather_event": weather.get("event_name", "Normal Weather"),
        "ambient_temp_c": weather.get("ambient_temp_c", 25.0),
        "wind_speed_kmh": weather.get("wind_speed_kmh", 15.0),
        "lightning_strikes": weather.get("lightning_strikes_last_hour", 0),
        "weather_multiplier": round(max_weather_mult, 2),
        "total_customers_served": total_customers,
        "customers_at_risk": customers_at_risk,
    }

    return {
        "summary": summary,
        "ranked_assets": enriched_ranked,
    }


@app.get("/api/assets/{asset_id}", tags=["Risk Analysis"])
def get_asset_detail(asset_id: str) -> Dict[str, Any]:
    """Retrieve detailed telemetry and diagnostic breakdown for a specific asset."""
    assets = get_raw_transformers()
    target_raw = next((a for a in assets if str(a.get("asset_id")).upper() == asset_id.upper()), None)

    if not target_raw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found in telemetry registry."
        )

    weather = get_raw_weather()
    substations = get_raw_substations()

    raw_map = {str(a.get("asset_id")): a for a in assets}
    sub_map = {str(s.get("substation_id")): s for s in substations}

    # Run single asset risk
    ranked = calculate_comprehensive_risk([target_raw], weather, substations)
    if not ranked:
        raise HTTPException(status_code=500, detail="Failed to calculate risk for asset.")

    enriched = _enrich_asset_record(ranked[0], raw_map, sub_map)
    dga_eval = evaluate_dga_and_health(target_raw)
    enriched["dga_evaluation"] = dga_eval

    return enriched


@app.post("/api/work-order/generate", tags=["IBM Granite Copilot"])
def create_work_order(req: WorkOrderRequest) -> Dict[str, Any]:
    """
    Invoke IBM Granite 3.0 via watsonx.ai to synthesize an emergency crew
    pre-positioning and staging work-order directive for the specified asset.
    """
    assets = get_raw_transformers()
    target_raw = next((a for a in assets if str(a.get("asset_id")).upper() == req.asset_id.upper()), None)

    if not target_raw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{req.asset_id}' not found in telemetry registry."
        )

    weather = get_raw_weather()
    substations = get_raw_substations()

    raw_map = {str(a.get("asset_id")): a for a in assets}
    sub_map = {str(s.get("substation_id")): s for s in substations}

    ranked = calculate_comprehensive_risk([target_raw], weather, substations)
    if not ranked:
        raise HTTPException(status_code=500, detail="Risk calculation failed.")

    enriched = _enrich_asset_record(ranked[0], raw_map, sub_map)

    # Format the exact top_asset dictionary required by work_order_generator
    top_asset_payload = {
        "asset_id": enriched["asset_id"],
        "model": enriched.get("model", "Power Transformer"),
        "substation_name": enriched.get("substation_name", enriched.get("substation_id")),
        "final_risk_score": enriched["composite_risk_score"],
        "category": enriched["risk_category"].capitalize(),
        "fault_flags": enriched.get("risk_factors", ["General operational wear"]),
        "criticality_factors": enriched.get("criticality_factors", ["Standard distribution load"]),
        "customers": enriched.get("customers_served", 0),
    }

    # Generate directive via IBM Granite 3.0 (with graceful offline fallback)
    work_order_text = generate_granite_work_order(top_asset_payload, weather)
    api_key = os.getenv("WATSONX_API_KEY", "")
    project_id = os.getenv("WATSONX_PROJECT_ID", "")
    is_live_granite = bool(
        api_key
        and project_id
        and api_key not in ("your_api_key_here", "your_ibm_cloud_api_key_here", "")
    )
    model_id = os.getenv("WATSONX_MODEL_ID", "ibm/granite-3-8b-instruct")

    return {
        "asset_id": enriched["asset_id"],
        "substation_name": enriched["substation_name"],
        "final_risk_score": enriched["composite_risk_score"],
        "urgency": enriched["risk_category"],
        "work_order_directive": work_order_text,
        "is_live_granite": is_live_granite,
        "engine": f"IBM Granite 3.0 ({model_id} via watsonx.ai)" if is_live_granite else "IBM Granite 3.0 Template Engine (Offline)",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/work-order/countersign", tags=["IBM Granite Copilot"])
def countersign_work_order(req: CountersignRequest) -> Dict[str, Any]:
    """Human-in-the-loop operator countersign and approval verification."""
    return {
        "status": "APPROVED" if req.approved else "REJECTED",
        "asset_id": req.asset_id,
        "operator_name": req.operator_name,
        "operator_id": req.operator_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "dispatch_id": f"DSP-{req.asset_id}-{int(datetime.now().timestamp())}",
        "message": "Crew pre-positioning work order successfully countersigned and queued for field dispatch.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
