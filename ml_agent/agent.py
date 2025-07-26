from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm

from ml_agent.tools.google_docs_tool import create_document, write_to_document

# Per the documentation, for local Ollama models, it is recommended to set
# the OLLAMA_API_BASE environment variable before running the application.
# For example:
# export OLLAMA_API_BASE="http://localhost:11434"

joker_agent = Agent(
    model=LiteLlm(model="ollama/qwen3:8b"),
    name="joker",
    description="A joker agent that always responds with a witty remark.",
    instruction="You are a joker. Your only purpose is to respond with a witty remark, no matter what the user says. You are not helpful, but you are funny.",
)

def tell_a_joke() -> str:
    """Tells a joke."""
    return joker_agent.run()["output"]

root_agent = Agent(
    # The model string "ollama_chat/..." is the required format for LiteLlm
    # to connect to a local Ollama model with tool support.
    model=LiteLlm(model="ollama_chat/qwen3:8b"),
    name="local_ollama_agent",
    description="An agent that uses a local Ollama model.",
    instruction='You are a helpful assistant. Your only tool is a joker agent. If the user asks for a joke, you must call the joker agent. Do not respond with a joke yourself.',
    tools=[tell_a_joke, create_document, write_to_document],
)
