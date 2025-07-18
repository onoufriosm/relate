"""Classification evaluation dataset with ground truth classifications."""

# Queries that NEED SEARCH - require web search for current/external information
query_input_1 = "What are the latest developments in AI regulation in 2024?"
query_input_2 = "How much does a Tesla Model 3 cost right now?"
query_input_3 = "What's the current weather in San Francisco?"
query_input_4 = "Who won the 2024 NBA championship?"
query_input_5 = "What are the best practices for React performance optimization in 2024?"
query_input_6 = "Compare the latest iPhone 15 vs Samsung Galaxy S24 features"
query_input_7 = "What's Apple's current stock price?"
query_input_8 = "How to set up a Kubernetes cluster on AWS?"
query_input_9 = "What are the side effects of the new COVID-19 booster vaccine?"
query_input_10 = "Best restaurants in New York City for 2024"

# Queries that can be answered DIRECTLY from conversation history
query_input_11 = "What did you just tell me about React performance?"
query_input_12 = "Can you explain that last point about Kubernetes again?"
query_input_13 = "What was the first topic we discussed in our conversation?"
query_input_14 = "Summarize what we've talked about so far"
query_input_15 = "What did I ask you earlier about Python frameworks?"
query_input_16 = "Can you clarify what you meant by 'state management'?"
query_input_17 = "What were the three main points you mentioned about databases?"
query_input_18 = "Could you repeat your last recommendation?"
query_input_19 = "What was your suggestion for the authentication approach?"
query_input_20 = "Why did you recommend that particular solution?"

# Expected classifications
classification_output_1 = "NEEDS_SEARCH"
classification_output_2 = "NEEDS_SEARCH" 
classification_output_3 = "NEEDS_SEARCH"
classification_output_4 = "NEEDS_SEARCH"
classification_output_5 = "NEEDS_SEARCH"
classification_output_6 = "NEEDS_SEARCH"
classification_output_7 = "NEEDS_SEARCH"
classification_output_8 = "NEEDS_SEARCH"
classification_output_9 = "NEEDS_SEARCH"
classification_output_10 = "NEEDS_SEARCH"
classification_output_11 = "DIRECT_ANSWER"
classification_output_12 = "DIRECT_ANSWER"
classification_output_13 = "DIRECT_ANSWER"
classification_output_14 = "DIRECT_ANSWER"
classification_output_15 = "DIRECT_ANSWER"
classification_output_16 = "DIRECT_ANSWER"
classification_output_17 = "DIRECT_ANSWER"
classification_output_18 = "DIRECT_ANSWER"
classification_output_19 = "DIRECT_ANSWER"
classification_output_20 = "DIRECT_ANSWER"

# Dataset examples following eval_template pattern
examples_classification = [
    {
        "inputs": {"query": query_input_1},
        "outputs": {"classification": classification_output_1},
    },
    {
        "inputs": {"query": query_input_2},
        "outputs": {"classification": classification_output_2},
    },
    {
        "inputs": {"query": query_input_3},
        "outputs": {"classification": classification_output_3},
    },
    {
        "inputs": {"query": query_input_4},
        "outputs": {"classification": classification_output_4},
    },
    {
        "inputs": {"query": query_input_5},
        "outputs": {"classification": classification_output_5},
    },
    {
        "inputs": {"query": query_input_6},
        "outputs": {"classification": classification_output_6},
    },
    {
        "inputs": {"query": query_input_7},
        "outputs": {"classification": classification_output_7},
    },
    {
        "inputs": {"query": query_input_8},
        "outputs": {"classification": classification_output_8},
    },
    {
        "inputs": {"query": query_input_9},
        "outputs": {"classification": classification_output_9},
    },
    {
        "inputs": {"query": query_input_10},
        "outputs": {"classification": classification_output_10},
    },
    {
        "inputs": {"query": query_input_11},
        "outputs": {"classification": classification_output_11},
    },
    {
        "inputs": {"query": query_input_12},
        "outputs": {"classification": classification_output_12},
    },
    {
        "inputs": {"query": query_input_13},
        "outputs": {"classification": classification_output_13},
    },
    {
        "inputs": {"query": query_input_14},
        "outputs": {"classification": classification_output_14},
    },
    {
        "inputs": {"query": query_input_15},
        "outputs": {"classification": classification_output_15},
    },
    {
        "inputs": {"query": query_input_16},
        "outputs": {"classification": classification_output_16},
    },
    {
        "inputs": {"query": query_input_17},
        "outputs": {"classification": classification_output_17},
    },
    {
        "inputs": {"query": query_input_18},
        "outputs": {"classification": classification_output_18},
    },
    {
        "inputs": {"query": query_input_19},
        "outputs": {"classification": classification_output_19},
    },
    {
        "inputs": {"query": query_input_20},
        "outputs": {"classification": classification_output_20},
    },
]

# Helper lists for convenience
query_inputs = [
    query_input_1, query_input_2, query_input_3, query_input_4, query_input_5,
    query_input_6, query_input_7, query_input_8, query_input_9, query_input_10,
    query_input_11, query_input_12, query_input_13, query_input_14, query_input_15,
    query_input_16, query_input_17, query_input_18, query_input_19, query_input_20
]

classification_outputs = [
    classification_output_1, classification_output_2, classification_output_3, classification_output_4, classification_output_5,
    classification_output_6, classification_output_7, classification_output_8, classification_output_9, classification_output_10,
    classification_output_11, classification_output_12, classification_output_13, classification_output_14, classification_output_15,
    classification_output_16, classification_output_17, classification_output_18, classification_output_19, classification_output_20
]