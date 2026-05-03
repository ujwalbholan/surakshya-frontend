"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Home() {
  return (
    <div className="w-scree  h-screen flex justify-center items-center flex-col mt-10">
      <h1 className="font-bold text-3xl underline italic">
        Surakshya Frontend
      </h1>
      <Button
        className="p-4 rounded-lg"
        onClick={() => toast.success("Event has been created")}
      >
        Click
      </Button>
    </div>
  );
}
