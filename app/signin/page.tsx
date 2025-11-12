"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import SigninForm from "../../ui/signinform";
import { signIn } from "next-auth/react";

export default function SignInPage() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if(res?.ok) {
      toast.success("Signed in successfully!");
      window.location.href ="/";
    }

    if(res?.error) {
      toast.error("Invalid credentials. Please try again.");
      setPassword("");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 sm:p-6">
        <Toaster />
        <SigninForm setUsername={setUsername} setPassword={setPassword} isSubmitting={isSubmitting} handleSubmit={handleSubmit} username={username} password={password}/>
      
    </div>
  );
}