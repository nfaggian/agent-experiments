"""Prefect pipeline for orchestrating agent workflows."""

from typing import Any

from prefect import flow, task

from agents.sow_agent.tools.google_docs_tool import (
    create_document,
    write_markdown_to_document,
    write_to_document,
)


@task
def create_sow_document(title: str) -> str:
    """Task to create a new SOW document."""
    return create_document(title)


@task
def generate_sow_content(prompt: str) -> str:
    """Task to generate SOW content using the SOW agent."""
    # TODO: Integrate with SOW agent when agent execution is needed
    # For now, return a placeholder
    return f"SOW content generated for: {prompt}"


@task
def write_content_to_document(document_id: str, content: str, use_markdown: bool = True) -> None:
    """Task to write content to a Google Doc."""
    if use_markdown:
        write_markdown_to_document(document_id, content)
    else:
        write_to_document(document_id, content)


@flow(name="agent_workflow", log_prints=True)
def agent_workflow(
    sow_title: str = "Statement of Work",
    sow_prompt: str = "Generate a statement of work document",
    use_markdown: bool = True,
) -> dict[str, Any]:
    """
    Main workflow for orchestrating agent tasks.

    This workflow:
    1. Creates a new Google Doc for the SOW
    2. Generates SOW content using the SOW agent
    3. Writes the content to the document

    Args:
        sow_title: Title for the SOW document
        sow_prompt: Prompt for generating SOW content

    Returns:
        Dictionary containing the document ID and status
    """
    # Step 1: Create document
    document_id = create_sow_document(sow_title)

    # Step 2: Generate content
    content = generate_sow_content(sow_prompt)

    # Step 3: Write content to document (with markdown support)
    write_content_to_document(document_id, content, use_markdown=use_markdown)

    return {
        "document_id": document_id,
        "status": "completed",
        "title": sow_title,
    }


if __name__ == "__main__":
    # Run the workflow
    result = agent_workflow()
    print(f"Workflow completed: {result}")

