/**
 * ai-agents.js
 * 
 * Uses the official `openai` SDK to call Nvidia's API endpoint.
 * Includes support for any reasoning content that the model outputs.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  dangerouslyAllowBrowser: true // Required for running SDK in Vite React Client
});

/**
 * Generic helper to call the OpenAI Chat Completions API via the SDK.
 */
async function callAgentAPI(systemPrompt, userPrompt) {
  const completion = await openai.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 1,
    top_p: 1,
    max_tokens: 4096,
    // Note: We disabled streaming (stream: false) so we can fully await
    // the JSON result to automatically populate your React dashboard UI.
    stream: false,
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0]?.message?.content || '{}';
  
  // Strip out potential <think> tags (used by reasoning models) and markdown code blocks
  const cleanContent = content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Parse the content cleanly assuming the model returned valid JSON
  try {
    return JSON.parse(cleanContent);
  } catch (err) {
    console.error("Failed to parse agent JSON:", cleanContent);
    throw err;
  }
}

/**
 * AGENT 1: SETUP / PROFILE AGENT
 */
export async function setupProfileAgent({ name, goals, subjects, level, hours }) {
  const systemPrompt = `You are the Expert Setup Agent. Your job is to initialize a master curriculum in JSON format.
You will extract topics based on the subjects and structure a logical learning path.
Respond ONLY with a JSON object.`;

  const userPrompt = `
PROFILE:
Name: ${name}
Goals: ${goals}
Subjects/Technologies: ${subjects}
Current Level: ${level}
Daily Available Hours: ${hours}

Generate a structured JSON curriculum based on this profile.`;

  return callAgentAPI(systemPrompt, userPrompt);
}

/**
 * AGENT 2: DAILY PLANNER
 */
export async function generateDailyPlanner({ name, goals, subjects, level, hours, day, sessionsList }) {
  const systemPrompt = `You are the Daily Planner Agent. Break down the overarching goals into actionable, time-boxed technical sessions.
Respond ONLY with a JSON object containing an array of 'sessions'.`;

  const userPrompt = `
CONTEXT:
Name: ${name}
Subject: ${subjects}
Current Day: ${day}
Hours Today: ${hours}

PREVIOUS SESSIONS/CURRICULUM STATE:
${sessionsList}

Create today's schedule. Break tasks into logical chunks that fit within ${hours} hours.`;

  return callAgentAPI(systemPrompt, userPrompt);
}

/**
 * AGENT 3: SESSION TRACKER / COACH
 */
export async function sessionCoachAgent({ completedList, currentSessionData, userQuery }) {
  const systemPrompt = `You are the Session Tracker Coach. The user is currently studying. 
Provide focused code examples, explanations, and resources tailored to their immediate topic.
Respond ONLY in JSON.`;

  const userPrompt = `
CURRENT SESSION:
${JSON.stringify(currentSessionData)}

PREVIOUSLY COMPLETED:
${completedList}

USER ASKED / USER INPUT:
${userQuery}

Help the user understand the current topic or provide the next logical step.`;

  return callAgentAPI(systemPrompt, userPrompt);
}

/**
 * AGENT 4: DAILY REFLECTION
 */
export async function dailyReflectionAgent({ day, completedList, notes }) {
  const systemPrompt = `You are the Daily Reflection Agent. Summarize the user's progress today, identify gaps, and log achievements.
Respond ONLY with a JSON object.`;

  const userPrompt = `
SUMMARY REQUIRED FOR DAY: ${day}

COMPLETED TODAY:
${completedList}

USER NOTES/STRUGGLES:
${notes}

Generate a structured daily summary JSON object.`;

  return callAgentAPI(systemPrompt, userPrompt);
}

/**
 * AGENT 5: WEEKLY REVIEWER
 */
export async function weeklyReviewAgent({ name, weeklyLogsJson, goals }) {
  const systemPrompt = `You are the Weekly Reviewer Agent. Analyze a week's worth of learning logs and adjust the trajectory.
Recommend adjustments, highlight strengths, and identify bottlenecks.
Respond ONLY with a JSON object.`;

  const userPrompt = `
Name: ${name}
Ultimate Goals: ${goals}

LAST 7 DAYS OF LOGS:
${weeklyLogsJson}

Analyze the week. Did they hit their hours? Where did they get stuck? Generate a weekly review JSON.`;

  return callAgentAPI(systemPrompt, userPrompt);
}
