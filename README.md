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

## How to contribute

The repo is public, so **you do not need an invitation**. Anyone with a GitHub account can contribute by forking the repo and opening a Pull Request. If you are new to this flow, the steps below walk through it from start to finish.

### One-time setup

1. Create a GitHub account if you do not have one: https://github.com/signup
2. Install Git on your machine: https://git-scm.com/downloads
3. Tell Git who you are (only needed once per machine):
```bash
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
```

### The flow, step by step

**1. Fork the repo.**  
Go to https://github.com/Ending-Pandemics/Epihack and click the **Fork** button (top right). This creates your own copy of the repo under your account.

**2. Clone your fork to your machine.**  
Replace `YOUR-USERNAME` with your GitHub username:
```bash
git clone https://github.com/YOUR-USERNAME/Epihack.git
cd Epihack
```

**3. Create a folder for your team's project.**  
Pick a short, descriptive slug. No spaces, lowercase, hyphens are fine:
```bash
mkdir -p projects/your-team-slug
cd projects/your-team-slug
```

Add at least a `README.md` describing what your project does, who is on the team, and how to run it.

**4. Create a branch for your work.**  
Do not work directly on `main`. Branch names should be short and descriptive:
```bash
git checkout -b add-your-team-slug
```

**5. Commit as you go.**  
Small, frequent commits are better than one giant one:
```bash
git add .
git commit -m "Initial project scaffold for your-team-slug"
```

**6. Push your branch to your fork.**
```bash
git push origin add-your-team-slug
```

**7. Open a Pull Request.**  
Go to your fork on GitHub. You will see a banner asking if you want to open a Pull Request — click it. Set the base repo to `Ending-Pandemics/Epihack`, base branch to `main`, and your branch as the source. Write a short description: team name, what the project does, what stage it is in. Submit.

Organizers will review and merge your PR. You can keep pushing more commits to the same branch and they will appear in the same PR automatically — no need to open a new one.

### Keeping your fork up to date

If the main repo gets updated during the week (for example, organizers add a new template), sync your fork:
```bash
git remote add upstream https://github.com/Ending-Pandemics/Epihack.git
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Important rules

- **Do not commit secrets.** No API keys, passwords, tokens, private health data, or identifiable information. Use `.env` files locally and rely on the `.gitignore` to keep them out.
- **Stay inside your team's folder.** Do not modify other teams' projects or files at the root unless you are coordinating with organizers.
- **Use clear commit messages.** "Fix bug" is not helpful. "Fix date parsing in symptom report form" is.
- **Open one PR per team**, not one per person. Add teammates as co-authors on commits if you want individual recognition: https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors

### Getting unstuck

- Confused by Git? GitHub's own intro is good: https://docs.github.com/en/get-started/quickstart
- Stuck on a merge conflict? Ask in `#tech-help` on the EpiHack Discord — someone will help.
- Something broken at the repo level? Open an issue here, or ping an organizer on Discord.

### Final deadline

All Pull Requests should be opened by **Friday May 22, 12:00 PM (Tucson time)**. After that point, organizers will merge what is ready and freeze the repo for demo day.

## License

All code and materials added to this repository during EpiHack Arizona are released under the **Creative Commons Attribution–NonCommercial 4.0 International License (CC BY-NC 4.0)**.

You are free to share and adapt the work, as long as you give appropriate credit and do not use the material for commercial purposes. See [LICENSE](./LICENSE) for the full text, or the human-readable summary at https://creativecommons.org/licenses/by-nc/4.0/.

> Note for contributors: CC BY-NC is more common for creative works than for software. The choice here reflects the spirit of EpiHack — outputs are meant to serve communities and public health, not to be commercialized. If a team wants to extend a prototype after the event under a different license, please open an issue first so we can discuss.

## Contact

Event info: https://endingpandemicsacademy.arizona.edu/trainings-events/epihack-arizona  
For repository questions, open an issue.
