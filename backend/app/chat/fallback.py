import re
from typing import Tuple, List
from app.chat.decision_tools import (
    investigation_support,
    district_review_summary,
    rising_crimes,
    crime_trend,
    disposal_analysis,
)
from app.chat.data.query import run_query

def extract_district(text: str) -> str | None:
    districts = [
        "bengaluru city", "mysuru", "tumakuru", "belagavi", "kalaburagi", 
        "dakshina kannada", "vijayapur", "ballari", "davanagere", 
        "shivamogga", "hassan", "mandya", "udupi", "dharwad", 
        "bagalkot", "chickballapura", "kolar", "raichur"
    ]
    text_lower = text.lower()
    for d in districts:
        if d in text_lower:
            return d.title()
            
    # Check common synonyms or abbreviations
    if "bengaluru" in text_lower or "bangalore" in text_lower:
        return "Bengaluru City"
    if "mysore" in text_lower:
        return "Mysuru"
    if "belgaum" in text_lower:
        return "Belagavi"
    if "mangalore" in text_lower or "dakshina" in text_lower:
        return "Dakshina Kannada"
    if "bijapur" in text_lower:
        return "Vijayapur"
    if "bellary" in text_lower:
        return "Ballari"
    if "shimoga" in text_lower:
        return "Shivamogga"
        
    return None

def extract_crime_head(text: str) -> str | None:
    # Common crime heads from schema
    crime_heads = [
        "murder", "attempt to murder", "rape", "pocso", "theft", "burglary", 
        "robbery", "kidnapping", "cyber crime", "dowry deaths", "riot"
    ]
    text_lower = text.lower()
    for head in crime_heads:
        if head in text_lower:
            return head
    return None

def generate_fallback_response(query: str) -> Tuple[str, List[str]]:
    district = extract_district(query)
    crime_head = extract_crime_head(query)
    query_lower = query.lower()

    # 1. Solve / Prevent / Reduce / Policing / Action Plan
    if any(k in query_lower for k in ["solve", "prevent", "reduce", "policing", "handle", "deal", "action plan", "priority", "briefing", "focus", "recommend", "investigation"]):
        # If district is found but no specific crime, run district investigation support
        if district and not crime_head:
            res = investigation_support(district)
            if "error" in res:
                return f"I encountered an error looking up investigation support details: {res['error']}", []
            
            lines = []
            lines.append("SITUATION:")
            lines.append(f"In {res['district']} district, the recent statistics indicate key crime categories that require immediate attention. The top recent crime concerns reported include:")
            for item in res["top_crime_concerns_recent"][:3]:
                lines.append(f"- {item['crime_type']}: {item['cases']} reported cases")
            
            lines.append("")
            lines.append("INVESTIGATION APPROACH:")
            lines.append("Based on the district's primary crime profile, the following operational investigative guidelines are recommended:")
            
            has_property_crime = False
            has_violent_crime = False
            has_vulnerable_crime = False
            
            for item in res["top_crime_concerns_recent"]:
                c_type = item["crime_type"].lower()
                if any(x in c_type for x in ["theft", "burglary", "robbery"]):
                    has_property_crime = True
                elif any(x in c_type for x in ["murder", "kidnapping"]):
                    has_violent_crime = True
                elif any(x in c_type for x in ["rape", "pocso", "women", "children"]):
                    has_vulnerable_crime = True
            
            if has_violent_crime:
                lines.append("- For violent crime cases like murder, establish immediate crime scene security, prioritize forensic and ballistics/DNA collection, secure local CCTV feeds, and investigate last-known associations.")
            if has_vulnerable_crime:
                lines.append("- For crimes against women, children, and vulnerable groups, ensure immediate medical assistance, expedite recording of victim statement under Sec 164 CrPC, and fast-track forensic submissions.")
            if has_property_crime:
                lines.append("- For property offences like burglary or theft, activate local intelligence networks, alert pawn shops, map burglary patterns, and coordinate modus operandi checks on active local offenders.")
            lines.append("- In all cases, improve inter-district communication to track mobile offender groups active along district borders.")
            
            lines.append("")
            lines.append("ADMINISTRATIVE ACTION:")
            if res["fir_esign"] or res["chargesheet_esign"] or res["sakala"]:
                lines.append(f"Administrative records for {res['district']} show the following bottlenecks:")
                if res["fir_esign"]:
                    lines.append(f"- FIR E-sign Completion: {res['fir_esign']['percentage']}% ({res['fir_esign']['fir_esign']} of {res['fir_esign']['fir_registered']} cases e-signed)")
                if res["chargesheet_esign"]:
                    lines.append(f"- Chargesheet E-sign Completion: {res['chargesheet_esign']['percentage']}% ({res['chargesheet_esign']['chargesheet_esign']} of {res['chargesheet_esign']['chargesheet_registered']} cases e-signed)")
                if res["sakala"]:
                    lines.append(f"- Sakala public service delivery: {res['sakala']['sakala_receipts']} cases received, {res['sakala']['sakala_disposals']} cases resolved, with a pendency of {res['sakala']['pendency']} cases past the due date.")
                
                low_esign = False
                if res["fir_esign"] and res["fir_esign"]["percentage"] < 95:
                    low_esign = True
                if res["chargesheet_esign"] and res["chargesheet_esign"]["percentage"] < 90:
                    low_esign = True
                if low_esign:
                    lines.append("- Action Required: Supervisors must monitor daily e-signature compliance and ensure officers utilize their digital certificates promptly.")
                if res["sakala"] and res["sakala"]["pendency"] > 10:
                    lines.append("- Action Required: Dedicate a desk officer to clear the pending Sakala public applications to comply with mandated timelines.")
            else:
                lines.append("- E-sign and Sakala public service pendency should be monitored daily to resolve administrative bottlenecks.")
                
            lines.append("")
            lines.append("PREVENTION:")
            lines.append("- Conduct high-visibility foot patrols in identified crime hotspots during peak hours.")
            lines.append("- Organize community policing forums to build public trust and gather local intelligence.")
            lines.append("- Leverage digital media and local workshops to raise public awareness on crime prevention.")
            
            return "\n".join(lines), res.get("_source", [])

        # If a specific crime type is mentioned (e.g. theft, cyber crime, murder, rape)
        elif crime_head:
            lines = []
            lines.append("SITUATION:")
            state_total = 0
            try:
                col = crime_head.lower().replace(" ", "_")
                if "cyber" in col:
                    col = "cyber_crime"
                elif "pocso" in col:
                    col = "pocso"
                sql = f"SELECT SUM(COALESCE({col}, 0)) as total FROM district_crime_matrix"
                db_res = run_query(sql)
                if db_res.rows:
                    state_total = int(db_res.rows[0]["total"])
            except Exception:
                pass
            
            if state_total > 0:
                lines.append(f"State-wide statistics show a total of {state_total:,} reported cases of {crime_head} in the recent period.")
            else:
                lines.append(f"Analysis of reported {crime_head} offences across police ranges is summarized below.")
            
            lines.append("")
            lines.append("INVESTIGATION APPROACH:")
            c_type = crime_head.lower()
            if "cyber" in c_type:
                lines.append("- Freeze beneficiary bank accounts immediately (within the Golden Hour) to prevent money siphoning.")
                lines.append("- Obtain IP addresses, digital logs, and ISP header details for routing analysis.")
                lines.append("- Preserve digital evidence and coordinate with the Cyber Crime FSL division for device analysis.")
            elif "theft" in c_type or "burglary" in c_type or "robbery" in c_type:
                lines.append("- Secure and review local CCTV footage from surrounding commercial and residential nodes.")
                lines.append("- Lift and submit latent fingerprints from the scene of crime to FPB database.")
                lines.append("- Alert local pawn shops and second-hand scrap dealers about matching stolen items.")
                lines.append("- Review modus operandi and check records of active property crime recidivists in the area.")
            elif "murder" in c_type or "violence" in c_type or "hurt" in c_type:
                lines.append("- Immediately secure the crime scene and preserve biological/physical evidence.")
                lines.append("- Coordinate with forensics (FSL) for quick DNA and ballistics analysis.")
                lines.append("- Document eyewitness statements under Sec 164 BNSS without delay.")
                lines.append("- Investigate the victim's immediate relationship circles and last known locations.")
            elif "rape" in c_type or "pocso" in c_type or "dowry" in c_type:
                lines.append("- Prioritize immediate medical examination and ensure psychological victim support.")
                lines.append("- Record statements in a sensitive manner using female investigating officers.")
                lines.append("- Fast-track forensic evidence submission to avoid contamination or delay.")
                lines.append("- Expedite legal review for fast-track court prosecution.")
            else:
                lines.append("- Standardize case file checklists and coordinate evidence gathering pipelines.")
                lines.append("- Check past offender logs matching similar modus operandi.")
                
            lines.append("")
            lines.append("ADMINISTRATIVE ACTION:")
            lines.append("- Monitor e-signature rates for FIRs and chargesheets to ensure compliance with digital timelines.")
            lines.append("- Dedicate specialized desk officers to expedite clearance of public grievances.")
            
            lines.append("")
            lines.append("PREVENTION:")
            if "cyber" in c_type:
                lines.append("- Conduct cyber security awareness workshops in schools, colleges, and local communities.")
                lines.append("- Distribute advisory alerts regarding phishing campaigns and OTP frauds.")
            elif "theft" in c_type or "burglary" in c_type or "robbery" in c_type:
                lines.append("- Optimize night patrolling routes based on temporal crime hotspot matrices.")
                lines.append("- Run community watch programs to encourage neighborhood monitoring.")
            else:
                lines.append("- Increase visible police patrolling in hotspots during peak hours.")
                lines.append("- Coordinate border checks and inter-district patrols to track mobile gangs.")
                
            return "\n".join(lines), ["crime-stats fallback guide"]
            
        else:
            # General solving/policing question (no crime head, no district)
            lines = []
            lines.append("SITUATION:")
            lines.append("State-wide crime trends indicate a high volume of property crimes (theft, burglary) and a rising incidence of cyber crimes.")
            
            lines.append("")
            lines.append("INVESTIGATION APPROACH:")
            lines.append("- Standardize evidence checklists across all units to ensure proper case build-ups.")
            lines.append("- Prioritize scientific and digital evidence (CCTV, mobile tower logs, fingerprints, forensic reports).")
            lines.append("- Leverage crime databases (such as CCTNS) to match modus operandi and identify active recidivists.")
            
            lines.append("")
            lines.append("ADMINISTRATIVE ACTION:")
            lines.append("- Enforce strict compliance for e-signature of FIRs (target > 95%) and chargesheets (target > 90%).")
            lines.append("- Allocate resources and specialized teams to districts showing high case load or backlog.")
            
            lines.append("")
            lines.append("PREVENTION:")
            lines.append("- Implement data-driven patrolling models targeting high-risk hotspots and hours.")
            lines.append("- Engage in active community policing and build public trust to collect actionable local intelligence.")
            
            return "\n".join(lines), ["crime-stats fallback guide"]

    # 2. Rising Crimes
    if any(k in query_lower for k in ["rising", "increase", "emerging"]):
        res = rising_crimes()
        lines = []
        lines.append("SITUATION:")
        lines.append(f"State-wide comparison for {res['basis']} reveals the following crime categories showing the largest year-over-year increases:")
        for item in res["rising"]:
            lines.append(f"- {item['crime_head']} ({item['category']}): increased by {item['change']} cases (from {item['january_2025']} in 2025 to {item['january_2026']} in 2026)")
            
        lines.append("")
        lines.append("PREVENTION:")
        lines.append("- Deploy specialized prevention campaigns for rising crime heads like cyber crime and financial frauds.")
        lines.append("- Increase police presence and regular checking of active recidivists associated with these specific offences.")
        return "\n".join(lines), res.get("_source", [])

    # 3. Crime Trend
    if "trend" in query_lower or "change" in query_lower:
        search_head = crime_head or "theft"
        res = crime_trend(search_head)
        if "error" in res:
            return f"I encountered an error looking up trend details: {res['error']}", []
        lines = []
        lines.append("SITUATION:")
        lines.append(f"Periodic trend analysis for {search_head} across the state shows:")
        for item in res["series"]:
            lines.append(f"- January 2025: {item['january_2025']} reported cases")
            lines.append(f"- December 2025: {item['december_2025']} reported cases")
            lines.append(f"- January 2026: {item['january_2026']} reported cases")
            
        lines.append("")
        lines.append("ADMINISTRATIVE ACTION:")
        lines.append("- Monitor monthly variations to allocate staff and adjust patrolling beats during seasons of higher activity.")
        return "\n".join(lines), res.get("_source", [])

    # 4. Disposal / E-sign / Sakala
    if any(k in query_lower for k in ["disposal", "esign", "e-sign", "sakala", "pendency"]):
        search_unit = district or "Mysuru"
        res = disposal_analysis(search_unit)
        if "error" in res:
            return f"I encountered an error looking up disposal details: {res['error']}", []
        lines = []
        lines.append("SITUATION:")
        lines.append(f"Administrative disposal and public service performance for {res['unit']} is summarized below:")
        if res["fir_esign"]:
            lines.append(f"- FIR e-sign completion rate is {res['fir_esign']['percentage']}% ({res['fir_esign']['fir_esign']} of {res['fir_esign']['fir_registered']} cases e-signed).")
        if res["chargesheet_esign"]:
            lines.append(f"- Chargesheet e-sign completion rate is {res['chargesheet_esign']['percentage']}% ({res['chargesheet_esign']['chargesheet_esign']} of {res['chargesheet_esign']['chargesheet_registered']} cases e-signed).")
        if res["sakala"]:
            lines.append(f"- Sakala public service delivery reports {res['sakala']['sakala_receipts']} receipts, {res['sakala']['sakala_disposals']} disposals, and {res['sakala']['pendency']} cases pending after the due date.")
            
        lines.append("")
        lines.append("ADMINISTRATIVE ACTION:")
        lines.append("- Ensure all investigating officers have working digital signatures and receive refresher training on the e-signing workflow.")
        lines.append("- Monitor the oldest pending Sakala files daily to resolve processing delays.")
        return "\n".join(lines), res.get("_source", [])

    # 5. Top 5 / High-crime districts / specific data list
    if any(k in query_lower for k in ["top", "high", "worst", "rank"]):
        try:
            sql = (
                "SELECT district, "
                "(murder + robbery + theft + rape + pocso + cyber_crime) as total "
                "FROM district_crime_matrix "
                "WHERE district NOT IN ('Total', 'Karnataka', 'Grand Total', 'State Total') "
                "ORDER BY total DESC LIMIT 5"
            )
            res = run_query(sql)
            lines = []
            lines.append("SITUATION:")
            lines.append("The top 5 districts in Karnataka ranked by total reported crime cases in the recent period are:")
            for item in res.rows:
                lines.append(f"- {item['district']}: {item['total']} total reported cases")
            
            lines.append("")
            lines.append("ADMINISTRATIVE ACTION:")
            lines.append("Resource deployment, specialized training, and administrative supervision should be scaled proportionally in these high-volume districts to ensure effective case management and public safety.")
            return "\n".join(lines), [f"crime-stats SQL: {sql}"]
        except Exception:
            pass

    # 6. Default to District Review Summary if a district is found
    if district:
        res = district_review_summary(district)
        if "error" in res:
            return f"I encountered an error looking up district details: {res['error']}", []
        lines = []
        lines.append("SITUATION:")
        lines.append(f"In {res['district']} district, the recent period recorded a total of {res['total_reported_cases']} crime cases. The major reported crime heads in the district are:")
        for item in res["top_crime_types"][:4]:
            lines.append(f"- {item['crime_type']}: {item['cases']} reported cases")
            
        lines.append("")
        lines.append("ADMINISTRATIVE ACTION:")
        lines.append("- Dedicate specialized teams to target the most frequent offences in the district.")
        lines.append("- Leverage crime hotspot maps to deploy field officers more effectively.")
        return "\n".join(lines), res.get("_source", [])

    # 7. Fallback generic response structured like a full decision briefing
    lines = []
    lines.append("SITUATION:")
    lines.append("I am the CrimeRakshak AI Copilot. State-wide crime telemetry indicates that property theft and Special & Local Laws (SLL) represent the highest case volume in Karnataka. Top reported concerns include:")
    try:
        sql = """
            SELECT 
                SUM(murder) as murder, SUM(theft) as theft, 
                SUM(cyber_crime) as cyber, SUM(spl_local_laws) as sll 
            FROM district_crime_matrix
        """
        res = run_query(sql)
        if res.rows:
            row = res.rows[0]
            lines.append(f"- Special & Local Laws (SLL) Cases: {int(row['sll']):,} cases")
            lines.append(f"- Property Theft: {int(row['theft']):,} cases")
            lines.append(f"- Cyber Crime: {int(row['cyber']):,} cases")
            lines.append(f"- Murder: {int(row['murder']):,} cases")
    except Exception:
        lines.append("- Property Theft: highest volume IPC offenses.")
        lines.append("- Cyber Crime: showing the fastest rate of growth year-over-year.")
        
    lines.append("")
    lines.append("INVESTIGATION APPROACH:")
    lines.append("- Standardize case checklists and prioritize digital evidence collection (CCTV, IP trails).")
    lines.append("- Freeze target bank accounts within the Golden Hour for cyber fraud reports.")
    
    lines.append("")
    lines.append("ADMINISTRATIVE ACTION:")
    lines.append("- Increase digital signature adoption for FIRs and chargesheets to clear backend backlogs.")
    lines.append("- Monitor Sakala application queues daily to minimize delivery delays.")
    
    lines.append("")
    lines.append("PREVENTION:")
    lines.append("- Optimize night beats and foot patrols based on spatio-temporal hotspots.")
    lines.append("- Run regular community policing forums and public cyber-hygiene campaigns.")
    
    return "\n".join(lines), ["crime-stats generic fallback"]
