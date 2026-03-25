import { collection, addDoc, Timestamp, getDocs, query, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const MOCK_MOAS = [
  {
    hteId: 'HTE-2026-001',
    companyName: 'Google Philippines',
    address: 'BGC Corporate Center, 30th St, Taguig, Metro Manila',
    contactPerson: 'Sundar Pichai',
    contactEmail: 's.pichai@google.com',
    industryType: 'Information Technology',
    effectiveDate: Timestamp.fromDate(new Date('2026-01-10')),
    status: 'APPROVED: Signed by President',
    college: 'CEIT',
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'system-seed'
  },
  {
    hteId: 'HTE-2026-002',
    companyName: 'Microsoft Philippines',
    address: '6750 Ayala Ave, Makati, Metro Manila',
    contactPerson: 'Satya Nadella',
    contactEmail: 's.nadella@microsoft.com',
    industryType: 'Information Technology',
    effectiveDate: Timestamp.fromDate(new Date('2026-02-15')),
    status: 'APPROVED: Ongoing Notarization',
    college: 'CEIT',
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'system-seed'
  },
  {
    hteId: 'HTE-2026-003',
    companyName: 'Apple South Asia Pte Ltd',
    address: 'Ayala Center, Makati, Metro Manila',
    contactPerson: 'Tim Cook',
    contactEmail: 't.cook@apple.com',
    industryType: 'Information Technology',
    effectiveDate: Timestamp.fromDate(new Date('2026-03-01')),
    status: 'APPROVED: No Notarization Needed',
    college: 'CEIT',
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'system-seed'
  },
  {
    hteId: 'HTE-2026-004',
    companyName: 'Amazon Web Services Philippines',
    address: 'Zuellig Building, Makati Ave, Makati, Metro Manila',
    contactPerson: 'Andy Jassy',
    contactEmail: 'a.jassy@amazon.com',
    industryType: 'Information Technology',
    effectiveDate: Timestamp.fromDate(new Date('2026-03-20')),
    status: 'PROCESSING: MOA draft sent to Legal Office for review',
    college: 'CEIT',
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'system-seed'
  },
  {
    hteId: 'HTE-2026-005',
    companyName: 'Meta Platforms Philippines',
    address: 'One Bonifacio High Street, BGC, Taguig',
    contactPerson: 'Mark Zuckerberg',
    contactEmail: 'm.zuckerberg@meta.com',
    industryType: 'Media & Arts',
    effectiveDate: Timestamp.fromDate(new Date('2026-01-05')),
    status: 'APPROVED: Signed by President',
    college: 'CAS',
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'system-seed'
  },
  {
    hteId: 'HTE-2026-006',
    companyName: 'Tesla Philippines',
    address: 'Uptown Mall, BGC, Taguig',
    contactPerson: 'Elon Musk',
    contactEmail: 'e.musk@tesla.com',
    industryType: 'Construction',
    effectiveDate: Timestamp.fromDate(new Date('2026-02-28')),
    status: 'EXPIRING: Two months before expiration date',
    college: 'CEIT',
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'system-seed'
  },
  {
    hteId: 'HTE-2026-007',
    companyName: 'Netflix Philippines',
    address: 'Scout Area, Quezon City, Metro Manila',
    contactPerson: 'Reed Hastings',
    contactEmail: 'r.hastings@netflix.com',
    industryType: 'Media & Arts',
    effectiveDate: Timestamp.fromDate(new Date('2026-03-15')),
    status: 'APPROVED: Signed by President',
    college: 'CAS',
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'system-seed'
  }
];

export const seedMockMOAs = async (force = false) => {
  try {
    const moasRef = collection(db, 'moas');
    
    if (force) {
      console.log('Clearing existing MOAs...');
      const allDocsSnapshot = await getDocs(moasRef);
      for (const d of allDocsSnapshot.docs) {
        await deleteDoc(doc(db, 'moas', d.id));
      }
      console.log('Existing MOAs cleared.');
    }

    const q = query(moasRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty || force) {
      console.log('Seeding mock MOAs...');
      for (const moa of MOCK_MOAS) {
        await addDoc(moasRef, moa);
      }
      console.log('Mock MOAs seeded successfully!');
      return true;
    } else {
      console.log('MOAs collection is not empty. Skipping seed.');
      return false;
    }
  } catch (error) {
    console.error('Error seeding mock MOAs:', error);
    return false;
  }
};
