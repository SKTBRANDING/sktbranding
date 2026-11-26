export type ProjectCategory = 
  | 'All'
  | 'Branding'
  | 'Logo Design'
  | 'Social Media'
  | 'Packaging'
  | 'Web Design';

export interface Project {
  id: string;
  title: string;
  slug: string;
  client: string;
  category: Exclude<ProjectCategory, 'All'>;
  year: string;
  coverImage: string;
  imageAlt: string;
  galleryImages: string[];
  videoUrl?: string; // Showcase video URL (MP4, WebM, MOV, or YouTube/Vimeo)
  videoAspectRatio?: '16:9' | '9:16'; // '16:9' (YouTube Widescreen) or '9:16' (Story / Reels Vertical)
  overview: string;
  services: string[];
  approach: string;
  externalLink?: string;
  isSample: boolean;
  isFeatured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  deliverables: string[];
  order: number;
  published: boolean;
}

export interface AgencyStat {
  id: string;
  value: string;
  label: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  thumbnail?: string;
}

export interface CoreValue {
  title: string;
  description: string;
}

export interface FounderInfo {
  name: string;
  role: string;
  bio: string;
  photo?: string;
  enabled: boolean;
}

export interface BrandLogo {
  id: string;
  name: string;
  tagline: string;
  image: string;
}

export interface WebsiteContent {
  hero: {
    badge: string;
    headline: string;
    supportingCopy: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
    heroImage?: string;
    stats: AgencyStat[];
  };
  about: {
    badge: string;
    headline: string;
    intro: string;
    approach: string;
    image?: string;
    values: CoreValue[];
    founder: FounderInfo;
  };
  process: {
    badge: string;
    headline: string;
    description: string;
    steps: ProcessStep[];
  };
  finalCta: {
    badge: string;
    headline: string;
    supportingCopy: string;
  };
  marqueeTitle?: string;
  partnerLogos?: BrandLogo[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
  rating: number;
  published: boolean;
  createdAt: string;
}

export type InquiryStatus = 'New' | 'Contacted' | 'Completed';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  service: string;
  description: string;
  status: InquiryStatus;
  createdAt: string;
  notes?: string;
}

export interface AgencySettings {
  agencyName: string;
  tagline: string;
  logoText: string;
  logoMarkUrl?: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  socialLinks: {
    whatsapp?: string;
    email?: string;
    instagram?: string;
    behance?: string;
    linkedin?: string;
    twitter?: string;
  };
  seoTitle: string;
  seoDescription: string;
  adminPassword?: string;
}

export interface Designer {
  id: string;
  name: string;
  email: string;
  specialty: string;
  avatar?: string;
  token: string;
  status: 'active' | 'inactive' | 'revoked';
  createdAt: string;
  lastActiveAt?: string;
  notes?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number; // in bytes
  type: string; // extension or mime type
  uploadedAt: string;
  category?: 'image' | 'pdf' | 'model' | 'audio' | 'archive' | 'design' | 'doc';
  duration?: number; // audio duration in seconds
}

export interface TaskSubmission {
  id: string;
  version: number;
  versionLabel: string; // 'Original Submission', 'Revision 1', 'Revision 2'...
  submittedAt: string;
  designerId: string;
  designerName: string;
  notes: string;
  files: TaskAttachment[];
  designerVoiceNote?: TaskAttachment | null;
  reviewStatus: 'pending' | 'revision_requested' | 'approved';
  reviewedAt?: string;
  adminFeedback?: string;
  adminVoiceFeedback?: TaskAttachment | null;
  adminFeedbackAttachments?: TaskAttachment[];
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 
  | 'available'           // Open for any eligible designer to claim
  | 'assigned'            // Assigned to a designer (pending start)
  | 'in_progress'         // Designer active on the task
  | 'submitted'           // Designer submitted deliverables, awaiting admin review
  | 'revision_requested'  // Admin reviewed and requested revisions
  | 'resubmitted'         // Designer submitted revised deliverables
  | 'completed';          // Admin approved the deliverables

export interface Task {
  id: string;
  title: string;
  client: string;
  brief: string;
  textContent?: string; // Text content / copy to be incorporated into design
  voiceBrief?: TaskAttachment | null; // Audio / voice instructions from admin
  deliverables: string;
  dimensions?: string;
  fileFormats?: string;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  assignedDesignerId?: string | null;
  assignedDesignerName?: string | null;
  assignedAt?: string;
  referenceFiles: TaskAttachment[];
  submissions: TaskSubmission[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  projects: Project[];
  services: ServiceItem[];
  content: WebsiteContent;
  testimonials: Testimonial[];
  inquiries: Inquiry[];
  settings: AgencySettings;
  designers: Designer[];
  tasks: Task[];
  invoices?: Invoice[];
}

export type InvoiceStatus = 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 
  | 'bank_transfer'
  | 'credit_card'
  | 'upi'
  | 'paypal'
  | 'stripe'
  | 'cash'
  | 'crypto';

export interface InvoiceItem {
  id: string;
  description: string;
  category?: string; // 'Branding' | 'Logo Design' | 'Social Media' | 'Packaging' | 'Web Design' | 'Motion' | 'Consulting'
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "SKT-INV-2026-001"
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCompany?: string;
  
  projectId?: string;
  projectName?: string; // e.g. "SOCIAL MEDIA POSTERS" or "Aethelgard Botanical Spirits"
  
  issueDate: string; // ISO date string (YYYY-MM-DD)
  dueDate: string;   // ISO date string (YYYY-MM-DD)
  
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;      // e.g. 5, 10, 18 percent
  taxAmount: number;
  discountRate: number; // percentage discount
  discountAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  
  status: InvoiceStatus;
  currency: string; // 'USD' | 'INR' | 'EUR' | 'AED' | 'GBP'
  paymentMethod?: PaymentMethod;
  paymentDetails?: string; // Bank account, SWIFT, UPI, IBAN
  notes?: string;          // Terms & conditions, payment terms
  
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
