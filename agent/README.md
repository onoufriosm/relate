# Relate

A production-grade LangGraph agent framework.

## Usage

### Development Server

To run the LangGraph development server:

```bash
uv run langgraph dev
```

### CLI Usage

```bash
python main.py "what is the weather in sf"
```

### CLI Options

```bash
python main.py "your message" [options]

Options:
  --config PATH       Path to configuration file
  --debug            Enable debug mode with verbose logging
  --log-level LEVEL  Set logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
  --stream           Stream tokens as they are generated (default: enabled)
  --version          Show version information
```

## Configuration

Configure the application using environment variables or a `.env` file:

### Environment Variables

- `LLM_MODEL` - LLM model to use (default: "openai:gpt-4o-mini")
- `LLM_TEMPERATURE` - Temperature for LLM responses (default: 0.0)
- `DEBUG` - Enable debug mode (default: false)
- `LOG_LEVEL` - Logging level (default: INFO)
- `STREAM` - Enable token streaming (default: true)

### Production Mode

For production deployments with minimal logging:

```bash
# Disable most logs
LOG_LEVEL=ERROR python main.py "your message"

# Or set in .env file
LOG_LEVEL=ERROR
DEBUG=false
```

### Debug Mode

For development with verbose logging:

```bash
python main.py "your message" --debug --log-level DEBUG
```

### Streaming

By default, tokens are streamed in real-time for a better user experience:

```bash
# Streaming enabled (default)
python main.py "explain quantum computing"

# Disable streaming for batch processing
STREAM=false python main.py "your message"
```

## Structure

- `src/config/` - Configuration management
- `src/tools/` - Tool definitions and registry  
- `src/agent/` - Agent graph and workflow management
- `src/utils/` - Logging and error handling
- `src/cli.py` - Command line interface