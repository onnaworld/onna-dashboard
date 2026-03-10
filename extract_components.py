#!/usr/bin/env python3
"""Extract inline components from App.jsx into separate files."""
import os, re

SRC = '/Users/emily/Desktop/onna-dashboard/src/App.jsx'

with open(SRC, 'r') as f:
    all_lines = f.readlines()

def get(start, end):
    """Get lines start..end (1-indexed, inclusive)."""
    return all_lines[start-1:end]

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"  Created {path}")

BASE = '/Users/emily/Desktop/onna-dashboard/src'

# ═══════════════════════════════════════════════════════════════════════════════
# 1. src/data/initVendors.js — lines 3939-4375
# ═══════════════════════════════════════════════════════════════════════════════
vendors_code = ''.join(get(3939, 4375))
# Change "const initVendors" to "export const initVendors" etc
vendors_code = vendors_code.replace('const SEED_LEADS', 'export const SEED_LEADS')
vendors_code = vendors_code.replace('const SEED_CLIENTS', 'export const SEED_CLIENTS')
vendors_code = vendors_code.replace('const SEED_PROJECTS', 'export const SEED_PROJECTS')
vendors_code = vendors_code.replace('const initVendors', 'export const initVendors')
vendors_code = vendors_code.replace('const initOutreach', 'export const initOutreach')
vendors_code = vendors_code.replace('const savedCallSheets', 'export const savedCallSheets')
vendors_code = vendors_code.replace('const savedRiskAssessments', 'export const savedRiskAssessments')
write_file(f'{BASE}/data/initVendors.js', vendors_code)

# ═══════════════════════════════════════════════════════════════════════════════
# 2. src/components/docs/CPSPolly.jsx — lines 349-1274 (constants + component)
# ═══════════════════════════════════════════════════════════════════════════════
cps_code = ''.join(get(349, 1274))
cps_file = f'''import React, {{ useState, useEffect, useRef, useCallback, useImperativeHandle }} from "react";
import {{ CSEditField, SignaturePad, CSEditTextarea, CSLogoSlot, CSResizableImage, CSXbtn, CSAddBtn, validateImg }} from "../ui/DocHelpers";

{cps_code}
export default CPSPolly;
'''
write_file(f'{BASE}/components/docs/CPSPolly.jsx', cps_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 3. src/components/docs/ShotListPolly.jsx — lines 1275-1891
# ═══════════════════════════════════════════════════════════════════════════════
sl_code = ''.join(get(1275, 1891))
sl_file = f'''import React, {{ useState, useEffect, useRef, useCallback, useImperativeHandle }} from "react";
import {{ validateImg }} from "../ui/DocHelpers";

{sl_code}
export default ShotListPolly;
'''
write_file(f'{BASE}/components/docs/ShotListPolly.jsx', sl_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 4. src/components/docs/LocationsConnie.jsx — lines 1892-2244
# ═══════════════════════════════════════════════════════════════════════════════
loc_code = ''.join(get(1892, 2244))
loc_file = f'''import React, {{ useState, useRef, useImperativeHandle }} from "react";
import {{ validateImg }} from "../ui/DocHelpers";

{loc_code}
export default LocationsConnie;
'''
write_file(f'{BASE}/components/docs/LocationsConnie.jsx', loc_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 5. src/components/docs/CastingConnie.jsx — lines 2245-2583
# ═══════════════════════════════════════════════════════════════════════════════
cast_code = ''.join(get(2245, 2583))
cast_file = f'''import React, {{ useState, useRef, useImperativeHandle }} from "react";
import {{ validateImg }} from "../ui/DocHelpers";

{cast_code}
export default CastingConnie;
'''
write_file(f'{BASE}/components/docs/CastingConnie.jsx', cast_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 6. src/components/docs/StoryboardPolly.jsx — lines 2584-2863
# ═══════════════════════════════════════════════════════════════════════════════
sb_code = ''.join(get(2584, 2863))
sb_file = f'''import React, {{ useState, useEffect, useRef, useCallback, useImperativeHandle }} from "react";
import {{ validateImg }} from "../ui/DocHelpers";

{sb_code}
export default StoryboardPolly;
'''
write_file(f'{BASE}/components/docs/StoryboardPolly.jsx', sb_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 7. src/components/docs/PostPolly.jsx — lines 2864-3161
# ═══════════════════════════════════════════════════════════════════════════════
pp_code = ''.join(get(2864, 3161))
pp_file = f'''import React, {{ useState, useRef, useImperativeHandle }} from "react";
import {{ validateImg }} from "../ui/DocHelpers";

{pp_code}
export default PostPolly;
'''
write_file(f'{BASE}/components/docs/PostPolly.jsx', pp_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 8. src/components/docs/CastingTableConnie.jsx — lines 3162-3354
# ═══════════════════════════════════════════════════════════════════════════════
ctb_code = ''.join(get(3162, 3354))
ctb_file = f'''import React, {{ useState, useRef, useImperativeHandle }} from "react";
import {{ PRINT_CLEANUP_CSS }} from "../../utils/helpers";
import {{ validateImg }} from "../ui/DocHelpers";

{ctb_code}
export default CastingTableConnie;
'''
write_file(f'{BASE}/components/docs/CastingTableConnie.jsx', ctb_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 9. src/components/docs/FittingConnie.jsx — lines 3355-3722
# ═══════════════════════════════════════════════════════════════════════════════
fit_code = ''.join(get(3355, 3722))
fit_file = f'''import React, {{ useState, useEffect, useRef, useImperativeHandle }} from "react";
import {{ validateImg }} from "../ui/DocHelpers";

{fit_code}
export default FittingConnie;
'''
write_file(f'{BASE}/components/docs/FittingConnie.jsx', fit_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 10. src/components/agents/EstimateView.jsx — lines 4832-5142
#     (includes EST_CURRENCIES constant at 4832)
# ═══════════════════════════════════════════════════════════════════════════════
ev_code = ''.join(get(4832, 5142))
ev_file = f'''import React, {{ useState, useRef }} from "react";
import {{ estFmt, estNum, estRowTotal, estSectionTotal, estCalcTotals }} from "../../utils/helpers";
import {{ EstHl, EstCell, EstSignaturePad, EST_F, EST_LS, EST_LS_HDR, EST_YELLOW, EST_SA_FIELDS, DEFAULT_TCS }} from "../ui/DocHelpers";
import {{ CSLogoSlot }} from "../ui/DocHelpers";

{ev_code}
export default EstimateView;
'''
write_file(f'{BASE}/components/agents/EstimateView.jsx', ev_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 11. src/components/agents/AgentDocPreview.jsx — lines 5143-5580
# ═══════════════════════════════════════════════════════════════════════════════
adp_code = ''.join(get(5143, 5580))
adp_file = f'''import React, {{ useState, useRef, useCallback, useEffect }} from "react";
import {{ createPortal }} from "react-dom";
import {{ renderHtmlToDocPages, exportDocPreview, PRINT_CLEANUP_CSS, PRINT_CLEANUP_SCRIPT }} from "../../utils/helpers";

{adp_code}
'''
write_file(f'{BASE}/components/agents/AgentDocPreview.jsx', adp_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 12. src/components/agents/AgentCard.jsx — lines 5581-7301
# ═══════════════════════════════════════════════════════════════════════════════
ac_code = ''.join(get(5581, 7301))
ac_file = f'''import React, {{ useState, useEffect, useRef, useCallback, useMemo, Fragment }} from "react";
import {{ api, docApi, buildPath }} from "../../utils/helpers";
import {{ useUI }} from "../../context/UIContext";
import {{ useProject }} from "../../context/ProjectContext";
import {{ useAgentStore }} from "../../context/AgentContext";

{ac_code}
'''
write_file(f'{BASE}/components/agents/AgentCard.jsx', ac_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 13. src/components/ui/SharedUI.jsx — lines 7302-7635
# ═══════════════════════════════════════════════════════════════════════════════
sui_code = ''.join(get(7302, 7635))
sui_file = f'''import React, {{ useState, useRef, useEffect, useCallback }} from "react";
import {{ api, debouncedGlobalSave }} from "../../utils/helpers";

{sui_code}
'''
write_file(f'{BASE}/components/ui/SharedUI.jsx', sui_file)

# ═══════════════════════════════════════════════════════════════════════════════
# 14. src/components/ui/DocHelpers.jsx — lines 65-348
#     (shared doc helpers: validateImg, CSEditField, SignaturePad, etc.)
# ═══════════════════════════════════════════════════════════════════════════════
dh_code = ''.join(get(65, 348))
dh_file = f'''import React, {{ useState, useRef, useEffect, useCallback }} from "react";

{dh_code}

// Re-export everything for convenience
export {{ MAX_IMG_SIZE, validateImg, CS_FONT, CS_LS, CS_YELLOW, RA_FONT, RA_LS, RA_LS_HDR, RA_GREY, CT_FONT, CT_LS, CT_LS_HDR }};
export {{ CSEditField, SignaturePad, CSEditTextarea, CSLogoSlot, CSResizableImage, CSXbtn, CSAddBtn }};
export {{ TIHl, TICell, TITableSection }};
export {{ DIETARY_TAGS, DIETARY_TAG_COLORS, DietaryTagSelect, DIETARY_INIT }};
export {{ EST_F, EST_LS, EST_LS_HDR, EST_YELLOW, EstHl, EstCell, EstSignaturePad, EST_SA_FIELDS, DEFAULT_TCS, ESTIMATE_INIT }};
export {{ CALLSHEET_INIT }};
'''
write_file(f'{BASE}/components/ui/DocHelpers.jsx', dh_file)

# ═══════════════════════════════════════════════════════════════════════════════
# NOW: Modify App.jsx
# ═══════════════════════════════════════════════════════════════════════════════

# Define ranges to remove (1-indexed, inclusive), sorted descending
# Remove from bottom to top to preserve line numbers
removals = [
    # SharedUI: 7302-7635
    (7302, 7635),
    # AgentCard: 5581-7301
    (5581, 7301),
    # AgentDocPreview: 5143-5580
    (5143, 5580),
    # EstimateView (+ EST_CURRENCIES): 4832-5142
    (4832, 5142),
    # Seed data: 3939-4375
    (3939, 4375),
    # Fitting: 3355-3722
    (3355, 3722),
    # CastingTable: 3162-3354
    (3162, 3354),
    # PostPolly: 2864-3161
    (2864, 3161),
    # Storyboard: 2584-2863
    (2584, 2863),
    # Casting: 2245-2583
    (2245, 2583),
    # Locations: 1892-2244
    (1892, 2244),
    # ShotList: 1275-1891
    (1275, 1891),
    # CPS: 349-1274
    (349, 1274),
    # DocHelpers (constants + mini components): 65-348
    (65, 348),
]

# Sort descending by start line
removals.sort(key=lambda x: -x[0])

new_lines = list(all_lines)
for rs, re_ in removals:
    del new_lines[rs-1:re_]

# Add new imports after existing imports (find last import line)
import_insert_idx = 0
for i, line in enumerate(new_lines):
    stripped = line.strip()
    if stripped.startswith('import ') and 'from ' in stripped:
        import_insert_idx = i + 1

new_imports = [
    '// Doc helper components & constants\n',
    'import { MAX_IMG_SIZE, validateImg, CS_FONT, CS_LS, CS_YELLOW, RA_FONT, RA_LS, RA_LS_HDR, RA_GREY, CT_FONT, CT_LS, CT_LS_HDR, CSEditField, SignaturePad, CSEditTextarea, CSLogoSlot, CSResizableImage, CSXbtn, CSAddBtn, TIHl, TICell, TITableSection, DIETARY_TAGS, DIETARY_TAG_COLORS, DietaryTagSelect, DIETARY_INIT, EST_F, EST_LS, EST_LS_HDR, EST_YELLOW, EstHl, EstCell, EstSignaturePad, EST_SA_FIELDS, DEFAULT_TCS, ESTIMATE_INIT, CALLSHEET_INIT } from "./components/ui/DocHelpers";\n',
    '// Doc components\n',
    'import CPSPolly from "./components/docs/CPSPolly";\n',
    'import ShotListPolly from "./components/docs/ShotListPolly";\n',
    'import LocationsConnie from "./components/docs/LocationsConnie";\n',
    'import CastingConnie from "./components/docs/CastingConnie";\n',
    'import StoryboardPolly from "./components/docs/StoryboardPolly";\n',
    'import PostPolly from "./components/docs/PostPolly";\n',
    'import CastingTableConnie from "./components/docs/CastingTableConnie";\n',
    'import FittingConnie from "./components/docs/FittingConnie";\n',
    '// Seed data\n',
    'import { SEED_LEADS, SEED_CLIENTS, SEED_PROJECTS, initVendors, initOutreach, savedCallSheets, savedRiskAssessments } from "./data/initVendors";\n',
    '// Agent components\n',
    'import EstimateView from "./components/agents/EstimateView";\n',
    '// Shared UI components\n',
    'import { Badge, Pill, StatCard, TH, TD, SearchBar, Sel, OutreachBadge, THFilter, SectionBtn, UploadZone, BtnPrimary, BtnSecondary, BtnExport, renderSopMarkdown, AIDocPanel, DashNotes } from "./components/ui/SharedUI";\n',
]

for imp in reversed(new_imports):
    new_lines.insert(import_insert_idx, imp)

# Write modified App.jsx
with open(SRC, 'w') as f:
    f.writelines(new_lines)

print(f"\n  App.jsx updated. New line count: {len(new_lines)}")
print("  Done!")
