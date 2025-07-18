"""Prompt templates for research agent evaluation."""

# Main evaluation prompt for LLM-as-judge assessment
RESEARCH_QUALITY_EVALUATION_PROMPT = """You are evaluating a research agent's response quality and workflow correctness.

EXPECTED CLASSIFICATION: {expected_classification}
ACTUAL CLASSIFICATION: {actual_classification}

SUCCESS CRITERIA TO EVALUATE:
{criteria_text}

AGENT'S RESPONSE:
{final_response}

EVALUATION INSTRUCTIONS:

1. **Classification Check**: Verify if the classification (NEEDS_SEARCH vs DIRECT_ANSWER) matches expected behavior

2. **Criteria Analysis**: For each bullet point in the success criteria:
   - Explicitly state whether it is MET or NOT MET
   - Provide specific evidence from the response
   - Quote exact phrases that demonstrate compliance or failure

3. **Overall Quality Assessment**: Rate 1-5 where:
   - 5 = Excellent (all criteria met exceptionally well)
   - 4 = Good (most criteria met well, minor issues)
   - 3 = Adequate (criteria partially met, some significant gaps)
   - 2 = Poor (few criteria met, major deficiencies)
   - 1 = Very Poor (criteria largely unmet, fundamental failures)

4. **Pass/Fail Decision**: Grade True ONLY if:
   - Classification is correct AND
   - At least 4 out of 5 success criteria are clearly MET AND
   - Overall quality is 4 or higher

5. **Justification**: Provide specific examples from the response supporting your decision

Be rigorous and objective. If criteria are not clearly met, mark them as NOT MET."""