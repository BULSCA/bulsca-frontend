export interface NavigationItem { label: string; to: string; children?: Array<{ label: string; to: string }> }
export const navigation: NavigationItem[] = [
  { label: 'Latest', to: '/latest' },
  { label: 'Competitions', to: '/competitions', children: [
    { label: 'Overview', to: '/competitions' }, { label: 'Calendar', to: '/competitions/calendar' },
    { label: 'Current league', to: '/competitions/league' }, { label: 'Previous leagues', to: '/competitions/previous-leagues' },
    { label: 'Championships', to: '/competitions/championships' },
  ] },
  { label: 'Get involved', to: '/get-involved', children: [
    { label: 'Overview', to: '/get-involved' }, { label: 'Freshers', to: '/freshers' },
    { label: 'Clubs', to: '/get-involved/clubs' }, { label: 'Start a club', to: '/get-involved/clubs/create' },
    { label: 'Committee', to: '/get-involved/committee' }, { label: 'Previous committees', to: '/get-involved/previous-committees' },
  ] },
  { label: 'Resources', to: '/resources', children: [
    { label: 'All resources', to: '/resources' }, { label: 'Search', to: '/resources/search' },
    { label: 'Forms', to: '/resources/forms' }, { label: 'SERCs', to: '/resources/sercs' }, { label: 'Casualties', to: '/resources/casualties' },
  ] },
  { label: 'Welfare', to: '/welfare', children: [
    { label: 'Overview', to: '/welfare' }, { label: 'Support and reporting', to: '/welfare/support-and-reporting' },
    { label: 'Inclusion and accessibility', to: '/welfare/inclusion-and-accessibility' },
  ] },
  { label: 'About', to: '/about', children: [{ label: 'About BULSCA', to: '/about' }, { label: 'Records', to: '/about/records' }, { label: 'Contact', to: '/contact' }] },
  { label: 'Portal', to: '/portal' },
]
