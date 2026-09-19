/**
 * GridSentinel AI — Directive Parser & Normalizer
 * Module: frontend/src/utils/directiveParser.js
 *
 * Converts raw Markdown directives from IBM Granite 3.0 (or offline template engine)
 * into strongly-typed, clean structured objects for the Grid Operations Console Action Card UI.
 * Strips all markdown syntax (###, **, *, ---) while preserving 100% of diagnostic telemetry,
 * gas concentrations, numbered action sequences, and human sign-off mandates.
 */

export function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/#{1,6}\s*/g, '')          // headers ###
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // bold **text**
    .replace(/\*([^*]+)\*/g, '$1')      // italic *text*
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1') // underscores
    .replace(/`([^`]+)`/g, '$1')        // inline code
    .replace(/---/g, '')                // horizontal rules
    .trim();
}

/**
 * Parses action items from the RECOMMENDED INTERVENTION section text.
 * Example inputs:
 * "1. IMMEDIATE ELECTRICAL ARCING SUPPRESSION: Acetylene concentration is at 85.0 ppm..."
 * or list of bullet points.
 */
export function parseActionRecommendations(interventionText, riskLevel = 'NORMAL') {
  if (!interventionText) return [];

  const cleaned = interventionText.trim();
  const rawItems = cleaned.split(/\n\s*(?=\d+\.|\bStep\s+\d+:?)/gi);
  const actions = [];

  rawItems.forEach((item, idx) => {
    const line = item.trim();
    if (!line) return;

    // Match "1. TITLE: Description" or "1. TITLE - Description"
    const match = line.match(/^(?:\d+\.|\bStep\s+\d+:?)\s*([^:\n-]+)(?::|-)\s*([\s\S]+)$/i);
    if (match) {
      const rawTitle = stripMarkdown(match[1]).trim();
      const rawDesc = stripMarkdown(match[2]).trim();

      // Determine urgency from title/text
      let urgency = 'STANDARD';
      const upper = (rawTitle + ' ' + rawDesc).toUpperCase();
      if (upper.includes('IMMEDIATE') || upper.includes('CRITICAL') || upper.includes('ARCING') || upper.includes('EMERGENCY')) {
        urgency = 'CRITICAL';
      } else if (upper.includes('PRIORITY') || upper.includes('HIGH') || upper.includes('HOTSPOT') || upper.includes('RUNAWAY')) {
        urgency = 'HIGH';
      } else if (upper.includes('PREVENTIVE') || upper.includes('MODERATE') || upper.includes('STABILIZATION')) {
        urgency = 'MEDIUM';
      } else if (upper.includes('NOMINAL') || upper.includes('ROUTINE') || upper.includes('SUPERVISION')) {
        urgency = 'ROUTINE';
      }

      // Determine action type
      let type = 'maintenance';
      if (upper.includes('ARCING')) type = 'arcing';
      else if (upper.includes('THERMAL') || upper.includes('COOLING')) type = 'thermal';
      else if (upper.includes('LOAD') || upper.includes('OFFLOADING') || upper.includes('SHED')) type = 'load';
      else if (upper.includes('WEATHER') || upper.includes('STORM')) type = 'weather';
      else if (upper.includes('INSPECTION') || upper.includes('VERIFICATION')) type = 'inspection';
      else if (upper.includes('MONITORING') || upper.includes('SUPERVISION')) type = 'monitoring';

      actions.push({
        step: idx + 1,
        title: rawTitle,
        description: rawDesc,
        urgency,
        type
      });
    } else {
      // Fallback for non-numbered paragraphs
      const cleanLine = stripMarkdown(line);
      if (cleanLine.length > 10) {
        actions.push({
          step: actions.length + 1,
          title: actions.length === 0 ? 'PRIMARY OPERATIONAL INTERVENTION' : `CONTINGENCY STEP ${actions.length + 1}`,
          description: cleanLine,
          urgency: riskLevel === 'CRITICAL' ? 'CRITICAL' : riskLevel === 'HIGH' ? 'HIGH' : 'STANDARD',
          type: 'maintenance'
        });
      }
    }
  });

  return actions;
}

/**
 * Normalizes or parses a directive into a complete structured object.
 */
export function normalizeDirective(rawDirective, asset = {}, weather = {}, structuredDirective = null, engineName = null, isLiveGranite = false) {
  // If backend provided a valid structured_directive object, use and enrich it
  if (structuredDirective && structuredDirective.asset && structuredDirective.recommendations) {
    return {
      ...structuredDirective,
      engine: engineName || structuredDirective.engine || (isLiveGranite ? 'IBM Granite 3.0 — Live' : 'IBM Granite 3.0 — Template Fallback'),
      is_live_granite: isLiveGranite || Boolean(structuredDirective.is_live_granite),
    };
  }

  // Fallback defaults from asset and weather
  const assetId = asset.asset_id || 'TX-401';
  const model = asset.model || 'High-Voltage Power Transformer';
  const location = asset.substation_name || asset.substation_id || 'Metro Central Transit Substation';
  const riskScore = asset.composite_risk_score ?? 0;
  const riskLevel = asset.risk_category || 'NORMAL';

  const oilTemp = asset.oil_temp_c ?? asset.telemetry_snapshot?.oil_temperature ?? 75.0;
  const vibration = asset.vibration_mms ?? asset.telemetry_snapshot?.vibration ?? 2.5;
  const loadPct = asset.load_pct ?? asset.telemetry_snapshot?.electrical_load_pct ?? 65.0;

  const c2h2 = asset.dga_ppm?.acetylene ?? asset.telemetry_snapshot?.c2h2_ppm ?? 0.0;
  const c2h4 = asset.dga_ppm?.ethylene ?? asset.telemetry_snapshot?.c2h4_ppm ?? 0.0;
  const h2 = asset.dga_ppm?.hydrogen ?? asset.telemetry_snapshot?.hydrogen_ppm ?? 0.0;
  const ch4 = asset.dga_ppm?.methane ?? asset.telemetry_snapshot?.ch4_ppm ?? 0.0;

  const wTemp = weather.ambient_temp_c ?? 25.0;
  const wGust = weather.wind_speed_kmh ?? 15.0;
  const wMult = asset.weather_multiplier ?? weather.weather_risk_multiplier ?? 1.0;
  const wSource = weather.source || 'Open-Meteo Live';
  const eventName = weather.event_name || 'Active Weather';

  const customers = asset.customers_served || 85000;
  const infra = asset.hospital_connected
    ? ['Regional Trauma Hospital Center']
    : asset.transit_connected
    ? ['Electrified Transit / Metro Rail']
    : ['Standard Commercial & Residential Load'];

  // If rawDirective text is available, parse sections from it
  if (typeof rawDirective === 'string' && rawDirective.trim()) {
    const text = rawDirective;

    // 1. Extract Recommended Intervention section
    let interventionSection = '';
    const recMatch = text.match(/(?:RECOMMENDED INTERVENTION|RECOMMENDED ACTION)[\s\S]*?(?=(?:####|\*\*\*|\bCrew Requirement|$))/i);
    if (recMatch) {
      interventionSection = recMatch[0]
        .replace(/(?:RECOMMENDED INTERVENTION|RECOMMENDED ACTION)/i, '')
        .trim();
    }

    const recommendations = parseActionRecommendations(interventionSection, riskLevel);

    // 2. Extract Crew Requirement lines
    const crewAllocationMatch = text.match(/Crew Allocation:\s*([^\n]+)/i);
    const preposMatch = text.match(/Pre-Positioning Directive:\s*([^\n]+)/i);
    const toolsMatch = text.match(/Required Diagnostic Tools:\s*([^\n]+)/i);
    const sparesMatch = text.match(/Spare Parts on Hot Standby:\s*([^\n]+)/i);

    // 3. Extract Safety & Urgency lines
    const urgencyMatch = text.match(/Reason for Urgency:\s*([^\n]+)/i);
    const safetyMatch = text.match(/Safety Safeguards:\s*([^\n]+)/i);

    // 4. Extract Human Review Mandate
    const mandateMatch = text.match(/Human-in-the-Loop Mandate:\s*([^\n]+)/i);

    return {
      asset: {
        id: assetId,
        name: assetId,
        model,
        location,
        substation_name: location,
        risk_score: riskScore,
        risk_level: riskLevel,
      },
      engine: engineName || (isLiveGranite ? 'IBM Granite 3.0 — Live' : 'IBM Granite 3.0 — Template Fallback'),
      is_live_granite: isLiveGranite,
      timestamp: new Date().toISOString(),
      dga: {
        status: (asset.risk_factors && asset.risk_factors[0]) || (c2h2 >= 35 ? 'Condition 4 (Active Arcing Hazard)' : 'Condition 1 (Nominal Standards-Informed Envelope)'),
        primary_risk_factor: (asset.risk_factors && asset.risk_factors[0]) || (c2h2 >= 35 ? 'High-Energy Electrical Arcing' : 'Operational Degradation within Standard Envelope'),
        c2h2_ppm: c2h2,
        c2h4_ppm: c2h4,
        h2_ppm: h2,
        ch4_ppm: ch4,
      },
      telemetry: {
        oil_temperature_c: oilTemp,
        vibration_mms: vibration,
        load_percent: loadPct,
      },
      weather: {
        temperature_c: wTemp,
        wind_gust_kmh: wGust,
        stress_multiplier: wMult,
        source: wSource,
        event_name: eventName,
      },
      grid_impact: {
        customers_affected: customers,
        critical_infrastructure: infra,
      },
      historical_context: {
        incident_count: asset.incident_count || 1,
      },
      recommendations: recommendations.length > 0 ? recommendations : [
        {
          step: 1,
          title: riskScore >= 80 ? 'IMMEDIATE ELECTRICAL ARCING SUPPRESSION' : 'NOMINAL GRID SUPERVISION',
          description: riskScore >= 80
            ? `Acetylene concentration is at ${c2h2} ppm. Dispatch High-Voltage Rapid Response Crew to ${location} within 30 minutes.`
            : `${assetId} is operating safely within standard IEEE physical and thermal limits.`,
          urgency: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'ROUTINE',
          type: riskScore >= 80 ? 'arcing' : 'supervision'
        }
      ],
      crew: {
        deployment: crewAllocationMatch ? stripMarkdown(crewAllocationMatch[1]) : (riskScore >= 60 ? `Substation Crew dispatched to ${location}` : 'No crew deployment required; SCADA telemetry active.'),
        pre_positioning: preposMatch ? stripMarkdown(preposMatch[1]) : (riskScore >= 60 ? `Pre-position rapid response unit near ${location}` : 'No pre-positioning necessary.'),
        diagnostic_equipment: toolsMatch ? stripMarkdown(toolsMatch[1]) : (riskScore >= 60 ? 'Mobile degasification trailer, acoustic ultrasonic analyzer, FLIR camera' : 'Standard telemetry sensors operational.'),
        spare_parts: sparesMatch ? stripMarkdown(sparesMatch[1]) : (riskScore >= 60 ? 'Replacement 345kV bushing assembly, radiator relay bank' : 'None required.'),
        deployment_required: riskScore >= 40,
        pre_positioning_required: riskScore >= 60,
      },
      safety_and_urgency: {
        urgency_level: riskLevel,
        reason: urgencyMatch ? stripMarkdown(urgencyMatch[1]) : `Calculated risk priority is ${riskScore}/100.`,
        safety: safetyMatch ? stripMarkdown(safetyMatch[1]) : 'Maintain standard arc-flash safety boundary and observe live yard safety protocols.',
      },
      human_review: {
        mandate: mandateMatch ? stripMarkdown(mandateMatch[1]) : 'AI-assisted operational recommendation — final field action requires certified operator approval and digital countersignature.',
        status: 'Awaiting Review',
        review_required: true,
      }
    };
  }

  // Fallback if no text provided
  return {
    asset: {
      id: assetId,
      name: assetId,
      model,
      location,
      substation_name: location,
      risk_score: riskScore,
      risk_level: riskLevel,
    },
    engine: engineName || 'IBM Granite 3.0 — Template Fallback',
    is_live_granite: isLiveGranite,
    timestamp: new Date().toISOString(),
    dga: {
      status: 'Condition 1 (Nominal Standards-Informed Envelope)',
      primary_risk_factor: 'Nominal baseline telemetry',
      c2h2_ppm: c2h2,
      c2h4_ppm: c2h4,
      h2_ppm: h2,
      ch4_ppm: ch4,
    },
    telemetry: {
      oil_temperature_c: oilTemp,
      vibration_mms: vibration,
      load_percent: loadPct,
    },
    weather: {
      temperature_c: wTemp,
      wind_gust_kmh: wGust,
      stress_multiplier: wMult,
      source: wSource,
      event_name: eventName,
    },
    grid_impact: {
      customers_affected: customers,
      critical_infrastructure: infra,
    },
    historical_context: {
      incident_count: 0,
    },
    recommendations: [
      {
        step: 1,
        title: 'NOMINAL GRID SUPERVISION',
        description: `${assetId} is operating safely within standard limits. Maintain regular SCADA telemetry polling.`,
        urgency: 'ROUTINE',
        type: 'supervision'
      }
    ],
    crew: {
      deployment: 'No crew deployment required; autonomous SCADA supervision active.',
      pre_positioning: 'No pre-positioning necessary.',
      diagnostic_equipment: 'Standard telemetry sensors operational.',
      spare_parts: 'None required.',
      deployment_required: false,
      pre_positioning_required: false,
    },
    safety_and_urgency: {
      urgency_level: riskLevel,
      reason: `Calculated baseline risk is ${riskScore}/100.`,
      safety: 'Normal automated monitoring protocols.',
    },
    human_review: {
      mandate: 'AI-assisted operational recommendation — final field action requires certified operator approval.',
      status: 'Awaiting Review',
      review_required: true,
    }
  };
}
