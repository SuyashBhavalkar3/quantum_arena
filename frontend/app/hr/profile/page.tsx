"use client";

import { useEffect, useState } from "react";
import { Building, Mail, Save, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser, hrAPI } from "@/lib/api";
import { getAuthToken, setUserData } from "@/lib/auth";

export default function HRProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company_name: "",
    company_description: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const user = await getCurrentUser(token);

        if (mounted) {
          setFormData({
            name: user.name || "",
            email: user.email || "",
            company_name: user.company || "",
            company_description: "",
          });
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updated = await hrAPI.updateProfile(formData);
      setUserData(updated);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
          My Profile
        </h1>
        <p className="mt-2 text-[#5A534A] dark:text-slate-400">
          Manage the account details used across the HR workspace.
        </p>
      </div>

      <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-[#B8915C]/20">
                <AvatarFallback className="bg-[#B8915C]/10 text-xl text-[#B8915C]">
                  {formData.name?.charAt(0) || "H"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                  {loading ? "Loading profile..." : formData.name || "HR User"}
                </h2>
                <p className="text-sm text-[#5A534A] dark:text-slate-400">{formData.email}</p>
              </div>
            </div>

            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="bg-[#B8915C] hover:bg-[#9F7A4F]">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-[#D6CDC2] text-[#4A443C]"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
                <Input
                  id="name"
                  disabled={!isEditing || loading}
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, name: event.target.value }))
                  }
                  className="border-[#D6CDC2] bg-white pl-9 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
                <Input
                  id="email"
                  type="email"
                  disabled={!isEditing || loading}
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, email: event.target.value }))
                  }
                  className="border-[#D6CDC2] bg-white pl-9 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_name">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
                <Input
                  id="company_name"
                  disabled={!isEditing || loading}
                  value={formData.company_name}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, company_name: event.target.value }))
                  }
                  className="border-[#D6CDC2] bg-white pl-9 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_description">Company Description</Label>
              <Textarea
                id="company_description"
                disabled={!isEditing || loading}
                value={formData.company_description}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    company_description: event.target.value,
                  }))
                }
                placeholder="Describe your company or hiring function..."
                className="min-h-32 border-[#D6CDC2] bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
