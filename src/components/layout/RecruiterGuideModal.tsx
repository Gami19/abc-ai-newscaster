"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RECRUITER_GUIDE } from "@/lib/config/recruiterGuide";

export function RecruiterGuideModal() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(RECRUITER_GUIDE.storageKey);
    setOpen(dismissed !== "1");
    setReady(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(RECRUITER_GUIDE.storageKey, "1");
    setOpen(false);
  };

  if (!ready) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-2rem)] overflow-y-auto bg-abc-white p-8 text-lg text-abc-charcoal sm:max-w-2xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-abc-charcoal">
            {RECRUITER_GUIDE.title}
          </DialogTitle>
          <DialogDescription className="text-lg leading-relaxed text-abc-charcoal">
            {RECRUITER_GUIDE.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {RECRUITER_GUIDE.sections.map((section) => (
            <section key={section.title}>
              <h3 className="mb-3 text-lg font-bold text-abc-charcoal">
                {section.title}
              </h3>
              <ul className="list-disc space-y-3 pl-5 text-lg leading-relaxed text-abc-charcoal">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="h-14 w-full bg-abc-red text-lg text-white hover:bg-abc-red/90 sm:w-auto sm:min-w-56"
            onClick={handleDismiss}
          >
            {RECRUITER_GUIDE.dismissButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
