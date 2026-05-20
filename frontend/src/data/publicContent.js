/*
Content + option lists for the public-facing One Health flow.
*/

export const PUBLIC_ALERTS = [
  {
    id: "heat",
    label: "Heat advisory",
    title: "Thru Fri",
    copy: "Temperatures will stay elevated this week across Tucson and surrounding areas.",
  },
  {
    id: "mosquito",
    label: "More mosquitoes than usual",
    title: "NW Pima",
    copy: "Standing-water reports and mosquito activity are trending upward nearby.",
  },
  {
    id: "animal",
    label: "3 animal reports nearby",
    title: "7d",
    copy: "Recent reports mention lethargic wildlife and unusual pasture behavior.",
  },
];

export const FEELING_OPTIONS = [
  { id: "good", label: "Feeling Good", icon: "smile" },
  { id: "sick", label: "Feeling Sick", icon: "thermometer" },
];

export const REPORT_CATEGORIES = [
  {
    id: "people",
    label: "Human health",
    description: "Symptoms · bite · heat",
    icon: "user",
  },
  {
    id: "animals",
    label: "Animal or wildlife",
    description: "Sick / dead / bit someone",
    icon: "paw",
  },
  {
    id: "environment",
    label: "Environment",
    description: "Water · smoke · air",
    icon: "leaf",
  },
  {
    id: "vector",
    label: "Mosquitoes or pests",
    description: "Vector activity",
    icon: "bug",
  },
  {
    id: "hazard",
    label: "Hazard",
    description: "Smoke · spill · fire",
    icon: "flame",
  },
  {
    id: "unsure",
    label: "Not sure",
    description: "We'll guide you",
    icon: "help",
  },
];

/*
Symptom / signal option lists per category — sourced from the U of A
"Minimum Set of Key Data Parameters" poster (One Health surveillance).
*/
export const SYMPTOM_OPTIONS = {
  people: [
    { id: "none",          label: "No symptoms",                    icon: "circle" },
    { id: "cough",         label: "Cough or congestion",            icon: "bug" },
    { id: "nausea",        label: "Nausea or vomiting",             icon: "droplet" },
    { id: "breathing",     label: "Difficulty breathing",           icon: "wind" },
    { id: "sore-throat",   label: "Sore throat",                    icon: "mic-off" },
    { id: "rash",          label: "Rash",                           icon: "scan" },
    { id: "fever",         label: "Fever",                          icon: "thermometer" },
    { id: "chills",        label: "Chills",                         icon: "snowflake" },
    { id: "diarrhea",      label: "Diarrhea",                       icon: "droplet" },
    { id: "bleeding",      label: "Bleeding from body openings",    icon: "alert" },
    { id: "red-eyes",      label: "Red eyes",                       icon: "eye" },
    { id: "body-aches",    label: "Muscle or body aches and pains", icon: "activity" },
    { id: "urine",         label: "Discolored or bloody urine",     icon: "flask" },
    { id: "smell-taste",   label: "Loss of smell or taste",         icon: "wifi" },
    { id: "jaundice",      label: "Yellow skin or yellow eyes",     icon: "sun" },
    { id: "absent-work",   label: "Absent from work",               icon: "briefcase" },
    { id: "absent-school", label: "Absent from school",             icon: "graduation" },
    { id: "sought-care",   label: "Sought health care or treatment", icon: "stethoscope" },
    { id: "other",         label: "Other",                          icon: "plus" },
  ],
  animals: [
    { id: "sick-injured",     label: "Sick or injured",        icon: "bug" },
    { id: "dead-animal",      label: "Dead animal",            icon: "alert" },
    { id: "acting-strange",   label: "Acting strange",         icon: "wifi" },
    { id: "bit-someone",      label: "Bit or scratched someone", icon: "scan" },
    { id: "wildlife",         label: "Wildlife incident",      icon: "paw" },
    { id: "livestock",        label: "Livestock concern",      icon: "users" },
    { id: "other",            label: "Other",                  icon: "plus" },
  ],
  environment: [
    { id: "flooding",         label: "Flooding",                 icon: "droplet" },
    { id: "water-contam",     label: "Water contamination",      icon: "flask" },
    { id: "smoke-smell",      label: "Smoke or unusual smell",   icon: "wind" },
    { id: "heat-air",         label: "Heat or air quality",      icon: "sun" },
    { id: "spill",            label: "Spill or runoff",          icon: "droplet" },
    { id: "other",            label: "Other",                    icon: "plus" },
  ],
  vector: [
    { id: "mosquitoes",       label: "More mosquitoes than usual", icon: "bug" },
    { id: "ticks",            label: "Ticks or fleas",             icon: "bug" },
    { id: "rodents",          label: "Rodent activity",            icon: "paw" },
    { id: "standing-water",   label: "Standing water nearby",      icon: "droplet" },
    { id: "bitten",           label: "Bitten recently",            icon: "scan" },
    { id: "other",            label: "Other",                      icon: "plus" },
  ],
  hazard: [
    { id: "smoke-fire",       label: "Smoke or fire",            icon: "wind" },
    { id: "chem-spill",       label: "Chemical spill",           icon: "flask" },
    { id: "gas-leak",         label: "Gas or fuel smell",        icon: "wind" },
    { id: "downed-line",      label: "Downed power line",        icon: "alert" },
    { id: "extreme-heat",     label: "Extreme heat exposure",    icon: "sun" },
    { id: "other",            label: "Other",                    icon: "plus" },
  ],
  unsure: [
    { id: "people-thing",     label: "Something about people",    icon: "users" },
    { id: "animal-thing",     label: "Something about animals",   icon: "paw" },
    { id: "place-thing",      label: "Something about a place",   icon: "map-pin" },
    { id: "describe",         label: "I'll describe it in a note", icon: "plus" },
  ],
};

export const DEMO_REPORT_REFERENCE = "RPT-1024";
