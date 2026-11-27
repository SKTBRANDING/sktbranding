const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Update Baithul Rasa client logo
if (Array.isArray(db.clients)) {
  const c = db.clients.find((cl) => {
    const n = (cl.name || '').toUpperCase();
    return n.includes('BAITHUL') || n.includes('BAITUL');
  });
  if (c) {
    c.logo = '/logos/baitul-rasa-emblem.svg';
  }
}

// 2. Prepare Sample Images
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
let availableUploads = [];
if (fs.existsSync(uploadsDir)) {
  availableUploads = fs
    .readdirSync(uploadsDir)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f) && !f.includes('qr') && !f.includes('logo'))
    .map((f) => '/uploads/' + f);
}

const posters = [
  'https://res.cloudinary.com/unzkhevi/image/upload/v1795720410/sktbranding/1795720406752_3.jpg',
  '/uploads/8279fce2-e_4.jpg',
  ...availableUploads.slice(0, 6),
].slice(0, 8);

const stickers = availableUploads.slice(6, 12);
const menus = availableUploads.slice(12, 16);
const growth = availableUploads.slice(16, 20);

const sampleReport = {
  id: 'rep-baithulrasa-oct2026',
  clientId: 'client-baithulrasa',
  clientName: 'BAITHULRASA',
  clientLogo: '/logos/baitul-rasa-emblem.svg',
  reportMonth: 'October 2026',
  reportTitle: 'BAITHULRASA MONTHLY REPORT',
  executiveSummaryTitle: 'Social Media Report – October 2026',
  executiveSummaryText:
    'We take immense pride in presenting the comprehensive visual deliverables and creative campaign progress executed across this billing cycle. Every assignment was strategically developed to elevate brand recall, reinforce market authority, and drive targeted consumer engagement across digital touchpoints.\n\nOur creative trajectory continues to prioritize strategic visual direction, coherent brand aesthetics, and maximum campaign resonance. Consistent aesthetics and high-fidelity typography selections across all creative formats have solidified an unmistakable and polished visual identity. Visual cohesion is paramount in capturing consumer mindshare, and this month\'s execution guarantees prominent standing against regional competition.\n\nThrough strategic communication architecture, high-impact poster storytelling, and meticulously crafted promotional collateral, we maintained consistent brand visibility and premium market positioning. Every visual asset was engineered to resonate with core demographics, supporting measurable brand growth and sustained customer loyalty.\n\nMoving forward, our studio remains committed to introducing progressive creative assets, refined brand collateral, and forward-looking visual strategies that command lasting attention across every digital and retail medium.',
  sections: [
    {
      id: 'sec-posters-1',
      title: 'SOCIAL MEDIA CREATIVE POSTERS',
      category: 'SOCIAL MEDIA CREATIVE POSTERS',
      items: posters.map((url, i) => ({
        id: 'pos-' + (i + 1),
        title: 'Creative Poster #' + (i + 1),
        imageUrl: url,
        category: 'Poster',
      })),
    },
    {
      id: 'sec-stickers-2',
      title: 'RATE STICKER',
      category: 'RATE STICKER',
      items: (stickers.length ? stickers : posters.slice(0, 6)).map((url, i) => ({
        id: 'stk-' + (i + 1),
        title: 'Rate Sticker #' + (i + 1),
        imageUrl: url,
        category: 'Sticker',
      })),
    },
    {
      id: 'sec-menus-3',
      title: 'MENU CARD DESIGN',
      category: 'MENU CARD DESIGN',
      items: (menus.length ? menus : posters.slice(0, 4)).map((url, i) => ({
        id: 'menu-' + (i + 1),
        title: 'Menu Card #' + (i + 1),
        imageUrl: url,
        category: 'Menu',
      })),
    },
    {
      id: 'sec-growth-4',
      title: 'SOCIAL MEDIA GROWTH',
      category: 'SOCIAL MEDIA GROWTH',
      items: (growth.length ? growth : posters.slice(0, 4)).map((url, i) => ({
        id: 'grw-' + (i + 1),
        title: 'Analytics & Growth #' + (i + 1),
        imageUrl: url,
        category: 'Growth',
      })),
    },
  ],
  thankYouTitle: 'THANK YOU',
  status: 'finalized',
  theme: {
    coverBackground: 'dark_gradient',
    pageBackground: '#FAF7F2',
    primaryColor: '#D60000',
    textColor: '#1A1A1A',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

if (!Array.isArray(db.reports) || db.reports.length === 0) {
  db.reports = [sampleReport];
} else {
  const r = db.reports.find(
    (rep) => rep.id === 'rep-baithulrasa-oct2026' || (rep.clientName || '').toUpperCase().includes('BAITHUL')
  );
  if (r) {
    r.clientLogo = '/logos/baitul-rasa-emblem.svg';
    if (!r.sections || r.sections.length === 0) {
      r.sections = sampleReport.sections;
    }
  } else {
    db.reports.unshift(sampleReport);
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Successfully seeded report and client logo into db.json!');
