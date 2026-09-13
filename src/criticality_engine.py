"""
src/criticality_engine.py
Calculates substation operational importance and downstream community impact.
Author: Palak Donga (Person 2)
"""
def calculate_grid_criticality(substation: dict) -> dict:
    """Return a 0-100 criticality score for a substation based on the
    critical infrastructure and customer population it feeds."""
    points = 0
    factors = []
    if substation.get("hospital_connected"):
        points += 35
        factors.append("Feeds Regional Trauma / Hospital Center")
    if substation.get("transit_connected"):
        points += 25
        factors.append("Feeds Electrified Transit / Rail Network")
    if substation.get("water_plant_connected"):
        points += 20
        factors.append("Feeds Municipal Water Treatment Facility")
    cust = substation.get("customers_served", 0)
    if cust > 50000:
        points += 20
        factors.append(f"Serves {cust:,} connected customers (Tier 1)")
    elif cust > 20000:
        points += 10
        factors.append(f"Serves {cust:,} connected customers (Tier 2)")
    elif cust > 0:
        factors.append(f"Serves {cust:,} connected customers (Tier 3)")
    return {
        "criticality_score": min(points, 100),
        "criticality_factors": factors,
    }
if __name__ == "__main__":
    sample_sub = {
        "substation_id": "SUB-METRO-09",
        "name": "Metro Central Transit Substation",
        "customers_served": 85000,
        "hospital_connected": True,
        "water_plant_connected": True,
        "transit_connected": True,
    }
    print(calculate_grid_criticality(sample_sub))