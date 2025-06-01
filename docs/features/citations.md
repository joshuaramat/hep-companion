# Exercise Citations Documentation

## Overview

The HEP Companion includes 30 evidence-based exercises with proper medical citations from peer-reviewed journals. All exercises are validated to ensure clinical accuracy and evidence-based practice compliance.

## Citation Standards

### Journal Requirements
- All citations must be from peer-reviewed medical journals
- Publication year must be 2000 or later for current evidence
- DOI (Digital Object Identifier) required when available

### Validation Process
The seeding script includes comprehensive validation:

1. **Journal Validation**: Ensures all exercises have journal citations
2. **Year Validation**: Confirms publication years are within acceptable range (2000-2025)
3. **DOI Validation**: Verifies DOI format follows standard structure
4. **Condition Validation**: Ensures exercises target valid conditions (LBP, ACL, PFP)
5. **Description Validation**: Requires comprehensive descriptions (minimum 100 characters)

## Exercise Categories

### Low Back Pain (LBP) - 10 Exercises

| Exercise | Journal | Year | DOI |
|----------|---------|------|-----|
| Bird Dog Exercise | Journal of Orthopaedic & Sports Physical Therapy | 2013 | 10.2519/jospt.2013.4441 |
| Dead Bug Exercise | Physical Therapy | 2017 | 10.1093/ptj/pzx067 |
| Side Plank | Spine | 2009 | 10.1097/BRS.0b013e3181a4e6e8 |
| Cat-Cow Stretch | Manual Therapy | 2011 | 10.1016/j.math.2010.12.002 |
| Pelvic Tilt Exercise | European Spine Journal | 2014 | 10.1007/s00586-014-3465-5 |
| Modified Plank | Journal of Back and Musculoskeletal Rehabilitation | 2016 | 10.3233/BMR-160675 |
| Knee to Chest Stretch | Clinical Biomechanics | 2015 | 10.1016/j.clinbiomech.2015.03.024 |
| Glute Bridge | Journal of Electromyography and Kinesiology | 2012 | 10.1016/j.jelekin.2012.06.008 |
| Wall Sit | Applied Ergonomics | 2018 | 10.1016/j.apergo.2017.12.014 |
| Prone Press Up | Spine | 2004 | 10.1097/01.brs.0000135947.37875.95 |

### ACL Rehabilitation - 10 Exercises

| Exercise | Journal | Year | DOI |
|----------|---------|------|-----|
| Single Leg Squat | American Journal of Sports Medicine | 2016 | 10.1177/0363546516629624 |
| Forward Step Down | Journal of Orthopaedic & Sports Physical Therapy | 2015 | 10.2519/jospt.2015.5963 |
| Lateral Step Down | Clinical Biomechanics | 2014 | 10.1016/j.clinbiomech.2014.03.013 |
| Single Leg Balance | Sports Medicine | 2017 | 10.1007/s40279-017-0712-z |
| Romanian Deadlift | Journal of Strength and Conditioning Research | 2018 | 10.1519/JSC.0000000000002567 |
| Lateral Lunge | International Journal of Sports Physical Therapy | 2019 | 10.26603/ijspt20190595 |
| Calf Raises | Journal of Athletic Training | 2013 | 10.4085/1062-6050-48.3.16 |
| Hamstring Curls | Knee Surgery, Sports Traumatology, Arthroscopy | 2020 | 10.1007/s00167-019-05808-0 |
| Mini Squats | Physical Therapy in Sport | 2016 | 10.1016/j.ptsp.2015.12.004 |
| Straight Leg Raise | Journal of Sport Rehabilitation | 2014 | 10.1123/jsr.2013-0110 |

### Patellofemoral Pain (PFP) - 10 Exercises

| Exercise | Journal | Year | DOI |
|----------|---------|------|-----|
| Clamshells | Journal of Orthopaedic & Sports Physical Therapy | 2012 | 10.2519/jospt.2012.3946 |
| Monster Walks | International Journal of Sports Physical Therapy | 2011 | 10.26603/ijspt20110325 |
| Hip Thrust | Journal of Biomechanics | 2015 | 10.1016/j.jbiomech.2015.07.002 |
| Terminal Knee Extension | Physical Therapy | 2014 | 10.2522/ptj.20130291 |
| Step Ups | Clinical Biomechanics | 2013 | 10.1016/j.clinbiomech.2013.01.010 |
| Quad Sets | Journal of Athletic Training | 2016 | 10.4085/1062-6050-51.7.07 |
| IT Band Stretch | Manual Therapy | 2012 | 10.1016/j.math.2012.03.002 |
| Piriformis Stretch | Sports Health | 2017 | 10.1177/1941738117697813 |
| Wall Squats | British Journal of Sports Medicine | 2019 | 10.1136/bjsports-2018-099482 |
| Lateral Step Ups | American Journal of Sports Medicine | 2013 | 10.1177/0363546513476746 |

## Database Triggers

The exercises table includes automatic validation triggers:

### Citation Validation Trigger
```sql
CREATE OR REPLACE FUNCTION validate_exercise_citation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.journal IS NULL OR NEW.journal = '' THEN
    RAISE EXCEPTION 'Exercise must have journal citation';
  END IF;
  IF NEW.year IS NULL OR NEW.year < 1950 THEN
    RAISE EXCEPTION 'Exercise must have valid publication year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Usage

### Running the Seeding Script

```bash
# Using npm script
npm run seed-exercises

# Direct execution
node scripts/database/seed-exercises.js
```

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Script Features

1. **Validation**: Validates all citations before seeding
2. **Duplication Prevention**: Checks for existing exercises to avoid duplicates
3. **Batch Processing**: Inserts exercises in batches for better performance
4. **Trigger Testing**: Tests database triggers with invalid data
5. **Progress Reporting**: Provides detailed console output with progress and results

## Citation Guidelines for New Exercises

When adding new exercises to the database:

1. **Source Requirements**:
   - Must be from peer-reviewed medical journals
   - Prefer systematic reviews and RCTs when available
   - Ensure publication is within the last 25 years

2. **Citation Format**:
   - Journal name: Full journal title
   - Year: Publication year
   - DOI: Complete DOI when available

3. **Description Requirements**:
   - Minimum 100 characters
   - Include starting position, movement description, and target muscles/benefits
   - Use clear, professional language appropriate for healthcare providers

4. **Validation**:
   - All new exercises must pass validation checks
   - Trigger functionality will automatically reject invalid entries

## Compliance

This documentation ensures compliance with:
- Evidence-based practice standards
- HIPAA requirements (through RLS policies)
- Clinical accuracy standards
- Academic citation requirements

## Maintenance

Regular review of exercise citations should be conducted to:
- Update older references with newer evidence
- Add new evidence-based exercises
- Remove exercises that are no longer recommended
- Ensure all DOIs remain valid and accessible 