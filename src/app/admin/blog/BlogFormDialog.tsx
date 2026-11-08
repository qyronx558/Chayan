"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { blogPostSchema, type BlogPostInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichEditor } from "@/components/admin/RichEditor";
import type { FormDialogProps } from "@/components/admin/list/types";
import type { BlogRow } from "./config";
import { Send } from "lucide-react";

const EMPTY_FORM: BlogPostInput = {
  title: "",
  slug: "",
  excerpt: null,
  content: null,
  author: null,
  image: null,
  tags: null,
  categoryId: null,
  published: false,
};

function toFormValues(row: BlogRow): BlogPostInput {
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    image: row.image,
    tags: row.tags,
    categoryId: row.categoryId,
    published: row.published,
  };
}

export function BlogFormDialog({ row, open, onOpenChange, lookups, onSaved }: FormDialogProps<BlogRow>) {
  const categories = lookups.categories ?? [];

  const form = useForm<BlogPostInput>({
    resolver: zodResolver(blogPostSchema) as never,
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (open) {
      form.reset(row ? toFormValues(row) : { ...EMPTY_FORM });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row?.id]);

  const createMutation = useMutation({
    mutationFn: (data: BlogPostInput) => api.post("/api/blog", data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
      toast("Post created", "success");
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: BlogPostInput) => api.put(`/api/blog/${row?.id}`, data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
      toast("Post updated", "success");
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  const onSubmit = (data: BlogPostInput) => {
    if (row) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex !max-w-[95vw] !max-h-[95vh] flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-6 py-4 shrink-0">
          <div>
            <DialogTitle className="text-xl">{row ? "Edit Post" : "New Blog Post"}</DialogTitle>
            <DialogDescription>Create and manage your blog content</DialogDescription>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Post title..."
                        onChange={(e) => { field.onChange(e); if (!row) form.setValue("slug", slugify(e.target.value)) }}
                        className="w-full border-0 bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RichEditor value={field.value || ""} onChange={(val) => field.onChange(val || null)} placeholder="Start writing..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="w-80 shrink-0 overflow-y-auto border-l bg-paper-2 p-6 dark:bg-ink/50">
              <div className="space-y-5">
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Slug</FormLabel>
                    <FormControl><Input {...field} className="text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="author" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Author</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="ChayanJobs" className="text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tags" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Tags</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="exam-tips, ssc, govt-jobs" className="text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Category</FormLabel>
                    <FormControl>
                      <Select value={field.value || ""} onValueChange={(val) => field.onChange(val === "none" ? null : val)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="image" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Featured Image</FormLabel>
                    <FormControl>
                      <ImageUpload value={field.value} onChange={field.onChange} folder="ChayanJobs/blog" className="!p-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="excerpt" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Excerpt</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} rows={3} className="text-sm" placeholder="Brief summary for listings..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="published" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border bg-background p-3 dark:border-ink dark:bg-ink">
                    <div>
                      <FormLabel className="text-sm font-medium">Published</FormLabel>
                      <p className="text-xs text-muted-foreground">{field.value ? "Visible to readers" : "Saved as draft"}</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex flex-col gap-2 pt-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    {row ? "Update Post" : "Publish Post"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
