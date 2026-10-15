# Rugga 27 — Rugby Union Positional Versatility & Game Mechanics Research Report

**Document Version:** 1.0.0  
**Focus:** Positional Systems, Cross-Unit Eligibility ("Hybrid" Mechanic), Out-of-Position Penalties, and Official Source Verification

---

## 1. Executive Summary & Context

In rugby union, physical and tactical specialization between the Forward pack (Jerseys 1–8) and the Backline (Jerseys 9–15) is more pronounced than in virtually any other team sport. Front-row players (props and hookers) engage in scrums with tons of force requiring certified neck/spine conditioning and technical scrummaging expertise. Conversely, halfbacks and outside backs execute rapid passing distribution, tactical kicking, high-speed aerial contests, and open-field running lines.

However, modern professional rugby has seen select elite athletes demonstrate genuine cross-unit versatility ("Hybrid" players). When designing **Rugga 27**, we must balance:
1. **Strict Positional Integrity**: Ordinary forwards cannot simply be dragged to wing or fly-half; ordinary backs cannot pack down at tighthead prop.
2. **Researched Hybrid Versatility**: Documented hybrid players (e.g. Ben Earl, André Esterhuizen, Levani Botia, Kwagga Smith, Mathieu Bastareaud, Mauro Bergamasco) must be accurately represented using verified historical evidence without artificial overpowered inflation.

---

## 2. Research on Rugby Management Games & Competitors

### 2.1 Rugby Union Manager (RUM) & Pro Rugby Manager
- **Positional Representation**: Players have a Primary position (100% effectiveness) and up to two Secondary positions (85–90% effectiveness).
- **Out-of-Position Penalties**: Placing a forward into a backline role results in severe penalties (-35% to -50% match rating drop, severe handling errors, missed defensive reads).
- **Front-Row Safety Laws**: Pro Rugby Manager enforces World Rugby Law 3 — teams without specialist front-row replacements must undergo uncontested scrums and forfeit a player.

### 2.2 Rugby Challenge Series (Wicked Witch / Home Entertainment Suppliers)
- **Role Categories**: Forwards and Backs are strictly partitioned in automated team sheets.
- **Versatility Ratings**: Players like Levani Botia or Radike Samo have explicit multi-category tags (`FLK / CTR` or `LOCK / WING`).
- **Tactical Impact**: Hybrid positioning modifies stamina burn and defensive alignment lines during open-field phases.

### 2.3 Football Manager (Sports Interactive) — Cross-Genre Mechanical Reference
- **Familiarity Levels**: Natural (20/20), Accomplished (17/20), Competent (14/20), Unconvincing (10/20), Awkward (6/20).
- **Attribute Re-weighting**: The same player attributes (Pace, Strength, Decision-Making) produce different position ratings based on position-specific weightings.

---

## 3. Real-World Case Studies of Cross-Unit Hybrid Players

### Case 1: Ben Earl (Saracens & England)
- **Primary Role**: Openside / Blindside Flanker & Number 8 (Loose Forward).
- **Documented Positional History**: Renowned for exceptional speed, acceleration, and handling lines into the wider channels. During emergency backline shortages and in training, Saracens and England have prepared Earl as emergency inside centre cover. However, competitive appearances remain overwhelmingly in the back-row (8, 7, 6).
- **Rugga 27 Implementation**:
  - *Primary Position*: `OPENSIDE_FLANKER` (7)
  - *Secondary Positions*: `NUMBER_8` (8), `BLINDSIDE_FLANKER` (6)
  - *Hybrid Status*: `LEVEL_1_LIMITED`
  - *Approved Cross-Unit Positions*: `['INSIDE_CENTRE']`
  - *Versatility Penalty*: Moderate out-of-position penalty (-12% defensive positioning read penalty if deployed at 12).

### Case 2: André Esterhuizen (Sharks & South Africa)
- **Primary Role**: Inside Centre (12).
- **Documented Positional History**: 115kg powerhouse centre possessing bruising carrying ability and jackaling skills comparable to a loose forward. For Harlequins and the Sharks, Esterhuizen has occasionally packed down as an emergency flanker in late-game defensive sets or following sin-bins.
- **Rugga 27 Implementation**:
  - *Primary Position*: `INSIDE_CENTRE` (12)
  - *Secondary Positions*: `OUTSIDE_CENTRE` (13)
  - *Hybrid Status*: `LEVEL_1_LIMITED`
  - *Approved Cross-Unit Positions*: `['BLINDSIDE_FLANKER']`
  - *Versatility Penalty*: Lacks lineout jumping and set-piece scrum technique, but retains elite breakdown jackaling and tackling attributes.

### Case 3: Levani Botia (La Rochelle & Fiji) — The Gold Standard Specialist Hybrid
- **Primary Role**: Openside Flanker / Inside Centre.
- **Documented Positional History**: Genuinely started international test matches for Fiji at Centre (12) and European Champions Cup finals for Stade Rochelais at Flanker (7). Nicknamed "The Demolition Man".
- **Rugga 27 Implementation**:
  - *Primary Position*: `OPENSIDE_FLANKER` (7)
  - *Secondary Positions*: `INSIDE_CENTRE` (12), `BLINDSIDE_FLANKER` (6)
  - *Hybrid Status*: `LEVEL_3_SPECIALIST`
  - *Approved Cross-Unit Positions*: `['INSIDE_CENTRE', 'OUTSIDE_CENTRE']`
  - *Versatility Penalty*: 0% penalty (Dual Specialist ratings calculated natively for both positions).

### Case 4: Kwagga Smith (Sharks / Lions / Yamaha / Springboks)
- **Primary Role**: Flanker (7 / 6).
- **Documented Positional History**: Former Blitzbok Sevens world champion who seamlessly plays loose forward while maintaining outside-back agility and emergency wing cover.
- **Rugga 27 Implementation**:
  - *Primary Position*: `OPENSIDE_FLANKER` (7)
  - *Hybrid Status*: `LEVEL_2_CAPABLE`
  - *Approved Cross-Unit Positions*: `['RIGHT_WING', 'OUTSIDE_CENTRE']`

---

## 4. Official Sources Consulted

1. **United Rugby Championship Official Squads**: https://www.unitedrugby.com/
2. **South African Rugby Union (SARU)**: https://www.sarugby.co.za/
3. **Super Rugby Pacific Squad Reveals**: https://super.rugby/superrugby/news/follow-live-2026-super-rugby-pacific-squads-revealed/
4. **Sharks Rugby Official URC & EPCR Squad**: https://sharksrugby.co.za/pages/team/urc-epcr-squad
5. **Premiership Rugby Official Squad Profiles**: https://www.premrugby.com/
6. **World Rugby Laws of the Game (Law 3 — Team Numbering & Front Row Replacements)**: https://www.world.rugby/the-game/laws/law/3

---

## 5. Architectural Decision for Rugga 27

1. **Strict Unit Boundary**: By default, players belong strictly to either `UNIT_FORWARDS` (1–8) or `UNIT_BACKS` (9–15).
2. **Explicit Hybrid Attribute**: Only players with `hybridLevel !== 'NONE'` and an entry in `approvedCrossUnitPositions` may be selected across units.
3. **Independent Position-Specific Ratings**: Each position evaluates a unique formula:
   - Prop: `(scrummaging*0.35) + (strength*0.25) + (tackling*0.15) + (carrying*0.15) + (fitness*0.10)`
   - Fly-Half: `(passing*0.25) + (kicking*0.25) + (tacticalAwareness*0.25) + (goalKicking*0.15) + (speed*0.10)`
4. **Front-Row Cover Validation**: Pre-match and substitution engines strictly verify that Jerseys 1, 2, 3 have certified front-row cover on the bench (16, 17, 18).
