import type { ConditionKey } from '../profile.js'

/**
 * Patient-education reference for a condition. Informational only — not medical advice.
 * Shown in the glossary UI and available to the assistant via lookup tools.
 */
export interface ConditionReference {
  key: ConditionKey
  displayName: string
  /** Plain-language overview (2–4 sentences). */
  summary: string
  whatItMeans: string
  commonSymptoms: string[]
  whyTrackingMatters: string
  /** General lifestyle topics often discussed — not personalized prescriptions. */
  commonlyDiscussed: string[]
  questionsForYourDoctor: string[]
  /** NIH, ADA, NIMH, etc. */
  learnMore: Array<{ label: string; url: string }>
  disclaimer: string
}

export const CONDITION_GLOSSARY_DISCLAIMER =
  'This is general patient education, not medical advice for your situation. Your care team knows your full history — use this to prepare questions, not to self-diagnose or change treatment.'

export const CONDITION_GLOSSARY: Partial<Record<ConditionKey, ConditionReference>> = {
  diabetes_t2: {
    key: 'diabetes_t2',
    displayName: 'Type 2 Diabetes',
    summary:
      'Type 2 diabetes means your body has trouble using insulin effectively, so blood sugar can run higher than normal over time. It is common and manageable with medications, food choices, activity, and monitoring.',
    whatItMeans:
      'Insulin is a hormone that helps sugar from food enter your cells for energy. In type 2 diabetes, cells become more resistant to insulin and the pancreas may not make enough — glucose builds up in the blood.',
    commonSymptoms: [
      'Increased thirst or urination',
      'Fatigue',
      'Blurred vision',
      'Slow-healing cuts',
      'Many people have no symptoms at first',
    ],
    whyTrackingMatters:
      'Patterns in glucose, A1C, weight, and blood pressure help you and your doctor see whether your plan is working and catch highs and lows before they become emergencies.',
    commonlyDiscussed: [
      'Target blood sugar ranges (personalized by your doctor)',
      'A1C goals',
      'Medications such as metformin, GLP-1 agonists, or insulin if prescribed',
      'Carbohydrate awareness and meal timing',
      'Foot care and annual eye exams',
    ],
    questionsForYourDoctor: [
      'What are my personal glucose and A1C targets?',
      'When should I call you vs. go to urgent care for a high or low?',
      'How often should I check my blood sugar?',
      'What symptoms mean I need help right away?',
    ],
    learnMore: [
      { label: 'CDC — Type 2 Diabetes', url: 'https://www.cdc.gov/diabetes/basics/type2.html' },
      { label: 'American Diabetes Association', url: 'https://diabetes.org' },
    ],
    disclaimer: CONDITION_GLOSSARY_DISCLAIMER,
  },

  schizophrenia: {
    key: 'schizophrenia',
    displayName: 'Schizophrenia',
    summary:
      'Schizophrenia is a serious mental health condition that affects how a person thinks, feels, and relates to others. With consistent treatment and support, many people manage symptoms well and lead fulfilling lives.',
    whatItMeans:
      'It is a brain disorder, not a character flaw. Symptoms can include hallucinations, delusions, disorganized thinking, and reduced motivation. Onset is often in late teens or early adulthood.',
    commonSymptoms: [
      'Hearing or seeing things others do not (hallucinations)',
      'Fixed false beliefs (delusions)',
      'Difficulty organizing thoughts or speech',
      'Reduced expression or motivation',
      'Symptoms vary widely between people',
    ],
    whyTrackingMatters:
      'Sleep, mood, medication adherence, and side effects often change before a relapse. Tracking helps you and your psychiatrist spot patterns early.',
    commonlyDiscussed: [
      'Antipsychotic medications and adherence',
      'Side effects such as weight gain, sedation, or movement changes',
      'Sleep regularity',
      'Therapy and supported employment or housing',
      'Substance use and interactions with meds',
    ],
    questionsForYourDoctor: [
      'What should I do if I miss doses?',
      'Which side effects are urgent vs. expected?',
      'What early warning signs mean we should adjust the plan?',
      'How does this medication interact with my other prescriptions?',
    ],
    learnMore: [
      { label: 'NIMH — Schizophrenia', url: 'https://www.nimh.nih.gov/health/topics/schizophrenia' },
    ],
    disclaimer: CONDITION_GLOSSARY_DISCLAIMER,
  },

  hypertension: {
    key: 'hypertension',
    displayName: 'High Blood Pressure (Hypertension)',
    summary:
      'Hypertension means the force of blood against artery walls is consistently too high. It often has no symptoms but raises risk for stroke, heart attack, and kidney disease over time.',
    whatItMeans:
      'Blood pressure is written as two numbers: systolic (pressure when the heart beats) over diastolic (pressure between beats). Guidelines define elevated and high stages; your doctor sets your personal target.',
    commonSymptoms: [
      'Usually none — which is why home monitoring matters',
      'Severe headache or vision changes can signal a hypertensive crisis — seek care',
    ],
    whyTrackingMatters:
      'Home readings show patterns office visits miss. Trends help your doctor adjust medications and lifestyle recommendations.',
    commonlyDiscussed: [
      'Sodium intake',
      'Weight and activity',
      'Medications such as ACE inhibitors, ARBs, diuretics, or calcium channel blockers',
      'Correct cuff size and measurement technique',
    ],
    questionsForYourDoctor: [
      'What is my target blood pressure?',
      'When should I take readings at home?',
      'Could any of my other meds affect blood pressure?',
    ],
    learnMore: [
      { label: 'CDC — High Blood Pressure', url: 'https://www.cdc.gov/high-blood-pressure/index.html' },
    ],
    disclaimer: CONDITION_GLOSSARY_DISCLAIMER,
  },

  depression: {
    key: 'depression',
    displayName: 'Depression (Major Depressive Disorder)',
    summary:
      'Depression is more than feeling sad — it is a medical condition that affects mood, energy, sleep, appetite, and concentration for weeks or longer. It is treatable with therapy, medication, or both.',
    whatItMeans:
      'Brain chemistry, genetics, stress, and medical conditions can all contribute. It is not weakness and not something you can simply "snap out of."',
    commonSymptoms: [
      'Low mood or loss of interest',
      'Sleep or appetite changes',
      'Fatigue',
      'Difficulty concentrating',
      'Feelings of worthlessness or guilt',
    ],
    whyTrackingMatters:
      'PHQ-9 scores and mood logs over time show whether treatment is helping and catch worsening early.',
    commonlyDiscussed: [
      'Antidepressants and time to effect (often 4–6 weeks)',
      'Therapy approaches',
      'Sleep hygiene',
      'Activity scheduling',
    ],
    questionsForYourDoctor: [
      'How long before we expect improvement on this medication?',
      'What side effects should I report?',
      'When should we reconsider the treatment plan?',
    ],
    learnMore: [
      { label: 'NIMH — Depression', url: 'https://www.nimh.nih.gov/health/topics/depression' },
    ],
    disclaimer: CONDITION_GLOSSARY_DISCLAIMER,
  },
}

export function getConditionReference(key: ConditionKey): ConditionReference | undefined {
  return CONDITION_GLOSSARY[key]
}
