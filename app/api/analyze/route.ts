import { NextRequest, NextResponse } from 'next/server'

interface AnalysisResult {
  riskLevel: string
  reason: string
  businessImpact: string
  recommendedAction: string
  suggestedReply?: string
  leadQualityScore?: number
  businessInsight: string
}

const SYSTEM_PROMPT = `You are an Advanced Business Intelligence AI Agent built for professional and enterprise use.

Your core objectives are to make business communication safer, faster, and smarter.

Your responsibilities include:

1. Message & Intent Analysis
- Analyze incoming business messages, emails, chats, leads, and inquiries.
- Identify the true intent: inquiry, sales lead, complaint, support request, negotiation, or risk.

2. Risk & Fraud Detection
- Detect fraud, scam, phishing, fake payments, impersonation, social engineering, or manipulation.
- Identify urgency pressure, authority misuse, emotional triggers, suspicious links, or abnormal requests.
- Classify risk level as:
  - Safe
  - Suspicious
  - High Risk Fraud

3. Business Impact Evaluation
- Explain how the message could impact business:
  - Financial loss
  - Reputation damage
  - Data/security risk
  - Operational disruption

4. Smart Response & Automation Support
- Suggest a professional, safe, business-appropriate reply.
- Provide multiple reply tones when useful:
  - Neutral
  - Polite & Firm
  - Legal / Compliance-safe

5. Sales & Lead Intelligence (if applicable)
- Detect whether the message is a sales lead.
- Rate lead quality from 1–10 based on clarity, intent, budget signals, and seriousness.
- Suggest next business action:
  - Follow-up
  - Qualification call
  - Ignore
  - Escalate to sales team

6. Decision Support
- Clearly state what the business should do next.
- Reduce decision-making time for owners, managers, and teams.

7. Tone & Rules
- Maintain a professional, confident, and concise business tone.
- Never assume facts not present in the message.
- Base all judgments strictly on observable message patterns.

Output strictly in JSON format with these exact fields:
{
  "riskLevel": "Safe | Suspicious | High Risk Fraud",
  "reason": "Detailed explanation of risk assessment",
  "businessImpact": "Explanation of potential business impact",
  "recommendedAction": "Clear action steps for the business",
  "suggestedReply": "Professional response suggestion (if applicable)",
  "leadQualityScore": number from 1-10 (only if this is a sales lead, otherwise 0),
  "businessInsight": "Strategic insight or key takeaway"
}`

function parseAnalysisResponse(text: string): AnalysisResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        riskLevel: parsed.riskLevel || 'Unknown',
        reason: parsed.reason || 'No reason provided',
        businessImpact: parsed.businessImpact || 'No impact assessment provided',
        recommendedAction: parsed.recommendedAction || 'No action recommended',
        suggestedReply: parsed.suggestedReply || undefined,
        leadQualityScore: parsed.leadQualityScore || 0,
        businessInsight: parsed.businessInsight || 'No insight provided'
      }
    }
  } catch (e) {
    console.error('JSON parsing failed:', e)
  }

  const lines = text.split('\n').filter(line => line.trim())

  const result: AnalysisResult = {
    riskLevel: 'Unknown',
    reason: '',
    businessImpact: '',
    recommendedAction: '',
    businessInsight: ''
  }

  let currentField = ''

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.match(/^Risk Level:/i)) {
      currentField = 'riskLevel'
      result.riskLevel = trimmed.replace(/^Risk Level:/i, '').trim()
    } else if (trimmed.match(/^Reason:/i)) {
      currentField = 'reason'
      result.reason = trimmed.replace(/^Reason:/i, '').trim()
    } else if (trimmed.match(/^Business Impact:/i)) {
      currentField = 'businessImpact'
      result.businessImpact = trimmed.replace(/^Business Impact:/i, '').trim()
    } else if (trimmed.match(/^Recommended Action:/i)) {
      currentField = 'recommendedAction'
      result.recommendedAction = trimmed.replace(/^Recommended Action:/i, '').trim()
    } else if (trimmed.match(/^Suggested Reply/i)) {
      currentField = 'suggestedReply'
      const reply = trimmed.replace(/^Suggested Reply[^:]*:/i, '').trim()
      if (reply) result.suggestedReply = reply
    } else if (trimmed.match(/^Lead Quality Score/i)) {
      currentField = 'leadQualityScore'
      const scoreMatch = trimmed.match(/(\d+)/)
      if (scoreMatch) result.leadQualityScore = parseInt(scoreMatch[1])
    } else if (trimmed.match(/^Business Insight:/i)) {
      currentField = 'businessInsight'
      result.businessInsight = trimmed.replace(/^Business Insight:/i, '').trim()
    } else if (trimmed && currentField) {
      if (currentField === 'suggestedReply') {
        result.suggestedReply = (result.suggestedReply || '') + '\n' + trimmed
      } else if (currentField in result && typeof result[currentField as keyof AnalysisResult] === 'string') {
        const key = currentField as keyof AnalysisResult
        const current = result[key]
        if (typeof current === 'string') {
          (result[key] as string) = current + ' ' + trimmed
        }
      }
    }
  }

  return result
}

async function analyzeWithClaude(message: string, senderInfo?: string, context?: string): Promise<AnalysisResult> {
  const userMessage = `
Message to analyze:
${message}

${senderInfo ? `Sender Information: ${senderInfo}` : ''}
${context ? `Business Context: ${context}` : ''}

Provide a complete business intelligence analysis.
`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: SYSTEM_PROMPT + '\n\n' + userMessage
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const analysisText = data.content[0].text

  return parseAnalysisResponse(analysisText)
}

async function analyzeWithOpenAI(message: string, senderInfo?: string, context?: string): Promise<AnalysisResult> {
  const userMessage = `
Message to analyze:
${message}

${senderInfo ? `Sender Information: ${senderInfo}` : ''}
${context ? `Business Context: ${context}` : ''}

Provide a complete business intelligence analysis.
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  const analysisText = data.choices[0].message.content

  return parseAnalysisResponse(analysisText)
}

async function analyzeWithFallback(message: string, senderInfo?: string, context?: string): Promise<AnalysisResult> {
  const fraudKeywords = ['urgent', 'wire', 'bank account', 'password', 'verify', 'suspended', 'click here', 'act now', 'limited time']
  const salesKeywords = ['interested', 'quote', 'pricing', 'demo', 'meeting', 'budget', 'looking for', 'need']
  const complaintKeywords = ['disappointed', 'unhappy', 'refund', 'complaint', 'terrible', 'awful', 'never again']

  const lowerMessage = message.toLowerCase()

  let isFraud = fraudKeywords.some(keyword => lowerMessage.includes(keyword))
  let isSales = salesKeywords.some(keyword => lowerMessage.includes(keyword))
  let isComplaint = complaintKeywords.some(keyword => lowerMessage.includes(keyword))

  const hasUrl = /https?:\/\//.test(message)
  const hasUrgency = /urgent|immediately|asap|right now|act now/i.test(message)
  const requestsInfo = /password|account|credit card|ssn|social security/i.test(message)

  let riskLevel = 'Safe'
  let reason = 'Message appears to be a normal business communication with no obvious risk indicators.'

  if ((isFraud || (hasUrgency && requestsInfo)) && hasUrl) {
    riskLevel = 'High Risk Fraud'
    reason = 'Message contains multiple fraud indicators: urgency pressure, requests for sensitive information, and external links. Pattern consistent with phishing or social engineering attacks.'
  } else if (hasUrgency || requestsInfo || (hasUrl && isFraud)) {
    riskLevel = 'Suspicious'
    reason = 'Message contains potential risk indicators such as urgency language, requests for information, or suspicious links. Requires careful verification before responding.'
  }

  let businessImpact = 'Minimal risk to business operations.'
  if (riskLevel === 'High Risk Fraud') {
    businessImpact = 'High risk of financial loss, data breach, or security compromise. Could lead to unauthorized access to systems, financial accounts, or sensitive business information.'
  } else if (riskLevel === 'Suspicious') {
    businessImpact = 'Moderate risk of security incident or fraud. Could potentially lead to data exposure or financial loss if not properly verified.'
  } else if (isComplaint) {
    businessImpact = 'Customer satisfaction and reputation risk. Requires prompt attention to prevent escalation and negative reviews.'
  } else if (isSales) {
    businessImpact = 'Potential revenue opportunity. Timely response could lead to new business.'
  }

  let recommendedAction = ''
  if (riskLevel === 'High Risk Fraud') {
    recommendedAction = 'DO NOT RESPOND. Do not click any links. Report to IT security team immediately. Block sender and mark as spam.'
  } else if (riskLevel === 'Suspicious') {
    recommendedAction = 'Verify sender identity through separate communication channel before responding. Do not click links or provide information. Consult security team if uncertain.'
  } else if (isComplaint) {
    recommendedAction = 'Respond within 24 hours. Acknowledge issue, apologize, and offer resolution. Escalate to customer service manager if needed.'
  } else if (isSales) {
    recommendedAction = 'Follow up within 24-48 hours. Qualify lead by understanding needs, budget, and timeline. Schedule discovery call if appropriate.'
  } else {
    recommendedAction = 'Respond professionally within 1-2 business days. Address inquiry directly and provide requested information.'
  }

  let suggestedReply = undefined
  if (riskLevel === 'Safe' && isSales) {
    suggestedReply = `Thank you for your interest in our services. I'd be happy to discuss how we can help meet your needs.\n\nCould you provide more details about:\n- Your specific requirements\n- Timeline for implementation\n- Budget considerations\n\nI'm available for a brief call this week to explore further. Please let me know your availability.\n\nBest regards`
  } else if (isComplaint) {
    suggestedReply = `Thank you for bringing this to our attention. I sincerely apologize for any inconvenience you've experienced.\n\nWe take these matters seriously and would like to resolve this as quickly as possible. Could you please provide additional details so we can investigate and address your concerns?\n\nI'm personally committed to ensuring we find a satisfactory resolution.\n\nBest regards`
  } else if (riskLevel === 'Safe') {
    suggestedReply = `Thank you for reaching out.\n\n[Address the specific inquiry or request here]\n\nPlease let me know if you need any additional information.\n\nBest regards`
  }

  let leadQualityScore = 0
  if (isSales && riskLevel === 'Safe') {
    leadQualityScore = 5
    if (lowerMessage.includes('budget')) leadQualityScore += 2
    if (lowerMessage.includes('timeline') || lowerMessage.includes('when')) leadQualityScore += 1
    if (lowerMessage.includes('demo') || lowerMessage.includes('meeting')) leadQualityScore += 1
    if (message.length > 200) leadQualityScore += 1
    leadQualityScore = Math.min(leadQualityScore, 10)
  }

  let businessInsight = ''
  if (isSales) {
    businessInsight = `This appears to be a sales opportunity. Lead quality: ${leadQualityScore}/10. Priority response recommended to maximize conversion potential.`
  } else if (isComplaint) {
    businessInsight = 'Customer retention risk. Immediate empathetic response required. This is an opportunity to demonstrate excellent customer service and prevent negative publicity.'
  } else if (riskLevel === 'High Risk Fraud') {
    businessInsight = 'Security threat detected. This message follows common fraud patterns. Employee training on security awareness is recommended to prevent future incidents.'
  } else if (riskLevel === 'Suspicious') {
    businessInsight = 'Exercise caution. Verify authenticity before engagement. Implement sender verification protocols for similar messages.'
  } else {
    businessInsight = 'Standard business communication. Respond professionally and maintain service level standards for response time.'
  }

  return {
    riskLevel,
    reason,
    businessImpact,
    recommendedAction,
    suggestedReply,
    leadQualityScore,
    businessInsight
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, senderInfo, context } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let result: AnalysisResult

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        result = await analyzeWithClaude(message, senderInfo, context)
      } catch (error) {
        console.error('Claude API failed, trying OpenAI:', error)
        if (process.env.OPENAI_API_KEY) {
          result = await analyzeWithOpenAI(message, senderInfo, context)
        } else {
          result = await analyzeWithFallback(message, senderInfo, context)
        }
      }
    } else if (process.env.OPENAI_API_KEY) {
      try {
        result = await analyzeWithOpenAI(message, senderInfo, context)
      } catch (error) {
        console.error('OpenAI API failed, using fallback:', error)
        result = await analyzeWithFallback(message, senderInfo, context)
      }
    } else {
      result = await analyzeWithFallback(message, senderInfo, context)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze message' },
      { status: 500 }
    )
  }
}
