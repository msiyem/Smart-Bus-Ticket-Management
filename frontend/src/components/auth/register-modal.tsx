"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  User,
  UserCheck,
} from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { registerSchema } from "@/lib/validations/register";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import Image from "next/image";
import googleLogo from "../../../public/google-logo.png";
import { registerUser } from "@/action/auth.action";

export default function RegisterModal({
  open,
  onOpenChange,
  switchToLogin,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  switchToLogin?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const onsubmit = async (data: z.infer<typeof registerSchema>) => {
    const registerPromise = registerUser(data as Record<string, unknown>);

    toast.promise(registerPromise, {
      loading: "Creating account...",
      success: "Account created successfully!",
      error: (err) => err.message || "Something went wrong",
      richColors: true,
    });

    await registerPromise;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-md sm:min-w-120 md:min-w-150">
        <DialogTitle className="sr-only">Register</DialogTitle>
        <Card className="border-none shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Task Management App</CardTitle>
            <CardDescription>
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-3"
              onClick={() => {
                setGoogleSubmitting(true);
                setTimeout(() => setGoogleSubmitting(false), 2000);
              }}
            >
              {googleSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin w-4 h-4" />
                  Continuing...
                </>
              ) : (
                <>
                  <Image src={googleLogo} alt="Google" width={18} height={18} />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              or
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit(onsubmit)} className="space-y-10">
              <div className="flex gap-5 w-full">
                <div className="w-1/2 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        autoComplete="off"
                        placeholder="Enter your full name"
                        {...register("name")}
                        required
                        className={`pl-10 ${errors.name ? "border-destructive" : ""} `}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.name?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>User Name*</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        {...register("username")}
                        required
                        className={`pl-10 ${
                          errors.username ? "border-destructive" : ""
                        } `}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-destructive/70 text-xs mt-1">
                        {errors.username?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Email*</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your Email"
                        {...register("email")}
                        required
                        className={`pl-10 ${errors.email ? "border-destructive" : ""} `}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive/70 text-xs mt-1">
                        {errors.email?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-1/2 space-y-5">
                  <div className="space-y-2">
                    <Label>Password*</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        {...register("password")}
                        required
                        className={`pl-10 ${
                          errors.password ? "border-destructive" : ""
                        } `}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive/70 text-xs mt-1">
                        {errors.password?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm Password*</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        {...register("confirmPassword")}
                        required
                        className={`pl-10 ${
                          errors.confirmPassword ? "border-destructive" : ""
                        } `}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-destructive/70 text-xs mt-1">
                        {errors.confirmPassword?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="animate-spin w-4 h-4" />
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            Already have an account?
            <span
              onClick={() => {
                onOpenChange?.(false);
                switchToLogin?.();
              }}
              className="ml-1 text-link hover:underline cursor-pointer"
            >
              Login
            </span>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
