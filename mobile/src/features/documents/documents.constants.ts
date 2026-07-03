import { DocumentItem } from './documents.types';

export const CATEGORIES = ['All', 'Govt IDs', 'Certificates', 'Education', 'Other'] as const;

export type CategoryType = typeof CATEGORIES[number];

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'driving_license',
    title: 'Driving license',
    subtitle: 'AP12345 · Nikhil Kumar',
    expiryText: '5 days',
    category: 'Govt IDs',
    state: 'danger',
    iconName: 'card-outline',
  },
  {
    id: 'aadhaar_card',
    title: 'Aadhaar card',
    subtitle: 'XXXX XXXX 4521',
    expiryText: 'Lifetime',
    category: 'Govt IDs',
    state: 'info',
    iconName: 'card-outline',
  },
  {
    id: 'pan_card',
    title: 'PAN card',
    subtitle: 'ABCPN1234K',
    expiryText: 'Lifetime',
    category: 'Govt IDs',
    state: 'info',
    iconName: 'card-outline',
  },
  {
    id: 'income_certificate',
    title: 'Income certificate',
    subtitle: 'Telangana Govt · 2024',
    expiryText: '30 days',
    category: 'Certificates',
    state: 'warning',
    iconName: 'document-text-outline',
  },
  {
    id: '10th_marksheet',
    title: '10th marksheet',
    subtitle: 'CBSE · 2022',
    expiryText: 'Valid',
    category: 'Education',
    state: 'success',
    iconName: 'school-outline',
  },
  {
    id: 'passport',
    title: 'Passport',
    subtitle: 'A1234567 · Expires 2027',
    expiryText: '2 years',
    category: 'Govt IDs',
    state: 'success',
    iconName: 'airplane-outline',
  },
];
