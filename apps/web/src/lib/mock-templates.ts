// Templates catalog — workspace templates (browsable here, used at workspace
// creation) and document templates (usable any time inside an editor flow).

export type TemplateCategory = "professional" | "academic" | "general";

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tagline: string;
  preview: {
    folders: string[];
    documents: { title: string; folder: string }[];
    taskColumns: string[];
    settings: {
      submissionWorkflowEnabled: boolean;
      supervisorReviewEnabled?: boolean;
      roleLabel: string;
    };
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: "meeting" | "planning" | "research" | "writing" | "engineering";
  estReadMin: number;
  preview: {
    sections: string[];
  };
}

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: "tpl-sw-dev",
    name: "Software Development",
    tagline: "Sprint cycles, PRDs, and engineering review.",
    description:
      "A full sprint workspace with PRDs, RFCs, and a five-stage engineering board. Best for product squads shipping every two weeks.",
    category: "professional",
    preview: {
      folders: ["Product", "Architecture", "Meetings", "Specs", "Postmortems"],
      documents: [
        { title: "PRD template", folder: "Product" },
        { title: "RFC template", folder: "Architecture" },
        { title: "Sprint planning", folder: "Meetings" },
        { title: "Retro template", folder: "Meetings" },
        { title: "ADR-000 starter", folder: "Architecture" },
      ],
      taskColumns: ["BACKLOG", "TODO", "IN PROGRESS", "REVIEW", "DONE"],
      settings: {
        submissionWorkflowEnabled: false,
        roleLabel: "ENGINEER",
      },
    },
  },
  {
    id: "tpl-client-work",
    name: "Client Engagement",
    tagline: "Scope, deliver, report — the agency loop.",
    description:
      "Built for consulting and agency work. Scoping docs, weekly status reports, and milestone-based task flow.",
    category: "professional",
    preview: {
      folders: ["Scoping", "Deliverables", "Status Reports", "Contracts"],
      documents: [
        { title: "Statement of work", folder: "Scoping" },
        { title: "Weekly status", folder: "Status Reports" },
        { title: "Milestone plan", folder: "Deliverables" },
      ],
      taskColumns: ["SCOPING", "ACTIVE", "REVIEW", "DELIVERED"],
      settings: {
        submissionWorkflowEnabled: false,
        roleLabel: "CONSULTANT",
      },
    },
  },
  {
    id: "tpl-product-launch",
    name: "Product Launch",
    tagline: "GTM, comms, and stakeholder alignment.",
    description:
      "Coordinate launches across marketing, product, and engineering. Includes launch comms, GTM checklist, and stakeholder briefs.",
    category: "professional",
    preview: {
      folders: ["GTM", "Comms", "Launch Plan", "Briefs", "Postlaunch", "Press"],
      documents: [
        { title: "Launch checklist", folder: "Launch Plan" },
        { title: "Press release draft", folder: "Press" },
        { title: "Stakeholder brief", folder: "Briefs" },
      ],
      taskColumns: ["IDEAS", "PLANNING", "BUILDING", "LAUNCHING", "LAUNCHED"],
      settings: {
        submissionWorkflowEnabled: false,
        roleLabel: "PRODUCT LEAD",
      },
    },
  },
  {
    id: "tpl-thesis",
    name: "Thesis & Senior Project",
    tagline: "Chapters, supervisor review, citations.",
    description:
      "End-to-end thesis workspace. Chapter outlines, supervisor review workflow, citation tracking, and submission gates.",
    category: "academic",
    preview: {
      folders: ["Chapters", "Literature", "Methods", "Results", "Drafts", "Submissions", "Defense"],
      documents: [
        { title: "Chapter 1 — Introduction", folder: "Chapters" },
        { title: "Literature matrix", folder: "Literature" },
        { title: "Methodology outline", folder: "Methods" },
        { title: "Defense slides", folder: "Defense" },
      ],
      taskColumns: ["DRAFT", "SUPERVISOR REVIEW", "REVISIONS", "APPROVED"],
      settings: {
        submissionWorkflowEnabled: true,
        supervisorReviewEnabled: true,
        roleLabel: "STUDENT",
      },
    },
  },
  {
    id: "tpl-research",
    name: "Research Group",
    tagline: "Papers, experiments, peer review.",
    description:
      "Collaborate on papers across a lab. Literature review, experiment logs, manuscript drafts, and submission tracking.",
    category: "academic",
    preview: {
      folders: ["Literature", "Experiments", "Manuscripts", "Submissions", "Peer Review"],
      documents: [
        { title: "Lit review template", folder: "Literature" },
        { title: "Experiment log", folder: "Experiments" },
        { title: "Manuscript draft", folder: "Manuscripts" },
      ],
      taskColumns: ["LITERATURE", "EXPERIMENT", "WRITING", "SUBMITTED"],
      settings: {
        submissionWorkflowEnabled: true,
        supervisorReviewEnabled: true,
        roleLabel: "REVIEWER",
      },
    },
  },
  {
    id: "tpl-coursework",
    name: "Course & Coursework",
    tagline: "Lectures, assignments, study groups.",
    description:
      "A term-long workspace for a single course. Lecture notes, assignment tracker, study group docs, graded submissions.",
    category: "academic",
    preview: {
      folders: ["Lectures", "Assignments", "Study Group", "Exams"],
      documents: [
        { title: "Week 1 notes", folder: "Lectures" },
        { title: "Assignment 1", folder: "Assignments" },
        { title: "Study guide", folder: "Study Group" },
      ],
      taskColumns: ["UPCOMING", "WORKING", "SUBMITTED", "GRADED"],
      settings: {
        submissionWorkflowEnabled: true,
        roleLabel: "STUDENT",
      },
    },
  },
  {
    id: "tpl-personal",
    name: "Personal Hub",
    tagline: "Notes, todos, and a few links.",
    description:
      "A simple home for ideas, todos, and reading lists. Light structure — no review gates, no roles to manage.",
    category: "general",
    preview: {
      folders: ["Notes", "Reading", "Ideas"],
      documents: [
        { title: "Daily notes", folder: "Notes" },
        { title: "Reading list", folder: "Reading" },
      ],
      taskColumns: ["INBOX", "TODAY", "LATER", "DONE"],
      settings: {
        submissionWorkflowEnabled: false,
        roleLabel: "OWNER",
      },
    },
  },
  {
    id: "tpl-blank",
    name: "Blank Workspace",
    tagline: "Start with nothing. Build it your way.",
    description:
      "An empty workspace — no folders, no starter docs. Three-column board (Todo / Doing / Done) and full owner control.",
    category: "general",
    preview: {
      folders: [],
      documents: [],
      taskColumns: ["TODO", "DOING", "DONE"],
      settings: {
        submissionWorkflowEnabled: false,
        roleLabel: "OWNER",
      },
    },
  },
];

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "doc-blank",
    name: "Blank document",
    description: "Just a title and a cursor. Start writing.",
    category: "writing",
    estReadMin: 0,
    preview: { sections: ["(empty)"] },
  },
  {
    id: "doc-meeting-notes",
    name: "Meeting notes",
    description: "Agenda, attendees, decisions, and action items in one structured layout.",
    category: "meeting",
    estReadMin: 3,
    preview: {
      sections: ["Agenda", "Attendees", "Discussion", "Decisions", "Action items"],
    },
  },
  {
    id: "doc-1on1",
    name: "1:1 notes",
    description: "A recurring template for manager / report sync. Carries forward open threads.",
    category: "meeting",
    estReadMin: 2,
    preview: {
      sections: ["Wins", "Blockers", "Topics", "Feedback", "Next steps"],
    },
  },
  {
    id: "doc-prd",
    name: "Product requirements (PRD)",
    description: "Problem, users, scope, success metrics, and rollout plan.",
    category: "planning",
    estReadMin: 8,
    preview: {
      sections: ["Problem", "Users", "Goals", "Scope", "Out of scope", "Metrics", "Rollout"],
    },
  },
  {
    id: "doc-rfc",
    name: "Engineering RFC",
    description: "Proposal for a technical change. Context, design, alternatives, risks.",
    category: "engineering",
    estReadMin: 10,
    preview: {
      sections: ["Context", "Proposal", "Design", "Alternatives", "Risks", "Open questions"],
    },
  },
  {
    id: "doc-adr",
    name: "Architecture decision record",
    description: "Lightweight ADR — one decision, one page. Accepted / superseded states.",
    category: "engineering",
    estReadMin: 4,
    preview: {
      sections: ["Status", "Context", "Decision", "Consequences"],
    },
  },
  {
    id: "doc-postmortem",
    name: "Incident postmortem",
    description: "Blameless postmortem. Timeline, contributing factors, and corrective actions.",
    category: "engineering",
    estReadMin: 12,
    preview: {
      sections: ["Summary", "Timeline", "Impact", "Root causes", "Corrective actions"],
    },
  },
  {
    id: "doc-research-brief",
    name: "Research brief",
    description: "Hypothesis, method, findings, and recommended next experiments.",
    category: "research",
    estReadMin: 6,
    preview: {
      sections: ["Hypothesis", "Method", "Findings", "Limitations", "Next steps"],
    },
  },
  {
    id: "doc-lit-review",
    name: "Literature review",
    description: "Structured matrix for comparing sources, methods, and gaps.",
    category: "research",
    estReadMin: 15,
    preview: {
      sections: ["Scope", "Sources", "Themes", "Gaps", "Synthesis"],
    },
  },
  {
    id: "doc-spec",
    name: "Functional spec",
    description: "User stories, acceptance criteria, edge cases, and dependencies.",
    category: "planning",
    estReadMin: 7,
    preview: {
      sections: ["Overview", "User stories", "Acceptance criteria", "Edge cases", "Dependencies"],
    },
  },
];

export function getWorkspaceTemplate(id: string) {
  return WORKSPACE_TEMPLATES.find((t) => t.id === id);
}
export function getDocumentTemplate(id: string) {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}
