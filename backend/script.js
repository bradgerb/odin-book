import { prisma } from "./lib/prisma";

async function main() {
  // Create a new user with a post
  const user = await prisma.user.create({
    data: {
      username: "Bob",
      password: "test",
      posts: {
        create: {
          content: "Hello world",
          comments: {
            content: "Hello comment"
          }
        },
      },
    },
    include: {
      posts: true,
      comments: true,
    },
  });
  console.log("Created user:", user);

  // Fetch all users with their posts
  const allUsers = await prisma.user.findMany({
    include: {
      posts: true,
      comments: true,
    },
  });
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

//   view table relations
//   npx prisma studio --config ./prisma.config.js
