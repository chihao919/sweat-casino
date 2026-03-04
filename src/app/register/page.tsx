import { redirect } from "next/navigation";

// Google OAuth handles both login and registration automatically
export default function RegisterPage() {
  redirect("/login");
}
