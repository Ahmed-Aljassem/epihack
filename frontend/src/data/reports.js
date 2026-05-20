export const REPORTS = [
  {
    id: "RPT-1024",
    category: "Animal",
    subcategory: "sick",
    summary: "Coyote, unsteady in pasture",
    location: { zip: "85719", county: "Pima Co.", coords: "32.286, -110.987" },
    submitted: "Today · 2:14 PM",
    submittedShort: "2:14 PM",
    tags: ["Animal · sick", "Anonymous", "Opted-in SMS"],
    description:
      "A coyote in our pasture, acting unsteady. Stayed close for ~20 minutes. Two horses in the same field but no contact. No people approached.",
    facts: {
      signs: "Unsteady · lethargic",
      affected: "1 animal",
      danger: "No (livestock nearby)",
      observed: "Today · 2:14 PM",
      reporter: "Anonymous · SMS",
      photo: "1 attached",
    },
    photo: { name: "coyote.jpg", size: "2.1 MB" },
    routing: {
      title: "Auto-routed",
      rule: "Rule matched",
      destination: "AZ Game & Fish · Rabies surveillance · Pima Animal Care & Control",
    },
    activity: [
      {
        kind: "check",
        title: "Submitted via public web",
        meta: "Category Animal · sick · keywords: unsteady, pasture",
        time: "2:14 PM",
      },
      {
        kind: "routed",
        title: "Routed to AZGF",
        meta: "Rule: animal × unsteady × rural ZIP",
        time: "2:14 PM",
      },
      {
        kind: "note",
        title: "Note · L. Romero",
        meta: "Calling reporter to confirm photo metadata.",
        time: "2:21 PM",
      },
    ],
    status: "New",
  },
  {
    id: "RPT-1023",
    category: "People",
    summary: "Fever cluster · 3 households",
    location: { zip: "85735", county: "Pima Co.", coords: "—" },
    submitted: "Today · 1:48 PM",
    submittedShort: "1:48 PM",
    status: "In review",
  },
  {
    id: "RPT-1022",
    category: "Vector",
    summary: "Mosquito activity ↑",
    location: { zip: "85705", county: "Pima Co.", coords: "—" },
    submitted: "Today · 12:31 PM",
    submittedShort: "12:31 PM",
    status: "Routed",
  },
];

export const getReport = (id) => REPORTS.find((r) => r.id === id) || REPORTS[0];
