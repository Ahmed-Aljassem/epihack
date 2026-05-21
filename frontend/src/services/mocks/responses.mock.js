/*
Mock implementation of the responses service.
*/

const wait = (ms = 140) => new Promise((r) => setTimeout(r, ms));

const MINE = [
  {
    id: "RSP-9001",
    survey_id: "SVY-402",
    survey_title: "Standing water reports",
    submitted_at: "2026-05-20T14:18:00Z",
    answers: [
      { question_id: "q1", value: "85705" },
      { question_id: "q2", value: 3 },
      { question_id: "q3", value: "container" },
    ],
  },
  {
    id: "RSP-9002",
    survey_id: "SVY-403",
    survey_title: "Heat illness self-check",
    submitted_at: "2026-05-19T08:42:00Z",
    answers: [
      { question_id: "q1", value: ["headache", "nausea"] },
      { question_id: "q2", value: "no" },
    ],
  },
  {
    id: "RSP-9003",
    survey_id: "SVY-401",
    survey_title: "Rabies surveillance — coyote sightings",
    submitted_at: "2026-05-15T17:02:00Z",
    answers: [
      { question_id: "q1", value: "Pasture south of 85719" },
      { question_id: "q2", value: "no" },
      { question_id: "q3", value: 1 },
    ],
  },
];

export async function submit() {
  await wait(180);
  return { ok: true };
}

export async function forSurvey() {
  await wait();
  return [];
}

export async function mine() {
  await wait();
  return [...MINE];
}
