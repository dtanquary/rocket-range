# Flight model and evidence

The user prioritizes realism and desktop mouse/keyboard interaction. Preparation is interactive; pressing Launch takes a deep, frozen copy of the airframe, engine, and field configuration and locks the setup. A uniformly sampled 0.25–1 second igniter delay follows, then motor audio and automatic flight start. The physical flight clock starts at ignition, not the button press. Camera/sound/display state is never supplied to the integrator. There is no throttle, steering, pause, speed multiplier, or mid-flight reset.

## What is modeled

| Element | Implementation | Limit |
| --- | --- | --- |
| Motor compatibility | Airframe engine list plus independent mount diameter and usable length | Catalog choices are a subset of manufacturer recommendations; scale fleet mounts are virtual |
| Thrust | Piecewise-linear samples from ThrustCurve, integrated exactly over each step | Representative measurements/transcriptions; individual motors vary |
| Propellant depletion | Fraction of integrated total impulse | Assumes constant effective exhaust velocity; delay charge mass loss omitted |
| Mass and CG | Dry airframe, aft motor, optional nose ballast | Finished-kit dry CG and inertia are estimated |
| CP and stability | Nose and trapezoidal-fin small-angle Barrowman approximation; `(CP-CG)/diameter` | Body transitions, canards, interference details, compressibility, and aeroelasticity are omitted |
| Attitude | Passive pitch/yaw torque from aerodynamic force at CP, rotational damping, and recovery load at the nose | Roll is omitted; damping and inertia estimates are approximate |
| Launch rod | Constrained travel along the configured rod, then free flight; exit speed recorded | Straight rigid rod, with no whip or lug friction; travel subtracts estimated lug location |
| Wind | Meteorological FROM bearing, power-law height profile, deterministic multi-frequency gusts | Simplified turbulence; no terrain flow or live weather |
| Recovery | Nominal delay after curve burnout, canopy inflation, air-relative parachute drag, load-based canopy failure | Inflation duration, drag coefficient, and tensile capacity are estimated |
| Touchdown | Ground crossing ends flight and records impact speed | Flat usable field; scenery collisions and structural damage are not modeled |

SI units are used internally. CG/CP distances are measured aft from the nose. World +X is east and -Z is north. Wind direction specifies where wind comes from; rod bearing specifies where the rod leans toward. A 120 Hz timestep and elapsed-time accumulator keep frame rate from changing the physics clock.

The ground-level atmosphere uses a nominal density of 1.195 kg/m³ and an 8,500 m exponential scale height. Wind speed is referenced to 10 m height, with a 0.14 exponent and a 1 m lower cutoff. Gust amplitudes are user-selected and deterministic for reproducibility. These constants are approximation choices, not a weather report for a real site.

Nose ballast is placed at 12% of airframe length from the tip. The dry CG fractions in the catalog are explicitly estimated. A positive static margin indicates restoring behavior in this small-angle model; margin alone is not a complete assessment of a real rocket. Long slender rockets can show large margins because body-lift corrections are omitted.

Canopy drag area inflates linearly over 0.7 s with a drag coefficient of 0.78. The illustrative overload threshold is 28 times dry-airframe weight; a failed canopy retains 12% of its modeled drag area. These are game material assumptions, not measured Estes cord or parachute ratings. Outcomes distinguish recovered flights, hard landings, impact before ejection, and failure to leave the pad. A total impact speed above 8 m/s is labeled a hard landing. No result is forced to succeed.

## Thrust sources

The numerical samples and factual dimensions/masses are stored in `lib/rocket/motor-data.json`, retrieved through the [ThrustCurve API](https://www.thrustcurve.org/info/api.html) on 2026-09-12. Source URLs identify the exact sample file for each motor. Source classification comes from the API: A8/B6/C6/E12/E16/F15 are marked certification-source; C11/D12 are contributed simulation data. The app retains those distinctions and does not describe a contributed file as raw certification measurements.

Impulse is the area under the selected sampled curve. It is not rescaled to fill its advertised letter class or to match a different reported test average. Burnout is the curve's final zero-thrust sample. Nominal labeled delays are used; measured delay variation is not simulated. Motor masses are the source's representative motor-family values, not separately measured masses for each delay variant.

[ThrustCurve's contribution guide](https://www.thrustcurve.org/info/contribute.html) explains the distinction between certification, manufacturer, and user-created files, and the limits of representative curves. [NAR Standards and Testing](https://www.nar.org/StandardsandTesting) describes motor test data and certification.

## Aerodynamic references

- [NASA: Conditions for Rocket Stability](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/conditions-for-rocket-stability/) describes the CP/CG relationship and how fins/nose weight affect stability.
- [OpenRocket technical documentation](https://openrocket.info/documentation.html) explains the broader Barrowman approach and full flight-simulation context. This project implements its own limited nose/fin approximation; it does not embed or claim equivalence to OpenRocket.

## Verification

`npm test` verifies all catalog pairs, rod constraints and exit speed, mass/CG movement, restoring versus destabilizing torque, wind direction symmetry, repeatable gusts, early/late ejection consequences, immutable launch inputs, and finite results at selectable environment/ballast limits. Source/TypeScript/build checks supplement these numerical tests. Browser rendering and playthrough validation still require a connected browser.

Audio checks verify finite/unclipped motor signals, burnout duration, thrust-envelope response, and reduced low-frequency energy. Camera checks verify steady Follow orientation under changing descent velocity, recovery framing for the fleet, and Onboard transforms under translation and rotation. These checks do not substitute for listening or visual browser review. Spatial audio uses Web Audio's [PannerNode](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode) and [AudioListener](https://developer.mozilla.org/en-US/docs/Web/API/AudioListener); distance attenuation and filtering are presentation choices, not a sound-pressure prediction.
