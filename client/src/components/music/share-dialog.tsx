import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import copy from "copy-to-clipboard";
import { Share2, Copy, Check, Link } from "lucide-react";

interface ShareDialogProps {
  songId: number;
  songTitle: string;
  songArtist: string;
}

export function ShareDialog({ songId, songTitle, songArtist }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const createShortLinkMutation = useMutation({
    mutationFn: async () => {
      const baseUrl = window.location.origin;
      const targetUrl = `${baseUrl}/song/${songId}`;
      
      const res = await apiRequest("POST", "/api/shortlinks", {
        targetUrl,
        type: "song",
        referenceId: songId
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      const baseUrl = window.location.origin;
      setShortLink(`${baseUrl}/s/${data.shortId}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating share link",
        description: "Could not create a shareable link at this time.",
        variant: "destructive",
      });
    },
  });
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !shortLink) {
      createShortLinkMutation.mutate();
    }
  };
  
  const copyToClipboard = () => {
    if (shortLink) {
      copy(shortLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The share link has been copied to your clipboard.",
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
          <Share2 className="h-4 w-4" />
          <span className="sr-only md:not-sr-only">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Song</DialogTitle>
          <DialogDescription>
            Share "{songTitle}" by {songArtist} with others
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-4">
          {createShortLinkMutation.isPending ? (
            <div className="flex h-36 w-36 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : shortLink ? (
            <div className="flex flex-col gap-4 items-center">
              <QRCodeSVG
                value={shortLink}
                size={180}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={false}
              />
              <div className="flex w-full items-center space-x-2">
                <div className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background truncate">
                  {shortLink}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Could not generate share link
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button
            variant="default"
            onClick={copyToClipboard}
            disabled={!shortLink || createShortLinkMutation.isPending}
            className="gap-2"
          >
            <Link className="h-4 w-4" />
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}