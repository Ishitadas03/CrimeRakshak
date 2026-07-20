import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './client-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // If the user is not signed in, redirect them to the login page
  if (!userId) {
    redirect('/login');
  }

  // Check if they have a role configured, otherwise send to onboarding
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role;

  if (!role) {
    redirect('/onboarding');
  }

  // Pass children to the client-side layout component
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
