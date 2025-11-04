from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm


# Per the documentation, for local Ollama models, it is recommended to set
# the OLLAMA_API_BASE environment variable before running the application.
# For example:
# export OLLAMA_API_BASE="http://localhost:11434"

root_agent = Agent(
    # The model string "ollama_chat/..." is the required format for LiteLlm
    # to connect to a local Ollama model with tool support.
    model=LiteLlm(model="ollama_chat/gpt-oss:20b"),
    name="local_ollama_agent",
    description="An agent that uses a local Ollama model.",
    instruction="You are a helpful technical writing assistant.",
    tools=[],
)
 