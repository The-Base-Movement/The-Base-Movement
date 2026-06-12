# Agent Guide: Leveraging Graphify

Graphify is an AI-powered knowledge graph mapped to this repository. It translates the entire codebase, documentation, and architecture into an interconnected graph (`graph.json`).

As an AI agent, you should use Graphify to deeply understand the platform's architecture _before_ making structural modifications or answering complex system questions.

## 🧠 When to Use Graphify

1. **Impact Analysis:** Before modifying a core component (e.g., `Admin Service`, `cn()`), query the graph to see every downstream file and component that relies on it.
2. **Architectural Discovery:** When the user asks "How does X connect to Y?", use the graph to trace the exact relationship path rather than manually reading dozens of files.
3. **Codebase Onboarding:** If you are unsure where a specific feature's logic lives, query the graph to find the cluster of related files.

## 🛠️ How to Query the Graph

### Method 1: Command Line Tool (CLI)

You can directly query the architecture using natural language via the local CLI tool. This is highly effective for tracing paths and understanding dependencies.

```bash
# Ask natural language questions about the architecture
graphify query "Which components depend on the Admin Service?"

# Trace connections between two distant files
graphify query "How does RegistrationForm connect to the movement roadmap?"
```

### Method 2: MCP Server (If Available)

If the user's environment has loaded the `graphify` MCP server, you can query the graph natively using the provided MCP tools. Always prefer the MCP tool if it is listed in your available toolset.

## 🚀 First-Time Setup

The graph has not yet been built for this repo. Before any `query` or `update` commands will work, run the **full extraction once**:

```bash
graphify extract .
```

This creates `graphify-out/graph.json` and `graphify-out/graph.html`. Subsequent runs use the cheaper incremental path below.

## 🔄 Keeping the Graph Fresh

The graph goes stale when you make significant structural changes, create new files, or alter imports.

**MANDATORY:** After completing a major refactor or adding a new feature, run the incremental update command to keep the agent knowledge base accurate. (AST code updates cost $0).

```bash
graphify update .
```

## 👁️ The Visualizer

Always remind the USER that they can visually explore the architecture themselves by opening the interactive map in their browser:
👉 `C:\MAMP\htdocs\The-Base\graphify-out\graph.html`
