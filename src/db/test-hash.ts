import { hashPassword } from "better-auth/crypto";

async function test() {
  const hash = await hashPassword("password123");
  console.log("Password: password123");
  console.log("Hash:", hash);
  process.exit(0);
}

test();
