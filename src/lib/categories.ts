// Category slugs used across the directory, admin review area and submissions.
// Order here is the order shown in the categories hub and the submit dropdown.
export const CATEGORIES = [
  { slug: "productivity", label: "Productivity" },
  { slug: "finance", label: "Finance" },
  { slug: "developer_tools", label: "Developer Tools" },
  { slug: "marketing_seo", label: "Marketing & SEO" },
  { slug: "design_creative", label: "Design & Creative" },
  { slug: "ai_tools", label: "AI Tools" },
  { slug: "task_management", label: "Task Management" },
  { slug: "note_taking", label: "Note Taking" },
  { slug: "time_tracking", label: "Time Tracking" },
  { slug: "automation", label: "Automation" },
  { slug: "calendar_scheduling", label: "Calendar & Scheduling" },
  { slug: "file_management", label: "File Management" },
  { slug: "email_management", label: "Email Management" },
  { slug: "distraction_blocking", label: "Distraction Blocking" },
  { slug: "api_tools", label: "API Tools" },
  { slug: "code_editors", label: "Code Editors" },
  { slug: "devops_ci_cd", label: "DevOps & CI/CD" },
  { slug: "database_tools", label: "Database Tools" },
  { slug: "testing_qa", label: "Testing & QA" },
  { slug: "security_dev", label: "Security for Developers" },
  { slug: "version_control", label: "Version Control" },
  { slug: "low_code_no_code", label: "Low-Code / No-Code" },
  { slug: "accounting_bookkeeping", label: "Accounting & Bookkeeping" },
  { slug: "payroll_hr", label: "Payroll & HR" },
  { slug: "crm_sales", label: "CRM & Sales" },
  { slug: "e_commerce_tools", label: "E-Commerce Tools" },
  { slug: "marketing_automation", label: "Marketing Automation" },
  { slug: "analytics_reporting", label: "Analytics & Reporting" },
  { slug: "tax_compliance", label: "Tax & Compliance" },
  { slug: "investment_crypto", label: "Investment & Crypto" },
  { slug: "graphic_design", label: "Graphic Design" },
  { slug: "video_editing", label: "Video Editing" },
  { slug: "audio_production", label: "Audio Production" },
  { slug: "photo_editing", label: "Photo Editing" },
  { slug: "3d_modeling", label: "3D Modeling" },
  { slug: "writing_content", label: "Writing & Content" },
  { slug: "presentation_deck", label: "Presentation Decks" },
  { slug: "branding_identity", label: "Branding & Identity" },
  { slug: "chatbots_conversational", label: "Chatbots & Conversational AI" },
  { slug: "image_generation", label: "Image Generation" },
  { slug: "text_generation", label: "Text Generation" },
  { slug: "data_analysis_ai", label: "Data Analysis & AI" },
  { slug: "voice_synthesis", label: "Voice Synthesis" },
  { slug: "recommendation_engine", label: "Recommendation Engines" },
  { slug: "health_wellness", label: "Health & Wellness" },
  { slug: "education_learning", label: "Education & Learning" },
  { slug: "social_networking", label: "Social Networking" },
  { slug: "gaming_entertainment", label: "Gaming & Entertainment" },
  { slug: "travel_planning", label: "Travel Planning" },
  { slug: "real_estate", label: "Real Estate" },
  { slug: "legal_compliance", label: "Legal & Compliance" },
  { slug: "reentry_workforce", label: "Reentry & Workforce" },
  { slug: "security_privacy", label: "Security & Privacy" },
  { slug: "system_utilities", label: "System Utilities" },
  { slug: "other", label: "Other" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);

export function categoryLabel(slug: string | null | undefined): string {
  if (!slug) return "Uncategorized";
  const found = CATEGORIES.find((c) => c.slug === slug);
  return found ? found.label : slug.replace(/_/g, " ");
}

export function isKnownCategory(slug: string | null | undefined): boolean {
  return !!slug && CATEGORY_SLUGS.includes(slug);
}
