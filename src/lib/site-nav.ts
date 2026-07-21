export const NAV_LINKS = [
  { label: 'Početna', href: '/' },
  { label: 'Timovi', href: '/timovi' },
  { label: 'Igrači', href: '/igraci' },
];

export function isNavLinkActive(href: string, pathname: string) {
  return pathname === href;
}
