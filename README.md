# EpiHack Arizona

**Where tech meets One Health.**  

May 18–22, 2026 · Health Sciences Innovation Building, University of Arizona, Tucson AZ.  
Hosted by the [Ending Pandemics Academy](https://endingpandemicsacademy.arizona.edu/).

This repository is the shared home for code, prototypes, and supporting materials produced during EpiHack Arizona.

---

## About the event

EpiHack is not a conference. It is a five-day, hands-on sprint where technologists and One Health experts sit at the same table and build working prototypes for real public health problems. The format was created by the Ending Pandemics Academy and has been run in multiple countries over the past decade.

The Arizona edition focuses on a tool that communities across the state can use to report health events as they happen, and to receive back timely information that helps prevent illness and slow the spread of infection.

The work is grounded in the **One Health** framework: human, animal, and environmental health are connected, and the earliest signals of an outbreak often show up at those intersections — unusual animal mortality, environmental stressors, human symptoms clustering in unexpected ways. Participatory surveillance puts communities at the front line of detection.

## Who is in the room

Two groups, working side by side:

- **Technologists** — software developers (full-stack, frontend, backend, mobile), AI/ML engineers, LLM practitioners (fine-tuning, prompt engineering, RAG), UX and product designers, and people with experience building digital health platforms. No prior public health background required.
- **One Health experts** (by invitation) — epidemiologists, veterinarians, environmental health scientists, health communicators, and field practitioners who bring the domain knowledge and the community trust that keep the prototypes realistic.

## The five days

| Day | Date | Focus |
|-----|------|-------|
| 1 | May 18 | Kickoff, team formation, challenge briefs, problem framing |
| 2 | May 19 | Discovery, user needs, data landscape, wireframes |
| 3 | May 20 | Build sprint, prototype development, mentor office hours |
| 4 | May 21 | Iteration, community feedback, demo prep |
| 5 | May 22 | Demo day, presentations, judging panel, pathways to implementation |

## Repository structure

Each team should add their work under `/projects/` with a short, descriptive folder name:
projects/
team-name-or-project-slug/
README.md       # what it does, who built it, how to run it
src/            # source code
docs/           # supporting docs, diagrams, slides
data/           # only public, non-sensitive sample data

Please do **not** commit private health data, identifiable data, or API credentials. Use `.env` files locally and keep them out of the repo (see `.gitignore`).

## License

All code and materials added to this repository during EpiHack Arizona are released under the **Creative Commons Attribution–NonCommercial 4.0 International License (CC BY-NC 4.0)**.

You are free to share and adapt the work, as long as you give appropriate credit and do not use the material for commercial purposes. See [LICENSE](./LICENSE) for the full text, or the human-readable summary at https://creativecommons.org/licenses/by-nc/4.0/.

> Note for contributors: CC BY-NC is more common for creative works than for software. The choice here reflects the spirit of EpiHack — outputs are meant to serve communities and public health, not to be commercialized. If a team wants to extend a prototype after the event under a different license, please open an issue first so we can discuss.

## Contact

Event info: https://endingpandemicsacademy.arizona.edu/trainings-events/epihack-arizona  
For repository questions, open an issue.
