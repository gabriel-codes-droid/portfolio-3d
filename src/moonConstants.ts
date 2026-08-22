// Single source of truth for the moon's world position and radius. Both
// App.tsx (mannequin seat-position math) and MoonModel.tsx (visual scaling)
// import from here \u2014 previously each hardcoded its own separate guess with
// no connection to the other, so the seat position could land in empty
// space next to a moon rendering at a completely different actual size.
export const MOON_CENTER: [number, number, number] = [0, -5, 0];
export const MOON_RADIUS = 8; // significantly enlarged for better visibility
