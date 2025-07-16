export interface Template {
  id: string;
  title: string;
  thumbnail: string;
}

export interface TemplateCategory {
  category: string;
  templates: Template[];
}

// Only use fallback mock data
export const TEMPLATES: TemplateCategory[] = [
  {
    category: "Flyers",
    templates: [
      { id: "flyer1", title: "Sale Poster", thumbnail: "https://i.postimg.cc/Wt4X897X/Fly3.jpg" },
      { id: "flyer2", title: "Birthday Flyer", thumbnail: "https://i.postimg.cc/5jkpRw71/Fly4.jpg" },
      { id: "flyer3", title: "Workshop Flyer", thumbnail: "https://i.postimg.cc/7Jb9L6Lp/Fly5.jpg" },
      { id: "flyer4", title: "Graduation Flyer", thumbnail: "https://i.postimg.cc/TLtQGmTV/Fly6.jpg" },
      { id: "flyer5", title: "Job Fair Flyer", thumbnail: "https://i.postimg.cc/N9sbWbvG/Fly7.jpg" }
    ]
  },
  {
    category: "Posters",
    templates: [
      { id: "poster1", title: "Concert Poster", thumbnail: "https://picsum.photos/150/90?random=6" },
      { id: "poster2", title: "Conference Poster", thumbnail: "https://picsum.photos/150/90?random=7" },
      { id: "poster3", title: "Movie Poster", thumbnail: "https://picsum.photos/150/90?random=8" },
      { id: "poster4", title: "Festival Poster", thumbnail: "https://picsum.photos/150/90?random=9" },
      { id: "poster5", title: "Announcement Poster", thumbnail: "https://picsum.photos/150/90?random=10" }
    ]
  },
  {
    category: "Cards & Invites",
    templates: [
      { id: "card1", title: "Business Card", thumbnail: "https://picsum.photos/150/90?random=11" },
      { id: "card2", title: "Holiday Card", thumbnail: "https://picsum.photos/150/90?random=12" },
      { id: "card3", title: "Wedding Invite", thumbnail: "https://picsum.photos/150/90?random=13" },
      { id: "card4", title: "Graduation Invite", thumbnail: "https://picsum.photos/150/90?random=14" },
      { id: "card5", title: "Event Invite", thumbnail: "https://picsum.photos/150/90?random=15" }
    ]
  },
  {
    category: "Banners & Ads",
    templates: [
      { id: "banner1", title: "Event Banner", thumbnail: "https://picsum.photos/150/90?random=16" },
      { id: "banner2", title: "Product Ad", thumbnail: "https://picsum.photos/150/90?random=17" },
      { id: "banner3", title: "Product Launch", thumbnail: "https://picsum.photos/150/90?random=18" },
      { id: "banner4", title: "Sale Banner", thumbnail: "https://picsum.photos/150/90?random=19" },
      { id: "banner5", title: "Promo Ad", thumbnail: "https://picsum.photos/150/90?random=20" }
    ]
  },
  {
    category: "Social Media",
    templates: [
      { id: "social1", title: "Instagram Post", thumbnail: "https://picsum.photos/150/90?random=21" },
      { id: "social2", title: "Facebook Cover", thumbnail: "https://picsum.photos/150/90?random=22" },
      { id: "social3", title: "YouTube Thumbnail", thumbnail: "https://picsum.photos/150/90?random=23" },
      { id: "social4", title: "Twitter Banner", thumbnail: "https://picsum.photos/150/90?random=24" },
      { id: "social5", title: "LinkedIn Post", thumbnail: "https://picsum.photos/150/90?random=25" }
    ]
  }
];

// Utility functions to get templates
export function getTemplatesByCategory(category: string) {
  const cat = TEMPLATES.find(c => c.category === category);
  return cat ? cat.templates : [];
}

export function getAllTemplates() {
  return TEMPLATES.flatMap(c => c.templates);
} 