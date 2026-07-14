import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

const doctors = [
  {
    name: "Dr Meredith Grey",
    email: "grey@example.com",
    specialization: "General Surgery",
    yearsExperience: 12,
  },
  {
    name: "Dr Sanjay Rao",
    email: "rao@example.com",
    specialization: "Dermatology",
    yearsExperience: 6,
  },
  {
    name: "Dr Aisha Khan",
    email: "khan@example.com",
    specialization: "Pediatrics",
    yearsExperience: 9,
  },
  {
    name: "Dr Leo Fernandes",
    email: "fernandes@example.com",
    specialization: "Neurology",
    yearsExperience: 15,
  },
  {
    name: "Dr Hannah Cross",
    email: "cross@example.com",
    specialization: "Cardiology",
    yearsExperience: 10,
  },
];

async function main() {
  // Everyone in the seed shares this demo password.
  const passwordHash = await hashPassword("password123");

  for (const doctor of doctors) {
    await prisma.user.upsert({
      where: { email: doctor.email },
      update: {},
      create: {
        name: doctor.name,
        email: doctor.email,
        passwordHash,
        role: "DOCTOR",
        doctorProfile: {
          create: {
            specialization: doctor.specialization,
            yearsExperience: doctor.yearsExperience,
          },
        },
      },
    });
  }

  await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {},
    create: {
      name: "Demo Patient",
      email: "patient@example.com",
      passwordHash,
      role: "PATIENT",
    },
  });

  console.log("seed complete: 5 doctors and 1 demo patient");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
