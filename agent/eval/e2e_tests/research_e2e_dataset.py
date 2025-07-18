"""End-to-end research agent evaluation dataset following eval_template patterns."""

# End-to-end research scenarios with comprehensive success criteria
examples_research_e2e = [
    {
        "inputs": {
            "query": "What are the latest developments in AI regulation in 2024?"
        },
        "outputs": {
            "classification": "NEEDS_SEARCH",
            "success_criteria": [
                "• Mentions specific 2024 AI regulation developments or proposed legislation",
                "• Cites at least 2 different sources or regulatory bodies",
                "• Discusses impact on AI companies, researchers, or development practices",
                "• Uses recent information from 2024 (not outdated sources)",
                "• Provides concrete examples of regulatory changes or proposals",
            ],
        },
    },
    {
        "inputs": {
            "query": "Compare the pricing and features of the vector databases mentioned above",
            "conversation_history": [
                {
                    "role": "user",
                    "content": "What are the best vector databases for enterprise use?",
                },
                {
                    "role": "assistant",
                    "content": "Based on my research, here are the top vector databases for enterprise use:\n\n**Pinecone**: Fully managed, starts at $70/month for 1M vectors\n**Weaviate**: Open source with cloud options, enterprise plans from $500/month\n**Qdrant**: Open source, cloud hosting from $25/month\n**Chroma**: Open source, focuses on simplicity and developer experience\n\nEach offers different strengths in terms of scalability, performance, and integration capabilities.",
                },
            ],
        },
        "outputs": {
            "classification": "DIRECT_ANSWER",
            "success_criteria": [
                "• References specific vector databases from previous conversation (Pinecone, Weaviate, Qdrant, Chroma)",
                "• Provides pricing comparison without performing new web searches",
                "• Uses only information from conversation history",
                "• Organizes comparison in clear, structured format",
                "• Acknowledges if pricing information is missing from previous context",
            ],
        },
    },
    {
        "inputs": {
            "query": "How do transformer neural networks work and what are the latest architectural improvements?"
        },
        "outputs": {
            "classification": "NEEDS_SEARCH",
            "success_criteria": [
                "• Explains transformer fundamentals clearly (attention mechanism, encoder-decoder)",
                "• Discusses recent architectural improvements or variants (2023-2024)",
                "• Mentions specific papers, researchers, or companies behind improvements",
                "• Covers practical applications and performance benefits",
                "• Balances technical depth with accessibility",
            ],
        },
    },
    {
        "inputs": {"query": "What's the current weather in New York City?"},
        "outputs": {
            "classification": "NEEDS_SEARCH",
            "success_criteria": [
                "• Attempts to find current weather information through search",
                "• Provides specific temperature, conditions, and forecast if available",
                "• Mentions data source and timestamp of weather information",
                "• Acknowledges limitations if real-time data unavailable",
                "• Includes relevant weather details (humidity, wind, etc.)",
            ],
        },
    },
    {
        "inputs": {
            "query": "Summarize the key points we discussed about AI regulation",
            "conversation_history": [
                {
                    "role": "user",
                    "content": "What are the latest developments in AI regulation in 2024?",
                },
                {
                    "role": "assistant",
                    "content": "Here are the key AI regulation developments in 2024:\n\n**EU AI Act Implementation**: The EU AI Act came into force with specific requirements for high-risk AI systems and prohibitions on certain AI practices.\n\n**US Executive Order Follow-up**: The Biden administration issued additional guidance implementing the 2023 Executive Order on AI, focusing on safety testing and red-teaming requirements.\n\n**China's AI Regulations**: China introduced new draft measures for AI model training and deployment, emphasizing data security and algorithmic transparency.\n\n**Industry Impact**: Major AI companies like OpenAI, Google, and Anthropic have had to modify their deployment practices to comply with new regulatory frameworks.",
                },
            ],
        },
        "outputs": {
            "classification": "DIRECT_ANSWER",
            "success_criteria": [
                "• Provides summary of previous AI regulation discussion",
                "• Does not perform any web searches or use search tools",
                "• Organizes information chronologically or thematically",
                "• Includes main regulatory developments mentioned earlier (EU AI Act, US Executive Order, China regulations)",
                "• Uses only information from conversation history",
            ],
        },
    },
    {
        "inputs": {
            "query": "Compare React vs Vue.js for enterprise web applications in 2024"
        },
        "outputs": {
            "classification": "NEEDS_SEARCH",
            "success_criteria": [
                "• Provides balanced comparison of React and Vue.js for enterprise use",
                "• Discusses current ecosystem state, community support, and tooling",
                "• Mentions recent updates or changes in 2024",
                "• Covers enterprise-specific considerations (scalability, maintenance, team size)",
                "• Cites specific examples, benchmarks, or case studies",
            ],
        },
    },
    {
        "inputs": {"query": "What are the best practices for database indexing?"},
        "outputs": {
            "classification": "NEEDS_SEARCH",
            "success_criteria": [
                "• Covers fundamental indexing concepts (B-tree, hash, etc.)",
                "• Discusses when to use different index types",
                "• Mentions performance considerations and trade-offs",
                "• Includes practical examples or code snippets",
                "• Addresses both relational and NoSQL database indexing",
            ],
        },
    },
    {
        "inputs": {
            "query": "Can you list the main frameworks we talked about earlier?",
            "conversation_history": [
                {
                    "role": "user",
                    "content": "Compare React vs Vue.js for enterprise web applications in 2024",
                },
                {
                    "role": "assistant",
                    "content": "Here's a comprehensive comparison of React vs Vue.js for enterprise applications in 2024:\n\n**React**: Maintained by Meta, larger ecosystem, more job market demand. Strong TypeScript support and enterprise tooling like Next.js.\n\n**Vue.js**: Easier learning curve, excellent documentation, growing enterprise adoption. Vue 3 with Composition API offers better TypeScript integration.\n\n**Other Enterprise Considerations**: Angular remains popular for large enterprise teams, while Svelte is gaining traction for performance-critical applications.",
                },
            ],
        },
        "outputs": {
            "classification": "DIRECT_ANSWER",
            "success_criteria": [
                "• Lists frameworks mentioned in previous conversation (React, Vue.js, Angular, Svelte)",
                "• Does not perform web searches",
                "• Provides clear, organized list format",
                "• References specific context from conversation history",
                "• Acknowledges the frameworks that were previously discussed",
            ],
        },
    },
]
