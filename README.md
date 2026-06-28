# Word Chaser

This is a documented exploration of AI-assisted software engineering, using the development of a real-time multiplayer word game - Word Chaser - as a vehicle.

My goal wasn't just to build an app, but to understand how AI changes the way experienced engineers design, build and ship software.

The project was mostly built between August and October 2025, during 13 weeks of parental leave, and provided me with the opportunity to experiment with an AI-first development workflow using the models and tools available at the time.

Rather than using AI only to generate code, I integrated it throughout the entire development lifecycle—from product discovery, design and architecture to implementation, debugging, testing and documentation.

_Active gameplay_
![active game](docs/gameplay/active-game.gif)

_Multiplayer lobby flow_
![multiplayer flow](docs/gameplay/multiplayer-flow.gif)

## Repository Guide

This repository is organised into two parts:

- 📖 **Case Study (this README)** — an exploration of AI-assisted software engineering through the development of Word Chaser.
- 🛠️ **Developer Documentation** — setup, architecture, testing and contribution guides. See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Why I Built This

My goal wasn't simply to recreate Boggle — or Yahoo Games' classic *Word Racer*, which was one of my favourite internet games as a child.

Instead, I wanted a project that was technically challenging, but still realistic to build by myself in a relatively short period of time.

Throughout the project, I set out to answer questions such as:

* How much can an experienced solo developer be accelerated?
* Where does this improvement appear most?
* Where is my human judgment still fundamental?

## Tool Selection

The specific tools were mostly incidental. I used Cursor with Claude Sonnet 4 for coding and Gemini for more general queries, as these were the models and editor available to me through Thoughtworks at the time.

Likewise, I chose Next.js because I had recently been working on a Next.js project and it allowed me to focus on the experiment rather than learning a new framework.

For the backend however, I wanted something more lightweight. I decided to go serverless with Firebase because it optimised for simplicity, speed of development and cost. The goal of the project was to explore AI-assisted software engineering rather than infrastructure, so this felt like the right trade-off.

While differences between models naturally became apparent over the course of the project, it wasn't my aim to compare them. The primary focus was on the overall workflow rather than the capabilities of any individual tool.

## AI-assisted development

This project also serves as a small case study in AI-assisted solo development.

Over the main build period—from **29 July to 13 October 2025**—a single experienced developer designed, built and documented a production-ready multiplayer word game from scratch. The delivered scope spanned product design, frontend, backend, infrastructure, security, testing and documentation.

### Product & gameplay

* Multiplayer game flow with host-managed lobbies
* Guest authentication and realtime Firebase rooms
* Algorithmically generated word grids
* Dictionary-backed word validation and pathfinding
* Live scoring, rounds and final results

### Engineering

* Next.js application with Firebase backend
* Real-time multiplayer architecture
* Secure database rules

### Quality & maintainability

* Unit tests
* Firebase emulator integration tests
* Backend API tests
* Playwright end-to-end tests
* Storybook component stories
* Architecture Decision Records (ADRs)
* Spike documents and architecture diagrams

I don't claim this demonstrates an exact productivity multiplier. The original roadmap and effort estimates weren't preserved, so it's impossible to make a rigorous comparison between planned and actual delivery.

What I can say with confidence is that I would not have been able to deliver a project of this breadth and technical complexity in anywhere near the same timeframe without AI.

That wasn't because I treated AI as a code generator. At the time, much of the discussion around AI focused on one-shot prompting and getting it to write software for you. Instead, I treated it as a collaborator.

I had long conversations, asked lots of questions, challenged its suggestions and tried to understand the reasoning behind its output. If I didn't understand something, I'd keep asking until I did.

My goal wasn't simply to produce working software—it was to produce software that was better than I could have built on my own while still fully understanding it. I wanted the code to remain mine, with every important change reviewed and every significant decision understood.

AI was involved throughout the development process, but I deliberately kept the workflow human-led. Rather than handing entire features to the model, I used it to explore ideas, challenge assumptions, review designs, write and review code, generate tests, diagnose bugs and improve documentation. The value came from the ongoing conversation, not from delegating the work.

### Decision Making Through Documentation

One of the biggest surprises was how AI changed my approach to documentation.

Because I was constantly trying to understand the reasoning behind technical decisions, it became natural to document them as ADRs. Since generating them took seconds rather than hours, I found myself writing far more of them than I normally would.

I started to think of ADRs as a way of asking the AI to justify its recommendations in a structured way. If it couldn't make a convincing case for a decision, it was often a sign that I needed to challenge it further or explore alternatives.

When tackling more complex technical problems, I would often ask the model to write a spike document, much as we would in an agile team. This helped me investigate options, compare trade-offs and ultimately make better decisions—for example when choosing Playwright as the E2E testing framework.

I also generated architecture diagrams throughout the project. They were quick to produce and helped me step back from the implementation details to better understand the overall system.

### Testing

At Thoughtworks, testing is part of our DNA, and I've fully embraced it as a way of building safe, easily changeable software. That mindset was always going to be part of this project.

I wanted to see how comfortable it would be to build fully tested software with AI support. One of the first rules I gave Cursor, for example, was to run the relevant tests as part of every task before considering the work complete. This undoubtedly slowed the workflow a little, but it more than paid for itself by catching defects early.

I was also happy for the model to write many of the test cases while I reviewed them. At the time, some people argued that tests should still be written manually for safety, but I found reviewing AI-generated tests to be no different from reviewing a pull request from a teammate. The value came from the review, not from writing every test myself.

One of the trickier parts of the project was getting meaningful Firebase integration tests running against the local emulator, particularly for the Realtime Database security rules. They took some effort to set up, but gave me confidence that the rules enforced the principle of least privilege.

I also found the model less effective at writing Playwright end-to-end tests, so I kept those intentionally simple and wrote them myself. It reinforced one of the project's broader lessons: AI was an excellent collaborator, but some tasks still benefited from a more hands-on approach.

Ultimately, the testing strategy came from my own engineering experience. Word Chaser includes unit, integration and end-to-end tests because that's how I build confidence in software, regardless of whether the code or the tests were drafted by AI.

## Failure Modes

### Rabbit Holes

Probably the biggest limitation I found was AI's tendency to disappear down rabbit holes.

When something wasn't working, the model would usually start with the conventional fix. If that didn't solve the problem, it rarely stopped to question its original assumptions. Instead, it would continue digging deeper, proposing increasingly clever but ultimately incorrect solutions that all stemmed from the same flawed understanding.

When that happened, I had to stop collaborating with the AI and go back to being a software engineer: reading the code carefully, tracing the execution path and rebuilding my understanding from first principles. Once I'd identified the real cause, I could usually steer the AI back in the right direction and reach a solution quickly.

These situations weren't constant, but they happened often enough to become a recognisable pattern. In the end, I actually appreciated them because they forced me to understand parts of the system more deeply than I otherwise might have. They also exposed one of the fundamental trade-offs of AI-assisted development: the faster you can produce code, the easier it is to become one step removed from fully understanding it.

### UX and Responsive Design

Another area where AI support was less reliable was UX and responsive design.

The model was generally good at producing clean-looking components, especially when working from an existing pattern. But it was much weaker at judging whether the overall experience actually felt good across screen sizes, input modes and real user flows.

Responsive design was a particular example of this. AI could often add the right Tailwind classes, but that didn't mean the result had been properly designed for mobile. I still had to review the UI in context, resize the browser, think about the player experience and make judgment calls that were more product design than code generation.

In fact, the mobile experience is probably the weakest part of Word Chaser. The game was originally designed for desktop, and I only realised partway through development how challenging it would be to adapt the interface for mobile. AI could help generate the code, but it wasn't particularly good at solving the UX problems involved, so I deliberately chose not to invest significant time refining it.

This reinforced the same broader lesson: AI was helpful at producing raw material, but it didn't replace taste, user empathy or the need to actually use the thing I was building.
