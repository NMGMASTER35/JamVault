import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSongRequestSchema, type SongRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Music2, 
  User, 
  AlbumIcon, 
  Calendar, 
  FileImage, 
  MessageSquare, 
  FileCheck,
  FileX,
  Clock,
  Loader2,
  Trash2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  requestType: z.enum(['song', 'album']).refine((val) => val === 'song' || val === 'album', {
    message: 'Please select a request type.',
  }),
  title: z.string().min(1, { message: 'Title is required' }),
  artist: z.string().optional(),
  album: z.string().optional(),
  year: z.number().optional().nullable(),
  cover: z.string().url({ message: 'Invalid cover URL' }).optional(),
  notes: z.string().optional(),
  userId: z.number().optional(),
});


type FormValues = z.infer<typeof formSchema>;

export default function SongRequestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<SongRequest | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAdminResponseDialogOpen, setIsAdminResponseDialogOpen] = useState(false);
  const [adminStatus, setAdminStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [adminMessage, setAdminMessage] = useState('');

  // Fetch song requests
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery<SongRequest[]>({
    queryKey: ['/api/song-requests'],
  });

  // Function to handle admin status update
  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminMessage }: { id: number, status: string, adminMessage: string }) => {
      const res = await apiRequest("PATCH", `/api/song-requests/${id}/status`, { status, adminMessage });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update request status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/song-requests'] });
      toast({
        title: "Request updated",
        description: "The song request status has been updated.",
      });
      setIsAdminResponseDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle deleting a request
  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/song-requests/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete request");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/song-requests'] });
      toast({
        title: "Request deleted",
        description: "The song request has been deleted.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Request form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestType: 'song',
      title: "",
      artist: "",
      album: "",
      year: undefined,
      cover: "",
      notes: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/song-requests", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create song request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/song-requests'] });
      toast({
        title: "Request submitted",
        description: "Your song request has been submitted for review.",
      });
      form.reset({
        requestType: 'song',
        title: "",
        artist: "",
        album: "",
        year: undefined,
        cover: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    createRequestMutation.mutate(data);
  }

  function handleDeleteRequest() {
    if (selectedRequest) {
      deleteRequestMutation.mutate(selectedRequest.id);
    }
  }

  function handleUpdateRequestStatus() {
    if (selectedRequest) {
      updateRequestStatusMutation.mutate({
        id: selectedRequest.id,
        status: adminStatus,
        adminMessage: adminMessage
      });
    }
  }

  // Function to get badge color based on status
  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mr-4"
          size="sm"
        >
          Back
        </Button>
        <h1 className="text-3xl font-bold gradient-text">Song Requests</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Song Requests</CardTitle>
              <CardDescription>
                View and manage your song requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <Music2 className="mx-auto h-12 w-12 mb-3 text-neutral-500" />
                  <h3 className="text-lg font-medium mb-1">No song requests yet</h3>
                  <p>Use the form to request songs you'd like to see added to JamVault.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableCaption>Your submitted song requests</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Artist</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.title}</TableCell>
                          <TableCell>{request.artist}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setSelectedRequest(request)}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Request Details</DialogTitle>
                                    <DialogDescription>
                                      {request.title} by {request.artist}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-sm font-medium text-neutral-400 mb-1">Album</h4>
                                        <p>{request.album || "Not specified"}</p>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-neutral-400 mb-1">Year</h4>
                                        <p>{request.year || "Not specified"}</p>
                                      </div>
                                    </div>

                                    {request.notes && (
                                      <div>
                                        <h4 className="text-sm font-medium text-neutral-400 mb-1">Notes</h4>
                                        <p className="text-sm">{request.notes}</p>
                                      </div>
                                    )}

                                    {request.cover && (
                                      <div>
                                        <h4 className="text-sm font-medium text-neutral-400 mb-1">Cover Image URL</h4>
                                        <p className="text-sm break-all">{request.cover}</p>
                                      </div>
                                    )}

                                    <div>
                                      <h4 className="text-sm font-medium text-neutral-400 mb-1">Status</h4>
                                      <div className="flex items-center gap-2">
                                        {getStatusBadge(request.status)}
                                        <span className="text-sm text-neutral-400">
                                          Submitted on {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>

                                    {request.adminMessage && (
                                      <div>
                                        <h4 className="text-sm font-medium text-neutral-400 mb-1">Admin Response</h4>
                                        <p className="text-sm border p-3 rounded-md bg-neutral-900">{request.adminMessage}</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* Admin response dialog */}
                              {user?.isAdmin && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setAdminStatus(request.status);
                                    setAdminMessage(request.adminMessage || '');
                                    setIsAdminResponseDialogOpen(true);
                                  }}
                                >
                                  {request.status === 'pending' ? (
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                  ) : request.status === 'approved' ? (
                                    <FileCheck className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <FileX className="h-4 w-4 text-red-500" />
                                  )}
                                </Button>
                              )}

                              {/* Delete request */}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Request a Song or Album</CardTitle>
              <CardDescription>
                Submit a request for a song or album to be added to JamVault
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type</FormLabel>
                        <FormControl>
                          <Select {...field}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select request type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="song">Song Request</SelectItem>
                              <SelectItem value="album">Album Request</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                            <Music2 className="h-4 w-4 text-neutral-400" />
                            <Input 
                              placeholder="Enter title" 
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
                    name="artist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                            <User className="h-4 w-4 text-neutral-400" />
                            <Input 
                              placeholder="Enter artist name" 
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
                    name="album"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Album (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                            <AlbumIcon className="h-4 w-4 text-neutral-400" />
                            <Input 
                              placeholder="Enter album name" 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                              <Calendar className="h-4 w-4 text-neutral-400" />
                              <Input 
                                type="number" 
                                placeholder="YYYY" 
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                                {...field}
                                onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cover"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover URL (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md pl-3 focus-within:ring-1 focus-within:ring-primary">
                              <FileImage className="h-4 w-4 text-neutral-400" />
                              <Input 
                                placeholder="Image URL" 
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex border rounded-md pl-3 pt-3 focus-within:ring-1 focus-within:ring-primary">
                            <MessageSquare className="h-4 w-4 text-neutral-400 flex-shrink-0 mr-2" />
                            <Textarea 
                              placeholder="Any additional information about this song..." 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[100px]"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Share any additional details that might help us find and add this song or album.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Request
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Response Dialog */}
      <Dialog open={isAdminResponseDialogOpen} onOpenChange={setIsAdminResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
            <DialogDescription>
              {selectedRequest?.title} by {selectedRequest?.artist}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex space-x-2">
                <Button
                  variant={adminStatus === 'pending' ? 'default' : 'outline'}
                  onClick={() => setAdminStatus('pending')}
                  size="sm"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Pending
                </Button>
                <Button
                  variant={adminStatus === 'approved' ? 'default' : 'outline'}
                  onClick={() => setAdminStatus('approved')}
                  size="sm"
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant={adminStatus === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setAdminStatus('rejected')}
                  size="sm"
                >
                  <FileX className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Message</label>
              <Textarea
                placeholder="Provide feedback to the user (optional)"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdminResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRequestStatus}
              disabled={updateRequestStatusMutation.isPending}
            >
              {updateRequestStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the song request for "{selectedRequest?.title}" by {selectedRequest?.artist}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRequest}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteRequestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}