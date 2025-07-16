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
      { id: "poster1", title: "Concert Poster", thumbnail: "https://i.postimg.cc/DWVsybjN/post8.jpg" },
      { id: "poster2", title: "Conference Poster", thumbnail: "https://i.postimg.cc/Z9rN9KX5/Post7.jpg" },
      { id: "poster3", title: "Movie Poster", thumbnail: "https://i.postimg.cc/v4xfsvz9/Post6.jpg[/img" },
      { id: "poster4", title: "Festival Poster", thumbnail: "https://picsum.photos/150/90?random=9" },
      { id: "poster5", title: "Announcement Poster", thumbnail: "https://picsum.photos/150/90?random=10" }
    ]
  },
  {
    category: "Cards & Invites",
    templates: [
      { id: "card1", title: "Business Card", thumbnail: "https://i.postimg.cc/R6kLkDrW/Inv7.webp" },
      { id: "card2", title: "Holiday Card", thumbnail: "img]https://i.postimg.cc/JtQ9NNjb/BuC2.webp" },
      { id: "card3", title: "Wedding Invite", thumbnail: "https://i.postimg.cc/9z26w8wm/BuC1.webp" },
      { id: "card4", title: "Graduation Invite", thumbnail: "https://i.postimg.cc/zVX40yk4/Buc5.webp" },
      { id: "card5", title: "Event Invite", thumbnail: "https://i.postimg.cc/ctdPqCGg/Buc6.webp" }
    ]
  },
  {
    category: "Resume",
    templates: [
      { id: "banner1", title: "Event Banner", thumbnail: "https://i.postimg.cc/HJpY2YVx/Res2.webp" },
      { id: "banner2", title: "Product Ad", thumbnail: "https://i.postimg.cc/Xr67rcW9/Res3.webp" },
      { id: "banner3", title: "Product Launch", thumbnail: "https://i.postimg.cc/ZWPYpBY2/res4.webp" },
      { id: "banner4", title: "Sale Banner", thumbnail: "https://i.postimg.cc/w7mjx4C6/Res5.webp" },
      { id: "banner5", title: "Promo Ad", thumbnail: "https://i.postimg.cc/z3MfrYPt/Res1.webp" }
    ]
  },
  {
    category: "Social Media",
    templates: [
      { id: "social1", title: "Instagram Post", thumbnail: "https://i.postimg.cc/XBKdTNcP/Post4.jpg" },
      { id: "social2", title: "Facebook Cover", thumbnail: "https://i.postimg.cc/nCZvq7nf/Post3.jpg" },
      { id: "social3", title: "YouTube Thumbnail", thumbnail: "https://i.postimg.cc/tY5FkTgZ/Post2.jpg" },
      { id: "social4", title: "Twitter Banner", thumbnail: "]https://i.postimg.cc/RJxwsJff/Post1.jpg" },
      { id: "social5", title: "LinkedIn Post", thumbnail: "https://i.postimg.cc/kDWQVw3y/Post5.jpg" }
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