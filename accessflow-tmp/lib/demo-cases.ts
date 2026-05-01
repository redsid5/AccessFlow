import { TriageResult, ContentType } from './types'

interface DemoCase {
  id: string
  type: ContentType
  label: string
  description: string
  result: TriageResult
}

export const DEMO_CASES: DemoCase[] = [
  {
    id: 'flyer',
    type: 'pdf',
    label: 'Spring 2022 event flyer.pdf',
    description: 'Old event flyer — typical low-value archive PDF',
    result: {
      decision: 'delete',
      priority: 'Low',
      contentDescription: 'Past event flyer PDF',
      why: 'Event passed two years ago. No student can act on this and no compliance clock is running.',
      action: 'Remove from all public links. Archive internally if records are required.',
      owner: 'Department content owner',
      confidence: 94,
      signals: {
        publicFacing: true,
        studentImpact: false,
        betterAsHTML: true,
        likelyLowValue: true,
        timeSensitive: false,
        missionCritical: false
      },
      priorityScore: {
        studentImpact: 1,
        legalRisk: 1,
        usageFrequency: 1,
        contentReplaceability: 2,
        timeSensitivity: 1,
        total: 12
      },
      estimatedEffort: '10 min',
      usageSignal: 'archived',
      wcagContext: '',
      roleNote: 'Mark for deletion — no remediation time required.'
    }
  },
  {
    id: 'accommodation',
    type: 'pdf',
    label: 'disability-accommodation-request.pdf',
    description: 'Accommodation form — highest-priority document type',
    result: {
      decision: 'fix',
      priority: 'High',
      contentDescription: 'Accommodation request form PDF',
      why: 'An inaccessible accommodation form directly blocks students with disabilities from the services they are legally entitled to. This is the highest-risk document type on campus.',
      action: 'Replace with an accessible HTML web form within 2 weeks. If that is not possible, remediate the PDF: fix reading order, tag all form fields, verify tab order.',
      owner: 'Accessibility office + Web team',
      confidence: 97,
      signals: {
        publicFacing: true,
        studentImpact: true,
        betterAsHTML: true,
        likelyLowValue: false,
        timeSensitive: true,
        missionCritical: true
      },
      priorityScore: {
        studentImpact: 10,
        legalRisk: 10,
        usageFrequency: 8,
        contentReplaceability: 9,
        timeSensitivity: 9,
        total: 92
      },
      estimatedEffort: 'multi-team project',
      usageSignal: 'high-traffic',
      wcagContext: 'WCAG 2.1 AA: 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value — form fields must be programmatically labeled',
      roleNote: 'Assign an owner today. This belongs on the highest-priority remediation list.'
    }
  },
  {
    id: 'tuition',
    type: 'url',
    label: 'university.edu/tuition-payment-deadlines',
    description: 'Tuition deadline page — active, high-stakes content',
    result: {
      decision: 'fix',
      priority: 'High',
      contentDescription: 'Tuition payment deadline page',
      why: 'Students who cannot access payment deadline information may incur late fees or lose enrollment. High traffic, time-bound, and directly tied to financial standing.',
      action: 'Audit heading structure, keyboard navigation, and any embedded tables before the next payment deadline. Assign web team as primary owner.',
      owner: 'Web team',
      confidence: 91,
      signals: {
        publicFacing: true,
        studentImpact: true,
        betterAsHTML: false,
        likelyLowValue: false,
        timeSensitive: true,
        missionCritical: true
      },
      priorityScore: {
        studentImpact: 9,
        legalRisk: 8,
        usageFrequency: 9,
        contentReplaceability: 7,
        timeSensitivity: 9,
        total: 86
      },
      estimatedEffort: '2 hours',
      usageSignal: 'seasonal',
      wcagContext: 'WCAG 2.1 AA: 1.3.1, 2.4.6 Headings and Labels, 2.1.1 Keyboard — deadline pages often have complex table structures',
      roleNote: 'Flag for the next sprint. Payment deadlines create urgency that compounds accessibility risk.'
    }
  }
]
