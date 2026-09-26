import { FeatureConfig, SubjectPreset } from '../types';

export const FEATURES: FeatureConfig[] = [
  {
    id: 'ask',
    title: 'Ask a Question',
    shortLabel: 'Ask a Question',
    tagline: 'Get instant, clear answers to any college question or theory',
    placeholder: 'Type your academic question here (e.g., How does photosynthesis work? What is Amdahl\'s Law?)...',
    buttonText: 'Ask AI',
    iconName: 'Sparkles',
    samplePrompt: 'What is the difference between microeconomics and macroeconomics?',
    examples: [
      'What is the difference between microeconomics and macroeconomics?',
      'How does the Doppler effect apply to astronomy and cosmology?',
      'Explain the key differences between mitosis and meiosis.',
    ],
  },
  {
    id: 'explain',
    title: 'Explain a Topic',
    shortLabel: 'Explain a Topic',
    tagline: 'Break down complex concepts into simple, everyday language',
    placeholder: 'Enter a difficult college topic (e.g., Fourier Transform, Normal Distribution, Pointers in C)...',
    buttonText: 'Explain Topic',
    iconName: 'Lightbulb',
    samplePrompt: 'Explain how the Central Limit Theorem works with a simple analogy.',
    examples: [
      'Explain how the Central Limit Theorem works with a simple analogy.',
      'Explain Heisenberg\'s Uncertainty Principle like I\'m five.',
      'How does public-key cryptography (RSA) actually work intuitively?',
    ],
  },
  {
    id: 'notes',
    title: 'Create Study Notes',
    shortLabel: 'Create Study Notes',
    tagline: 'Generate concise, high-yield revision summaries and key points',
    placeholder: 'Enter a chapter, topic, or paste lecture text to summarize into revision notes...',
    buttonText: 'Create Study Notes',
    iconName: 'FileText',
    samplePrompt: 'Keynesian Economics vs Classical Economics core principles and formulas.',
    examples: [
      'Keynesian Economics vs Classical Economics core principles and formulas.',
      'Summary of Krebs Cycle (Citric Acid Cycle): inputs, outputs, key enzymes.',
      'Newton\'s 3 Laws of Motion with formulas and calculus derivations.',
    ],
  },
  {
    id: 'practice',
    title: 'Practice Exam Questions',
    shortLabel: 'Practice Exam Questions',
    tagline: 'Generate exam-prep questions with solutions to test your knowledge',
    placeholder: 'Enter the subject or topic you want to test yourself on...',
    buttonText: 'Generate Questions',
    iconName: 'GraduationCap',
    samplePrompt: 'Cellular respiration and ATP synthesis for an introductory biology exam.',
    examples: [
      'Cellular respiration and ATP synthesis for an introductory biology exam.',
      'Data structures: Binary Search Trees, Big-O complexity, and traversal.',
      'Organic Chemistry: SN1 vs SN2 reaction mechanisms with sample reactions.',
    ],
  },
  {
    id: 'code',
    title: 'Explain Code',
    shortLabel: 'Explain Code',
    tagline: 'Understand programming logic, algorithms, and fix tricky bugs',
    placeholder: 'Paste your code snippet or error message here (Python, Java, C++, JS, SQL)...',
    buttonText: 'Explain Code',
    iconName: 'Code2',
    samplePrompt: `def find_average(numbers):\n    total = 0\n    for n in numbers:\n        total += n\n    return total / len(numbers)\n\n# Why does this fail when numbers is empty, and how do I fix it?`,
    examples: [
      `def find_average(numbers):\n    total = 0\n    for n in numbers:\n        total += n\n    return total / len(numbers)\n\n# Why does this fail when numbers is empty, and how do I fix it?`,
      `// Java: What does NullPointerException mean here?\nString text = null;\nif (text.equals("hello")) {\n    System.out.println("Match!");\n}`,
      `SELECT department, AVG(salary) FROM employees WHERE AVG(salary) > 50000 GROUP BY department;\n-- Why does SQL give an error on this WHERE clause?`,
    ],
  },
];

export const SUBJECT_PRESETS: SubjectPreset[] = [
  {
    id: 'cs',
    label: 'Computer Science',
    icon: '💻',
    sampleQuery: 'Explain recursion vs iteration with a factorial example in Python.',
    suggestedFeature: 'code',
  },
  {
    id: 'math',
    label: 'Math & Stats',
    icon: '📐',
    sampleQuery: 'Explain the difference between Type I and Type II errors in hypothesis testing.',
    suggestedFeature: 'explain',
  },
  {
    id: 'bio',
    label: 'Biology & Chem',
    icon: '🧬',
    sampleQuery: 'Make high-yield exam notes on Photosynthesis Light Reactions vs Calvin Cycle.',
    suggestedFeature: 'notes',
  },
  {
    id: 'econ',
    label: 'Economics',
    icon: '📊',
    sampleQuery: 'Practice exam questions on Elasticity of Demand and Consumer Surplus.',
    suggestedFeature: 'practice',
  },
  {
    id: 'phys',
    label: 'Physics',
    icon: '⚡',
    sampleQuery: 'Explain Electromagnetic Induction and Faraday\'s Law with simple real-world examples.',
    suggestedFeature: 'explain',
  },
];

