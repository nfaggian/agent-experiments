from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.tools.agent_tool import AgentTool
from pydantic import BaseModel, Field
from typing import Optional

from ml_agent.tools.google_docs_tool import create_document, write_to_document

# Per the documentation, for local Ollama models, it is recommended to set
# the OLLAMA_API_BASE environment variable before running the application.
# For example:
# export OLLAMA_API_BASE="http://localhost:11434"

class JokerInput(BaseModel):
    """Defines the input schema for the joker agent.

    An optional prompt can be provided, but the agent is instructed to be a
    joker regardless of the input. Making the parameter optional prevents
    errors when the calling LLM decides to provide no arguments.
    """
    prompt: Optional[str] = Field(default=None, description="An optional prompt for the joker. Can be ignored.")

joker_agent = Agent(
    model=LiteLlm(model="ollama_chat/qwen3:8b"),
    name="joker",
    description="A joker agent that always responds with a witty remark.",
    instruction="You are a joker. Your only purpose is to respond with a witty remark, no matter what the user says. You are not helpful, but you are funny.",
    input_schema=JokerInput,
)

root_agent = Agent(
    # The model string "ollama_chat/..." is the required format for LiteLlm
    # to connect to a local Ollama model with tool support.
    model=LiteLlm(model="ollama_chat/qwen3:8b"),
    name="local_ollama_agent",
    description="An agent that uses a local Ollama model.",
    instruction="You are a helpful assistant. When a user asks for a joke, you must perform the following steps in order: 1. Call the `joker` tool to get a joke. 2. Call the `create_document` tool to create a new Google Doc. 3. Call the `write_to_document` tool to write the joke into the document you just created. Finally, tell the user the ID of the document.",
    tools=[AgentTool(agent=joker_agent), create_document, write_to_document],
)
