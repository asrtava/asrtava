# ASRTAVA Responsive Design & Touch Ergonomics Specification

## 1. Responsive Viewport Strategy

Hospital software must function flawlessly across diverse hardware environments:
1. **Wall-mounted nursing station terminals** (1920x1080 and ultra-wide 2560x1440)
2. **Physician consultation desks** (laptops, 13-16 inch displays)
3. **Point-of-Care (POC) mobile carts & tablets** (iPad 10.2", Galaxy Tab, Microsoft Surface)
4. **Physician & Patient smartphones** (iPhone, Samsung Galaxy, 375px to 430px widths)

---

## 2. Breakpoint Grid

ASRTAVA adheres to Tailwind CSS standard breakpoints, supplemented with custom fluid container widths:

| Breakpoint | Minimum Width | Device Categories | Layout Adaptations |
| :--- | :--- | :--- | :--- |
| **`sm`** | 640px | Large phones, landscape phablets | 2-column KPI grids, single-column forms expand to 2-column |
| **`md`** | 768px | Tablets (iPad Portrait) | Modal widths expand, multi-tab horizontal scroll navigation |
| **`lg`** | 1024px | Laptops, Tablets Landscape | Sidebar uncollapses from slide-out drawer to fixed 260px navigation |
| **`xl`** | 1280px | Desktop monitors | 4-column KPI cards, side-by-side queue and EMR consultation workbench |
| **`2xl`** | 1536px | Clinical workstations & PACS displays | High-density data tables, multi-column DICOM image comparisons |

---

## 3. Touch Ergonomics & Mobile UX

1. **Minimum Touch Targets**: All interactive controls maintain a minimum target area of `44px x 44px` on mobile viewports to avoid mis-taps in clinical environments.
2. **Mobile Sidebar Drawer**: On viewports under `1024px`, the navigation sidebar transitions into an off-canvas drawer with a blurred backdrop overlay, opening via a hamburger menu and automatically closing on route selection or backdrop tap.
3. **Dense Table Horizontal Scroll**: Data-dense tables (OPD queues, pharmacy formulary, laboratory parameters) feature dedicated horizontal swipe wrappers (`overflow-x-auto`) with subtle scroll indicators to prevent layout clipping.
4. **Touch-Friendly Modals**: Modals automatically reposition as bottom sheets on smartphones (`max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl`) for convenient one-handed thumb dismissal.

