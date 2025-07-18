from datetime import datetime

current_date = datetime.now().isoformat()

"""Prompts for the multi-query search agent."""

# Classification prompt template
QUERY_CLASSIFICATION_TEMPLATE = """
< Role >
You are an expert query classifier who determines whether queries require web search or can be answered from conversation history.
</ Role >

< Conversation History >
{conversation_history}
</ Conversation History >

< Instructions >
Analyze the conversation history above and the current user query to determine the appropriate classification:

1. NEEDS_SEARCH: Choose this if the query requires new information from the web such as:
   - Current facts, events, or data not in the conversation
   - Specific information that needs to be researched
   - Questions about real-time or recent developments

2. DIRECT_ANSWER: Choose this if the query can be answered using only the conversation history:
   - Reorganizing, analyzing, or processing previously mentioned information
   - References to "those", "these", or items discussed earlier
   - Summarization or comparison of previously discussed topics

Current User Query: {current_query}
</ Instructions >

< Examples >
DIRECT_ANSWER queries:
- "Put those cities in alphabetical order"
- "Which of these options is cheapest?"
- "Summarize what we discussed"
- "Compare the restaurants you mentioned"

NEEDS_SEARCH queries:
- "What are the best cities to live in?"
- "What's the weather like today?"
- "Tell me about recent AI developments"
- "Find information about X topic"
</ Examples >

< Rules >
- Always provide classification, reasoning, and confidence score
- Consider whether the conversation history contains sufficient information
- If the query references previous discussion items, lean toward DIRECT_ANSWER
- If the query asks for new factual information, choose NEEDS_SEARCH
</ Rules >"""


# Query planning prompt template
QUERY_PLANNING_TEMPLATE = """
< Role >
You are an expert search query planner who generates targeted web search queries to gather comprehensive information.
</ Role >

< Conversation History >
{conversation_history}
</ Conversation History >

< Instructions >
Analyze the user's current query in the context of the conversation history above and generate effective search queries:

1. Context Analysis:
   - Review the conversation history to understand what has been discussed
   - If the user refers to "those", "these", "the mentioned", or similar references, identify the specific items mentioned in the Assistant's previous response and use those EXACT names

2. Query Generation:
   - If no specific date/year is mentioned in the query, include current year/month in your searches to get the most recent data. The current date in ISO format is: {current_date}.
   - Generate focused search queries that will gather comprehensive information to answer the user's question
   - Use as few queries as possible while ensuring comprehensive coverage
   - Make each search query specific and targeted for best results

Current User Query: {current_query}
</ Instructions >

< Output Format >
Return ONLY the search queries, one per line, with no explanations or additional text:
[Search Query 1]
[Search Query 2]
[Search Query 3]
</ Output Format >

< Rules >
- Maximum 3 search queries
- Each query should be specific and actionable
- Include current date context when relevant
- Use exact names from conversation history when referenced
- Focus on comprehensive information gathering
</ Rules >"""


# Direct answer prompt template
DIRECT_ANSWER_TEMPLATE = """
< Role >
You are a helpful assistant who provides direct answers to user queries.
</ Role >

< Conversation History >
{conversation_history}
</ Conversation History >

< Instructions >
Analyze the conversation history above and the current user query to determine the best approach:

1. If there is relevant conversation history:
   - Answer the user's question using ONLY the information from the conversation history above
   - Be helpful, accurate, and specific
   - If the user refers to "those", "these", or similar references, identify the specific items from the conversation history
   - Do not add any new information that wasn't previously discussed

2. If there is no relevant conversation history or the conversation history doesn't contain information needed to answer the query:
   - Use your knowledge to provide a helpful, accurate answer
   - Be informative but concise
   - Focus on directly answering what the user asked

Current User Query: {original_query}
</ Instructions >

< Rules >
- Always be helpful and accurate
- If referencing conversation history, stick strictly to what was discussed
- If using general knowledge, be clear and factual
- Keep responses focused and relevant to the query
</ Rules >"""


# Summarization prompt template
SUMMARIZATION_TEMPLATE = """Based on these search results, provide a comprehensive answer to the user's question.

Original Question: {original_query}

Search Results:{combined_results}

Instructions:
- Only use information from the search results provided
- If information is missing, acknowledge what couldn't be found
- Provide a clear, well-structured answer
- Be specific and cite relevant details from the searches
- Organize information logically and maintain objectivity"""


# Episodic decision prompt template
EPISODIC_DECISION_TEMPLATE = """
< Role >
You are an episodic memory decision maker who determines whether to auto-approve, auto-skip, or proceed to human review based on similar past user interactions.
</ Role >

< Current Situation >
Query: {current_query}
Planned searches: {planned_searches}
</ Current Situation >

< Similar Past Episodes >
{episodes_context}
</ Similar Past Episodes >

< Instructions >
Analyze the similar past episodes above and determine the best action for the current situation:

1. Pattern Analysis:
   - Compare current query similarity and complexity to past episodes
   - Evaluate search quality and scope patterns from previous interactions
   - Assess user decision consistency in similar situations
   - Consider context and timing patterns

2. Decision Making:
   - "approve" - Choose this if user consistently approved similar queries/searches in the past
   - "skip" - Choose this if user consistently skipped to direct answer for similar queries
   - "review" - Choose this if patterns are unclear or confidence is insufficient

3. Confidence Assessment:
   - Only auto-decide (approve/skip) if confidence level is very high (> 0.8)
   - Consider the consistency and clarity of past user decisions
   - Factor in the similarity strength between current and past episodes
</ Instructions >

< Decision Options >
Return one of the following with reasoning and confidence score:
- "approve" - Automatically approve these searches (user likely to approve based on patterns)
- "skip" - Automatically skip to direct answer (user likely to skip based on patterns)  
- "review" - Proceed to human review (not confident enough to auto-decide)
</ Decision Options >

< Rules >
- Only auto-decide if confidence > 0.8
- Prioritize user consistency over single data points
- Consider query complexity and search scope similarity
- When in doubt, choose "review" to maintain user control
- Always provide clear reasoning for the decision
</ Rules >"""
