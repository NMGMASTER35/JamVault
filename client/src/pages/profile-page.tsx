import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  User as UserIcon, 
  KeyRound, 
  Mail, 
  AtSign, 
  FileText, 
  Loader2 
} from "lucide-react";

type FormValues = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      email: user?.email || "",
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: FormValues) {
    // Only send password fields if we're on the password tab and the current password is filled
    if (activeTab === "password") {
      if (!data.currentPassword) {
        form.setError("currentPassword", {
          type: "manual",
          message: "Current password is required",
        });
        return;
      }
      
      if (data.newPassword && !data.confirmNewPassword) {
        form.setError("confirmNewPassword", {
          type: "manual",
          message: "Please confirm your new password",
        });
        return;
      }
      
      if (data.newPassword !== data.confirmNewPassword) {
        form.setError("confirmNewPassword", {
          type: "manual",
          message: "Passwords do not match",
        });
        return;
      }
    } else {
      // If we're on the info tab, remove password fields
      data.currentPassword = undefined;
      data.newPassword = undefined;
      data.confirmNewPassword = undefined;
    }
    
    updateProfileMutation.mutate(data);
  }
  
  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6 gradient-text">Your Profile</h1>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-neutral-800 rounded-lg flex items-center justify-center text-primary">
            <UserIcon className="w-12 h-12" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user?.displayName || user?.username}</h2>
          <p className="text-neutral-400">
            {user?.isAdmin ? "Administrator" : "Member"} · Joined {
              user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "..."
            }
          </p>
          {user?.bio && (
            <p className="mt-2 text-neutral-200">{user.bio}</p>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "info" | "password")}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="info">Profile Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>
        
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="info">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your public profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                            <AtSign className="h-4 w-4 text-neutral-400" />
                            <Input 
                              placeholder="Your display name" 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                            <Mail className="h-4 w-4 text-neutral-400" />
                            <Input 
                              placeholder="your.email@example.com" 
                              type="email"
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          This is used for password recovery and notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <div className="flex border rounded-md pl-3 pt-3 focus-within:ring-1 focus-within:ring-primary">
                            <FileText className="h-4 w-4 text-neutral-400 flex-shrink-0 mr-2" />
                            <Textarea 
                              placeholder="Tell others about yourself..." 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[100px]"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="ml-auto" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </TabsContent>
              
              <TabsContent value="password">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                            <KeyRound className="h-4 w-4 text-neutral-400" />
                            <Input 
                              type="password" 
                              placeholder="Your current password" 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                            <KeyRound className="h-4 w-4 text-neutral-400" />
                            <Input 
                              type="password" 
                              placeholder="New password" 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters and include uppercase, lowercase, 
                          numbers, and special characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                            <KeyRound className="h-4 w-4 text-neutral-400" />
                            <Input 
                              type="password" 
                              placeholder="Confirm new password" 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="ml-auto" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Password
                  </Button>
                </CardFooter>
              </TabsContent>
            </form>
          </Form>
        </Card>
      </Tabs>
    </div>
  );
}