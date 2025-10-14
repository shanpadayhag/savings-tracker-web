"use client";

import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import authAxios from '@/configs/axios/auth';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

export default () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      await authAxios.post("/login", {
        email: email,
        password: password,
      });

      router.replace("/user");
    } catch (exception) {
      if (exception instanceof AxiosError) {
        if (!exception.response) {
          return toast.error("Network Error 🌐", {
            description: "Cannot connect to the server. Please check your internet connection.",
          });
        }

        switch (exception.response.status) {
          case 400:
            toast.error("Invalid Input 🤔", {
              description: "Please check the details you entered and try again.",
            });
            break;

          case 401:
            toast.error("Login Failed 🔒", {
              description: "The email or password you entered is incorrect.",
            });
            break;

          case 500:
            toast.error("Server Issue 🛠️", {
              description: "We're having trouble on our end. Please try again in a moment.",
            });
            break;

          default:
            toast.error("Unexpected Error 💥", {
              description: "An unknown error occurred. If this continues, please contact support.",
            });
            break;
        }
      } else {
        toast.error("Unexpected Error 💥", {
          description: "An unknown error occurred. If this continues, please contact support.",
        });
      }
    }
  };

  const loginFormOnSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login();
  };

  return <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div className="w-full max-w-sm">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginFormOnSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input onChange={event => setEmail(event.target.value)} placeholder="m@example.com" type="email" id="email" autoComplete="off" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input onChange={event => setPassword(event.target.value)} type="password" id="email" autoComplete="off" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button type="submit">Login</Button>
                  <p className="text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5 [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4 text-center">Don&apos;t have an account? <Link className="cursor-not-allowed" scroll={false} onClick={(e) => { e.preventDefault(); }} href="/signup">Sign up</Link></p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>;
};
