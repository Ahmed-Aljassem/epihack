/*
Mock implementation of the surveys service.
*/

const wait = (ms = 140) => new Promise((r) => setTimeout(r, ms));

const SEED = [
  {
    id: "SVY-401",
    title: "Rabies surveillance — coyote sightings",
    description:
      "Help AZ Game & Fish track unusual coyote behavior across Pima and Pinal counties.",
    category: "animal",
    tags: ["AZGF", "rabies"],
    response_count: 12,
    status: "active",
    questions: [
      { id: "q1", text: "Where did you observe the animal?", type: "text", required: true },
      { id: "q2", text: "Did it approach humans or livestock?", type: "boolean", required: true },
      { id: "q3", text: "Estimated number of animals seen", type: "scale", min_value: 1, max_value: 10, required: false },
    ],
  },
  {
    id: "SVY-402",
    title: "Standing water reports",
    description:
      "Coordinated with Vector Control. Where are you seeing pooled water after rain?",
    category: "vector",
    tags: ["mosquitoes", "vector-control"],
    response_count: 47,
    status: "active",
    questions: [
      { id: "q1", text: "Nearest ZIP", type: "text", required: true },
      { id: "q2", text: "Days standing", type: "scale", min_value: 1, max_value: 14, required: false },
      { id: "q3", text: "Container or open ground?", type: "single_choice", options: [
        { value: "container", label: "Container" },
        { value: "ground",    label: "Open ground" },
      ], required: true },
    ],
  },
  {
    id: "SVY-403",
    title: "Heat illness self-check",
    description:
      "A short check-in during the heat advisory week. Anonymous.",
    category: "human",
    tags: ["heat", "self-report"],
    response_count: 184,
    status: "active",
    questions: [
      { id: "q1", text: "Any symptoms today?", type: "multi_choice", options: [
        { value: "headache",     label: "Headache" },
        { value: "dizziness",    label: "Dizziness" },
        { value: "nausea",       label: "Nausea" },
        { value: "no-symptoms",  label: "No symptoms" },
      ], required: true },
      { id: "q2", text: "Did you seek care?", type: "boolean", required: false },
    ],
  },
  {
    id: "SVY-404",
    title: "Air quality concerns — wildfire smoke",
    description:
      "Seasonal smoke-report intake for ADEQ. Only active during AQI advisories.",
    category: "environment",
    tags: ["ADEQ", "smoke"],
    response_count: 6,
    status: "paused",
    questions: [
      { id: "q1", text: "When did the smoke start?", type: "date", required: true },
      { id: "q2", text: "Visible smoke level", type: "single_choice", options: [
        { value: "low",      label: "Light haze" },
        { value: "moderate", label: "Visible plume" },
        { value: "heavy",    label: "Heavy / restricts visibility" },
      ], required: true },
    ],
  },
];

export async function list(params = {}) {
  await wait();
  let data = [...SEED];
  if (params?.category) data = data.filter((s) => s.category === params.category);
  return data;
}

export async function get(id) {
  await wait();
  return SEED.find((s) => s.id === id) || null;
}

export async function create() {
  throw new Error("Survey creation not yet implemented in mock.");
}

export async function updateStatus(id, status) {
  await wait(80);
  const target = SEED.find((s) => s.id === id);
  if (target) target.status = status;
  return target;
}

export async function _delete(id) {
  await wait(80);
  const i = SEED.findIndex((s) => s.id === id);
  if (i >= 0) SEED.splice(i, 1);
  return true;
}
export { _delete as delete };
