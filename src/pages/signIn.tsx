"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  email: z.string().min(2).max(50),
  password: z.string().min(2),
});

const SignIn = () => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);

  const signInWithPassword = async (email: string, password: string) => {
    const { error, data } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
        })
      : await supabase.auth.signInWithPassword({
          email,
          password,
        });
    if (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Error with auth" + error.message,
      });
    } else if (isSignUp && data.user) {
      setIsSignUp(false);
    } else if (data.user) {
      router.push("/app/overview").catch((err) => {
        console.error("Failed to navigate", err);
      });
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      toast({
        variant: "default",
        title: "Signed out successfully",
      });
      router.push("/signin").catch((err) => {
        console.error("Failed to navigate", err);
      });
    }
  };

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    signInWithPassword(values.email, values.password).catch((err) => {
      console.error(err);
    });
  }

  return (
    <div className="navbar text-primary-content flex justify-end bg-primary p-4">
      <Toaster></Toaster>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          <span className="text-[hsl(280,100%,70%)]">Dex</span> Sign-In
        </h1>
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-96">
              <div className="flex flex-col items-start">
                <Form {...form}>
                  <h1 className="mb-4 text-3xl font-bold">T3 Demo Sign-In</h1>

                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              className="w-96"
                              placeholder="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              className="w-96"
                              placeholder="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit">Login</Button>
                      <Button onClick={signOut}>Sign Out</Button>
                      <Button onClick={() => setIsSignUp((s) => !s)}>
                        {isSignUp
                          ? "Already have an account?"
                          : "Don't have an account?"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
