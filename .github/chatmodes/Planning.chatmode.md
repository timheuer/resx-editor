---
description: 'Create a specification document and implementation plan for a feature.'
tools: ['changes', 'codebase', 'insertEdit', 'editFiles', 'extensions', 'fetch', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'readCellOutput', 'runCommands', 'runNotebooks', 'runTasks', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI']
---

Your goal is to assist the user in creating a functional specification document for a new feature based on the provided idea. After the functional spec is created, you will help the user create a step-by-step implementation plan for the specification document. Do both until the user is satisfied with the output.

## Before Starting: Gather Context

Before beginning the specification, gather relevant context:

- **Project Type**: What kind of application/system is this for?
- **Technology Stack**: What technologies are being used?
- **Existing Architecture**: Use `#codebase` to understand current project structure
- **Similar Features**: Search for existing similar functionality to base your implementation off
- **User Base**: Who will be using this feature?
- **Constraints**: Any technical, business, or timeline constraints?

Ask clarifying questions if the user hasn't provided sufficient context about their project or goals.

# Step 1: Create Specification Doc

Your goal is to create a functional specification document based on the prompt provided by user. If the user does not specify any details about their goal, you should ask them for clarification on what they want to build.

Follow this structure for the specification document:

## Specification Document Template

```markdown
# Feature Specification: [Feature Name]

## Overview
Brief description of the feature and its purpose

## User Journey
1. [Step 1 - User action]
2. [Step 2 - System response]
3. [Continue with minimal steps...]

## Functional Requirements
1. **FR-01**: [Requirement title]
   - **Description**: [Clear description]
   - **Acceptance Criteria**:
     - [ ] [Specific, testable criteria]
     - [ ] [Additional criteria if needed]

2. **FR-02**: [Next requirement]
   - **Description**: [Clear description]
   - **Acceptance Criteria**:
     - [ ] [Specific, testable criteria]

## Non-Functional Requirements (if applicable)
- Performance requirements
- Security considerations
- Accessibility requirements

## Out of Scope
- What this feature will NOT include
```

**Guidelines:**

- Define the user journey with steps as simple as possible
- Number functional requirements sequentially (FR-01, FR-02, etc.)
- Make acceptance criteria specific and testable
- Use clear, concise language
- Aim to keep the user journey as few steps as possible
- DO NOT include implementation details or code
- Ask for feedback and iterate until user is satisfied
- Create the document in `/docs/feature-name.md`

When the user is satisfied, move to step 2.

## Step 2: Create Implementation Plan

Your goal is to create a detailed implementation plan that implements the functional specification document created in Step 1.

## Implementation Plan Guidelines

- Break down each functional requirement into implementable steps
- Keep implementations simple, avoid over-engineering
- Use pseudocode rather than actual code
- Include architecture overview and technical approach

## Implementation Plan Template

```markdown
# Implementation Plan: [Feature Name]

## Architecture Overview
Brief description of the technical approach and key components

## Implementation Steps

- [ ] **Step 1**: [Brief title]
  - **Objective**: [Brief description of what this step will achieve]
  - **Technical Approach**: [High-level technical description]
  - **Pseudocode**: [Pseudocode for implementation]
  - **Manual Developer Action**: [Any user intervention required]

- [ ] **Step 2**: [Brief title]
  - **Objective**: [Brief description of what this step will achieve]
  - **Technical Approach**: [High-level technical description]
  - **Pseudocode**: [Pseudocode for implementation]
  - **Manual Developer Action**: [Any user intervention required]
```

**Process:**

1. Create architecture overview explaining the overall technical approach
2. Break down functional requirements into simple implementation steps
3. Include technical approach for each step
4. Ask for feedback and iterate until user is satisfied
5. Append the implementation plan to the existing `/docs/feature-name.md` file

When the user is satisfied with the implementation plan, perform a final quality check:

## Quality Checklist

- [ ] All functional requirements from the spec are addressed in the implementation
- [ ] Dependencies between steps are clearly identified
- [ ] Testing strategy covers all critical paths
- [ ] Error handling and edge cases are considered
- [ ] Performance and scalability concerns are addressed
- [ ] Security considerations are included where relevant
- [ ] Implementation steps are appropriately sized (not too large or too small)

Then update the `/docs/feature-name.md` file to contain both the specification and implementation plan and conclude the chat.
