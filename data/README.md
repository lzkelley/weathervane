# NOAA Integrated Surface Database (ISD)

## General

- Quality Code
    * 0 = Passed gross limits check
    * 1 = Passed all quality control checks
    * 2 = Suspect
    * 3 = Erroneous
    * 4 = Passed gross limits check, data originate from an NCEI data source
    * 5 = Passed all quality control checks, data originate from an NCEI data source
    * 6 = Suspect, data originate from an NCEI data source
    * 7 = Erroneous, data originate from an NCEI data source
    * 9 = Passed gross limits check if element is present

    * A = Data value flagged as suspect, but accepted as a good value
    * C = Temperature and dew point received from Automated Weather Observing System (AWOS) are reported in whole degrees Celsius. Automated QC flags these values, but they are accepted as valid.
    * I = Data value not originally in data, but inserted by validator
    * M = Manual changes made to value based on information provided by NWS or FAA
    * P = Data value not originally flagged as suspect, but replaced by validator
    * R = Data value replaced with value computed by NCEI software
    * U = Data value replaced with edited value

## Parameters

### Mandatory Data

- `WND` : 'WIND-OBSERVATION' : Wind observation
    Example: `260,5,N,0072,5`   (invalid: `999,9,9,9999,9`)
    0:3 = direction angle in degrees, clockwise from north
    4 = direction quality code
    6 = type code [meaning unclear]
    8:12 = speed (meters per second * 10)
    14 = speed quality code

- `CIG` : 'SKY-CONDITION-OBESERVATION' : ceiling height of lowest dominantly-obscuring (>5/8) layer

- `VIS` : 'VISIBILITY-OBSERVATION' : visibility distance

- `TMP` : AIR-TEMPERATURE-OBSERVATION air temperature
    Example: `-0033,5`  (invalid: +9999,9)
    0:5 = temperature (celsius * 10)
    7 = temperature quality code

- `DEW` : AIR-TEMPERATURE-OBSERVATION dew point temperature

- `SLP` : ATMOSPHERIC-PRESSURE-OBSERVATION sea level pressure

### Additional Data

- `AA#` (1-4) : LIQUID-PRECIPITATION occurrence identifier
    Length: 12
    Example: `01,0000,9,5`
    0:2 = duration of measurement (hours)  [99=missing]
    3:7 = depth measure (millimeters * 10)
    8 = condition code  [complicated]   [9=missing]
    10 = quality code

- `AJ1` : SNOW-DEPTH : on the ground

- `AL#` (1-4) : SNOW-ACCUMULATION

- `AO#` (1-4) : LIQUID-PRECIPITATION : *unclear difference with `AA#`*

- `AT#` (1-8) : PRESENT-WEATHER-OBSERVATION automated occurrence identifier for ASOS/AWOS data
    NOTE: Daily observation!

- `AU#` (1-9) : PRESENT-WEATHER-OBSERVATION
    Length: 14
    Example: `1,0,02,0,0,1,5`
    0 = intensity code
        0 = Not Reported
        1 = Light (-)
        2 = Moderate or Not Reported (no entry in original observation)
        3 = Heavy (+)
        4 = Vicinity (VC)
        9 = Missing
    2 = descriptor code
        0 = No Descriptor
        1 = Shallow (MI)
        2 = Partial (PR)
        3 = Patches (BC)
        4 = Low Drifting (DR) 5 = Blowing (BL)
        6 = Shower(s) (SH)
        7 = Thunderstorm (TS) 8 = Freezing (FZ)
        9 = Missing
    4:6 = precipitation code
        00 = No Precipitation
        01 = Drizzle (DZ)
        02 = Rain (RA)
        03 = Snow (SN)
        04 = Snow Grains (SG)
        05 = Ice Crystals (IC)
        06 = Ice Pellets (PL)
        07 = Hail (GR)
        08 = Small Hail and/or Snow Pellets (GS)
        09 = Unknown Precipitation (UP)
        99 = Missing
    7 = present weather obscuration code
        0 = No Obscuration
        1 = Mist (BR)
        2 = Fog (FG)
        3 = Smoke (FU)
        4 = Volcanic Ash (VA)
        5 = Widespread Dust (DU)
        6 = Sand (SA)
        7 = Haze (HZ)
        8 = Spray (PY)
        9 = Missing
    9 = other weather code
        0 = None Reported
        1 = Well-Developed Dust/Sand Whirls (PO)
        2 = Squalls (SQ)
        3 = Funnel Cloud, Tornado, Waterspout (FC)
        4 = Sandstorm (SS)
        5 = Duststorm (DS)
        9 = Missing
    11 = combination indicator
        -
    13 = quality code

- `AW#` (1-4) : PRESENT-WEATHER-OBSERVATION automated occurrence

- `AX#` (1-6) : PAST-WEATHER-OBSERVATION summary of day occurrence

- `AY#` (1-2) : PAST-WEATHER-OBSERVATION manual occurrence

- `AZ#` (1-2) : PAST-WEATHER-OBSERVATION automated occurrence

### Climate Reference Network Unique Data

### Cloud and Solar Data

- `GA#` (1-6) : SKY-COVER-LAYER
    Length: 18
    Example: `08,1,+00600,9,05,9`  (partial: `00,1,+99999,9,99,9`)
    0:2 = coverage code
        00 = None, SKC or CLR
        01 = One okta - 1/10 or less but not zero
        02 = Two oktas - 2/10 - 3/10, or FEW
        03 = Three oktas - 4/10
        04 = Four oktas - 5/10, or SCT
        05 = Five oktas - 6/10
        06 = Six oktas - 7/10 - 8/10
        07 = Seven oktas - 9/10 or more but not 10/10, or BKN 08 = Eight oktas - 10/10, or OVC
        09 = Sky obscured, or cloud amount cannot be estimated 10 = Partial obscuration
        99 = Missing
    3 = quality code
    5:11 = base height (meters)
    12 = base height quality code
    14:16 = cloud type code
        00 = Cirrus (Ci)
        01 = Cirrocumulus (Cc)
        02 = Cirrostratus (Cs)
        03 = Altocumulus (Ac)
        04 = Altostratus (As)
        05 = Nimbostratus (Ns)
        06 = Stratocumulus (Sc)
        07 = Stratus (St)
        08 = Cumulus (Cu)
        09 = Cumulonimbus (Cb)
        10 = Cloud not visible owing to darkness, fog, duststorm, sandstorm, or other analogous phenonomena/sky obcured
        11 = Not used
        12 = Towering Cumulus (Tcu)
        13 = Stratus fractus (Stfra)
        14 = Stratocumulus Lenticular (Scsl)
        15 = Cumulus Fractus (Cufra)
        16 = Cumulonimbus Mammatus (Cbmam)
        17 = Altocumulus Lenticular (Acsl)
        18 = Altocumulus Castellanus (Accas)
        19 = Altocumulus Mammatus (Acmam)
        20 = Cirrocumulus Lenticular (Ccsl)
        21 = Cirrus and/or Cirrocumulus
        22 = jenkins-content-114Stratus and/or Fracto-stratus
        23 = Cumulus and/or Fracto-cumulus
        99 = Missing
    17 = cloud type quality code

- `GD#` (1-6) : SKY-COVER-SUMMATION-STATE
    Length: 17
    Example: `2,01,5,+01800,1,9`   (partial: `4,00,5,+99999,9,9`)
    0 = coverage code #1
        0 = Clear - No coverage
        1 = FEW - 2/8 or less coverage (not including zero)
        2 = SCATTERED - 3/8-4/8 coverage
        3 = BROKEN - 5/8-7/8 coverage
        4 = OVERCAST - 8/8 coverage
        5 = OBSCURED
        6 = PARTIALLY OBSCURED
        9 = MISSING
    2:4 = coverage code #2
        00 = None, SKC or CLR
        01 = One okta - 1/10 or less but not zero
        02 = Two oktas - 2/10 - 3/10, or FEW
        03 = Three oktas - 4/10
        04 = Four oktas - 5/10, or SCT
        05 = Five oktas - 6/10
        06 = Six oktas - 7/10 - 8/10
        07 = Seven oktas - 9/10 or more but not 10/10, or BKN
        08 = Eight oktas - 10/10, or OVC
        09 = Sky obscured, or cloud amount cannot be estimated
        10 = Partial Obscuration
        11 = Thin Scattered
        12 = Scattered
        13 = Dark Scattered
        14 = Thin Broken
        15 = Broken
        16 = Dark Broken
        17 = Thin Overcast
        18 = Overcast
        19 = Dark overcast
        99 = Missing
    5 = coverage quality code [0-9]
    7:13 = height (meters)
    14 = height quality code [0-9]
    16 = characteristic code
        1 = Variable height
        2 = Variable amount
        3 = Thin clouds
        4 = Dark layer (reported in data prior to 1950)
        9 = Missing
