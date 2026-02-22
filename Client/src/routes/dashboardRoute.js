import Dashboard from './Pages/Dashboard';

export const routes = [
  {
    path: '/dashboard',
    element: <Dashboard />,
    sidebar: true,
    label: 'דשבורד',
    icon: 'dashboard',
    order: 1,
  },
  // ...existing routes
];
