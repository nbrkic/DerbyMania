export const NAV_LINKS = [
  { label: 'Početna', href: '/' },
  { label: 'Turniri', href: '/turniri' },
  { label: 'Timovi', href: '/timovi' },
  { label: 'Igrači', href: '/igraci' },
  { label: 'Feedback', href: '/feedback' },
];

export function isNavLinkActive(href: string, pathname: string) {
  return pathname === href;
}
