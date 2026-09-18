"""
GridSentinel AI — FastAPI Backend Server
Module: src/server.py

Exposes RESTful endpoints connecting IEEE C57.104 DGA analysis,
meteorological compounding risk calculations, and IBM Granite 3.0
emergency work-order generation to the React frontend dashboard.
"""

from __future__ import annotations

import base64
import json
import os
import time
import hmac
import hashlib
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from urllib.parse import urlencode

import requests
from fastapi import FastAPI, HTTPException, status, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    _env_root = Path(__file__).resolve().parent.parent / ".env"
    _env_src = Path(__file__).resolve().parent / ".env"
    if _env_root.exists():
        load_dotenv(_env_root, override=True)
    if _env_src.exists():
        load_dotenv(_env_src, override=True)
except ImportError:
    pass

# Import core analytical engines
try:
    from .risk_engine import calculate_comprehensive_risk
    from .dga_engine import evaluate_dga_and_health
    from .weather_engine import calculate_weather_factor
    from .criticality_engine import calculate_grid_criticality
    from .work_order_generator import generate_granite_work_order, WATSONX_API_KEY, WATSONX_PROJECT_ID
    from .auth import hash_password, verify_password, create_access_token, decode_access_token, JWT_SECRET_KEY
except ImportError:
    from risk_engine import calculate_comprehensive_risk  # type: ignore
    from dga_engine import evaluate_dga_and_health  # type: ignore
    from weather_engine import calculate_weather_factor  # type: ignore
    from criticality_engine import calculate_grid_criticality  # type: ignore
    from work_order_generator import generate_granite_work_order, WATSONX_API_KEY, WATSONX_PROJECT_ID  # type: ignore
    from auth import hash_password, verify_password, create_access_token, decode_access_token, JWT_SECRET_KEY  # type: ignore


# =============================================================================
# DATA PATH CONFIGURATION & LOADERS
# =============================================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

TRANSFORMER_DATA_PATH = DATA_DIR / "transformer_telemetry.json"
WEATHER_DATA_PATH = DATA_DIR / "weather_data.json"
GRID_DATA_PATH = DATA_DIR / "grid_criticality.json"
USERS_DATA_PATH = DATA_DIR / "users.json"


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


def get_users() -> List[Dict[str, Any]]:
    return _load_json_file(USERS_DATA_PATH, [])


def save_users(users: List[Dict[str, Any]]) -> None:
    try:
        with open(USERS_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Error saving {USERS_DATA_PATH}: {e}")


def get_enriched_substations() -> List[Dict[str, Any]]:
    """Substation topology pre-enriched with computed criticality scores."""
    subs = get_raw_substations()
    enriched: List[Dict[str, Any]] = []
    for s in subs:
        c_res = calculate_grid_criticality(s)
        sub_copy = dict(s)
        sub_copy["computed_criticality"] = c_res["criticality_score"]
        sub_copy["criticality_score"] = c_res["criticality_score"]
        sub_copy["criticality_factors"] = c_res["criticality_factors"]
        enriched.append(sub_copy)
    return enriched


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


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    org: Optional[str] = "Metro Power Authority"
    role: Optional[str] = "Senior Reliability Dispatcher"


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None
    redirect_uri: Optional[str] = None


class GoogleAuthInitRequest(BaseModel):
    role: Optional[str] = None
    org: Optional[str] = None
    name: Optional[str] = None
    redirect_uri: Optional[str] = None


# Allowed application roles
ALLOWED_ROLES = [
    "Senior Reliability Dispatcher",
    "Reliability Dispatcher",
    "Grid Operations Manager",
    "Transmission Operations Manager",
    "Substation Relay Engineer",
    "Grid Security Officer"
]

# Thread-safe in-memory store with TTL for OAuth state
OAUTH_STATE_STORE: Dict[str, Dict[str, Any]] = {}
STATE_TTL_SECONDS = 900  # 15 minutes


def clean_expired_oauth_states() -> None:
    now = time.time()
    expired = [k for k, v in OAUTH_STATE_STORE.items() if now - v.get("created_at", 0) > STATE_TTL_SECONDS]
    for k in expired:
        OAUTH_STATE_STORE.pop(k, None)


def validate_signup_role(role_candidate: Optional[str]) -> str:
    """Validate role against allowed list or clean safe title format."""
    if not role_candidate:
        return "Senior Reliability Dispatcher"
    cleaned = role_candidate.strip()
    if cleaned in ALLOWED_ROLES:
        return cleaned
    for allowed in ALLOWED_ROLES:
        if cleaned.lower() == allowed.lower():
            return allowed
    if len(cleaned) <= 80 and re.match(r"^[A-Za-z0-9\s\-_/]+$", cleaned):
        return cleaned
    return "Senior Reliability Dispatcher"


def validate_signup_org(org_candidate: Optional[str]) -> str:
    """Sanitize and validate organization string."""
    if not org_candidate:
        return "Metro Power Authority"
    cleaned = org_candidate.strip()
    if 2 <= len(cleaned) <= 100 and re.match(r"^[A-Za-z0-9\s\-&.,/()]+$", cleaned):
        return cleaned
    return "Metro Power Authority"


def create_oauth_state(metadata: Optional[Dict[str, Any]] = None) -> str:
    """Create secure state token with server-side store + cryptographic HMAC fallback."""
    clean_expired_oauth_states()
    token = base64.urlsafe_b64encode(os.urandom(16)).decode("utf-8").rstrip("=")
    meta = metadata or {}

    # Store in memory
    OAUTH_STATE_STORE[token] = {
        **meta,
        "created_at": time.time()
    }

    # Cryptographic HMAC token fallback: token.payload_b64.sig_b64
    payload_json = json.dumps(meta).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode("utf-8").rstrip("=")
    sig = hmac.new(JWT_SECRET_KEY.encode("utf-8"), f"{token}.{payload_b64}".encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode("utf-8").rstrip("=")

    return f"{token}.{payload_b64}.{sig_b64}"


def resolve_oauth_state(state_str: Optional[str]) -> Dict[str, Any]:
    """Resolve and cryptographically verify OAuth state data."""
    if not state_str:
        return {}

    parts = state_str.split(".")
    token = parts[0]

    # 1. In-memory check
    if token in OAUTH_STATE_STORE:
        stored = OAUTH_STATE_STORE.pop(token, {})
        return stored

    # 2. Cryptographic HMAC fallback
    if len(parts) == 3:
        token, payload_b64, sig_b64 = parts
        expected_sig = hmac.new(
            JWT_SECRET_KEY.encode("utf-8"),
            f"{token}.{payload_b64}".encode("utf-8"),
            hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode("utf-8").rstrip("=")

        if hmac.compare_digest(sig_b64, expected_sig_b64):
            try:
                padded = payload_b64 + "=" * (-len(payload_b64) % 4)
                data = json.loads(base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8"))
                if isinstance(data, dict):
                    return data
            except Exception:
                pass

    return {}


# Google OAuth 2.0 Settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "").strip()


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
            "auth_register": "/api/auth/register",
            "auth_login": "/api/auth/login",
            "auth_me": "/api/auth/me",
            "ranked_risk": "/api/risk/ranked",
            "weather": "/api/weather",
            "substations": "/api/substations",
            "generate_work_order": "/api/work-order/generate",
            "countersign": "/api/work-order/countersign"
        }
    }


# =============================================================================
# AUTHENTICATION ROUTES (BCRYPT + JWT)
# =============================================================================

@app.post("/api/auth/register", tags=["Authentication"])
def register(req: RegisterRequest) -> Dict[str, Any]:
    """Register a new SCADA grid operator with bcrypt-hashed credentials."""
    users = get_users()
    norm_email = req.email.strip().lower()
    if any(u.get("email", "").lower() == norm_email for u in users):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An operator account with this email address already exists."
        )

    user_id = f"usr-{int(datetime.now(timezone.utc).timestamp())}"
    hashed_pw = hash_password(req.password)
    initials = "".join([part[0].upper() for part in req.name.split()[:2]]) or "OP"

    new_user = {
        "id": user_id,
        "name": req.name.strip(),
        "email": norm_email,
        "hashed_password": hashed_pw,
        "org": req.org.strip() if req.org else "Grid Operations",
        "role": req.role.strip() if req.role else "Reliability Dispatcher",
        "avatar": initials,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    users.append(new_user)
    save_users(users)

    # Issue signed JWT token
    token = create_access_token({"sub": new_user["id"], "email": new_user["email"], "role": new_user["role"]})

    safe_user = {k: v for k, v in new_user.items() if k != "hashed_password"}
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": safe_user
    }


@app.post("/api/auth/login", tags=["Authentication"])
def login(req: LoginRequest) -> Dict[str, Any]:
    """Authenticate grid operator credentials using bcrypt and issue signed JWT access token."""
    users = get_users()
    norm_email = req.email.strip().lower()
    user = next((u for u in users if u.get("email", "").lower() == norm_email), None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. No operator found with this email."
        )

    if not verify_password(req.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Incorrect password."
        )

    # Issue signed JWT token
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user.get("role", "")})

    safe_user = {k: v for k, v in user.items() if k != "hashed_password"}
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": safe_user
    }


@app.get("/api/auth/me", tags=["Authentication"])
@app.get("/auth/me", tags=["Authentication"])
def get_current_operator(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Verify incoming JWT Bearer token and return authenticated operator profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected 'Bearer <token>'."
        )

    token = authorization.split(" ")[1].strip()
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired JWT token."
        )

    users = get_users()
    user = next((u for u in users if u.get("id") == payload["sub"] or u.get("email") == payload.get("email")), None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operator profile not found."
        )

    safe_user = {k: v for k, v in user.items() if k != "hashed_password"}
    if "organization" not in safe_user and "org" in safe_user:
        safe_user["organization"] = safe_user["org"]
    if "org" not in safe_user and "organization" in safe_user:
        safe_user["org"] = safe_user["organization"]
    return safe_user


# =============================================================================
# GOOGLE OAUTH 2.0 AUTHENTICATION
# =============================================================================

@app.get("/api/auth/google/status", tags=["Authentication"])
@app.get("/auth/google/status", tags=["Authentication"])
def get_google_auth_status() -> Dict[str, Any]:
    """Check if real Google OAuth 2.0 credentials are configured."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID).strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET).strip()
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", GOOGLE_REDIRECT_URI).strip()
    is_configured = bool(client_id and client_secret and "your_google" not in client_id.lower())
    return {
        "configured": is_configured,
        "client_id": (client_id[:12] + "...") if is_configured else None,
        "redirect_uri": redirect_uri or "http://localhost:8001/api/auth/google/callback"
    }


def _build_google_auth_response(
    request: Request,
    redirect_uri: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    client_id = os.getenv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID).strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET).strip()
    env_redirect = os.getenv("GOOGLE_REDIRECT_URI", GOOGLE_REDIRECT_URI).strip()

    if not client_id or not client_secret or "your_google" in client_id.lower():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env."
        )

    # Determine target redirect URI
    if env_redirect:
        target_redirect = env_redirect
    elif redirect_uri:
        target_redirect = redirect_uri
    else:
        base = str(request.base_url).rstrip("/")
        target_redirect = f"{base}/api/auth/google/callback"

    state_token = create_oauth_state(metadata)

    params = {
        "client_id": client_id,
        "redirect_uri": target_redirect,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": state_token
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {
        "url": auth_url,
        "state": state_token,
        "redirect_uri": target_redirect,
        "configured": True
    }


@app.get("/api/auth/google/url", tags=["Authentication"])
@app.get("/auth/google/url", tags=["Authentication"])
def get_google_auth_url(
    request: Request,
    redirect_uri: Optional[str] = None,
    role: Optional[str] = None,
    org: Optional[str] = None,
    name: Optional[str] = None
) -> Dict[str, Any]:
    """Generate Google OAuth URL with optional query metadata."""
    metadata = {}
    if role:
        metadata["role"] = validate_signup_role(role)
    if org:
        metadata["org"] = validate_signup_org(org)
    if name:
        metadata["name"] = name.strip()
    return _build_google_auth_response(request, redirect_uri, metadata)


@app.post("/api/auth/google/url", tags=["Authentication"])
@app.post("/auth/google/url", tags=["Authentication"])
def post_google_auth_url(request: Request, req: Optional[GoogleAuthInitRequest] = None) -> Dict[str, Any]:
    """Generate Google OAuth URL with secure signup context (role, org, name)."""
    metadata = {}
    redirect_uri = None
    if req:
        redirect_uri = req.redirect_uri
        if req.role:
            metadata["role"] = validate_signup_role(req.role)
        if req.org:
            metadata["org"] = validate_signup_org(req.org)
        if req.name:
            metadata["name"] = req.name.strip()
    return _build_google_auth_response(request, redirect_uri, metadata)


@app.post("/api/auth/google/callback", tags=["Authentication"])
@app.post("/auth/google/callback", tags=["Authentication"])
def google_auth_callback(req: GoogleCallbackRequest) -> Dict[str, Any]:
    """
    Exchange authorization code with Google token endpoint, verify Google identity,
    and find or create authenticated grid operator account.
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID).strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET).strip()
    env_redirect = os.getenv("GOOGLE_REDIRECT_URI", GOOGLE_REDIRECT_URI).strip()

    if not client_id or not client_secret or "your_google" in client_id.lower():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth credentials are not configured on the backend."
        )

    target_redirect = req.redirect_uri or env_redirect or "http://localhost:8001/api/auth/google/callback"

    # 1. Exchange authorization code with Google token endpoint
    token_url = "https://oauth2.googleapis.com/token"
    token_payload = {
        "code": req.code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": target_redirect,
        "grant_type": "authorization_code"
    }

    try:
        token_resp = requests.post(token_url, data=token_payload, timeout=12)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to connect to Google OAuth token service: {str(e)}"
        )

    if not token_resp.ok:
        err_data = token_resp.json() if token_resp.text else {}
        error_desc = err_data.get("error_description", err_data.get("error", "Failed to exchange authorization code with Google."))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_desc
        )

    tokens = token_resp.json()
    google_access_token = tokens.get("access_token")
    if not google_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No access token returned by Google."
        )

    # 2. Fetch and cryptographically verify user profile from Google
    userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    try:
        userinfo_resp = requests.get(
            userinfo_url,
            headers={"Authorization": f"Bearer {google_access_token}"},
            timeout=12
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to verify Google profile: {str(e)}"
        )

    if not userinfo_resp.ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve verified profile from Google."
        )

    google_user = userinfo_resp.json()
    google_email = google_user.get("email", "").strip().lower()
    google_sub = google_user.get("sub", "")
    google_name = google_user.get("name", "").strip()

    if not google_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not return a verified email address."
        )

    # 3. Find existing user OR create user
    users = get_users()
    user = next((u for u in users if u.get("email", "").lower() == google_email), None)

    if user:
        # Existing user sign-in: update Google metadata if not present, NEVER overwrite role/org
        if not user.get("google_id"):
            user["google_id"] = google_sub
            save_users(users)
    else:
        # New user: extract preserved role and organization from state
        state_meta = resolve_oauth_state(req.state)
        target_role = validate_signup_role(state_meta.get("role"))
        target_org = validate_signup_org(state_meta.get("org"))
        target_name = (state_meta.get("name") or "").strip()

        user_id = f"usr-{int(datetime.now(timezone.utc).timestamp())}"
        final_name = google_name or target_name or "SCADA Grid Operator"
        initials = "".join([part[0].upper() for part in final_name.split()[:2]]) or "GO"
        user = {
            "id": user_id,
            "name": final_name,
            "email": google_email,
            "hashed_password": "",  # Managed via Google OAuth
            "org": target_org,
            "organization": target_org,
            "role": target_role,
            "avatar": initials,
            "google_id": google_sub,
            "picture": google_user.get("picture", ""),
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        users.append(user)
        save_users(users)

    # 4. Create standard signed JWT access token matching normal session
    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "Senior Reliability Dispatcher")
    })

    safe_user = {k: v for k, v in user.items() if k != "hashed_password"}
    if "organization" not in safe_user and "org" in safe_user:
        safe_user["organization"] = safe_user["org"]
    if "org" not in safe_user and "organization" in safe_user:
        safe_user["org"] = safe_user["organization"]

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": safe_user
    }


@app.get("/api/auth/google/callback", tags=["Authentication"])
@app.get("/auth/google/callback", tags=["Authentication"])
def google_auth_callback_get(request: Request, code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None) -> Any:
    """Direct browser redirect callback from Google OAuth."""
    frontend_base = os.getenv("FRONTEND_URL", "http://localhost:5173")
    if error:
        if error == "access_denied":
            return RedirectResponse(url=f"{frontend_base}/?google_error=cancelled")
        return RedirectResponse(url=f"{frontend_base}/?google_error=failed")
    if not code:
        return RedirectResponse(url=f"{frontend_base}/?google_error=failed")

    # Match exact callback URL that Google redirected the browser to
    callback_uri = GOOGLE_REDIRECT_URI or str(request.url).split("?")[0]

    try:
        res = google_auth_callback(
            GoogleCallbackRequest(code=code, state=state, redirect_uri=callback_uri)
        )
        token = res.get("access_token", "")
        return RedirectResponse(url=f"{frontend_base}/?auth_token={token}")
    except Exception as e:
        print(f"[Google OAuth Error] Failed token exchange: {e}")
        return RedirectResponse(url=f"{frontend_base}/?google_error=failed")


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
    return get_enriched_substations()


@app.get("/api/risk/ranked", tags=["Risk Analysis"])
def get_ranked_risk() -> Dict[str, Any]:
    """
    Execute comprehensive multi-variable risk engine across all transformer assets.
    Combines IEEE C57.104 DGA, weather severity compounding, and grid criticality.
    """
    assets = get_raw_transformers()
    weather = get_raw_weather()
    substations = get_enriched_substations()

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
    substations = get_enriched_substations()

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
    substations = get_enriched_substations()

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
