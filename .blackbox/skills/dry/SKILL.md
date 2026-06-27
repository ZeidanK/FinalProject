---
name: dry
description: Automated code review and refactoring tool to eliminate duplicate logic and enforce the DRY (Don't Repeat Yourself) principle.
---

# Dry

## Instructions
1. Identify Duplicate Logic: Scan files for repeated algorithms, hardcoded strings, or identical UI layouts.
2. Extract to Reusable Units: Move shared logic into C# extension methods, JavaScript helper functions, or custom JSX components.
3. Parameterize Component Layouts: Convert repetitive JSX blocks into dynamic components using loops (.map()) and props.
4. Leverage Language Features: Use C# generics/inheritance and JavaScript closures/rest parameters to abstract varying details.
5. Consolidate State Management: Merge redundant state variables in JSX components into unified objects or custom hooks.
6. Refactor and Replace: Substitute original duplicate segments with calls to the newly consolidated code structures.

## Examples
Example 1: C# Object MappingBefore (WET):csharpvar dto1 = new UserDto { Id = user.Id, Name = user.FullName, Active = true };
// Later in code
var dto2 = new UserDto { Id = admin.Id, Name = admin.FullName, Active = true };
After (DRY):csharppublic static UserDto MapToDto(User user) => 
    new() { Id = user.Id, Name = user.FullName, Active = true };

var dto1 = MapToDto(user);
var dto2 = MapToDto(admin);
Example 2: JavaScript/JSX Hardcoded ListsBefore (WET):jsxconst Navigation = () => (
  <nav>
    <a href="/home" className="nav-link">Home</a>
    <a href="/about" className="nav-link">About</a>
    <a href="/contact" className="nav-link">Contact</a>
  </nav>
);
After (DRY):jsxconst links = [
  { path: '/home', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' }
];

const Navigation = () => (
  <nav>
    {links.map(link => (
      <a key={link.path} href={link.path} className="nav-link">{link.label}</a>
    ))}
  </nav>
);