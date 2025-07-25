# Agent Experiments

This repository contains experiments with the Google Agent Development Kit (ADK).

The `ml_agent` is configured to use a local Ollama model. To run the agent, you will need to have Ollama installed and running. You will also need to set the `OLLAMA_API_BASE` environment variable to the address of your Ollama instance. This can be done by creating a `.env` file in the root of the project with the following content:

```
OLLAMA_API_BASE="http://localhost:11434"
```