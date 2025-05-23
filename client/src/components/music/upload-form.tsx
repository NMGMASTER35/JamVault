import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, UploadCloud, X, Music, CheckCircle, AlertCircle, Image, ImagePlus } from "lucide-react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define validation schema
const uploadFormSchema = z.object({
  title: z.string().min(1, "Song title is required"),
  artist: z.string().min(1, "Artist name is required"),
  album: z.string().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().optional(),
  duration: z.coerce.number().min(1, "Duration is required"),
  cover: z.string().optional(),
  lyrics: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface FileUploadState {
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface CoverUploadState {
  file: File;
  preview: string;
}

export function UploadForm() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [fileUpload, setFileUpload] = useState<FileUploadState | null>(null);
  const [coverUpload, setCoverUpload] = useState<CoverUploadState | null>(null);

  // Initialize form
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      artist: "",
      album: "",
      duration: 0,
      cover: "",
    },
  });

  // Fetch artists
  const { data: artists } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/artists'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (values: UploadFormValues & { file: File }) => {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', values.file);
      formData.append('title', values.title);
      formData.append('artist', values.artist);

      if (values.album) {
        formData.append('album', values.album);
      }

      formData.append('duration', values.duration.toString());

      if (values.cover) {
        formData.append('cover', values.cover);
      }

      if (values.genre) {
        formData.append('genre', values.genre);
      }

      if (values.year) {
        formData.append('year', values.year.toString());
      }

      if (values.lyrics) {
        formData.append('lyrics', values.lyrics);
      }

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setFileUpload(prev => prev ? { ...prev, progress: Math.min(progress, 90) } : null);

        if (progress >= 90) {
          clearInterval(interval);
        }
      }, 200);

      try {
        // Upload the file
        const response = await fetch('/api/songs', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        clearInterval(interval);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Upload failed');
        }

        setFileUpload(prev => prev ? { ...prev, progress: 100, status: 'success' } : null);
        return await response.json();
      } catch (error) {
        clearInterval(interval);
        setFileUpload(prev => prev ? { 
          ...prev, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        } : null);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });

      // Show success toast
      toast({
        title: "Upload successful",
        description: "Your song has been uploaded successfully",
      });

      // Reset form after a delay
      setTimeout(() => {
        form.reset();
        setFileUpload(null);
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file (MP3, WAV, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    // Extract metadata from filename
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const parts = fileName.split(' - ');

    if (parts.length >= 2) {
      form.setValue('artist', parts[0].trim());
      form.setValue('title', parts[1].trim());
    } else {
      form.setValue('title', fileName);
    }

    // Set a dummy duration for now (would normally be extracted)
    form.setValue('duration', 180); // 3 minutes default

    // Initialize file upload state
    setFileUpload({
      file,
      progress: 0,
      status: 'idle',
    });
  };

  // Handle form submission
  const onSubmit = (values: UploadFormValues) => {
    if (!fileUpload) {
      toast({
        title: "No file selected",
        description: "Please select an audio file to upload",
        variant: "destructive",
      });
      return;
    }

    setFileUpload(prev => prev ? { ...prev, status: 'uploading' } : null);
    uploadMutation.mutate({ ...values, file: fileUpload.file });
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Update file input for consistency
    if (fileInputRef.current) {
      // Create a DataTransfer object to set the files
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;

      // Manually trigger change event handling
      const event = {
        target: {
          files: dataTransfer.files
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  // Clear file selection
  const clearFileSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileUpload(null);

    // Reset form fields related to the file
    form.setValue('title', '');
    form.setValue('artist', '');
    form.setValue('album', '');
    form.setValue('duration', 0);
    form.setValue('genre', '');
    form.setValue('year', undefined);
    form.setValue('lyrics', '');
  };

  // Handle cover image selection
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum cover image size is 2MB",
        variant: "destructive",
      });
      return;
    }

    // Create a preview URL
    const preview = URL.createObjectURL(file);

    // Set cover upload state
    setCoverUpload({ file, preview });

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        form.setValue('cover', data.url);
      } else {
        toast({
          title: "Cover upload failed",
          description: 'Error uploading cover image',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: "Cover upload failed",
        description: 'Error uploading cover image',
        variant: 'destructive'
      })
    }
  };

  // Clear cover image
  const clearCoverImage = () => {
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
    if (coverUpload?.preview) {
      URL.revokeObjectURL(coverUpload.preview);
    }
    setCoverUpload(null);
    form.setValue('cover', '');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up cover image preview URL when component unmounts
      if (coverUpload?.preview) {
        URL.revokeObjectURL(coverUpload.preview);
      }
    };
  }, [coverUpload]);

  // Render file upload state
  const renderFileUploadState = () => {
    if (!fileUpload) return null;

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-primary">
              {fileUpload.status === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : fileUpload.status === 'error' ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Music className="h-5 w-5" />
              )}
            </div>
            <div className="flex-grow">
              <div className="text-sm font-medium">{fileUpload.file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(fileUpload.file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {fileUpload.status === 'uploading' || fileUpload.status === 'processing' 
                ? `${Math.round(fileUpload.progress)}%` 
                : fileUpload.status === 'success' 
                  ? 'Complete' 
                  : fileUpload.status === 'error' 
                    ? 'Failed' 
                    : 'Ready'}
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-muted-foreground"
              onClick={clearFileSelection}
              disabled={fileUpload.status === 'uploading' || fileUpload.status === 'processing'}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {(fileUpload.status === 'uploading' || fileUpload.status === 'processing') && (
            <Progress 
              value={fileUpload.progress} 
              className="h-1 mt-2"
            />
          )}

          {fileUpload.status === 'error' && fileUpload.error && (
            <div className="mt-2 text-xs text-destructive">
              {fileUpload.error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* File Drop Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 ${
          fileUpload ? 'border-primary/40 bg-primary/5' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center cursor-pointer">
          <UploadCloud className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-foreground mb-2">
            Drag and drop your MP3 files here
          </p>
          <p className="text-muted-foreground text-sm mb-4">or</p>
          <Button 
            type="button" 
            className="mb-4"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse Files
          </Button>
          <p className="text-xs text-muted-foreground">
            Supported formats: MP3, WAV, FLAC (Max size: 50MB)
          </p>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="audio/*"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* File Upload Progress */}
      {renderFileUploadState()}

      {/* Song Metadata Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              {/* Cover Image Upload */}
              <FormField
                control={form.control}
                name="cover"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <div 
                      className={`
                        border-2 border-dashed rounded-lg p-4 text-center
                        ${coverUpload ? 'border-primary/40 bg-primary/5' : 'border-border'}
                        ${coverUpload ? 'h-[200px]' : 'h-[150px]'}
                        relative overflow-hidden
                      `}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {coverUpload ? (
                        <>
                          <img 
                            src={coverUpload.preview} 
                            alt="Cover preview" 
                            className="object-cover w-full h-full absolute top-0 left-0"
                          />
                          <div className="absolute top-2 right-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7 bg-background/80 hover:bg-background"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearCoverImage();
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full cursor-pointer">
                          <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Add cover image</p>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG (max 2MB)</p>
                        </div>
                      )}
                      <Input
                        type="hidden"
                        {...field}
                      />
                      <input 
                        type="file" 
                        ref={coverInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleCoverSelect}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Song title" {...field} />
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
                      <FormLabel>Artist</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select artist" />
                          </SelectTrigger>
                          <SelectContent>
                            {artists?.map((artist) => (
                              <SelectItem key={artist.id} value={artist.name}>
                                {artist.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Input placeholder="Album name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Duration in seconds" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-2 w-[400px] mb-4">
              <TabsTrigger value="details">Additional Details</TabsTrigger>
              <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Genre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Release year" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="lyrics" className="space-y-4">
              <FormField
                control={form.control}
                name="lyrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lyrics (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add song lyrics here..."
                        className="min-h-[200px] resize-y"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-8">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/library')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={
                uploadMutation.isPending || 
                !fileUpload || 
                fileUpload.status === 'uploading' || 
                fileUpload.status === 'processing'
              }
            >
              {uploadMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}