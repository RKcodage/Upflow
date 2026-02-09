# UpFlow Demo

A beautiful feature request management system with community voting.

## 🎯 Two Views Available

### 1. **Dashboard View** (Admin/Internal)

**URL:** `http://localhost:3000/`

The internal dashboard for managing feature requests:

- ✅ Full feature request management
- ✅ Status tracking (Planned, In Progress, Completed, Under Review)
- ✅ Sidebar with filters and stats
- ✅ Detailed feature cards with comments, dates, and authors
- ✅ Create new feature requests with modal
- ✅ Upvote/downvote system
- ✅ Search and sort functionality

**Perfect for:** Product managers, developers, and internal teams

---

### 2. **Widget View** (Public/Embedded)

**URL:** `http://localhost:3000/demo`

The public-facing widget that embeds into any website:

- ✅ **Floating button** trigger (bottom-right corner, like Intercom)
- ✅ **Slide-in panel** from the right (440px wide, mobile responsive)
- ✅ Compact feature list with voting
- ✅ Real-time search and filtering
- ✅ Quick feature submission form
- ✅ Toast notifications for user actions
- ✅ Status badges (Live, In Progress, Planned)
- ✅ Minimal, clean design that doesn't distract

**Perfect for:** End users on your website/product

---

## 🎨 Design Features

### Theme

- **Dark mode** with deep violet (#6B59D7)
- **Custom font:** Outfit (clean, modern, geometric)
- **Micro-interactions:** Smooth hover states, scale animations
- **Professional polish:** Gradients, shadows, and animations

### UX Highlights

- **Instant feedback:** Toast notifications for all actions
- **Smart filtering:** By status, search, and sort
- **Vote indication:** Visual feedback when you've voted
- **Mobile responsive:** Works on all screen sizes
- **Non-intrusive:** Widget can be dismissed easily

---

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Visit:

- Dashboard: http://localhost:3000
- Widget Demo: http://localhost:3000/demo
- Embed page (iframe): http://localhost:3000/embed

---

## 💡 Widget Integration Example

This is what developers would add to their website:

```html
<!-- Add UpFlow widget -->
<script src="https://YOUR_UPFLOW_DOMAIN/upflow-widget.js"></script>
<script>
  UpFlow.init({
    projectId: "your-project-id",
    // projectKey: "your-public-project-key",
    position: "bottom-right", // or 'bottom-left'
    theme: "dark", // or 'light'
    // accent: "#6b59d7",
  });
</script>
```

The widget then:

1. Shows a floating button in the corner
2. Opens a slide-in panel when clicked
3. Allows users to vote and submit features
4. Syncs all data with your dashboard

---

## 🎯 Key Features Demonstrated

### For Developers

- ✅ Zero external dependencies (just Next.js + Tailwind + lucide-react)
- ✅ MongoDB + API pour persister les votes et demandes
- ✅ Fully functional voting system
- ✅ Real feature submission
- ✅ Clean, modular component structure

### For Users

- ✅ Intuitive voting interface
- ✅ See what's being built
- ✅ Submit feature ideas
- ✅ Community-driven prioritization
- ✅ Transparent development

---

## 📦 Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **TypeScript**
- **lucide-react** (icons)

---

## 🎥 Perfect for Video Demos

Both views are polished and ready for:

- 📹 Product demo videos
- 🎨 Design showcases
- 💼 Portfolio pieces
- 🚀 Investor pitches
- 📱 Social media content

---

Built with ❤️ following the SaaS Demo Generator instructions
