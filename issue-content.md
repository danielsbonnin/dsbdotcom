## Problem
The current color scheme has several contrast issues that make the site less accessible and harder to read:

1. **Gray text on light backgrounds** - Many text elements use gray colors that don't meet WCAG contrast guidelines
2. **Inconsistent color usage** - Mix of hard-coded grays and custom colors creates visual inconsistency  
3. **Professional blue may be too dark** - The #004E98 blue might be too dark for some use cases
4. **Orange accent needs better contrast** - The vibrant orange (#FF6700) needs better contrast ratios

## Requirements

### High Contrast Color Palette
- Replace low-contrast gray text with darker, more readable colors
- Ensure all text meets WCAG AA contrast standards (4.5:1 minimum)
- Create a cohesive color system with better hierarchy

### Specific Improvements Needed
1. **Text Colors**: Replace `text-gray-600`, `text-gray-700` with higher contrast alternatives
2. **Background Colors**: Improve `bg-gray-100`, `bg-gray-800` contrast ratios
3. **Interactive Elements**: Ensure buttons and links have sufficient contrast
4. **Professional Blue**: Consider lightening for better readability when used on dark backgrounds
5. **Consistent Usage**: Replace inconsistent color classes with systematic custom colors

### Technical Implementation
- Update `tailwind.config.ts` with improved color palette
- Replace existing color classes in components with new high-contrast alternatives
- Maintain visual hierarchy while improving accessibility
- Test contrast ratios to ensure WCAG compliance

### Files to Update
- `tailwind.config.ts` - Define new color palette
- `src/app/page.tsx` - Update homepage colors
- `src/app/portfolio/page.tsx` - Fix portfolio page contrast
- `src/app/experience/page.tsx` - Improve experience page readability
- `src/components/Navbar.tsx` - Enhance navigation contrast
- `src/components/Footer.tsx` - Improve footer readability

## Acceptance Criteria
- [ ] All text meets WCAG AA contrast standards (4.5:1)
- [ ] Consistent use of custom color variables instead of generic grays
- [ ] Visual hierarchy maintained with improved contrast
- [ ] Professional appearance with enhanced readability
- [ ] Mobile responsiveness preserved

## Priority
High - Accessibility improvements are essential for user experience

## Labels
accessibility, design, contrast, ui-improvement
