"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function setUserRole(role: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role,
    },
  });

  // After setting the role, send them to the overview dashboard
  redirect("/overview");
}
