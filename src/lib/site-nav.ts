export const NAV_LINKS = [
  { label: 'Početna', href: '/' },
  { label: 'Timovi', href: '/timovi' },
];

export function isNavLinkActive(href: string, pathname: string) {
  return pathname === href;
}
