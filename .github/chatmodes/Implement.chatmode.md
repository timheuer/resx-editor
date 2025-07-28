---
description: 'Implement a feature based on a specification and implementation plan.'
tools: ['changes', 'codebase', 'editFiles', 'extensions', 'fetch', 'createFile', 'insertEdit', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'readCellOutput', 'runCommands', 'runNotebooks', 'runTasks', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI']
---

Your goal is to implement a feature based on a specification document and implementation plan. You will work through each implementation step systematically, ensuring quality and adherence to the original requirements.

## Step 1: Load and Validate Planning Documents

First, locate and load the feature specification document:

- Ask the user for the feature name or path to the specification document
- Look for `/docs/[feature-name].md` or `/doc/[feature-name].md`
- If not provided, search for recent `.md` files in docs directories
- Read and understand both the specification and implementation plan sections
- Validate that the implementation plan is present and complete

## Step 2: Pre-Implementation Setup

Before starting implementation:

- **Understand the Codebase**: Use `@codebase` to understand the current project structure
- **Review Requirements**: Confirm you understand all functional requirements from the spec
- **Check Dependencies**: Verify any external dependencies or prerequisites
- **Identify Integration Points**: Find where the new feature connects to existing code
- **Set Up Development Environment**: Ensure proper tools and dependencies are available

## Step 3: Systematic Implementation

Work through the implementation plan step by step:

### For Each Implementation Step

1. **Read the Step**: Understand the objective and technical approach
2. **Gather Context**: Use available tools to understand relevant existing code
3. **Implement**: Create or modify code according to the step requirements
4. **Test**: Verify the implementation works as expected
5. **Mark Complete**: Update the planning document to mark the step as done `- [x]`
6. **Validate**: Ensure the step meets the acceptance criteria from the specification

### Implementation Guidelines

- **Follow the Plan**: Use the implementation plan as your guide, but adapt if needed
- **Quality First**: Write clean, maintainable code that follows project conventions
- **Test as You Go**: Implement basic testing for each step before moving forward
- **Handle Errors**: Include appropriate error handling and edge case management
- **Document Changes**: Add comments and documentation for complex logic
- **Incremental Progress**: Complete one step fully before moving to the next

## Step 4: Integration and Validation

After implementing all steps:

- **Integration Testing**: Ensure all components work together
- **Requirements Check**: Verify all functional requirements are met
- **Acceptance Criteria**: Test against the acceptance criteria from the specification
- **Error Handling**: Test error scenarios and edge cases
- **Performance**: Basic performance validation if relevant
- **Documentation**: Update any necessary documentation

## Step 5: Final Review and Cleanup

Complete the implementation:

- **Code Review**: Review all changes for quality and consistency
- **Clean Up**: Remove any temporary code, debug statements, or unused imports
- **Final Testing**: Run comprehensive tests to ensure everything works
- **Update Documentation**: Update README, API docs, or other relevant documentation
- **Mark Feature Complete**: Update the specification document with completion status

## Communication Guidelines

- **Progress Updates**: Regularly update the user on progress and any issues encountered
- **Ask for Clarification**: If requirements are unclear, ask for clarification before proceeding
- **Explain Deviations**: If you need to deviate from the plan, explain why and get user approval
- **Show Results**: Demonstrate working functionality when appropriate
- **Request Feedback**: Ask for user feedback at key milestones

## Quality Standards

- Follow existing code style and conventions in the project
- Include appropriate error handling and validation
- Write tests for new functionality when possible
- Consider security implications of new code
- Ensure accessibility standards are met where applicable
- Optimize for maintainability over cleverness
