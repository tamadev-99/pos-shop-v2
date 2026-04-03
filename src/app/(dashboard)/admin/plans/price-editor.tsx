"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePlanPrice } from "@/lib/actions/admin-subscription";
import { toast } from "sonner";
import { Settings, Save, Loader2 } from "lucide-react";

interface PriceEditorProps {
  planId: string;
  currentPrice: string;
}

export function PriceEditor({ planId, currentPrice }: PriceEditorProps) {
  const [price, setPrice] = useState(currentPrice);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePlanPrice(planId, price);
      setIsEditing(false);
      toast.success("Harga paket berhasil diperbarui.");
    } catch (error) {
      toast.error("Gagal memperbarui harga.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold tracking-tight">Rp {parseInt(price).toLocaleString("id-ID")}</span>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 max-w-[200px]">
      <Input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="font-bold text-lg h-9"
        autoFocus
      />
      <Button 
        size="icon" 
        onClick={handleSave} 
        disabled={isLoading}
        className="h-9 w-9 shrink-0"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      </Button>
    </div>
  );
}
