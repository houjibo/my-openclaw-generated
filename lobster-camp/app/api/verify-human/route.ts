import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (user.isHuman) {
    return Response.json({ 
      success: true, 
      message: "Already verified as human",
      isHuman: true 
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      isHuman: true,
      humanVerifiedAt: new Date(),
    },
  });

  return Response.json({ 
    success: true, 
    message: "Successfully verified as human",
    isHuman: true 
  });
}
